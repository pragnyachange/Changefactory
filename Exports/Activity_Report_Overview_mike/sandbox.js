"use strict";

/*
================================================================================
PQFORCE ACTIVITY REPORT EXPORT – All Projects with Allocations
================================================================================

EXECUTIVE SUMMARY:
This automation generates a comprehensive Activity Report that exports all 
employee time recordings from the previous calendar month, organized by project,
task, and employee. It reconciles planned allocations with actual time entries
and displays remaining effort for project management visibility.

KEY FEATURES:
- Exports all readable projects from the organization
- Period: Previous full calendar month (e.g., May 1 - May 31)
- One row per individual time entry (maintains granularity)
- Links customer information via project relations
- Displays THREE effort columns per employee/task combination:
  * Planned/Allocated Effort: What management assigned for the period
  * Already Inputted Effort: What employees have actually recorded
  * Remaining Effort: What's left to complete (Planned - Actual)

DATA FLOW:
1. Calculates the previous month date range
2. Retrieves all projects accessible to the export user
3. Fetches time actuals (employee entries) for the period
4. Retrieves planned allocations for the same period
5. Matches actuals to allocations using employee + task key
6. Aggregates into summary rows (one per customer/project/task/employee combo)
7. Formats all data as Excel-ready JSON (jsdata object)
8. Returns data to PQForce, which injects it into the Excel template

TECHNICAL NOTES:
- Returns jsdata object (NOT the Excel file directly - PQForce handles that)
- No email sending or direct XLSX creation
- Includes error handling with fallback values
- Uses caching to minimize duplicate API calls
- Logs warnings for debugging/monitoring

REQUIRED CONFIGURATION:
✓ Automation Category: Must be "EXPORT" (not "NORMAL")
✓ MOMENT Library: Must be enabled in PQForce
✓ Excel Template: PQFORCE_Aktivitaetenbericht_Export_Template_AllProjects_Allocations.xlsx
✓ Placeholders in Excel: Must match the jsdata structure defined below
================================================================================
*/

// Set locale to German for date/time formatting
moment.locale("de");

// CONFIG ######################################################################
/*
Configuration settings that control export behavior and validation.
These can be adjusted without modifying the core logic.
*/

const CONFIG = {
    // DEMO: System name and URL used in the Excel report header
    // Allows users to navigate back to the system for detailed review
    systemName: "PQFORCE Demo / change-factory",
    activityPageUrl: "https://demo.pqforce.com/change-factory?type=HRM-RES-TYP-EMP&id=11D80DD82C7440CFBC380604661B2CFD&feature=timerecording",

    // PRODUCTION: uncomment/change these when moving to cloud.
    // systemName: "PQFORCE Produktiv / change-factory",
    // activityPageUrl: "https://cloud.pqforce.com/change-factory?type=HRM-RES-TYP-EMP&id=11D80DD82C7440CFBC380604661B2CFD&feature=timerecording",

    // If false: excludes time entries with 0 minutes (fewer rows, cleaner output)
    // If true: includes all entries, even zero-minute ones (more complete view)
    includeZeroValues: true,

    // Portfolio filter: which projects to include
    // Empty array [] = include ALL readable projects
    // With IDs: only projects in these portfolios are exported
    portfolioIds: [],

    // Excel template row limitations - must match the .xlsx file
    // If data exceeds these limits, a warning is logged
    maxDetailRows: 200,        // Individual time entry rows
    maxSummaryRows: 100,       // Aggregated summary rows

    // Debug flag: if true, logs the entire jsdata object to console
    logJsdata: true
};

// CACHES ######################################################################
/*
Three caches to avoid repeated API calls for the same resources.
PQForce API calls can be expensive, so we cache results during execution.
*/

let RESOURCE_CACHE = {};    // Cache: resourceId -> {name: string}
let WORKITEM_CACHE = {};    // Cache: workItemId -> {name: string}
let CUSTOMER_CACHE = {};    // Cache: projectId -> customerName string

// MAIN ########################################################################
/*
Main execution block. Orchestrates the export process with comprehensive error handling.

PROCESS FLOW:
1. Calculate date range for previous month
2. Build detail rows: one per time entry with allocation context
3. Build summary rows: aggregate by customer/project/task/employee
4. Create jsdata object with system info, report metadata, and detail/summary rows
5. Return jsdata to PQForce for Excel template injection
6. On error: return minimal jsdata with error message to prevent export failure
*/

