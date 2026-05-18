
This Markdown file summarizes and gives an explicit recipe for creating a JTF_Widget, based on the forum post by Luca Iten.

Templates can be found in the JTF_Widget folder. 

JTF Widget: configurable **JSON table widget** in PQFORCE: data is collected by a **JS automation / JS sandbox**, returned as a **JTF object**, and then displayed in the cockpit as a table or chart-based widget. 

JTF widget is made from **two parts that work together**: a **widget definition** stored on the server, and a **JS sandbox** that returns the JTF object. The widget definition references the sandbox by ID.

A JTF widget is basically this pipeline:

1.  **Create a JS sandbox** (before creating a widget)
2.**Create a widget definition**
3. The sandbox returns a **JTF object**
4. The cockpit renders that object as a widget

 The widget definition can be created with:

`PUT /API/V2/CLF/CockpitWidget/{widgetId}/WithTranslations`

and existing widget definitions can be listed with:

`GET /API/V2/CLF/CockpitWidgets/WithTranslations`

Debugging: find the widget then go to sandbox and to the console to check error messages if u don't get one when clicking it 
  - the widget appears at the correct place (means bruno api call correct)
  - content not correct ( js-sandbox code needs to be modified)



### 1) Widget definition

 Important fields in the widget definition:

* `objectType`: the PQFORCE object type where the widget can be used
* `widgetType`: must be `"jtf"` for JTF widgets
* `definition`: escaped JSON string containing widget settings
* `tags`: where the widget should be shown
* `sandboxId`: ID of the JS sandbox that returns the JTF object
    
    
    

### 2) JS sandbox

The sandbox must return a **JTF object**. The JTF object has:

* `meta`
* `data`
* optional `charts`
    
    

The server also passes values into the sandbox, especially:

* `reference` with the triggering object context
* `client` with the current widget settings chosen by the user

Example uses `client` to read widget properties set by the user, such as a checkbox.



---

## The recipe to make a JTF widget

### Step 1: Decide what the widget shows

Example from the post: a table of all resources in an OU, showing **name** and **email**.



### Step 2: Build the widget settings JSON

This becomes the `definition` field in the widget definition.

The post’s example includes a `properties` array with:

* a `group` section called “Settings / Einstellungen”
* a `checkbox` property with id `include_subOUs`

This checkbox lets the user include resources from sub-OUs. On page 4, the screenshot shows this settings area in the widget UI.



### Step 3: Create the JS sandbox first

The server checks whether the sandbox exists, so the **sandbox must exist before the widget is created**.



### Step 4: Create the widget definition

Send the widget definition to:

`PUT /API/V2/CLF/CockpitWidget/{widgetId}/WithTranslations`

Make sure `sandboxId` points to the sandbox from step 3.



### Step 5: In the sandbox, read user settings from `client`

The example reads whether the checkbox `include_subOUs` is enabled by looking inside `client.config.properties`. The exact code line is cut off in the screenshot on page 6, but the intent is clear: find the property by id and read its `value`.



### Step 6: Build the JTF object

The post says to define:

* `meta` with column definitions
* `data` with rows
* optionally `charts`

For the example table, `meta.columns` includes columns for **Name** and **E-Mail**. Each column needs a unique ID, a category, a type, and a label.



### Step 7: Return the JTF object

At the end of the sandbox, return the constructed JTF object. That returned object is what PQFORCE renders.


---

## All practical instructions in one place

Use this checklist:

1. Create a JS sandbox that returns a JTF object.
2. Make sure the returned object contains at least `meta` and `data`.
3. Create a widget definition with:
    * `widgetType: "jtf"`
    * `sandboxId`
    * `definition` as an escaped JSON string
    * `objectType`
    * `tags`
4. Put user-adjustable widget settings inside `definition.properties`.
5. In the sandbox, read those settings from `client.config.properties`.
6. Build `meta.columns` for the table structure.
7. Push one row per item into `data`.
8. Return the final JTF object.

One useful detail from the example: the widget can hide the timeline, and the table can be configured with options like header visibility and sorting behavior in the configuration shown on pages 5–6.



---

## Copy-paste recipe

This is a **minimal template** to adapt.

### A. Widget definition body

