# Luca_ReassessedWorkload - Widget Development Guide

## Project Overview

This is a **professional TypeScript-based PQForce widget project** for displaying reassessed task efforts. It demonstrates a complete development workflow with type safety, testing, linting, and automated build processes.

**Widget Purpose:** Display all tasks within a selected timeframe that have had their effort reassessed, showing old vs new effort estimates and who made the change.

---

## Project Structure

```
Luca_ReassessedWorkload/
├── src/                    # TypeScript source files
│   ├── widget.ts          # Main widget logic
│   ├── jtf.ts             # JTF type definitions
│   ├── utils.ts           # Helper functions
│   ├── structs.ts         # Custom data structures
│   └── api.d.ts           # PQForce API type declarations
├── dist/                   # Compiled JavaScript (generated)
├── test/                   # Jest test files
│   └── utils.spec.ts      # Unit tests
├── widgetconf/            # Widget configuration files
├── script.js              # Final output (for sandbox deployment)
├── gulpfile.js            # Build post-processing
├── tsconfig.json          # TypeScript compiler config
├── jest.config.js         # Test framework config
├── eslint.config.mjs      # Code linting rules
├── package.json           # Dependencies and scripts
└── README.md              # Quick start guide
```

---

## TypeScript Files Explained

### **1. `widget.ts` - Main Widget Logic**

**Purpose:** Core business logic that builds the reassessment widget

**What it does:**
- Defines the main `createWidget()` function
- Fetches project, scenario, and work item data from PQForce API
- Retrieves progress corrections (reassessments) for each task
- Filters tasks based on selected timeframe
- Compares old vs new effort estimates
- Formats data into JTF (JSON Table Format) for display

**Key components:**
- `TIMERANGE_PROP_ID` - References the "timerange" dropdown property
- `TIMERANGE_VALUE_MAP` - Maps enum IDs to time durations:
  - Past 7 Days = 7 days
  - Past 14 Days = 14 days
  - Since start of month = current day of month
- `columns` - Defines table structure (Task, New Effort, Old Effort, Timestamp, User)
- `createWidget()` - Main function that orchestrates data fetching and formatting

**Data flow:**
1. Get project from context
2. Get project's active scenario
3. Get all work items in scenario
4. For each work item, get progress corrections (reassessments)
5. Filter by timeframe (only show recent reassessments)
6. Build table rows with current vs previous effort
7. Return JTF object for rendering

---

### **2. `jtf.ts` - Type Definitions**

**Purpose:** Provides TypeScript interfaces for all JTF data structures

**Why separate?** Keeps type definitions organized and reusable across multiple files

**Key interfaces:**
- `JTFCode` - Bilingual text object: `{de: "...", en: "..."}`
- `JTFDataEnum` - Enum items like tasks and users
- `JTFMetaColumn` - Defines a single table column (id, label, type, formatting)
- `JTFMetaSection` - Complete table metadata (all columns, categories, options)
- `JsonTableFormat` - The complete widget output format
- `JTFClient` - Widget context/settings passed to createWidget()

**Benefits:**
- Full IDE autocomplete
- Compile-time error detection
- Self-documenting code
- Type safety across entire widget

---

### **3. `utils.ts` - Helper Functions**

**Purpose:** Reusable utility functions used throughout the widget

**Functions provided:**

**`jtfCodeDeEn(deStr: string, enStr: string): JTFCode`**
- Creates bilingual label objects
- Example: `jtfCodeDeEn("Aufwand", "Effort")` → `{de: "Aufwand", en: "Effort"}`
- Used for all user-facing labels (column headers, messages, etc.)

**`constructJtfObject(meta, data, charts, hints): JsonTableFormat`**
- Builds the complete JTF response object
- Wraps metadata and data into proper structure
- Used at the end of `createWidget()` to return final result

**`constructJtfMeta(options, columns, categories): JTFMetaSection`**
- Creates table metadata structure
- Combines options, column definitions, and categories

**`_toEnum(obj): JTFDataEnum | null`**
- Converts PQForce API objects (tasks, users) to JTF enum format
- Extracts relevant fields: id, type, name, description, icon, color
- Marks deleted items with "(deleted)" suffix

---

### **4. `structs.ts` - Custom Data Structures**