let jsdata = {};

try {
    // STEP 1: Calculate the date range for the previous calendar month
    // E.g., if today is June 15, period = May 1 - May 31
    let period = getPreviousMonthPeriod();

    // STEP 2: Build detail rows (one row per individual time entry)
    // Each row includes: project, task, employee, date, duration, and allocation info
    let rows = buildActivityRowsForAllProjects(period.apiFrom, period.apiTo);
    
    // STEP 3: Build summary rows (one row per customer/project/task/employee combination)
    // Aggregates all detail rows, summing effort within each combination
    let summaryRows = buildSummaryRows(rows);

    // STEP 4: Construct the jsdata object that will be injected into Excel
    // This is the main output structure - must match Excel template placeholders exactly
    jsdata = {
        // System metadata: where/when this export came from
        system: {
            name: CONFIG.systemName,
            activityPageUrl: CONFIG.activityPageUrl,
            generatedAt: moment().format("DD.MM.YYYY HH:mm")
        },

        // Report metadata: what period, how many rows
        report: {
            title: "Aktivitätenbericht PQFORCE",
            period: period.label,                          // e.g., "Mai 2026"
            periodFrom: period.displayFrom,                // e.g., "2026-05-01"
            periodTo: period.displayTo,                    // e.g., "2026-05-31"
            apiFrom: period.apiFrom,                       // API format
            apiTo: period.apiTo,                           // API format (exclusive)
            month: period.monthLabel,
            year: period.year,
            rowCount: rows.length,
            detailRowsPrepared: CONFIG.maxDetailRows,
            summaryRowsPrepared: CONFIG.maxSummaryRows
        },

        // Two output formats for data (supporting different Excel template designs):
        
        // Format 1: Column arrays - useful for charts/pivot-like views
        entries: rowsToColumnArrays(rows),
        summary: summaryToColumnArrays(summaryRows),

        // Format 2: Fixed-position objects for traditional table rows
        // Excel placeholders like {jsdata.entryRows.r001.customer} reference these
        entryRows: rowsToFixedObject(rows, CONFIG.maxDetailRows, emptyEntryRow, "r"),
        summaryRows: rowsToFixedObject(summaryRows, CONFIG.maxSummaryRows, emptySummaryRow, "s")
    };

    // STEP 5: Log diagnostic information for troubleshooting
    console.warn("EXPORT JSDATA CREATED");
    console.warn("PERIOD DISPLAY: " + period.displayFrom + " - " + period.displayTo);
    console.warn("PERIOD API: " + period.apiFrom + " - " + period.apiTo + " (to is exclusive)");
    console.warn("ROWS COUNT: " + rows.length);
    console.warn("SUMMARY COUNT: " + summaryRows.length);

    // STEP 6: Validation warnings
    if (rows.length > CONFIG.maxDetailRows) {
        console.warn(
            "WARNING: More detail rows (" + rows.length +
            ") than prepared Excel rows (" + CONFIG.maxDetailRows +
            "). Increase CONFIG.maxDetailRows and add more placeholder rows in Excel."
        );
    }

    if (summaryRows.length > CONFIG.maxSummaryRows) {
        console.warn(
            "WARNING: More summary rows (" + summaryRows.length +
            ") than prepared Excel rows (" + CONFIG.maxSummaryRows +
            "). Increase CONFIG.maxSummaryRows and add more placeholder rows in Excel."
        );
    }

    // Optional: log the entire jsdata structure for debugging
    if (CONFIG.logJsdata) {
        console.warn(JSON.stringify(jsdata));
    }

} catch (err) {
    // FALLBACK: If anything fails, return minimal jsdata with error message
    // This prevents export crashes and allows the user to see what went wrong
    console.warn("ERROR building export jsdata: " + err);

    jsdata = {
        system: {
            name: CONFIG.systemName,
            activityPageUrl: CONFIG.activityPageUrl,
            generatedAt: moment().format("DD.MM.YYYY HH:mm")
        },
        report: {
            title: "Aktivitätenbericht PQFORCE",
            period: "",
            periodFrom: "",
            periodTo: "",
            rowCount: 0,
            error: String(err)  // Error message will appear in Excel
        },
        entries: rowsToColumnArrays([]),
        summary: summaryToColumnArrays([]),
        entryRows: rowsToFixedObject([], CONFIG.maxDetailRows, emptyEntryRow, "r"),
        summaryRows: rowsToFixedObject([], CONFIG.maxSummaryRows, emptySummaryRow, "s")
    };
}

