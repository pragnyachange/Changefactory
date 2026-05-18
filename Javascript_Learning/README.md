# Changefactory
Running javascript file : (go into Javascript_Learning folder first) 
    node filename.js

Git:
    After changing a file:
        git add .
        git commit -m " message " 
        git push
        
Javascript:
// comments
console.log = print 
\n is new line 
function name():



# PQForce TypeScript / JavaScript Widget

This project is a small starter template for building **PQForce JavaScript sandbox widgets** with **TypeScript**.

## What this project is for

PQForce runs **JavaScript** inside its sandbox, but writing raw JavaScript can be harder to maintain.
This project lets you:

- write widget code in **TypeScript**
- use type hints and autocomplete for the **Pqf** API
- compile your code to plain **JavaScript**
- paste the compiled JavaScript into the PQForce sandbox

In short:

- `TypeScript` = better developer experience -> has concrete types since javascript types are dynamic
- `JavaScript` = what PQForce actually executes

## Important idea: TypeScript vs JavaScript

### JavaScript
JavaScript is the real runtime language.
PQForce executes JavaScript in its sandbox.

Example:

```js
const project = Pqf.pm.getProject(client.selectedObject.id);
```

### TypeScript
TypeScript is JavaScript plus type checking.
It helps you catch mistakes before runtime.

Example:

```ts
function exampleWidget(pqfProjectId: string): JsonTableFormat {
    const project = Pqf.pm.getProject(pqfProjectId);
    return {
        id: "JFT-TS-EXAMPLE",
        code: { en: "example", de: "beispiel" },
        name: { en: "Table example", de: "Tabellenbeispiel" },
        charts: [{ id: "chart1" }],
        data: [project.name],
        description: {
            en: "TBD Description",
            de: "TBD Beschreibung"
        },
        initialChart: "chart1",
        meta: {
            options: {
                adaptiveColumnWidths: true,
                showHeader: true,
                sortBy: { columnId: "example" }
            },
            categories: columnCategories,
            columns
        },
        mimeType: "application/x.pqf.table.json",
        hints: [
            {
                type: "info",
                label: "Project",
                text: { en: "Example", de: "Beispiel" }
            }
        ],
        type: "JsonTable"
    };
}
```

After compilation, the types disappear and only JavaScript remains.

## Files in this project

### `src/widget.ts`
Your actual widget source file.

This is where you write the widget logic:
- call PQForce APIs
- shape the data
- return a widget object

### `src/jtf.ts`
Type definitions for the table/widget JSON format.

This helps TypeScript understand what a valid widget result should look like.

### `src/api.d.ts`
Type definitions for the global `Pqf` namespace.

This gives autocomplete and type checking for methods like:
- `Pqf.pm.getProject(...)`
- `Pqf.res.getResources(...)`
- `Pqf.nav.getObject(...)`

### `src/generator.ts`
Utility script that can generate API typings from XML.

You usually do **not** need this just to build or edit a widget.

### `dist/widget.js`
The compiled JavaScript output you can copy into the PQForce sandbox.

## What the example widget does

The example widget:

1. gets the current object id from `client.selectedObject.id`
2. fetches a project using `Pqf.pm.getProject(...)`
3. puts the project name into the table data
4. returns a simple JSON table widget

That means the example displays a one-column table with the selected project's name.

## What `client` means

Inside the sandbox, PQForce provides a global object named `client`.

Example:

```js
const pqfProjectId = client.selectedObject.id;
```

That means the widget is using the currently selected object in the UI.

Common part:

```ts
client.selectedObject.id
```

This is how your widget knows which PQForce object it should work on.

## What `Pqf` means

`Pqf` is the global PQForce API namespace.

Examples:

```js
Pqf.pm.getProject(projectId)
Pqf.res.getResource(resourceId)
Pqf.nav.getObject(type, id)
```

You do not create `Pqf` yourself.
PQForce provides it at runtime.

The `api.d.ts` file exists so TypeScript understands that `Pqf` exists and what functions it has.

## What the returned widget object is

Your widget must return an object in the format PQForce expects.

For table widgets, that object includes things like:

- `data` -> the actual values to show
- `meta.columns` -> how columns should look
- `meta.categories` -> column groupings
- `name` -> widget name
- `description` -> widget description
- `mimeType` -> tells PQForce what kind of widget this is
- `type` -> the widget format type

Example:

```js
return {
    id: "JFT-TS-EXAMPLE",
    code: { en: "example", de: "beispiel" },
    name: { en: "Table example", de: "Tabellenbeispiel" },
    charts: [{ id: "chart1" }],
    data: [project.name],
    description: {
        en: "TBD Description",
        de: "TBD Beschreibung"
    },
    initialChart: "chart1",
    meta: {
        options: {
            adaptiveColumnWidths: true,
            showHeader: true,
            sortBy: { columnId: "example" }
        },
        categories: columnCategories,
        columns
    },
    mimeType: "application/x.pqf.table.json",
    hints: [],
    type: "JsonTable"
};
```

