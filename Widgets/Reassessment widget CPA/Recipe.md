# Reassessed Tasks Widget - Complete Setup Recipe

This document provides step-by-step instructions to recreate the **Reassessed Tasks Widget** (ID: `89A532D20F584726840B9BCBCDB097C4`). The widget displays tasks that have had their effort reassessed within a selected timeframe.

## Overview & Key Concepts

The widget consists of three main components:

1. **Enum Values** - Dropdown options for timeframe selection
2. **Widget Definition** - The visual configuration and UI properties
3. **Sandbox Script** - The JavaScript logic that fetches and processes data

### Authorization
- Use the same bearer token per tenant for all API calls
- For the Change Factory demo, use the same token consistently

---

## Step 1: Create Enum Type (TIMEFRAME-TASKS-REASSESSMENT)

**File:** `Enum_def.json`

**What it defines:** The enum type itself - essentially creating a new category for dropdown options

**How to create:**

**Option A: Via API Call (Bruno)**
- POST to: `/API/V2/PF/Enum` with the following JSON:

```json
{
  "type": "EnumType",
  "id": "TIMEFRAME-TASKS-REASSESSMENT",
  "name": [
    {
      "code": "en",
      "text": "Timeframe Tasks Reassessment"
    }
  ],
  "code": null,
  "description": null,
  "iconRef": null,
  "color": null,
  "validityStart": null,
  "validityUntil": null
}
```

**Option B: Via Kundenportal (Customer Portal)**
- Navigate to: Kundenportal → Listen (Enums) → JSON
- Create the enum type there directly
- Export/copy the JSON response and store it

**Where to place:** Store the enum type JSON in `Enum_def.json`

**Note:** The enum type created via either method gets referenced in the API call when creating enum values and in the widget definition's `sourceUrl` field.

---

## Step 2: Create Enum Values (TIMEFRAME-TASKS-REASSESSMENT-001/002/003)

**File:** `Enum_value.json`

**What it defines:** The actual dropdown options (Past 7 Days, Past 14 Days, Since start of month)

**How to create:**

**Option A: Via API Call (Bruno)**
- POST to: `/API/V2/PF/Enum/TIMEFRAME-TASKS-REASSESSMENT/Values` for each value
- Create three values with IDs:
  - `TIMEFRAME-TASKS-REASSESSMENT-001` = "Past 7 Days" (7 days duration)
  - `TIMEFRAME-TASKS-REASSESSMENT-002` = "Past 14 Days" (14 days duration)
  - `TIMEFRAME-TASKS-REASSESSMENT-003` = "Since the start of the current month" (days from 1st to today)

**Example payload for value creation:**

```json
{
  "type": "TIMEFRAME-TASKS-REASSESSMENT",
  "id": "TIMEFRAME-TASKS-REASSESSMENT-001",
  "name": [
    {
      "code": "en",
      "text": "Past 7 Days"
    },
    {
      "code": "de",
      "text": "Letzte 7 Tage"
    }
  ],
  "code": null,
  "description": [
    {
      "code": "en",
      "text": ""
    },
    {
      "code": "de",
      "text": ""
    }
  ],
  "iconRef": null,
  "color": null,
  "validityStart": null,
  "validityUntil": null
}
```

**Option B: Via Kundenportal (Customer Portal)**
- Navigate to: Kundenportal → Listen (Enums) → Select `TIMEFRAME-TASKS-REASSESSMENT` → JSON
- Create each enum value there directly
- Export/copy the JSON responses

**Where to place:** Store all three responses in `Enum_value.json` as an array

---

## Step 3: Define Widget Attributes

**File:** `Attribute_def.json`

**What it defines:** The UI properties and configuration options available in the widget

**Key attributes in this widget:**
- `timerange` - Enum dropdown for timeframe selection (references the TIMEFRAME-TASKS-REASSESSMENT enum)
- Widget view configuration (table view with lifecycle colors)
- Column definitions (Task, Effort new, Effort old, Timestamp, User)
- Display options (legend, headers, decimals, color scheme)

**Structure template:**

