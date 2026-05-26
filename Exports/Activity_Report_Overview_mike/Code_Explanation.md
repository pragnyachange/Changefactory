# PQForce Activity Report Export - Supervisor-Level Explanation

## EXECUTIVE SUMMARY

This JavaScript automation generates a monthly **Activity Report** that exports employee time tracking data from the PQForce system. It reconciles two critical business views:

- **What was planned** (allocations assigned to employees)
- **What actually happened** (time entries recorded by employees)  
- **What remains** (gap between plan and actual)

The report is delivered as an Excel file organized by customer, project, task, and employee, enabling management visibility into project progress, resource utilization, and potential overruns.

---

## LEVEL 1: THE BROAD IDEA (Business Purpose)

### Problem Statement
Project managers need to understand:
1. Are employees working on what was planned?
2. How much time was allocated vs actually spent?
3. On which tasks is effort being consumed vs budgeted?
4. Which employees are over/under their allocations?

### Solution
This export **automatically reconciles allocation data with time entries** and presents both in a structured report. Instead of manually comparing spreadsheets, managers get a single Excel file showing:

| Customer | Project | Task | Employee | Planned | Actual | Remaining | Current Entry |
|---|---|---|---|---|---|---|---|
| Acme Corp | Website Redesign | UI Dev | John | 40h | 25h | 15h | 2h (on May 15) |
| Acme Corp | Website Redesign | Backend | Sarah | 30h | 28h | 2h | 1.5h (on May 20) |

Each row represents **one time entry**, with the allocation context shown on every row for easy analysis.

---

## LEVEL 2: ARCHITECTURE (How It Works)

### High-Level Flow

```
START
  ↓
[1] Calculate Period
    Determines the previous calendar month
    ↓
[2] Fetch All Projects
    Get all accessible projects
    ↓
[3] For Each Project:
    ├─ [3a] Fetch Time Actuals (time entries)
    ├─ [3b] Fetch Allocations (planned efforts)
    ├─ [3c] Link Customer (forward relation)
    └─ [3d] Create Detail Rows (one per entry)
    ↓
[4] Aggregate Summary Rows
    Group by Customer/Project/Task/Employee
    ↓
[5] Format Output
    Convert to Excel-ready JSON (jsdata)
    ↓
[6] Return to PQForce
    PQForce injects jsdata into Excel template
    ↓
END → Excel File Generated
```

### Key Concepts

**1. Two Data Sources - Must Be Reconciled**

| Data Source | What It Is | Retrieved By | Represents |
|---|---|---|---|
| **Allocations** | Resource allocation records | `Pqf.alc.getProjectPhaseAllocations()` | What management PLANNED |
| **Actuals** | Time entries logged by employees | `Pqf.act.getProjectTimeActuals()` | What employees ACTUALLY RECORDED |

**2. The Lookup Key Mechanism**

Both allocations and actuals are indexed by the same key:
```
Key = employeeId | taskId
```

This allows instant matching:
- Find the allocation for "Employee John" + "Task UI Dev"
- Find all time entries for "Employee John" + "Task UI Dev"
- Compare them instantly

**3. Three Output Formats**

The export creates three complementary representations:

| Format | Purpose | Use Case |
|---|---|---|
| **Detail Rows** | One row per time entry + allocation context | Excel detail table with individual entries |
| **Summary Rows** | Aggregate by customer/project/task/employee | Excel summary showing totals per combination |
| **Column Arrays** | Transposed (columns instead of rows) | Alternative data structure for charts |

---

## LEVEL 3: DEEP DIVE - FUNCTION BY FUNCTION

### 1. **getPreviousMonthPeriod()** - Period Calculation

**What It Does:**  
Calculates the date range for the previous complete calendar month.

**Why It's Needed:**  
PQForce uses ISO date ranges (start inclusive, end exclusive). We need to ensure:
- Start = first day of previous month
- End (exclusive) = first day of current month

**Example (Today = June 15, 2026):**
```javascript
{
    apiFrom: "2026-05-01",       // Inclusive
    apiTo: "2026-06-01",         // Exclusive (anything < this date)
    displayFrom: "2026-05-01",   // User-facing
    displayTo: "2026-05-31",     // User-facing
    label: "Mai 2026",           // Month name
    monthLabel: "Mai",
    year: "2026"
}
```

**Algorithm:**
```
start = subtract 1 month from today, then set to first day of that month
endDisplay = subtract 1 month from today, then set to last day of that month
endExclusive = set today to first day of this month (exclusive boundary)
```