JSON{  
  "name": [  
    { "code": "en", "text": "Resource List" },  
    { "code": "de", "text": "Ressourcenliste" }  
  ],  
  "description": [  
    { "code": "en", "text": "Shows resources in an OU" },  
    { "code": "de", "text": "Zeigt Ressourcen in einer OU" }  
  ],  
  "code": "resource_list_jtf",  
  "icon": "table",  
  "objectType": "HRM-RES-TYP-OU",  
  "widgetType": "jtf",  
  "tags": ["cockpit", "resource"],  
  "sandboxId": "YOUR_SANDBOX_ID",  
  "definition": "{\"view\":\"table\",\"showHeader\":true,\"dateRange\":null,\"properties\":[{\"type\":\"group\",\"title\":[{\"code\":\"en\",\"text\":\"Settings\"},{\"code\":\"de\",\"text\":\"Einstellungen\"}]},{\"id\":\"include_subOUs\",\"name\":[{\"code\":\"en\",\"text\":\"Incl. Sub-OUs\"},{\"code\":\"de\",\"text\":\"Inkl. Sub-OUs\"}],\"type\":\"checkbox\",\"value\":false,\"options\":{}}],\"options\":{\"disableFilter\":false,\"disableSorting\":true}}"  
}

### B. Example JS sandbox

JavaScript// Example JTF sandbox for an OU resource table  
  
(function () {  
  function getPropertyValue(client, propertyId, defaultValue) {  
    const props = client?.config?.properties || [];  
    const prop = props.find(p => p.id === propertyId);  
    return prop && typeof prop.value !== "undefined" ? prop.value : defaultValue;  
  }  
  
  const includeSubOUs = getPropertyValue(client, "include_subOUs", false);  
  
  // Replace this with  real data loading logic  
  function getResourcesFromOU(referenceObjectId, includeChildren) {  
    // Example static data  
    return [  
      {  
        id: "res1",  
        displayName: "Alice Example",  
        email: "alice@example.com"  
      },  
      {  
        id: "res2",  
        displayName: "Bob Example",  
        email: "bob@example.com"  
      }  
    ];  
  }  
  
  const selectedObjectId = reference?.objectId || null;  
  const resources = getResourcesFromOU(selectedObjectId, includeSubOUs);  
  
  const jtf = {  
    meta: {  
      columns: [  
        {  
          id: "name",  
          label: "Name",  
          type: "enum",  
          category: "general"  
        },  
        {  
          id: "email",  
          label: "E-Mail",  
          type: "string",  
          category: "general"  
        }  
      ]  
    },  
    data: [],  
    charts: []  
  };  
  
  resources.forEach((res, index) => {  
    jtf.data.push({  
      id: res.id || ("row_" + index),  
      name: {  
        value: res.displayName,  
        icon: "user"  
      },  
      email: {  
        value: res.email  
      }  
    });  
  });  
  
  return jtf;  
})();

---

## Example to copy-paste


### Example widget `definition` JSON

JSON{  
  "view": "table",  
  "showHeader": true,  
  "dateRange": null,  
  "properties": [  
    {  
      "type": "group",  
      "title": [  
        { "code": "en", "text": "Settings" },  
        { "code": "de", "text": "Einstellungen" }  
      ]  
    },  
    {  
      "id": "include_subOUs",  
      "name": [  
        { "code": "en", "text": "Incl. Sub-OUs" },  
        { "code": "de", "text": "Inkl. Sub-OUs" }  
      ],  
      "type": "checkbox",  
      "value": false,  
      "options": {}  
    }  
  ],  
  "options": {  
    "disableFilter": false,  
    "disableSorting": true  
  }  
}

### Example full sandbox

JavaScript(function () {  
  const props = client?.config?.properties || [];  
  const includeSubOUs = (props.find(p => p.id === "include_subOUs") || {}).value === true;  
  
  // Demo data source  
  const rows = [  
    { id: "1", name: "Max Mustermann", email: "max@example.com" },  
    { id: "2", name: "Erika Musterfrau", email: "erika@example.com" }  
  ];  
  
  return {  
    meta: {  
      columns: [  
        {  
          id: "name",  
          label: "Name",  
          type: "enum",  
          category: "general"  
        },  
        {  
          id: "email",  
          label: "E-Mail",  
          type: "string",  
          category: "general"  
        }  
      ]  
    },  
    data: rows.map(r => ({  
      id: r.id,  
      name: {  
        value: r.name,  
        icon: "user"  
      },  
      email: {  
        value: r.email  
      }  
    })),  
    charts: []  
  };  
})();

---



## Recipe


1. **JS sandbox**
    * returns the JTF object
    * reads user settings from `client.config.properties`
2. **Widget definition**
    * references the sandbox with `sandboxId`
    * sets `widgetType` to `"jtf"`
    * contains the escaped widget config JSON in `definition`
3. **Definition JSON**
    * controls view settings and widget properties
    * can define user-editable options like checkboxes and groups