## Why the file ends with `widgetData;`

In the example you may see:

```js
const pqfProjectId = client.selectedObject.id;
const widgetData = exampleWidget(pqfProjectId);
widgetData;
```

That last line looks strange in a normal app, but in sandbox-style scripting it is often used so the last evaluated value becomes the output.

So this is effectively the widget result.

## General TypeScript things you should know

### 1. Type annotations
TypeScript lets you say what type a value should have.

```ts
const name: string = "Project A";
const count: number = 5;
const active: boolean = true;
```

### 2. Function parameter types
```ts
function loadProject(projectId: string) {
    return Pqf.pm.getProject(projectId);
}
```

### 3. Return types
```ts
function getName(): string {
    return "Example";
}
```

### 4. Interfaces
Interfaces describe object shapes.

```ts
interface Person {
    id: string;
    name: string;
}
```

### 5. Optional values
```ts
interface Filter {
    name?: string;
}
```

### 6. Arrays
```ts
const ids: string[] = ["a", "b", "c"];
```

### 7. Type-only imports
This project uses type-only imports so TypeScript can check types without forcing runtime module behavior.

```ts
import type { JsonTableFormat } from "./jtf";
```

That matters because PQForce's runtime is old and does not support normal modern module patterns well.

## General JavaScript things you should know

### 1. `const` and `let`
Use `const` if the variable should not be reassigned.
Use `let` if it should change.

```js
const projectId = client.selectedObject.id;
let total = 0;
```

### 2. Objects
```js
const project = {
    id: "123",
    name: "Example"
};
```

### 3. Arrays
```js
const names = ["A", "B", "C"];
```

### 4. Functions
```js
function getProjectName(project) {
    return project.name;
}
```

### 5. Dot access
```js
project.name
client.selectedObject.id
```

### 6. Calling APIs
```js
const project = Pqf.pm.getProject(projectId);
```

## How to work on the widget

### 1. Edit the TypeScript source
Open:

```text
src/widget.ts
```

### 2. Change the example logic
For example:
- add more columns
- show more project fields
- call other `Pqf` APIs
- add hints or formatting

### 3. Compile
Run:

```bash
npx tsc
```

### 4. Copy the compiled JavaScript
Use:

```text
dist/widget.js
```

Paste that into the PQForce sandbox configuration.

## Typical workflow

1. edit `src/widget.ts`
2. run `npx tsc`
3. open `dist/widget.js`
4. copy/paste into PQForce sandbox
5. test in PQForce
6. repeat

Do not rely on editing only the compiled JavaScript unless you really have to.

## Common mistakes

### Mistake 1: Editing only `dist/widget.js`
That works short-term, but you lose TypeScript safety and autocomplete.

Better:
- edit `src/widget.ts`
- compile again

### Mistake 2: Using unsupported module syntax in sandbox
PQForce's Rhino-based environment is limited.
Avoid relying on:
- `import` at runtime
- `require`
- `export`

Use the compiled simple JavaScript output.

### Mistake 3: Returning the wrong object shape
If the widget object does not match the expected format, PQForce may reject it or render incorrectly.

### Mistake 4: Wrong column ids
If `sortBy.columnId` refers to a column that does not exist, sorting will not behave correctly.

Example:
- bad: `sortBy: { columnId: "nr" }`
- good: `sortBy: { columnId: "example" }`

## Small example: add another column

If you want to show two columns, define two columns and two values.

Example idea:

```ts
const columns = [
    {
        catid: "cat1",
        id: "name",
        label: { en: "Name", de: "Name" },
        type: "string"
    },
    {
        catid: "cat1",
        id: "code",
        label: { en: "Code", de: "Code" },
        type: "string"
    }
];

function exampleWidget(pqfProjectId: string): JsonTableFormat {
    const project = Pqf.pm.getProject(pqfProjectId);

    return {
        id: "JFT-TS-EXAMPLE",
        code: { en: "example", de: "beispiel" },
        name: { en: "Table example", de: "Tabellenbeispiel" },
        charts: [{ id: "chart1" }],
        data: [project.name, project.code],
        description: {
            en: "Example widget",
            de: "Beispiel-Widget"
        },
        initialChart: "chart1",
        meta: {
            options: {
                adaptiveColumnWidths: true,
                showHeader: true,
                sortBy: { columnId: "name" }
            },
            categories: columnCategories,
            columns
        },
        mimeType: "application/x.pqf.table.json",
        hints: [],
        type: "JsonTable"
    };
}
```

## Commands you will use most

Install dependencies:

```bash
npm install
```

Check TypeScript:

```bash
npx tsc --noEmit
```

Compile:

```bash
npx tsc
```

## Final mental model



- `widget.ts` = what you write
- `api.d.ts` = how TypeScript knows PQForce APIs
- `jtf.ts` = how TypeScript knows valid widget structure
- `widget.js` = what PQForce runs

So the usual pattern is:

**write in TypeScript -> compile -> paste JavaScript into PQForce**