---

### 2. **buildActivityRowsForAllProjects()** - Core Data Collection

**What It Does:**  
This is the **engine** of the export. It:
1. Iterates through every project
2. Fetches time entries and allocations
3. Creates a detailed row for each time entry
4. Enriches each row with employee, task, customer, and allocation context

**Why It's Needed:**  
Time entries are scattered across projects and employees. This function gathers them all into one comprehensive list.

**Process Flow:**

```javascript
let projects = Pqf.pm.getProjects()  // Get all accessible projects

projects.forEach(function(project) {
    
    // Step 1: Get all time entries for this project
    let actuals = Pqf.act.getProjectTimeActuals(project.id, from, to)
    
    // Step 2: Get all allocations for this project
    let allocationLookup = buildAllocationLookup(project.id, from, to)
    
    // Step 3: Get sum of actuals by employee/task (fallback)
    let actualsLookup = buildActualsLookup(actuals)
    
    // Step 4: Merge for completeness (ensure unallocated work is captured)
    mergeActualsFallbackIntoAllocationLookup(allocationLookup, actualsLookup)
    
    // Step 5: Get customer name from project relations
    let customer = getCustomerName(project)
    
    // Step 6: Create a row for each time entry
    actuals.forEach(function(entry) {
        let row = {
            customer: customer,
            projectName: project.name,
            taskName: workItem.name,
            employeeName: employee.name,
            date: entry.day,
            effort: entry.duration,                    // This entry's duration
            allocatedEffort: allocation.planned,       // Monthly allocation
            alreadyInputtedEffort: allocation.actual,  // Total actual so far
            remainingEffort: allocation.remaining,     // Planned - Actual
            comment: entry.comment
        }
        rows.push(row)
    })
})

// Finally: Sort rows for readability
rows.sort(by: customer → project → task → employee → date → comment)
```

**Key Insight:**  
This is "one row per time entry", NOT "one row per allocation". So if John logs 4 times on the same task in a month, there are 4 rows. But each row shows the MONTHLY allocation context.

---

### 3. **buildAllocationLookup()** - Fetch Planned Efforts

**What It Does:**  
Creates a fast lookup table mapping `employeeId|taskId → {allocated, actual, remaining}`

**Why It's Needed:**  
Allocations are structured hierarchically in PQForce. This function flattens them into a simple lookup for quick matching.

**Data Structure:**

```javascript
// Input: Resource Allocation (from PQForce API)
{
    resource: { id: "emp123", name: "John Doe" },
    workItems: [
        {
            workItem: { id: "task456", name: "UI Development" },
            planned: "PT40H",           // ISO 8601 duration (40 hours)
            actual: "PT25H",           // What PQForce calculated
            remaining: "PT15H"         // Planned - Actual
        }
    ]
}

// Output: Lookup table
{
    "emp123|task456": {
        allocatedEffort: "40.00",              // 40 hours
        allocatedEffortMinutes: 2400,
        alreadyInputtedEffort: "25.00",        // 25 hours
        alreadyInputtedEffortMinutes: 1500,
        remainingEffort: "15.00",              // 15 hours
        remainingEffortMinutes: 900
    }
}
```

**Key Point:**  
If NO allocation exists for an employee/task pair, the lookup entry will be empty. The export handles this gracefully with the fallback merge.

---

### 4. **buildActualsLookup()** - Sum All Time Entries

**What It Does:**  
Creates a fast lookup mapping `employeeId|taskId → total_minutes_recorded`

**Why It's Needed:**  
If an employee has time entries but NO allocation, we still want to show their effort. This lookup captures all recorded time.

**Algorithm:**
```javascript
actuals.forEach(entry => {
    let key = entry.resourceId + "|" + entry.workItemId
    lookup[key] += durationToMinutes(entry.duration)  // Add to running total
})
```

**Example:**
```
Employee John, Task UI Dev:
  - May 5: 2 hours
  - May 10: 3 hours  
  - May 15: 2 hours

Result: lookup["john|ui_dev"] = 420 minutes (7 hours total)
```

---

### 5. **mergeActualsFallbackIntoAllocationLookup()** - Handle Edge Cases

**What It Does:**  
Handles three scenarios:

| Scenario | What Happens |
|---|---|
| Allocation exists, no actual data | Use allocation as-is (no time entered yet) |
| Actual exists, no allocation | Create minimal entry showing only actual (unallocated work) |
| Both exist | Merge intelligently (allocation is authoritative) |