sample uses a `group` plus a checkbox `include_subOUs`, then reads that property in the sandbox to decide how to load data.

 

---

# Recipe: how to make a JTF widget

## Step 1 — Create the JS sandbox first

The server validates the referenced sandbox, so the **sandbox must already exist before the widget definition is created**.

 

## Step 2 — Write the widget config JSON

This becomes the content of the `definition` field.  
The post’s example includes:

* `view: "table"`
* widget `properties`
* a `group`
* a checkbox called `include_subOUs`
    
     
    

## Step 3 — Create the widget definition

Send it to:

PUT /API/V2/CLF/CockpitWidget/{widgetId}/WithTranslations

Existing definitions can be fetched with:

GET /API/V2/CLF/CockpitWidgets/WithTranslations

 

## Step 4 — In the sandbox, read `client`
The sandbox receives:

* `reference` for the triggering object
* `client` for current user/widget settings
    
     
    

## Step 5 — Return the JTF object

The JTF object should contain:

* `meta`
* `data`
* optional `charts`
    
     
    

---

# Starter pack

## 1) Definition JSON

This is the readable JSON before escaping it into the widget definition.

JSON{  
  "view": "table",  
  "showHeader": true,  
  "dateRange": null,  
  "properties": [  
    {  
      "type": "group",  
      "title": [  
        { "code": "en", "text": "Settings" },  
        { "code": "de", "text": "Einstellungen" }  
      ]  
    },  
    {  
      "id": "include_subOUs",  
      "name": [  
        { "code": "en", "text": "Incl. Sub-OUs" },  
        { "code": "de", "text": "Inkl. Sub-OUs" }  
      ],  
      "type": "checkbox",  
      "value": false,  
      "options": {}  
    }  
  ],  
  "options": {  
    "disableFilter": false,  
    "disableSorting": true  
  }  
}

 

---

## 2) Widget definition body

Replace the placeholders:

* `YOUR_WIDGET_ID`
* `YOUR_SANDBOX_ID`
* `YOUR_OBJECT_TYPE`

JSON{  
  "name": [  
    { "code": "en", "text": "Resource List" },  
    { "code": "de", "text": "Ressourcenliste" }  
  ],  
  "description": [  
    { "code": "en", "text": "Shows resources in an OU" },  
    { "code": "de", "text": "Zeigt Ressourcen in einer OU" }  
  ],  
  "code": "resource_list_jtf",  
  "icon": "table",  
  "objectType": "YOUR_OBJECT_TYPE",  
  "widgetType": "jtf",  
  "tags": ["cockpit", "resource"],  
  "sandboxId": "YOUR_SANDBOX_ID",  
  "definition": "{\"view\":\"table\",\"showHeader\":true,\"dateRange\":null,\"properties\":[{\"type\":\"group\",\"title\":[{\"code\":\"en\",\"text\":\"Settings\"},{\"code\":\"de\",\"text\":\"Einstellungen\"}]},{\"id\":\"include_subOUs\",\"name\":[{\"code\":\"en\",\"text\":\"Incl. Sub-OUs\"},{\"code\":\"de\",\"text\":\"Inkl. Sub-OUs\"}],\"type\":\"checkbox\",\"value\":false,\"options\":{}}],\"options\":{\"disableFilter\":false,\"disableSorting\":true}}"  
}

 important fields in the widget definition: `objectType`, `widgetType`, `definition`, `tags`, and `sandboxId`.

 

---

## 3) JS sandbox

This is the main part. It reads the widget property, loads rows, and returns a JTF object.

JavaScript(function () {  
  function getPropertyValue(client, propertyId, defaultValue) {  
    const props = client?.config?.properties || [];  
    const prop = props.find(p => p.id === propertyId);  
    return prop && typeof prop.value !== "undefined" ? prop.value : defaultValue;  
  }  
  
  const includeSubOUs = getPropertyValue(client, "include_subOUs", false);  
  
  const selectedObjectType = reference?.objectType || null;  
  const selectedObjectId = reference?.objectId || null;  
  
  // Replace this with real data loading logic  
  function loadResources(objectType, objectId, includeChildren) {  
    // Example/demo rows  
    return [  
      {  
        id: "res_1",  
        name: "Max Mustermann",  
        email: "max.mustermann@example.com"  
      },  
      {  
        id: "res_2",  
        name: "Erika Musterfrau",  
        email: "erika.musterfrau@example.com"  
      }  
    ];  
  }  
  
  const resources = loadResources(selectedObjectType, selectedObjectId, includeSubOUs);  
  
  const jtf = {  
    meta: {  
      columns: [  
        {  
          id: "name",  
          label: "Name",  
          type: "enum",  
          category: "general"  
        },  
        {  
          id: "email",  
          label: "E-Mail",  
          type: "string",  
          category: "general"  
        }  
      ]  
    },  
    data: [],  
    charts: []  
  };  
  
  for (let i = 0; i < resources.length; i++) {  
    const res = resources[i];  
  
    jtf.data.push({  
      id: res.id || ("row_" + i),  
      name: {  
        value: res.name,  
        icon: "user"  
      },  
      email: {  
        value: res.email  
      }  
    });  
  }  
  
  return jtf;  
})();