```json
{
    "source": {
        "category": "js"
    },
    "config": {
        "view": "table",
        "lifecycle": true,
        "colorscheme": "poly",
        "decimals": 2,
        "legend": {
            "show": true,
            "pos": null
        },
        "showHeader": true,
        "properties": [
            {
                "type": "group",
                "title": [
                    {"code": "en", "text": "Timeframe"},
                    {"code": "de", "text": "Zeitraum"}
                ]
            },
            {
                "id": "timerange",
                "type": "enum",
                "label": [
                    {"code": "en", "text": "Timeframe"},
                    {"code": "de", "text": "Zeitraum"}
                ],
                "hint": [
                    {"code": "en", "text": "Select the timeframe for which the tasks that have been reassessed should be displayed."},
                    {"code": "de", "text": "Wählen Sie den Zeitraum, in dem die neu bewerteten Aufgaben angezeigt werden sollen."}
                ],
                "sourceUrl": "/API/V2/PF/Enum/TIMEFRAME-TASKS-REASSESSMENT/Values",
                "selectedItem": "TIMEFRAME-TASKS-REASSESSMENT-001"
            }
        ]
    },
    "projectStatusFilter": null,
    "options": {
        "disableFilter": false,
        "disableSorting": false
    },
    "canReload": false
}
```

**Where to place:** Save to `Attribute_def.json`

---

## Step 4: Create Sandbox Script

**File:** `script` (no extension - JavaScript)

**What it defines:** The business logic that:
- Fetches project data using Pqf API calls
- Filters work items based on selected timeframe
- Retrieves progress corrections (reassessments)
- Formats data for table display

### Build Process: From TypeScript to Sandbox Script

The sandbox script is created by compiling and processing TypeScript source files:

#### **Step 5.1: Write TypeScript Source Files**
Source files (typically in `src/` folder):
- `widget.ts` - Main widget logic for data fetching and processing
- `jtf.ts` - JTF helper functions for building the table format
- `utils.ts` or similar - Shared utility functions

#### **Step 5.2: Compile TypeScript to JavaScript**
Run TypeScript compiler:
```bash
tsc
```
Output: JavaScript files with source maps in `dist/` folder

#### **Step 5.3: Post-Process with Gulp**
Use gulpfile ( in PQF_UnitTests) to transform the compiled JavaScript for sandbox compatibility:

```javascript
// gulpfile.js transformation pipeline
src("dist/*.js")
    .pipe(replace('export', '/* export */'))     // Comment out ES6 exports
    .pipe(replace('import', '// import'))        // Comment out ES6 imports
    .pipe(concat('script.js'))                   // Concatenate all files into one
    .pipe(uglify())                              // Minify code (optional)
    .pipe(dest('./'));                           // Output final script
```

**Why these transformations?**
- **ES6 modules not supported** in PQForce sandbox environment
- **Single file concatenation** - all functions must be in one file
- **Uglify (minification)** - reduces file size (can be disabled for debugging)

**To build the script:**
```bash
gulp
```

#### **Step 5.4: Clean Up for Deployment**
Remove source mapping comments from final script:
- `//# sourceMappingURL=*.js.map` - These debug links are only for development
- Optional: Can keep for debugging in browser DevTools during development

**Result:** Clean, concatenated `script` file ready for sandbox paste

### Key Functions in the Script

1. **`createWidget(settings)`** - Main function that:
   - Gets the project: `Pqf.pm.getProject(settings.selectedObject.id)`
   - Gets active scenario: `Pqf.pm.getProjectActiveScenario(prj.id, false)`
   - Gets work items: `Pqf.pm.getScenarioWorkItems(scen.id, true)`
   - Gets progress corrections: `Pqf.pm.getProjectWorkItemProgressCorrections(workItem.id)`
   - Filters by timeframe and returns formatted data

2. **Timerange mapping:**
   - Past 7 Days = 7 days
   - Past 14 Days = 14 days
   - Since start of month = current day of month

3. **Table columns definition:**
   - Task (enum type with link to gantt)
   - Remaining Effort (new) (duration)
   - Remaining Effort (old) (duration)
   - Timestamp (date, formatted as DD.MM.YYYY)
   - User (enum type)