**Example:**

```javascript
// Scenario 1: Allocated task, but employee hasn't entered time yet
Before: allocationLookup["emp1|task1"] = {allocated: 40h, actual: 0h, remaining: 40h}
After: unchanged (already has data)

// Scenario 2: No allocation, but employee logged 5 hours of work
Before: nothing in allocationLookup for "emp1|task2"
After: allocationLookup["emp1|task2"] = {allocated: "", actual: 5h, remaining: ""}

// This captures unallocated/ad-hoc work that still needs to appear in the report
```

---

### 6. **buildSummaryRows()** - Aggregate Data

**What It Does:**  
Groups detail rows by `customer|project|task|employee` and sums their efforts.

**Input:**  
Array of 200 detail rows (one per time entry)

**Output:**  
Array of ~30 summary rows (one per unique customer/project/task/employee combo)

**Process:**

```javascript
// Detail rows (before aggregation)
Customer: Acme, Project: Website, Task: UI, Employee: John, Date: May 5, Effort: 2h
Customer: Acme, Project: Website, Task: UI, Employee: John, Date: May 10, Effort: 3h
Customer: Acme, Project: Website, Task: UI, Employee: John, Date: May 15, Effort: 2h
Customer: Acme, Project: Website, Task: Backend, Employee: Sarah, Date: May 8, Effort: 1.5h

// Summary rows (after aggregation)
Customer: Acme, Project: Website, Task: UI, Employee: John, Effort in Period: 7h
Customer: Acme, Project: Website, Task: Backend, Employee: Sarah, Effort in Period: 1.5h
```

---

### 7. **getCustomerName()** - Resolve Customer Relation

**What It Does:**  
Looks up the customer assigned to a project via a PQForce relation named "Customer".

**Why It's Needed:**  
Projects link to customers via object relations. We need to resolve this link to show who the customer is.

**Process:**

```javascript
let relations = Pqf.pf.getForwardRelations("Project", projectId, null, null, null, true)

// relations might be:
// [
//   {name: "Portfolio", target: {...}},
//   {name: "Customer", target: {type: "HRM-RES-TYP-EMP", id: "cust123"}},
//   {name: "Program", target: {...}}
// ]

// We find the one with name == "Customer", then resolve the target to a resource name
```

---

### 8. **Conversion Functions - Format Data for Excel**

**durationToMinutes(duration)**
Converts various duration formats to minutes:
- `"PT1H30M"` (ISO 8601) → 90 minutes
- `2.5` (numeric, hours) → 150 minutes
- `"1DT2H"` (1 day, 2 hours) → 1440 + 120 = 1560 minutes

**minutesToHHMM(minutes)**
Converts minutes to Excel-friendly format:
- 150 minutes → `"02.30"` (2 hours, 30 minutes)
- 90 minutes → `"01.30"`
- German format: hours DOT minutes (not colon)

**formatDate(dateIso)**
Converts `"2026-05-15"` to `"15.05.2026"` (German format)

**stripHtml(comment)**
Removes HTML tags from comments:
- Input: `"<p>Fix <b>bug</b></p>"`
- Output: `"Fix bug"`

---

### 9. **Safe Helper Functions - Error Resilience**

**safeGetResource() and safeGetWorkItem()**

These functions implement **caching** + **error handling**:

```javascript
function safeGetResource(resourceId) {
    // 1. Check cache first (avoid API call)
    if (RESOURCE_CACHE[resourceId]) {
        return RESOURCE_CACHE[resourceId]
    }
    
    // 2. Try to load from API
    try {
        let resource = Pqf.res.getResource(resourceId)
        RESOURCE_CACHE[resourceId] = { name: resource.name }
        return RESOURCE_CACHE[resourceId]
    } catch (err) {
        // 3. Graceful degradation: cache error marker
        RESOURCE_CACHE[resourceId] = { name: "[Resource nicht gefunden]" }
        return RESOURCE_CACHE[resourceId]
    }
}
```

**Why This Matters:**
- If a resource can't be loaded, the entire row doesn't get lost
- Instead, Excel shows `[Resource nicht gefunden]` as the employee name
- Admins can see what failed and investigate
- The export still completes successfully

---

## LEVEL 4: DATA FLOW THROUGH THE SYSTEM

### End-to-End Data Journey