// Return jsdata to PQForce for Excel template injection
jsdata;

// PERIOD ######################################################################
/*
Calculate the date range for the previous calendar month.

LOGIC:
- Start: First day of previous month (00:00)
- End Display: Last day of previous month (inclusive)
- End API: First day of current month (00:00, exclusive)

The API uses exclusive end dates (anything < apiTo is included).

EXAMPLE: If today is June 15, 2026:
- Start: 2026-05-01 (May 1st)
- End Display: 2026-05-31 (May 31st)
- End Exclusive: 2026-06-01 (so May is included, June is not)
*/

function getPreviousMonthPeriod() {
    let start = moment().subtract(1, "month").startOf("month");
    let endDisplay = moment().subtract(1, "month").endOf("month");
    let endExclusive = moment().startOf("month");

    return {
        apiFrom: start.format("YYYY-MM-DD"),
        apiTo: endExclusive.format("YYYY-MM-DD"), // API maximum is exclusive.
        displayFrom: start.format("YYYY-MM-DD"),
        displayTo: endDisplay.format("YYYY-MM-DD"),
        label: start.format("MMMM YYYY"),
        monthLabel: start.format("MMMM"),
        year: start.format("YYYY")
    };
}

// DATA COLLECTION #############################################################
/*
CORE FUNCTION: Build detail rows for all projects.

This is the main data collection engine. For each project, it:
1. Fetches all time entries (actuals) for the period
2. Fetches planned allocations for the same period
3. Creates a row object for each time entry with allocation context
4. Includes employee, task, customer, and effort information

OUTPUT: Array of row objects, each representing one time entry with:
- Details: what was done (project, task, employee, when, how long)
- Allocation: what was planned vs what's been done vs what remains

KEY INSIGHT: One row per TIME ENTRY, not per employee/task combo
If an employee logs multiple times on same task/day, each gets its own row.
This granularity is needed for detailed tracking but is then aggregated for summaries.
*/

function buildActivityRowsForAllProjects(fromInclusive, toExclusive) {
    let rows = [];
    
    // STEP 1: Fetch all projects the export user can read
    let projects = Pqf.pm.getProjects();

    if (!projects || projects.length === 0) {
        console.warn("No projects found.");
        return rows;
    }

    console.warn("PROJECTS FOUND: " + projects.length);

    // STEP 2: Iterate through each project
    projects.forEach(function (projectRef) {
        try {
            let projectId = projectRef.id || projectRef;
            let project = Pqf.pm.getProject(projectId);

            // Filter projects if CONFIG.portfolioIds is specified
            if (!projectMatchesPortfolioFilter(project)) {
                return;
            }

            // STEP 3: Get all time entries for this project in the period
            let actuals = Pqf.act.getProjectTimeActuals(project.id, fromInclusive, toExclusive);

            // Skip projects with no entries for this period
            if (!actuals || actuals.length === 0) {
                return;
            }

            // STEP 4: Build two lookup tables for allocation matching
            // This allows us to quickly find planned vs actual for any employee/task combo
            let allocationLookup = buildAllocationLookup(project.id, fromInclusive, toExclusive);
            let actualsLookup = buildActualsLookup(actuals);
            mergeActualsFallbackIntoAllocationLookup(allocationLookup, actualsLookup);

            let customerName = getCustomerName(project);

            console.warn(
                "PROJECT ACTUALS: " +
                (project.code || "") + " " +
                (project.name || "") +
                " / Customer: " + customerName +
                " / Actuals: " + actuals.length
            );

            // STEP 5: Create a row for each individual time entry
            // Each time entry gets enriched with allocation context
            actuals.forEach(function (actual) {
                let minutes = durationToMinutes(actual.duration);

                // Optional: skip zero-minute entries (cleaner output)
                if (!CONFIG.includeZeroValues && minutes === 0) {
                    return;
                }

                // Load cached resource and task names
                let resource = safeGetResource(actual.resourceId);
                let workItem = safeGetWorkItem(actual.workItemId);
                
                // Find allocation data for this employee/task combo
                // If no allocation exists, use empty values (may happen for unallocated work)
                let allocation = allocationLookup[getAllocationKey(actual.resourceId, actual.workItemId)] || emptyAllocationInfo();

                // CREATE THE DETAIL ROW
                // This row will be one line in the Excel detail section
                rows.push({
                    // CUSTOMER & PROJECT INFO
                    customer: customerName,
                    projectName: project.name || "",
                    projectId: project.id || "",

                    // TASK & EMPLOYEE INFO
                    taskName: workItem.name || "",
                    taskId: actual.workItemId || "",
                    employeeName: resource.name || "",
                    employeeId: actual.resourceId || "",

                    // DATE & EFFORT (individual entry)
                    date: formatDate(actual.day),
                    dateIso: actual.day || "",
                    effort: minutesToHHMM(minutes),              // How long they worked on this entry
                    effortMinutes: minutes,

                    // ALLOCATION CONTEXT (for this employee/task combo for the entire period)
                    // These show the "big picture" allocation vs actual for the month
                    allocatedEffort: allocation.allocatedEffort,              // What was planned
                    allocatedEffortMinutes: allocation.allocatedEffortMinutes,

                    alreadyInputtedEffort: allocation.alreadyInputtedEffort,          // What's been recorded so far
                    alreadyInputtedEffortMinutes: allocation.alreadyInputtedEffortMinutes,

                    remainingEffort: allocation.remainingEffort,              // What's left to do
                    remainingEffortMinutes: allocation.remainingEffortMinutes,

                    // NOTES & BILLING INFO
                    comment: stripHtml(actual.comment),
                    billable: "",
                    invoiceRemark: ""
                });
            });

        } catch (err) {
            // RESILIENCE: If one project fails, skip it and continue with others
            // Error details are logged so admins can investigate
            console.warn("Project skipped because of error: " + JSON.stringify(projectRef) + " / " + err);
        }
    });

    // STEP 6: Sort rows for readability in Excel
    // Order: Customer → Project → Task → Employee → Date → Comment
    // This creates a logical, hierarchical view in the export
    rows.sort(function (a, b) {
        return [
            a.customer,
            a.projectName,
            a.taskName,
            a.employeeName,
            a.dateIso,
            a.comment
        ].join("|").localeCompare([
            b.customer,
            b.projectName,
            b.taskName,
            b.employeeName,
            b.dateIso,
            b.comment
        ].join("|"));
    });

    return rows;
}