4. **Data structure:** Returns JTF (JTF - PQForce's table format) with:
   - meta: options, columns, categories
   - data: array of rows (each with id and data array)
   - charts: empty (not used here)
   - hints: warning messages if data loading fails

**Where to place:** Save the final `script` file to the widget folder (in this directory)

**Where to place:** Save the final `script` file to the widget folder (in this directory)

**After creating the script:** Upload it to the PQForce sandbox and note the returned `sandboxId` - you'll need this for Step 5.

**Dependencies:** The script uses:
- Moment.js for date/time handling (referenced as `MOMENT_WITH_LOCALES`)
- PQForce API (`Pqf.pm.*` and `Pqf.clf.*`)
- Helper functions from jtf.ts and utils (jtfCodeDeEn, constructJtfObject, etc.)

#### **Step 5.5: Create the trigger -> auslöser here is Project ( when project updated)
---

## Step 5: Create Widget Definition via API

**File:** `widget_def.json`

**What it defines:** The complete widget registration in the system. Contains all metadata, references to the enum, and embeds the attribute definition JSON.

**Prerequisites:**
-  Enum Type created (Step 1)
- Enum Values created (Step 2)
-  Sandbox Script uploaded (Step 4) - **You need the `sandboxId` from this step**

**How to create:**
- POST to: `/API/V2/PF/CockpitWidget` with the complete widget definition
- The `definition` field must contain the entire `Attribute_def.json` content as a stringified JSON
- The `sandboxId` field must contain the ID returned when you uploaded the script in Step 4

**Key fields to customize:**
- `id` - Unique widget ID (UUID format)
- `code` - Widget code identifier (e.g., `REASSESSED_TASKS`)
- `name` - Widget display name (with en/de localization)
- `description` - Widget description (with en/de localization)
- `iconRef` - Icon path (e.g., `/images/cockpit-table.png`)
- `objectType` - Object type widget applies to (e.g., `Project`)
- `widgetType` - Type of widget (e.g., `jtf`)
- `sandboxId` - **Links to the sandbox script ID from Step 4**  **Required**
- `sortIndex` - Sort order in UI (100.0)
- `tags` - Categories (e.g., "Effort")

**Where to place:** Save API response to `widget_def.json`

**Note:** The `definition` field in `widget_def.json` contains the stringified version of `Attribute_def.json`

---

## Step 6: Verify Widget in System

**Order of operations (summary):**

1. Create Enum Type (Enum_def.json)
2. Create Enum Values (Enum_value.json)  
3. Define Widget Attributes (Attribute_def.json)
4. Create/Upload Sandbox Script (script file) →  **Copy the returned sandboxId**
5. Create Widget Definition (widget_def.json) → **Paste the sandboxId here**
6. Verify and test the widget

**Validation checks:**
- Verify all enum IDs match between Enum_value.json and sourceUrl in widget definition
- Ensure sandboxId in widget_def.json matches the uploaded script ID
- Test the timerange dropdown loads options from `/API/V2/PF/Enum/TIMEFRAME-TASKS-REASSESSMENT/Values`
- Verify script handles null/error cases with proper hints

---

## Summary: File Purposes

| File | Purpose | Contains |
|------|---------|----------|
| `Enum_def.json` | Define enum type | Enum type metadata |
| `Enum_value.json` | Define dropdown options | Array of 3 timeframe values |
| `Attribute_def.json` | UI configuration | Display options, columns, properties |
| `widget_def.json` | Widget registration | Complete widget metadata + embedded definition |
| `script` | Business logic | JavaScript that fetches & formats data |

---

## API Call Sequence (Bruno)

1. POST `/API/V2/PF/Enum` → Get Enum Type ID
2. POST `/API/V2/PF/Enum/TIMEFRAME-TASKS-REASSESSMENT/Values` × 3 → Get Value IDs
3. **Upload script file to sandbox → Get Sandbox ID**  **Save this!**
4. **POST `/API/V2/PF/CockpitWidget` → Register widget with sandboxId + all references** 

 

