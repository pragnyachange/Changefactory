"use strict";

/**
 * ============================================================================
 * WIDGET: "Reassessed Tasks" / "Neu eingeschätzte Tasks"
 * Author: Luca Iten (LI)
 * WidgetId:  89A532D20F584726840B9BCBCDB097C4
 * SandboxId: 82F6A863771E4D839876BF6668BD3E08
 *
 * NOTE: This is a DIFFERENT widget/script than Pragnya's "Identify tasks in the
 *       past with no time reported". Different author, sandbox and purpose — it
 *       is only stored in this repo alongside it. Do not confuse the two.
 * ----------------------------------------------------------------------------
 * Displays all tasks within a selected timeframe whose remaining effort was
 * reassessed (progress corrections), showing old vs new effort.
 *
 * Performance fix (2026-07). Root-caused after a production server overload:
 * this widget previously issued one API call PER work item
 * (getProjectWorkItemProgressCorrections) plus one newUuids() per output row.
 * On large projects (~1000+ work items), and with several users opening the
 * cockpit at once, this generated thousands of requests and forced repeated
 * server-side recalculations.
 *
 * It now loads the same data via a single scenario-level batch call
 * (getProjectScenarioProgressCorrections) and assigns row IDs in one call, so
 * the request count is (near-)constant regardless of project size. Business
 * logic, filters, columns and output are unchanged; verified against the
 * per-item endpoint in Bruno.
 * @requires MOMENT_WITH_LOCALES
 * ============================================================================
 */

/** Enable verbose logging. Kept false in production: serializing the whole JTF
 *  object on every run creates large strings and needless memory pressure. */
const DEBUG = false;

/** The widget property ID that holds the selected timeframe from the dropdown */
const TIMERANGE_PROP_ID = "timerange";

/**
 * Maps enum value IDs to their corresponding time durations
 * - 001: Past 7 days
 * - 002: Past 14 days
 * - 003: From start of current month to today (day-of-month minus 1)
 */
const TIMERANGE_VALUE_MAP = {
    "TIMEFRAME-TASKS-REASSESSMENT-001": { duration: moment.duration(7, 'days') },
    "TIMEFRAME-TASKS-REASSESSMENT-002": { duration: moment.duration(14, 'days') },
    "TIMEFRAME-TASKS-REASSESSMENT-003": { duration: moment.duration(moment().date() - 1, 'days') }
};

/** Default timeframe if none selected (Past 7 Days) */
const TIMERANGE_DEFAULT_KEY = "TIMEFRAME-TASKS-REASSESSMENT-001";

/** Default duration fallback */
const TIMERANGE_DEFAULT_DURATION = TIMERANGE_VALUE_MAP[TIMERANGE_DEFAULT_KEY]?.duration;


// ============================================================================
// HELPERS (unchanged)
// ============================================================================

/** Create bilingual (German/English) label objects */
function jtfCodeDeEn(deStr, enStr) {
    return { de: deStr, en: enStr };
}

/** Build JTF (PQForce table format) response object */
function constructJtfObject(meta, data, charts = [], hints = []) {
    return { meta: meta, data: data, charts: charts, hints: hints };
}

/** Create JTF metadata object */
function constructJtfMeta(options, columns, categories) {
    return { options: options, columns: columns, categories: categories };
}

/** Convert a PQForce object to JTF enum format */
function _toEnum(obj) {
    if (!obj) {
        return null;
    }
    // Mark deleted items with "(deleted)" suffix
    if ("isDeleted" in obj)
        obj.name = (obj.isDeleted ? " (deleted)" : "");
    return {
        'type': obj.type,
        'id': obj.id,
        'name': obj.name,
        'description': obj.description,
        'iconRef': obj.iconRef,
        'color': obj.color
    };
}


// ============================================================================
// TABLE META (unchanged)
// ============================================================================

const options = {
    adaptiveColumnWidths: false,
    showHeader: true
};

const cats = [
    {
        id: '/* default */',
        label: null
    }
];

const columns = [
    {
        catid: "/* default */",
        id: "task",
        label: jtfCodeDeEn('Task', 'Task'),
        type: "enum",
        options: {
            resizable: true,
            width: 300
        },
        format: {
            showIcon: true,
            addLink: true
        },
        style: {
            backgroundColor: "#eee"
        }
    },
    {
        catid: "/* default */",
        id: "remainingEffort_new",
        label: jtfCodeDeEn('Aufwand (neu)', 'Effort (new)'),
        type: "duration",
        options: {
            width: 100,
            aggregation: "none"
        }
    },
    {
        catid: "/* default */",
        id: "remainingEffort_old",
        label: jtfCodeDeEn('Aufwand (alt)', 'Effort (old)'),
        type: "duration",
        options: {
            width: 100,
            aggregation: "none"
        }
    },
    {
        catid: "/* default */",
        id: "timestamp",
        label: jtfCodeDeEn('Zeitstempel', 'Timestamp'),
        type: "date",
        options: {
            width: 100
        },
        format: {
            format: "DD.MM.YYYY"
        }
    },
    {
        catid: "/* default */",
        id: "user",
        label: jtfCodeDeEn('User', 'User'),
        type: "enum",
        options: {
            width: 200
        },
        format: {
            showIcon: true,
            addLink: false
        }
    }
];


// ============================================================================
// MAIN
// ============================================================================

