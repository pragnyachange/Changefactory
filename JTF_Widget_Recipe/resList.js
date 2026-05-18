/*
Author(s): LI

Description:
    Code for example widget "Resource List", described in community post.

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "94F36F9798024E63AF8EAF58ED2AE5B2"
    -   Resource List Widget
        -   [CockpitWidgetId] = "51848189F1A940BDA3F4E065DA92318A"

Libraries: 
    -   MOMENT

*/

"use strict";
moment.locale("de");

// PARAMETERS ##################################################################
/**
 * Define global constants and parameters for the widget.
 */

const DEBUG = true;

let hints = [];

// READ SETTINGS ###############################################################
/**
 * Read the client settings.
 */

DEBUG ? console.log("client: " + JSON.stringify(client)) : null;

let incl_subOUs = client.config.properties.find(prop => prop.id === "include_subOUs").value;


// LOAD DATA ###################################################################
/**
 * Load JTF data, typically by calling a function from the jtf-section in
 * pqfDataCollectorLib. 
 */

let jtf = {
    "meta": {
        "options": {
            "adaptiveColumnWidths": true,
            "groupBy": null,
            "sortBy": { "columnId": "name_col", "direction": "ASC" }
        },
        "categories": [
            { "id": "res_cat", "label": null}
        ],
        "columns": [
            {
                "id": "name_col",
                "catid": "res_cat",
                "type": "enum",
                "label": { "en": "Name", "de": "Name" },
                "options": { "width": 200 },
                "format": { "showIcon": true, "addLink": "details" }
            },
            {
                "id": "email_col",
                "catid": "res_cat",
                "type": "string",
                "label": { "en": "E-Mail", "de": "E-Mail" },
                "options": { "width": 200 }
            },
        ]
    },
    "data": []
}

let resObjs = _getResObjs(reference.id, incl_subOUs).filter(resObj => resObj.type === "HRM-RES-TYP-EMP");
resObjs.forEach(resObj => {
    let row = {
        "id": Pqf.clf.newUuids(1).newUuids[0],
        "data": [_toEnum(resObj), resObj.properties.find(prop => prop.key === "emp-email").value]
    };
    jtf.data.push(row);
});

// ADD CHARTS ##################################################################
/**
 * Add charts to the JTF.
 */

// RETURN JTF ##################################################################
/**
 * Return resulting JTF object.
 */

//jtf.hints = hints; // Only added in 4.25.6
DEBUG ? console.log("jtf: " + JSON.stringify(jtf)) : null;
jtf;

// FUNCTIONS ###################################################################
/**
 * Set of function definitions that are specific to this widget.
 */

function _getResObjs(ouId, incl_subOUs) {
    // Load all child resource of this OU
    let resObjs = [];
    try {
        resObjs = Pqf.res.getResourceChildren(ouId);
    } catch {
        hints.push({
            "type": "warn",
            "label": "Resource Load Warning",
            "message": "Failed to load child-resources of OU with ID " + ouId
        })
    }
    if (!resObjs || resObjs.length === 0) {
        return [];
    }
    // If the user wants to consider sub OUs, load all resources of the OU and its children
    if (incl_subOUs) {
        resObjs.forEach(child => {
            resObjs = resObjs.concat(_getResObjs(child.id, incl_subOUs));
        });
    }
    // Filter duplicate resource enums
    resObjs = resObjs.filter((resObj, index, self) =>
        index === self.findIndex((r) => r.id === resObj.id)
    );
    
    return resObjs;
}

function _toEnum(obj) {
    if (!obj) {
        return null;
    }
    return {
        'type': obj.type,
        'id': obj.id,
        'name': obj.name,
        'description': obj.description,
        'iconRef': obj.iconRef,
        'color': obj.color
    };
}