/*
Validate if a project should be included based on portfolio filter.
If CONFIG.portfolioIds is empty, all projects are included.
If specified, only projects in those portfolios are included.
*/
function projectMatchesPortfolioFilter(project) {
    if (!CONFIG.portfolioIds || CONFIG.portfolioIds.length === 0) {
        return true;  // No filter: include all
    }

    if (!project || !project.portfolios) {
        return false;
    }

    return project.portfolios.some(function (portfolio) {
        return CONFIG.portfolioIds.indexOf(portfolio.id) >= 0;
    });
}

// ALLOCATION ##################################################################
/*
CRITICAL SECTION: Allocation Data

PQForce tracks effort planning in two ways:
1. ALLOCATIONS: What management plans for employees (in resource allocation phase)
2. ACTUALS: What employees record in time entries (in time recording)

This section reconciles these two sources to show:
- Planned: How much was allocated
- Actual: How much has been recorded
- Remaining: Planned - Actual (should be completed)

KEY INSIGHT: Allocations are hierarchical and summed across the organization.
An allocation is assigned at the PROJECT PHASE level to an EMPLOYEE for specific WORK ITEMS.
*/

/*
Build a lookup table: (resourceId | workItemId) → {allocated, actual, remaining}

This function fetches all resource allocations for a project/period and creates
a fast lookup map so we can instantly find allocation data for any employee/task pair.

INPUT: Project ID, date range
OUTPUT: Map where key = "employeeId|taskId" and value = {allocatedMinutes, actualMinutes, remainingMinutes}
*/
function buildAllocationLookup(projectId, fromInclusive, toExclusive) {
    let lookup = {};

    try {
        // Fetch all resource allocations assigned to this project for the period
        let allocations = Pqf.alc.getProjectPhaseAllocations(projectId, fromInclusive, toExclusive);

        if (!allocations || allocations.length === 0) {
            return lookup;  // No allocations for this project/period
        }

        // Process each resource's allocation
        allocations.forEach(function (resourceAllocation) {
            if (!resourceAllocation || !resourceAllocation.resource || !resourceAllocation.resource.id) {
                return;
            }

            let resourceId = resourceAllocation.resource.id;
            let workItems = resourceAllocation.workItems || [];

            // Process each work item (task) within this resource's allocation
            workItems.forEach(function (workItemAllocation) {
                if (!workItemAllocation || !workItemAllocation.workItem || !workItemAllocation.workItem.id) {
                    return;
                }

                let workItemId = workItemAllocation.workItem.id;
                
                // Extract three effort values from the allocation
                // planned = what was assigned by management
                // actual = what PQForce has calculated as done (based on time entries? or recorded actuals?)
                // remaining = planned - actual
                let allocatedMinutes = durationToMinutes(workItemAllocation.planned);
                let alreadyInputtedMinutes = durationToMinutes(workItemAllocation.actual);
                let remainingMinutes = durationToMinutes(workItemAllocation.remaining);

                // Store in lookup with employee+task key
                lookup[getAllocationKey(resourceId, workItemId)] = {
                    allocatedEffort: minutesToHHMM(allocatedMinutes),
                    allocatedEffortMinutes: allocatedMinutes,

                    alreadyInputtedEffort: minutesToHHMM(alreadyInputtedMinutes),
                    alreadyInputtedEffortMinutes: alreadyInputtedMinutes,

                    remainingEffort: minutesToHHMM(remainingMinutes),
                    remainingEffortMinutes: remainingMinutes
                };
            });
        });

    } catch (err) {
        console.warn("Could not load project phase allocations for project " + projectId + ": " + err);
    }

    return lookup;
}