Approach: define `meta.columns`, create rows in `data`, then return the final object. Each column should have a unique ID, category, type, and label.

 

---

# Copy-paste example: full simple JTF widget

This is the simplest useful example: **OU resource list with Name + E-Mail**.

## Sandbox

JavaScript(function () {  
  const props = client?.config?.properties || [];  
  const includeSubOUs = (props.find(p => p.id === "include_subOUs") || {}).value === true;  
  
  const rows = [  
    { id: "1", name: "Alice Example", email: "alice@example.com" },  
    { id: "2", name: "Bob Example", email: "bob@example.com" }  
  ];  
  
  return {  
    meta: {  
      columns: [  
        {  
          id: "name",  
          label: "Name",  
          type: "enum",  
          category: "general"  
        },  
        {  
          id: "email",  
          label: "E-Mail",  
          type: "string",  
          category: "general"  
        }  
      ]  
    },  
    data: rows.map(r => ({  
      id: r.id,  
      name: {  
        value: r.name,  
        icon: "user"  
      },  
      email: {  
        value: r.email  
      }  
    })),  
    charts: []  
  };  
})();

## Definition JSON

JSON{  
  "view": "table",  
  "showHeader": true,  
  "dateRange": null,  
  "properties": [  
    {  
      "type": "group",  
      "title": [  
        { "code": "en", "text": "Settings" },  
        { "code": "de", "text": "Einstellungen" }  
      ]  
    },  
    {  
      "id": "include_subOUs",  
      "name": [  
        { "code": "en", "text": "Incl. Sub-OUs" },  
        { "code": "de", "text": "Inkl. Sub-OUs" }  
      ],  
      "type": "checkbox",  
      "value": false,  
      "options": {}  
    }  
  ],  
  "options": {  
    "disableFilter": false,  
    "disableSorting": true  
  }  
}

## Widget definition body

JSON{  
  "name": [  
    { "code": "en", "text": "Resource List" },  
    { "code": "de", "text": "Ressourcenliste" }  
  ],  
  "description": [  
    { "code": "en", "text": "Simple JTF table example" },  
    { "code": "de", "text": "Einfaches JTF-Tabellenbeispiel" }  
  ],  
  "code": "resource_list_jtf",  
  "icon": "table",  
  "objectType": "HRM-RES-TYP-OU",  
  "widgetType": "jtf",  
  "tags": ["cockpit"],  
  "sandboxId": "YOUR_SANDBOX_ID",  
  "definition": "{\"view\":\"table\",\"showHeader\":true,\"dateRange\":null,\"properties\":[{\"type\":\"group\",\"title\":[{\"code\":\"en\",\"text\":\"Settings\"},{\"code\":\"de\",\"text\":\"Einstellungen\"}]},{\"id\":\"include_subOUs\",\"name\":[{\"code\":\"en\",\"text\":\"Incl. Sub-OUs\"},{\"code\":\"de\",\"text\":\"Inkl. Sub-OUs\"}],\"type\":\"checkbox\",\"value\":false,\"options\":{}}],\"options\":{\"disableFilter\":false,\"disableSorting\":true}}"  
}

---

# How to use it

## A. Create the sandbox

Create/save the JS sandbox and note its ID.

## B. Insert the sandbox ID into the widget definition

Replace:

YOUR_SANDBOX_ID

## C. Set the right object type

 Supported object types include `Project`, `ProjectPortfolio`, and configurable resource types. In the example, the context is an OU/resource type.

 

## D. Call the API

Create the widget via:

PUT /API/V2/CLF/CockpitWidget/{widgetId}/WithTranslations

## E. Open the cockpit

The widget should render the JTF table.

---

# Quick rules to remember

* `widgetType` must be `"jtf"`
    
     
    
* `sandboxId` must point to an existing sandbox
    
     
    
* `definition` is JSON passed as a string in the widget definition
    
     
    
* the sandbox returns the JTF object
* `meta` defines columns
* `data` contains rows
* `charts` is optional
    
     
    