**Purpose:** Defines data models for complex historical tracking

**Data structures:**

**`ProjectHistory`**
- Container for array of `ProjectHistoryItem[]`
- Used to track project information over time

**`ProjectHistoryItem`**
- Represents a project snapshot at a point in time
- Fields: timestamp, project ID/name/category, budget/planning info, start/end dates
- Includes array of task IDs in the project

**`PspTaskHistory`**
- Container for task definition and controlling history
- PSP = Project Structure Plan

**`PspTaskHistoryItem`**
- Historical task definition snapshot
- Fields: timestamp, task ID, name, estimated effort (Soll)

**`PspTaskControllingHistoryItem`**
- Historical controlling/financial data
- Fields: margins, rates, revenue (planned vs actual), hours, invoiced amounts

**When used:**
- Extended widget version that shows historical trends
- Analyzing how effort estimates changed over time
- Financial tracking and margin analysis

---

### **5. `api.d.ts` - PQForce API Type Declarations**

**Purpose:** Type definitions for the PQForce API (the global `Pqf` object)

**Structure:** Uses TypeScript `declare namespace` to define the entire Pqf API

**Key namespaces:**

**`Pqf.acm` (Access Control Management)**
- Authentication and token management
- `ApiClientInfo` - Application/client information
- `ApiTokenAuthorizationRequest` - Token auth requests
- `AuthenticationState` - Current authentication status

**`Pqf.pf` (Portfolio/Common)**
- Base/common types used across API
- Interfaces like `Item`, `Reference`, etc.

**`Pqf.pm` (Project Management)**
- Main API for project/work item operations
- Functions called in widget.ts:
  - `getProject(id)` - Get project by ID
  - `getProjectActiveScenario(projectId, includeSingleInactive)` - Get active scenario
  - `getScenarioWorkItems(scenarioId, includeAll)` - Get work items
  - `getProjectWorkItemProgressCorrections(workItemId)` - Get reassessments
- Types like `ProjectWorkItem`, `ProjectWorkItemRemainingEffortWithOverrides`

**`Pqf.clf` (Common/Utility)**
- Utility functions
- `newUuids(count)` - Generate unique IDs

**Why this file?**
- Without it, TypeScript wouldn't understand `Pqf.*` API calls
- Provides autocomplete for all available API functions
- Prevents "unknown identifier" compile errors
- Documents the entire PQForce API interface

---

## Build Process

### **Step 1: Install Dependencies**
```bash
npm install
```
Installs all packages listed in `package.json`:
- TypeScript compiler
- ESLint (code quality)
- Gulp (build automation)
- Jest (testing framework)
- Moment.js (date/time library)

### **Step 2: Build Script**
```bash
npm run build_js
```

**What happens:**
1. **ESLint** - Checks TypeScript files for code quality issues
2. **TypeScript Compiler (tsc)** - Compiles `.ts` files to `.js`
   - Runs with `tsconfig.json` settings
   - Outputs to `dist/` folder
   - Generates source maps (`.js.map`) for debugging
3. **Gulp Post-processing** - Transforms compiled JavaScript:
   - Comments out `export` statements → `/* export */`
   - Comments out `import` statements → `// import`
   - Comments out `default` → `/* default */`
   - Concatenates all `dist/*.js` files into single `script.js`
   - Minifies code with Uglify (reduces file size)

**Why these transformations?**
- PQForce sandbox doesn't support ES6 modules (import/export)
- Everything must be in a single file
- Minification reduces deployment size

**Output:** `script.js` - Ready to copy into PQForce sandbox

### **Step 3: Test (Optional)**
```bash
npm test
```
Runs Jest unit tests (see `test/utils.spec.ts`)

### **Step 4: Deploy (Optional)**
```bash
npm run deploy_js
```
Runs PowerShell script to upload `script.js` to sandbox

---

## TypeScript Configuration (`tsconfig.json`)

**Key settings:**
- `rootDir: "./src"` - Where source files are
- `outDir: "./dist"` - Where compiled JS goes
- `module: "preserve"` - Keep module syntax for Gulp processing
- `target: "esnext"` - Compile to modern JavaScript
- `sourceMap: true` - Generate debugging maps
- `declaration: true` - Generate `.d.ts` type files
- `strict: true` (implied) - Enable all type checking