/*
Build a secondary lookup: Sum ALL time entries by (resourceId | workItemId)

This creates a fast lookup of total effort recorded for each employee/task combo.
We use this as a FALLBACK for cases where allocations don't exist.

SCENARIO: An employee might have time entries without corresponding allocations.
Example: Task was added after allocations were locked, or employee recorded time on unallocated work.

INPUT: Array of time entry records
OUTPUT: Map where key = "employeeId|taskId" and value = total minutes recorded
*/
function buildActualsLookup(actuals) {
    let lookup = {};

    if (!actuals) {
        return lookup;
    }

    // Sum all time entries by employee+task key
    actuals.forEach(function (actual) {
        let key = getAllocationKey(actual.resourceId, actual.workItemId);
        if (!lookup[key]) {
            lookup[key] = 0;
        }
        lookup[key] += durationToMinutes(actual.duration);  // Add to running total
    });

    return lookup;
}

/*
Merge actuals data into allocation lookup as FALLBACK.

PURPOSE: Handle cases where time entries exist but no allocation does.
This ensures that ALL recorded time appears in the report, even if not explicitly allocated.

LOGIC:
1. For each actuals key NOT in allocations: create a minimal entry with actual effort only
2. For entries IN allocations but missing actual: use actual data from actuals lookup
3. For entries already complete: no change (allocation data is authoritative)

This creates a "best effort" reconciliation of plan vs actual.
*/
function mergeActualsFallbackIntoAllocationLookup(allocationLookup, actualsLookup) {
    for (let key in actualsLookup) {
        if (!Object.prototype.hasOwnProperty.call(actualsLookup, key)) {
            continue;
        }

        if (!allocationLookup[key]) {
            let minutes = actualsLookup[key];
            allocationLookup[key] = {
                allocatedEffort: "",
                allocatedEffortMinutes: "",
                alreadyInputtedEffort: minutesToHHMM(minutes),
                alreadyInputtedEffortMinutes: minutes,
                remainingEffort: "",
                remainingEffortMinutes: ""
            };
        } else if (!allocationLookup[key].alreadyInputtedEffort && actualsLookup[key] > 0) {
            allocationLookup[key].alreadyInputtedEffort = minutesToHHMM(actualsLookup[key]);
            allocationLookup[key].alreadyInputtedEffortMinutes = actualsLookup[key];
        }
    }
}

function getAllocationKey(resourceId, workItemId) {
    return String(resourceId || "") + "|" + String(workItemId || "");
}

function emptyAllocationInfo() {
    return {
        allocatedEffort: "",
        allocatedEffortMinutes: "",
        alreadyInputtedEffort: "",
        alreadyInputtedEffortMinutes: "",
        remainingEffort: "",
        remainingEffortMinutes: ""
    };
}

// CUSTOMER ####################################################################

