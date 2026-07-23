"use strict";

moment.locale("de");

/**
 * ============================================================================
 * WIDGET: "Identify tasks in the past with no time reported"
 * Author: Pragnya Rachakonda   |   SandboxId: 9318B24835944C13AF0EB18B736E2D94
 * ----------------------------------------------------------------------------
 * Lists past (already ended) work items whose reported effort is below a
 * selectable share of their planned allocation.
 *
 * Performance fix (2026-07). Root-caused after a production server overload:
 * this widget previously issued one API call PER work item
 * (getWorkItemAccumulatedValues), plus getWorkItemMacroAllocations per match
 * and an uncached getResource per resource. On large projects (~1000+ work
 * items), and with several users opening the cockpit at once, this generated
 * thousands of requests and forced repeated server-side recalculations.
 *
 * It now loads the same data via scenario-level batch calls
 * (getScenarioAccumulatedValues, getProjectScenarioMacroAllocations) and
 * caches resources in a Map, so the request count is (near-)constant
 * regardless of project size. Business logic, filters, columns and output
 * are unchanged; verified against the per-item endpoint in Bruno.
 * ============================================================================
 */

// The widget property ID that holds the selected threshold from the dropdown
const THRESHOLD_PROP_ID     = "effort_threshold";
const THRESHOLD_DEFAULT_KEY = "IDENTIFY-TASKS-NO-REPORT-002";

// Maps threshold enum value IDs to their reported/allocation ratio
const THRESHOLD_VALUE_MAP = {
    "IDENTIFY-TASKS-NO-REPORT-001": 0.10,
    "IDENTIFY-TASKS-NO-REPORT-002": 0.25,
    "IDENTIFY-TASKS-NO-REPORT-003": 0.50,
    "IDENTIFY-TASKS-NO-REPORT-004": 0.75
};


// ============================================================================
// HELPERS (unchanged)
// ============================================================================

/** Create a bilingual (German/English) label object */
function jtfLabel(de, en) {
    return { de: de, en: en };
}

/** Convert a PQForce object to JTF enum format */
function toEnum(obj) {
    if (!obj) return null;
    return {
        type: obj.type,
        id: obj.id,
        name: (obj.isDeleted ? obj.name + " (deleted)" : obj.name),
        description: obj.description || null,
        iconRef: obj.iconRef || null,
        color: obj.color || null
    };
}

/** Convert an ISO-8601 duration string to hours (0 if empty/invalid) */
function isoToHours(isoDuration) {
    if (!isoDuration) return 0;
    return moment.duration(isoDuration).asHours();
}

/** Build the JTF (PQForce table format) response object */
function buildJtf(options, columns, cats, data, hints) {
    return {
        meta: { options: options, columns: columns, categories: cats },
        data: data,
        charts: [],
        hints: hints
    };
}


// ============================================================================
// TABLE META (unchanged)
// ============================================================================

const options = {
    adaptiveColumnWidths: false,
    showHeader: true
};

const cats = [{ id: "/* default */", label: null }];

const columns = [
    {
        catid: "/* default */",
        id: "task_name",
        label: jtfLabel("Task", "Task"),
        type: "enum",
        options: { width: 280, resizable: true },
        format: { showIcon: true, addLink: true },
        style: { backgroundColor: "#eeeeee" }
    },
    {
        catid: "/* default */",
        id: "task_start",
        label: jtfLabel("Startdatum", "Start Date"),
        type: "date",
        options: { width: 110 },
        format: { format: "DD.MM.YYYY" }
    },
    {
        catid: "/* default */",
        id: "task_end",
        label: jtfLabel("Enddatum", "End Date"),
        type: "date",
        options: { width: 110 },
        format: { format: "DD.MM.YYYY" }
    },
    {
        catid: "/* default */",
        id: "resources",
        label: jtfLabel("Ressource(n)", "Resource(s)"),
        type: "multienum",
        options: { width: 200, resizable: true },
        format: { showIcon: true, addLink: false }
    },
    {
        catid: "/* default */",
        id: "allocation_h",
        label: jtfLabel("Allokation (h)", "Allocation (h)"),
        type: "duration",
        options: { width: 120, aggregation: "sum" },
        format: { digits: 1, unit: "hour" }
    },
    {
        catid: "/* default */",
        id: "reported_h",
        label: jtfLabel("Gemeldeter Aufwand (h)", "Reported Effort (h)"),
        type: "duration",
        options: { width: 150, aggregation: "sum" },
        format: { digits: 1, unit: "hour" }
    },
    {
        catid: "/* default */",
        id: "reported_pct",
        label: jtfLabel("Gemeldet / Allokation (%)", "Reported / Allocation (%)"),
        type: "number",
        options: { width: 160, aggregation: "none" },
        format: { digits: 1, unit: "%" }
    }
];