---

## Gulp Configuration (`gulpfile.js`)

**Purpose:** Post-processes compiled JavaScript for sandbox compatibility

```javascript
// Read all .js files from dist/
src("dist/*.js")
    // Replace ES6 export keywords
    .pipe(replace('export', '/* export */'))
    // Replace ES6 import keywords  
    .pipe(replace('import', '// import'))
    // Replace default keyword
    .pipe(replace('default', '/* default */'))
    // Merge all files into one
    .pipe(concat('script.js'))
    // Optional: Minify (can be disabled)
    // .pipe(uglify())
    // Output to root
    .pipe(dest('./'));
```

---

## Jest Testing (`jest.config.js`)

**Purpose:** Unit testing framework

**Configuration:**
- Uses `ts-jest` preset for TypeScript support
- Test files: `src/**/*.spec.ts`
- See `test/utils.spec.ts` for example tests

**Run tests:**
```bash
npm test
```

**Example tests:**
- Parse ISO 8601 duration strings to hours
- Extract numeric values from enum IDs
- Validate helper function outputs

---

## ESLint Configuration (`eslint.config.mjs`)

**Purpose:** Code quality and style checking

**Checks:**
- No unused variables
- No unused function parameters
- Consistent naming conventions
- Type safety violations
- Common JavaScript errors

**Run ESLint:**
```bash
npx eslint src/*.ts
```

---

## Development Workflow

### **1. Making Changes**
Edit TypeScript files in `src/`:
- Add features
- Fix bugs
- Improve logic

### **2. Test Locally**
```bash
npm run build_js    # Compile and check for errors
npm test            # Run unit tests
```

### **3. Verify Output**
Check `script.js` to see generated JavaScript:
- Should be minified/hard to read
- No `export` or `import` statements
- Single concatenated file

### **4. Deploy to Sandbox**
```bash
npm run buildAndDeploy_js
```

### **5. Test in PQForce**
- Open PQForce portal
- Create/update widget with new script
- Test with actual data

---

## Common Tasks

### **Add a New Function**
1. Create in appropriate `.ts` file (or new file)
2. Export it: `export function myFunc() {}`
3. Add JSDoc comments
4. Add unit tests in `test/`
5. Run `npm run build_js` to verify

### **Debug Issues**
1. Check console output during build
2. Look at `dist/*.js` files before Gulp processing
3. Use source maps in browser DevTools
4. Check jest test results: `npm test`
5. Run ESLint: `npx eslint src/*.ts`

### **Update Dependencies**
```bash
npm update
```
Or for specific package:
```bash
npm install package-name@latest
```

### **Disable Minification (for debugging)**
Edit `gulpfile.js`, comment out:
```javascript
// .pipe(uglify())
```
Then rebuild:
```bash
npm run build_js
```

---

## Why This Project Structure?

| Feature | Benefit |
|---------|---------|
| TypeScript | Type safety, IDE support, early error detection |
| Separate files | Code organization, reusability, maintainability |
| ESLint | Code quality, consistent style, catch errors |
| Jest tests | Prevent regressions, document expected behavior |
| Gulp automation | Consistent builds, no manual steps |
| Source maps | Debug compiled code in browser DevTools |
| npm scripts | Simple commands instead of complex CLI calls |

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies (first time) |
| `npm run build_js` | Compile, lint, process, output `script.js` |
| `npm test` | Run unit tests |
| `npm run deploy_js` | Upload to sandbox |
| `npm run buildAndDeploy_js` | Build + Deploy |

---

## File Outputs

**After `npm run build_js`:**

- `dist/*.js` - Compiled JavaScript with types
- `dist/*.d.ts` - TypeScript type declarations
- `dist/*.js.map` - Source maps for debugging
- `script.js` - Final output for sandbox (minified, concatenated)

**Safe to commit to version control:** `src/`, `test/`, configuration files
**Should NOT commit:** `dist/`, `node_modules/`, `script.js`

---

## Next Steps

1. Read individual file comments for implementation details
2. Study `test/utils.spec.ts` for testing patterns
3. Examine `widget.ts` for PQForce API usage
4. Create new widgets using this as template

