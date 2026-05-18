/*
Description:
    Project team widget:
    Loads all project-team members via PF forward relations,
    then loads each resource and displays name + e-mail in a table.


Libraries:
    - MOMENT
*/

"use strict";

// Set moment.js locale to German.
moment.locale("de");

// Enable / disable console logging.
const DEBUG = true;

// The PF relation type that links a project to its team members.
// Replace this with the correct relation type ID from your system.
const RELATION_TYPE_ID = "EB1E1FA5DC3046968A66E6328F30390F";

// Collect warning/info hints that can be shown in the widget result.
let hints = [];

// Debug: log sandbox globals if they exist.
DEBUG ? console.log("client: " + JSON.stringify(typeof client !== "undefined" ? client : null)) : null;
DEBUG ? console.log("reference: " + JSON.stringify(typeof reference !== "undefined" ? reference : null)) : null;

/*
 * JTF = widget output structure.
 * It defines:
 * - table options
 * - one category
 * - two columns:
 *   1. name as enum object with icon + details link
 *   2. e-mail as plain string
 */
let jtf = {
    "meta": {
        "options": {
            "adaptiveColumnWidths": true,
            "groupBy": null,
            "sortBy": { "columnId": "name_col", "direction": "ASC" }
        },
        "categories": [
            { "id": "res_cat", "label": null }
        ],
        "columns": [
            {
                "id": "name_col",
                "catid": "res_cat",
                "type": "enum",
                "label": { "en": "Name", "de": "Name" },
                "options": { "width": 220 },
                "format": { "showIcon": true, "addLink": "details" }
            },
            {
                "id": "email_col",
                "catid": "res_cat",
                "type": "string",
                "label": { "en": "E-Mail", "de": "E-Mail" },
                "options": { "width": 220 }
            }
        ]
    },
    "data": []
};

/*
 * The widget needs a bound object in the sandbox.
 * If reference or reference.id is missing, show a warning instead of crashing.
 */
if (typeof reference === "undefined" || !reference || !reference.id) {
    hints.push({
        "type": "warn",
        "label": "Missing reference",
        "message": "No project reference was provided to the widget sandbox."
    });
} else {
    // Load all resources connected to the current project by the configured relation type.
    let resObjs = _getProjectTeamResources(reference.id, RELATION_TYPE_ID);

    // Optional restriction:
    // Keep only employee resources.
    // Adjust/remove this if your team members are stored with another resource type.
    resObjs = resObjs.filter(resObj => resObj && resObj.type === "HRM-RES-TYP-EMP");

    // Convert each resource into one output row.
    resObjs.forEach(resObj => {
        // Try to extract the e-mail from common fields / properties.
        let email = _getEmail(resObj);

        // Every row needs a unique ID.
        let row = {
            "id": Pqf.clf.newUuids(1).newUuids[0],
            "data": [
                _toEnum(resObj), // first column: resource object as enum
                email            // second column: e-mail text
            ]
        };

        jtf.data.push(row);
    });
}

// Only attach hints if any were collected.
if (hints.length > 0) {
    jtf.hints = hints;
}

// Debug: log final widget result.
DEBUG ? console.log("jtf: " + JSON.stringify(jtf)) : null;

// Return final widget payload.
jtf;


// FUNCTIONS ###################################################################

/*
 * Loads all project team resources for one project.
 *
 * Steps:
 * 1. Load all forward relations of the project for the given relation type.
 * 2. Extract all target IDs from those relations.
 * 3. Remove duplicate IDs.
 * 4. Load the full resource object for each target ID.
 * 5. Remove duplicate resources.
 *
 * Returns:
 *   Array of resource objects.
 */
function _getProjectTeamResources(projectId, relationTypeId) {
    let relations = [];
    let resourceIds = [];
    let resObjs = [];

    try {
        // 1) Load project -> team member relations.
        relations = _getProjectForwardRelations(projectId, relationTypeId) || [];

        DEBUG ? console.log("relations: " + JSON.stringify(relations)) : null;

        // 2) Extract relation target IDs.
        relations.forEach(rel => {
            if (rel && rel.target && rel.target.id) {
                resourceIds.push(rel.target.id);
            }
        });

        // Remove duplicate IDs.
        resourceIds = resourceIds.filter((id, index, self) => self.indexOf(id) === index);

        DEBUG ? console.log("resourceIds: " + JSON.stringify(resourceIds)) : null;

        // 3) Load the full resource object for each target.
        resourceIds.forEach(resourceId => {
            let resObj = _getResourceById(resourceId);
            if (resObj) {
                resObjs.push(resObj);
            }
        });

        // Remove duplicate resource objects by resource ID.
        resObjs = resObjs.filter((resObj, index, self) =>
            index === self.findIndex(r => r && r.id === resObj.id)
        );

    } catch (e) {
        // If anything fails, add a warning to the widget.
        hints.push({
            "type": "warn",
            "label": "Project Team Load Warning",
            "message": "Failed to load project team for project ID " + projectId + ": " + e
        });
    }

    DEBUG ? console.log("resObjs: " + JSON.stringify(resObjs)) : null;

    return resObjs;
}

/*
 * Loads all forward PF relations from one project for one relation type.
 *
 * Parameters:
 *   projectId       = current project ID
 *   relationTypeId  = relation type that links project -> team member
 *
 * Uses the documented JS wrapper:
 *   Pqf.pf.getForwardRelations(sourceType, sourceId, targettype, targetid, type, includeimplicit)
 */
function _getProjectForwardRelations(projectId, relationTypeId) {
    return Pqf.pf.getForwardRelations(
        "Project",      // source object type
        projectId,      // source object ID
        null,           // target type filter
        null,           // target ID filter
        relationTypeId, // relation type filter
        false           // include implicit relations?
    );
}

/*
 * Loads a full resource object by resource ID.
 *
 * Uses the documented JS wrapper:
 *   Pqf.res.getResource(resourceId, version)
 *
 * Version is omitted, so the current version is returned.
 */
function _getResourceById(resourceId) {
    return Pqf.res.getResource(resourceId);
}

/*
 * Tries to extract an e-mail address from a resource object.
 *
 * Checked in this order:
 * 1. resObj.eMail
 * 2. resObj.email
 * 3. resObj.properties[].key === "emp-email" or "email"
 *
 * Returns:
 *   e-mail string, or "" if nothing was found
 */
function _getEmail(resObj) {
    if (!resObj) {
        return "";
    }

    // eMail field returned 
    if (resObj.eMail) {
        return resObj.eMail;
    }


    return "";
}

/*
 * Converts a full object into the enum structure expected by the JTF table.
 *
 * This allows the Name column to show:
 * - object name
 * - icon
 * - link to details
 */
function _toEnum(obj) {
    if (!obj) {
        return null;
    }

    return {
        "type": obj.type,
        "id": obj.id,
        "name": obj.name,
        "description": obj.description,
        "iconRef": obj.iconRef,
        "color": obj.color
    };
}