function getCustomerName(project) {
    if (!project || !project.id) {
        return "";
    }

    if (CUSTOMER_CACHE[project.id] !== undefined) {
        return CUSTOMER_CACHE[project.id];
    }

    let customerName = "";

    try {
        let relations = Pqf.pf.getForwardRelations("Project", project.id, null, null, null, true);

        if (relations && relations.length > 0) {
            for (let i = 0; i < relations.length; i++) {
                let relation = relations[i];

                if (relation && String(relation.name || "").toLowerCase() === "customer") {
                    customerName = resolveCustomerRelationTargetName(relation);
                    break;
                }
            }
        }
    } catch (err) {
        console.warn("Could not read Customer relation for project " + project.id + ": " + err);
    }

    CUSTOMER_CACHE[project.id] = customerName;
    return customerName;
}

function resolveCustomerRelationTargetName(relation) {
    if (!relation || !relation.target || !relation.target.type || !relation.target.id) {
        return "";
    }

    let targetType = relation.target.type;
    let targetId = relation.target.id;

    try {
        if (
            targetType === "HRM-RES-TYP-EMP" ||
            targetType === "Resource" ||
            String(targetType).indexOf("HRM") === 0
        ) {
            return safeGetResource(targetId).name || "";
        }

        // Customer is expected to be HRM-RES-TYP-EMP in this tenant.
        console.warn("Customer relation target is not an HRM resource: " + targetType + " / " + targetId);
        return "";

    } catch (err) {
        console.warn("Could not resolve Customer target " + targetType + " / " + targetId + ": " + err);
        return "";
    }
}

// SUMMARY #####################################################################

function buildSummaryRows(rows) {
    let map = {};

    rows.forEach(function (row) {
        let key = [
            row.customer,
            row.projectName,
            row.taskName,
            row.employeeName
        ].join("|");

        if (!map[key]) {
            map[key] = {
                customer: row.customer,
                projectName: row.projectName,
                taskName: row.taskName,
                employeeName: row.employeeName,

                allocatedEffort: row.allocatedEffort,
                allocatedEffortMinutes: row.allocatedEffortMinutes,

                alreadyInputtedEffort: row.alreadyInputtedEffort,
                alreadyInputtedEffortMinutes: row.alreadyInputtedEffortMinutes,

                remainingEffort: row.remainingEffort,
                remainingEffortMinutes: row.remainingEffortMinutes,

                periodEffortMinutes: 0,
                periodEffort: "00.00"
            };
        }

        map[key].periodEffortMinutes += row.effortMinutes;
        map[key].periodEffort = minutesToHHMM(map[key].periodEffortMinutes);

        // Keep first non-empty allocation values.
        if (!map[key].allocatedEffort && row.allocatedEffort) {
            map[key].allocatedEffort = row.allocatedEffort;
            map[key].allocatedEffortMinutes = row.allocatedEffortMinutes;
        }
        if (!map[key].alreadyInputtedEffort && row.alreadyInputtedEffort) {
            map[key].alreadyInputtedEffort = row.alreadyInputtedEffort;
            map[key].alreadyInputtedEffortMinutes = row.alreadyInputtedEffortMinutes;
        }
        if (!map[key].remainingEffort && row.remainingEffort) {
            map[key].remainingEffort = row.remainingEffort;
            map[key].remainingEffortMinutes = row.remainingEffortMinutes;
        }
    });

    let result = [];

    for (let key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) {
            result.push(map[key]);
        }
    }

    result.sort(function (a, b) {
        return [
            a.customer,
            a.projectName,
            a.taskName,
            a.employeeName
        ].join("|").localeCompare([
            b.customer,
            b.projectName,
            b.taskName,
            b.employeeName
        ].join("|"));
    });

    return result;
}

// EXCEL OUTPUT SHAPE ##########################################################