```
1. PERIOD CALCULATION
   Today: June 15, 2026
   ↓
   Previous Month Period: May 1 - May 31
   
2. PROJECT RETRIEVAL
   API: Pqf.pm.getProjects()
   ↓
   Result: [Project A, Project B, Project C, ...]
   
3. FOR EACH PROJECT:
   
   3a. GET TIME ENTRIES
       API: Pqf.act.getProjectTimeActuals(projectId, "2026-05-01", "2026-06-01")
       ↓
       Result: [
         {resourceId: "emp1", workItemId: "task1", duration: "PT2H", day: "2026-05-05", comment: "UI work"},
         {resourceId: "emp1", workItemId: "task1", duration: "PT3H", day: "2026-05-10", comment: "More UI"},
         {resourceId: "emp2", workItemId: "task2", duration: "PT1H30M", day: "2026-05-08", comment: "DB setup"}
       ]
       
   3b. BUILD ALLOCATION LOOKUP
       API: Pqf.alc.getProjectPhaseAllocations(projectId, "2026-05-01", "2026-06-01")
       ↓
       Result: {
         "emp1|task1": {allocated: 40h, actual: 25h, remaining: 15h},
         "emp2|task2": {allocated: 30h, actual: 28h, remaining: 2h},
         "emp1|task3": {allocated: 20h, actual: 0h, remaining: 20h}
       }
       
   3c. BUILD ACTUALS LOOKUP
       Sum of actual entries by employee/task
       ↓
       Result: {
         "emp1|task1": 300 minutes (5 hours from 2 entries),
         "emp2|task2": 90 minutes
       }
       
   3d. MERGE FALLBACK
       For "emp1|task1": Already in allocations, keep allocation data
       For "emp2|task2": Already in allocations, keep allocation data
       (No unallocated work in this example)
       
   3e. GET CUSTOMER
       API: Pqf.pf.getForwardRelations("Project", projectId, ...)
       ↓
       Result: "Acme Corp"
       
   3f. CREATE DETAIL ROWS
       One row per time entry:
       
       Row 1: {
         customer: "Acme Corp",
         project: "Website Redesign",
         task: "UI Development",
         employee: "John",
         date: "05.05.2026",
         effort: "02.00",                    ← This entry's duration
         allocatedEffort: "40.00",           ← Monthly total
         alreadyInputtedEffort: "25.00",
         remainingEffort: "15.00",
         comment: "UI work"
       }
       
       Row 2: {
         customer: "Acme Corp",
         project: "Website Redesign",
         task: "UI Development",
         employee: "John",
         date: "10.05.2026",
         effort: "03.00",                    ← This entry's duration (different)
         allocatedEffort: "40.00",           ← Same monthly total (repeats)
         alreadyInputtedEffort: "25.00",     ← Same aggregate
         remainingEffort: "15.00",           ← Same aggregate
         comment: "More UI"
       }
       
       [... more rows ...]

4. SORT ALL ROWS
   By: customer → project → task → employee → date → comment
   
5. BUILD SUMMARY ROWS
   Aggregate by: customer | project | task | employee
   ↓
   Summary Row 1: {
     customer: "Acme Corp",
     project: "Website Redesign",
     task: "UI Development",
     employee: "John",
     allocatedEffort: "40.00",
     alreadyInputtedEffort: "25.00",
     remainingEffort: "15.00",
     periodEffort: "05.00"          ← Total for the month
   }

6. FORMAT OUTPUT - Two parallel structures:
   
   Option A - Row format (for traditional Excel tables):
   {
     entryRows: {
       r001: {customer: "Acme Corp", project: ..., ...},
       r002: {customer: "Acme Corp", project: ..., ...},
       r003: {customer: "", ...},  ← Empty placeholder row
       ...
       r200: {customer: "", ...}
     },
     summaryRows: {
       s001: {...},
       ...
       s100: {...}
     }
   }
   
   Option B - Column arrays (for pivot-like analysis):
   {
     entries: {
       customer: ["Acme Corp", "Acme Corp", ...],
       project: ["Website", "Website", ...],
       task: ["UI", "Backend", ...],
       employee: ["John", "Sarah", ...],
       effort: ["02.00", "03.00", ...]
     }
   }

7. CREATE JSDATA OBJECT
   Combines metadata + formatted data
   {
     system: {
       name: "PQFORCE Demo",
       activityPageUrl: "https://demo.pqforce.com/...",
       generatedAt: "25.05.2026 14:30"
     },
     report: {
       title: "Aktivitätenbericht PQFORCE",
       period: "Mai 2026",
       periodFrom: "2026-05-01",
       periodTo: "2026-05-31",
       rowCount: 247,
       detailRowsPrepared: 200,
       summaryRowsPrepared: 100
     },
     entries: {...},
     summary: {...},
     entryRows: {...},
     summaryRows: {...}
   }

8. RETURN JSDATA TO PQFORCE
   PQForce receives jsdata and:
   - Finds the Excel template file
   - Replaces placeholders like {jsdata.entryRows.r001.customer}
   - Keeps all Excel formulas, formatting, charts intact
   - Returns finished .xlsx file to user

9. USER DOWNLOADS EXCEL
   Excel contains:
   - All detail rows with employee entries and allocation context
   - Summary table aggregating by project/employee/task
   - User can pivot, sort, filter, create charts
```