// ============================================================================
// MAIN
// ============================================================================

function createWidget(settings) {

    const jtfData  = [];
    const jtfHints = [];

    // Read selected threshold from widget settings
    const selectedKey = settings.config.properties
        .find(prop => prop.id === THRESHOLD_PROP_ID)?.selectedItem
        || THRESHOLD_DEFAULT_KEY;
    const threshold = THRESHOLD_VALUE_MAP[selectedKey] ?? 0.25;

    // ---- Load project ----
    let prj = null;
    try {
        prj = Pqf.pm.getProject(settings.selectedObject.id);
    } catch (e) {
        jtfHints.push({ type: "warning", label: jtfLabel("Fehler", "Error"), text: jtfLabel("Projekt konnte nicht geladen werden.", "Project could not be loaded.") });
        return buildJtf(options, columns, cats, jtfData, jtfHints);
    }
    if (!prj) return buildJtf(options, columns, cats, jtfData, jtfHints);

    // ---- Load scenarios — pick active one, fallback to first ----
    let scen = null;
    try {
        const allScenarios = Pqf.pm.getProjectScenarios(prj.id);
        scen = allScenarios.find(s => s.active === true) || allScenarios[0] || null;
    } catch (e) {
        jtfHints.push({ type: "warning", label: jtfLabel("Fehler", "Error"), text: jtfLabel("Szenario konnte nicht geladen werden.", "Scenario could not be loaded.") });
        return buildJtf(options, columns, cats, jtfData, jtfHints);
    }
    if (!scen) {
        jtfHints.push({ type: "warning", label: jtfLabel("Kein Szenario", "No scenario"), text: jtfLabel("Kein Szenario gefunden.", "No scenario found.") });
        return buildJtf(options, columns, cats, jtfData, jtfHints);
    }

    // ---- Load all work items recursively ----
    let workItems = [];
    try {
        workItems = Pqf.pm.getScenarioWorkItems(scen.id, true);
    } catch (e) {
        jtfHints.push({ type: "warning", label: jtfLabel("Fehler", "Error"), text: jtfLabel("Tasks konnten nicht geladen werden.", "Work items could not be loaded.") });
        return buildJtf(options, columns, cats, jtfData, jtfHints);
    }
    if (workItems.length === 0) {
        jtfHints.push({ type: "info", label: jtfLabel("Keine Tasks", "No tasks"), text: jtfLabel("Keine Tasks im Szenario.", "No work items in scenario.") });
        return buildJtf(options, columns, cats, jtfData, jtfHints);
    }

    // ========================================================================
    // BATCH 1 (critical): accumulated values for the WHOLE scenario in ONE call
    // Indexed by work item id -> replaces one getWorkItemAccumulatedValues per task.
    // ========================================================================
    const accByWorkItem = new Map();
    try {
        const scenarioAccValues = Pqf.pm.getScenarioAccumulatedValues(scen.id) || [];
        scenarioAccValues.forEach(av => accByWorkItem.set(av.projectWorkItemId, av));
    } catch (e) {
        jtfHints.push({ type: "warning", label: jtfLabel("Fehler", "Error"), text: jtfLabel("Aufwandskennwerte konnten nicht geladen werden.", "Accumulated values could not be loaded.") });
        return buildJtf(options, columns, cats, jtfData, jtfHints);
    }

    // ========================================================================
    // BATCH 2 (non-critical): all macro allocations of the scenario in ONE call.
    // Grouped into workItemId -> [unique resourceId, ...].
    // If this fails we simply render rows without resources (no abort).
    // ========================================================================
    const resourceIdsByWorkItem = new Map();
    try {
        const scenarioAllocs = Pqf.pm.getProjectScenarioMacroAllocations(scen.id) || [];
        scenarioAllocs.forEach(alloc => {
            if (!alloc || !alloc.workItemId || !alloc.resourceId) return;
            let list = resourceIdsByWorkItem.get(alloc.workItemId);
            if (!list) {
                list = [];
                resourceIdsByWorkItem.set(alloc.workItemId, list);
            }
            if (list.indexOf(alloc.resourceId) === -1) list.push(alloc.resourceId);
        });
    } catch (e) {
        // Non-fatal: leave resource column empty for the affected rows.
    }

    // ---- Resource cache: each resource is fetched at most once per run ----
    const resourceCache = new Map();
    function getResourceEnumCached(resourceId) {
        if (resourceCache.has(resourceId)) return resourceCache.get(resourceId);
        let resEnum = null;
        try {
            resEnum = toEnum(Pqf.res.getResource(resourceId));
        } catch (e) {
            resEnum = null;
        }
        resourceCache.set(resourceId, resEnum);
        return resEnum;
    }

    // ========================================================================
    // Filter + build rows — NO API call inside this loop anymore
    // ========================================================================
    const today = moment().startOf("day");
    const rows  = []; // collect first, then assign row IDs in a single batch

    workItems.forEach(workItem => {

        // Skip items with no end date
        if (!workItem.end) return;

        // Skip tasks not yet ended (only past tasks)
        if (!moment(workItem.end).isBefore(today)) return;

        // Look up accumulated values from the batch (was: per-task API call)
        const accValues = accByWorkItem.get(workItem.id);
        if (!accValues) return;

        // Skip tasks with no allocation
        const allocHours = isoToHours(accValues.resourceAllocations);
        if (allocHours === 0) return;

        // Reported = Actual + ExpectedPending (provisional)
        const actualHours   = isoToHours(accValues.resourceActuals);
        const pendingHours  = isoToHours(accValues.timeExpectedPending);
        const reportedHours = actualHours + pendingHours;
        const reportedRatio = reportedHours / allocHours;

        // Skip tasks at or above the threshold
        if (reportedRatio >= threshold) return;

        // Resources from the pre-fetched, grouped allocations (cached lookups)
        const resources = [];
        const resourceIds = resourceIdsByWorkItem.get(workItem.id) || [];
        resourceIds.forEach(resourceId => {
            const resEnum = getResourceEnumCached(resourceId);
            if (resEnum) resources.push(resEnum);
        });

        // Build task enum with Gantt link
        const taskEnum = toEnum(workItem);
        if (taskEnum) {
            taskEnum.type    = "Project";
            taskEnum.id      = workItem.projectId;
            taskEnum.feature = "gantt&itemtype=Phase&itemid=" + workItem.id;
        }

        const allocIso    = moment.duration(allocHours,    "hours").toISOString();
        const reportedIso = moment.duration(reportedHours, "hours").toISOString();
        const pct         = (reportedHours / allocHours) * 100;

        rows.push({
            fallbackId: workItem.id,
            data: [
                taskEnum,
                workItem.beg,
                workItem.end,
                resources,
                allocIso,
                reportedIso,
                pct
            ]
        });
    });

    // ---- Assign unique row IDs in a SINGLE batch call (was: one per row) ----
    let newIds = [];
    if (rows.length > 0) {
        try {
            newIds = Pqf.clf.newUuids(rows.length)?.newUuids || [];
        } catch (e) {
            newIds = [];
        }
    }
    rows.forEach((row, i) => {
        jtfData.push({
            id: newIds[i] || row.fallbackId,
            data: row.data
        });
    });

    if (jtfData.length === 0) {
        jtfHints.push({
            type: "info",
            label: jtfLabel("Keine Ergebnisse", "No results"),
            text: jtfLabel(
                "Keine abgelaufenen Tasks mit unzureichend gemeldeten Aufwänden gefunden.",
                "No past tasks with under-reported effort found for the selected threshold."
            )
        });
    }

    return buildJtf(options, columns, cats, jtfData, jtfHints);
}

createWidget(client);