function rowsToColumnArrays(rows) {
    return {
        customer: rows.map(function (r) { return r.customer; }),
        projectName: rows.map(function (r) { return r.projectName; }),
        projectId: rows.map(function (r) { return r.projectId; }),

        taskName: rows.map(function (r) { return r.taskName; }),
        taskId: rows.map(function (r) { return r.taskId; }),

        employeeName: rows.map(function (r) { return r.employeeName; }),
        employeeId: rows.map(function (r) { return r.employeeId; }),

        date: rows.map(function (r) { return r.date; }),
        dateIso: rows.map(function (r) { return r.dateIso; }),

        effort: rows.map(function (r) { return r.effort; }),
        effortMinutes: rows.map(function (r) { return r.effortMinutes; }),

        allocatedEffort: rows.map(function (r) { return r.allocatedEffort; }),
        allocatedEffortMinutes: rows.map(function (r) { return r.allocatedEffortMinutes; }),

        alreadyInputtedEffort: rows.map(function (r) { return r.alreadyInputtedEffort; }),
        alreadyInputtedEffortMinutes: rows.map(function (r) { return r.alreadyInputtedEffortMinutes; }),

        remainingEffort: rows.map(function (r) { return r.remainingEffort; }),
        remainingEffortMinutes: rows.map(function (r) { return r.remainingEffortMinutes; }),

        comment: rows.map(function (r) { return r.comment; }),

        billable: rows.map(function (r) { return r.billable; }),
        invoiceRemark: rows.map(function (r) { return r.invoiceRemark; })
    };
}

function summaryToColumnArrays(rows) {
    return {
        customer: rows.map(function (r) { return r.customer; }),
        projectName: rows.map(function (r) { return r.projectName; }),
        taskName: rows.map(function (r) { return r.taskName; }),
        employeeName: rows.map(function (r) { return r.employeeName; }),

        allocatedEffort: rows.map(function (r) { return r.allocatedEffort; }),
        alreadyInputtedEffort: rows.map(function (r) { return r.alreadyInputtedEffort; }),
        remainingEffort: rows.map(function (r) { return r.remainingEffort; }),
        periodEffort: rows.map(function (r) { return r.periodEffort; })
    };
}

function rowsToFixedObject(rows, maxRows, emptyFactory, prefix) {
    let result = {};

    for (let i = 1; i <= maxRows; i++) {
        let key = prefix + String(i).padStart(3, "0");
        result[key] = rows[i - 1] || emptyFactory();
    }

    return result;
}

function emptyEntryRow() {
    return {
        customer: "",
        projectName: "",
        projectId: "",

        taskName: "",
        taskId: "",

        employeeName: "",
        employeeId: "",

        date: "",
        dateIso: "",

        effort: "",
        effortMinutes: "",

        allocatedEffort: "",
        allocatedEffortMinutes: "",

        alreadyInputtedEffort: "",
        alreadyInputtedEffortMinutes: "",

        remainingEffort: "",
        remainingEffortMinutes: "",

        comment: "",

        billable: "",
        invoiceRemark: ""
    };
}

function emptySummaryRow() {
    return {
        customer: "",
        projectName: "",
        taskName: "",
        employeeName: "",

        allocatedEffort: "",
        allocatedEffortMinutes: "",

        alreadyInputtedEffort: "",
        alreadyInputtedEffortMinutes: "",

        remainingEffort: "",
        remainingEffortMinutes: "",

        periodEffort: "",
        periodEffortMinutes: ""
    };
}

// HELPERS #####################################################################
/*
UTILITY FUNCTIONS: Safe data access and format conversion

These functions abstract away complexity of:
- Null/undefined checking
- Error handling
- Caching
- Format conversion (duration strings to minutes, minutes to HH.MM)
- HTML stripping from comments
*/

/*
Safely retrieve a resource by ID with caching and error handling.

PURPOSE: Avoid crashing if a resource cannot be loaded, and cache results to minimize API calls.

BEHAVIOR:
- Cache hit: return cached {name} object
- Cache miss: load from API, cache result
- Load error: return cached error message to prevent row loss
*/
function safeGetResource(resourceId) {
    if (!resourceId) {
        return { name: "" };
    }

    if (RESOURCE_CACHE[resourceId]) {
        return RESOURCE_CACHE[resourceId];
    }

    try {
        let resource = Pqf.res.getResource(resourceId);
        RESOURCE_CACHE[resourceId] = { name: resource.name || "" };
        return RESOURCE_CACHE[resourceId];

    } catch (err) {
        // Graceful degradation: show error marker in Excel instead of crashing
        console.warn("Resource could not be loaded: " + resourceId + " / " + err);
        RESOURCE_CACHE[resourceId] = { name: "[Resource not found: " + resourceId + "]" };
        return RESOURCE_CACHE[resourceId];
    }
}