---

## LEVEL 5: WHAT COULD GO WRONG? (Error Handling)

### Scenario 1: Project Has No Time Entries
**What Happens:**  
Function returns early, skips to next project  
**User Experience:**  
Project silently omitted (expected)

### Scenario 2: Resource/Task Not Found
**What Happens:**  
Caught in try-catch, returns `[Resource nicht gefunden: id123]`  
**User Experience:**  
Row appears in Excel with error marker  
**Benefit:**  
User knows something failed, can investigate

### Scenario 3: No Allocations but Time Entries Exist
**What Happens:**  
Merge function creates allocation entry with actual time only  
**User Experience:**  
Unallocated work still appears in report (correct behavior)

### Scenario 4: More Rows Than Excel Template
**What Happens:**  
Warning logged: "More detail rows (247) than prepared Excel rows (200)"  
**User Experience:**  
First 200 rows appear; remaining rows lost  
**Fix:**  
Increase CONFIG.maxDetailRows and add more placeholder rows in Excel

### Scenario 5: Data Retrieval Fails Completely
**What Happens:**  
Caught in outer try-catch, returns jsdata with error message  
**User Experience:**  
Excel generated but shows error in report section  
**Benefit:**  
Export doesn't crash, user sees what went wrong

---

## LEVEL 6: CONFIGURATION & CUSTOMIZATION

### CONFIG Object - Easy Adjustments

```javascript
const CONFIG = {
    // Switch between demo/prod systems
    systemName: "PQFORCE Demo / change-factory",
    activityPageUrl: "https://demo.pqforce.com/...",
    
    // Include zero-minute entries?
    includeZeroValues: true,
    
    // Filter by portfolio?
    // Empty = all projects
    // With IDs = only those portfolios
    portfolioIds: [],
    
    // Template row limits (must match Excel)
    maxDetailRows: 200,
    maxSummaryRows: 100,
    
    // Debug logging
    logJsdata: true
}
```

**Common Customizations:**

1. **Limit to specific portfolios:**
   ```javascript
   portfolioIds: ["portfolio-123", "portfolio-456"]
   ```

2. **Hide zero-minute entries (cleaner report):**
   ```javascript
   includeZeroValues: false
   ```

3. **Increase row capacity:**
   ```javascript
   maxDetailRows: 500  // Then add 500 placeholder rows in Excel
   ```

4. **Turn off debug logging (production):**
   ```javascript
   logJsdata: false
   ```

---

## SUMMARY FOR YOUR SUPERVISOR

### What This Export Does (In Business Terms)
"Automatically generates a monthly activity report that shows what each employee worked on, how long they worked, what was planned, and what still remains. This gives project managers instant visibility into resource allocation vs actual effort."

### How It Works (Technical Summary)
"The script pulls time entries and allocations from PQForce for the previous month, matches them by employee and task, and outputs a spreadsheet with both detail (individual entries) and summary (aggregated) views. PQForce handles the Excel templating, so we just provide the data."

### Why It's Robust
"It includes comprehensive error handling: missing resources don't crash the export, unallocated work is still captured, and the code gracefully degrades to show error markers rather than losing data."

### What to Watch For
- Ensure the Excel template exists and has enough placeholder rows
- Monitor the console logs for warnings about missing resources or data
- If more than maxDetailRows of data exists, increase the config and add rows to Excel
- Test in demo system first before moving to production (URL change in CONFIG)

### Effort Estimate for Deployment
- Set up Excel template (1-2 hours)
- Configure automation in PQForce (15 minutes)
- Test and validate (1 hour)
- Deploy to production (5 minutes)

---

**Questions? Refer to the inline comments in the sandbox.js file for function-level details.**