function createWidget(settings) {

    const jtfData = [];
    const jtfHints = [];

    // ---- Load the project ----
    const prj = (() => {
        try {
            return Pqf.pm.getProject(settings.selectedObject.id);
        }
        catch {
            jtfHints.push({
                type: "warning",
                label: jtfCodeDeEn("Ladefehler", "Loading error"),
                text: jtfCodeDeEn("Das Projekt konnte nicht geladen werden.", "The project could not be loaded.")
            });
            return null;
        }
    })();

    // ---- Load the project's active scenario ----
    const scen = prj ?
        (() => {
            try {
                return Pqf.pm.getProjectActiveScenario(prj.id, false);
            }
            catch {
                jtfHints.push({
                    type: "warning",
                    label: jtfCodeDeEn("Ladefehler", "Loading error"),
                    text: jtfCodeDeEn("Das Szenario konnte nicht geladen werden. Kann sein, dass kein aktives Szenario vorhanden ist.", "The scenario could not be loaded. It may be that no active scenario is available.")
                });
                return null;
            }
        })() : null;

    // ---- Load all work items (tasks) in the scenario ----
    const workItems = scen ?
        (() => {
            try {
                return Pqf.pm.getScenarioWorkItems(scen.id, true);
            }
            catch {
                jtfHints.push({
                    type: "warning",
                    label: jtfCodeDeEn("Ladefehler", "Loading error"),
                    text: jtfCodeDeEn("Die Tasks konnten nicht geladen werden.", "The tasks could not be loaded.")
                });
                return [];
            }
        })() : [];

    // ========================================================================
    // Process work items and find reassessments
    // ========================================================================
    if (workItems.length > 0) {

        // Selected timeframe (fallback: Past 7 Days)
        const timerange = TIMERANGE_VALUE_MAP[settings.config.properties.find(prop => prop.id === TIMERANGE_PROP_ID)?.selectedItem || TIMERANGE_DEFAULT_KEY]?.duration;

        // Start date of the selected timeframe (now - duration, at 00:00:00)
        const timeFrameStart = moment().subtract(timerange || TIMERANGE_DEFAULT_DURATION).startOf('day');

        if (DEBUG) console.log("timeFrameStart: " + timeFrameStart.toISOString());

        // ====================================================================
        // BATCH: progress corrections for the WHOLE scenario in ONE call.
        // Indexed by work item id -> replaces one call per work item.
        // Each entry (pf.Reference) has .id (= work item id) and .timeline.
        // ====================================================================
        const correctionsByWorkItem = new Map();
        try {
            const scenarioCorrections = Pqf.pm.getProjectScenarioProgressCorrections(scen.id) || [];
            scenarioCorrections.forEach(pc => {
                if (pc && pc.id) correctionsByWorkItem.set(pc.id, pc);
            });
        }
        catch {
            jtfHints.push({
                type: "warning",
                label: jtfCodeDeEn("Ladefehler", "Loading error"),
                text: jtfCodeDeEn("Die Fortschrittskorrekturen konnten nicht geladen werden.", "The progress corrections could not be loaded.")
            });
        }

        // Collect matching rows first; assign unique IDs in one batch afterwards
        const rows = [];

        workItems.forEach(workItem => {

            // Look up this task's corrections from the batch (was: per-task API call)
            const progressCorrections = correctionsByWorkItem.get(workItem.id);
            const timeline = (progressCorrections && progressCorrections.timeline) ? progressCorrections.timeline : [];

            // Find the MOST RECENT reassessment (highest timestamp)
            const currentProgressCorrection = timeline.reduce((acc, current) => {
                if (!acc)
                    return current;
                return moment(current.at).isAfter(acc.at) ? current : acc;
            }, null);

            // Only include if there is a reassessment within the selected timeframe
            if (currentProgressCorrection && moment(currentProgressCorrection.at).isAfter(timeFrameStart)) {

                // Find the PREVIOUS reassessment (latest one before the current)
                const previousProgressCorrection = timeline.reduce((acc, current) => {
                    if (!acc)
                        return moment(current.at).isBefore(currentProgressCorrection.at) ? current : null;
                    return moment(current.at).isAfter(acc.at) && moment(current.at).isBefore(currentProgressCorrection.at) ? current : acc;
                }, null);

                // Convert work item to enum format for table display
                const workItem_enum = _toEnum(workItem);

                if (workItem_enum) {
                    const workItemId = workItem.id;
                    // Adapt enum so the link works in gantt view
                    workItem_enum.type = "Project";
                    workItem_enum.id = workItem.projectId;
                    workItem_enum.feature = "gantt&itemtype=Phase&itemid=" + workItemId;
                }

                // Collect row (order matches columns: [task, new, old, timestamp, user])
                rows.push([
                    workItem_enum,
                    currentProgressCorrection.remainingEffort,
                    previousProgressCorrection?.remainingEffort,
                    currentProgressCorrection.at,
                    _toEnum(currentProgressCorrection.modifiedBy)
                ]);
            }
        });

        // ---- Assign unique row IDs in a SINGLE batch call (was: one per row) ----
        let newIds = [];
        if (rows.length > 0) {
            try {
                newIds = Pqf.clf.newUuids(rows.length)?.newUuids || [];
            }
            catch {
                newIds = [];
            }
        }
        rows.forEach((data, i) => {
            jtfData.push({
                id: newIds[i] || "",
                data: data
            });
        });
    }

    return constructJtfObject(constructJtfMeta(options, columns, cats), jtfData, [], jtfHints);
}

// ============================================================================
// EXECUTE
// ============================================================================
const jtf = createWidget(client);

if (DEBUG)
    console.log("Generated JTF: " + JSON.stringify(jtf));

jtf;