/*
Safely retrieve a work item (task) by ID with caching and error handling.
Same pattern as safeGetResource.
*/
function safeGetWorkItem(workItemId) {
    if (!workItemId) {
        return { name: "" };
    }

    if (WORKITEM_CACHE[workItemId]) {
        return WORKITEM_CACHE[workItemId];
    }

    try {
        let workItem = Pqf.pm.getWorkItem(workItemId);

        WORKITEM_CACHE[workItemId] = {
            name: workItem.name || ""
        };

        return WORKITEM_CACHE[workItemId];

    } catch (err) {
        console.warn("Work item could not be loaded: " + workItemId + " / " + err);

        WORKITEM_CACHE[workItemId] = {
            name: "[Work item not found: " + workItemId + "]"
        };

        return WORKITEM_CACHE[workItemId];
    }
}

/*
Remove HTML tags from time entry comments.

PQForce comments may contain HTML formatting (from rich text editor).
Excel doesn't render HTML, so we strip tags and normalize whitespace.

EXAMPLE INPUT:  "<p>Fix <b>bug</b> in form</p>"
EXAMPLE OUTPUT: "Fix bug in form"
*/
function stripHtml(value) {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(/<!--[\s\S]*?-->/g, "")      // Remove HTML comments
        .replace(/<[^>]*>/g, " ")             // Replace all tags with space
        .replace(/\s+/g, " ")                 // Normalize whitespace
        .trim();
}

/*
Format ISO date string (e.g., "2026-05-15") to German format "DD.MM.YYYY"
Used for Excel display.
*/
function formatDate(dateIso) {
    if (!dateIso) {
        return "";
    }

    return moment(dateIso).format("DD.MM.YYYY");
}

/*
Convert duration values to minutes.

PQForce can represent durations in multiple formats:
- ISO 8601 Duration (e.g., "1DT2H30M" = 1 day, 2 hours, 30 minutes)
  Matches: 1D, 2H, 30M, 45S
- Numeric value: interpreted as hours (e.g., 2.5 = 2.5 hours = 150 minutes)
- Empty/null: 0

EXAMPLES:
  durationToMinutes("1DT2H30M") → 1*1440 + 2*60 + 30 = 1710 minutes
  durationToMinutes(2.5) → 2.5 * 60 = 150 minutes
  durationToMinutes("1H30M") → 60 + 30 = 90 minutes
  durationToMinutes(null) → 0
*/
function durationToMinutes(duration) {
    if (duration === null || duration === undefined || duration === "") {
        return 0;
    }

    // If numeric: treat as hours
    if (typeof duration === "number") {
        return Math.round(duration * 60);
    }

    // Parse ISO 8601 duration string
    let durationString = String(duration);

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // Use regex to extract each component
    let dayMatch = durationString.match(/(\d+(?:\.\d+)?)D/);
    let hourMatch = durationString.match(/(\d+(?:\.\d+)?)H/);
    let minuteMatch = durationString.match(/(\d+(?:\.\d+)?)M/);
    let secondMatch = durationString.match(/(\d+(?:\.\d+)?)S/);

    if (dayMatch) {
        days = parseFloat(dayMatch[1]);
    }

    if (hourMatch) {
        hours = parseFloat(hourMatch[1]);
    }

    if (minuteMatch) {
        minutes = parseFloat(minuteMatch[1]);
    }

    if (secondMatch) {
        seconds = parseFloat(secondMatch[1]);
    }

    // Sum all components converted to minutes
    return Math.round(days * 24 * 60 + hours * 60 + minutes + seconds / 60);
}

/*
Convert minutes to human-readable format "HH.MM"

German format: hours.minutes (NOT hours:minutes)
Examples:
  150 minutes → "02.30" (2 hours 30 minutes)
  90 minutes → "01.30"
  0 minutes → "00.00"
  -30 minutes → "-00.30" (handles negative values)

This format is useful for Excel because it sorts correctly as a decimal number.
*/

function minutesToHHMM(totalMinutes) {
    // Handle empty/null values
    if (totalMinutes === "" || totalMinutes === null || totalMinutes === undefined) {
        return "";
    }

    totalMinutes = Number(totalMinutes) || 0;

    // Handle negative values (rare, but possible)
    let sign = totalMinutes < 0 ? "-" : "";
    totalMinutes = Math.abs(totalMinutes);

    // Extract hours and remaining minutes
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;

    // Return formatted as "HH.MM" with zero-padding
    return sign + String(hours).padStart(2, "0") + "." + String(minutes).padStart(2, "0");
}