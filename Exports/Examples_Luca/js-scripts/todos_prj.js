/*
Author(s): LI

Description:

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "838EE5D3CED84D54A58A84A78A58B475"
    -   Export
        -   [JavaScriptExportDefinitionId] = "D260555528D24E3E838D464187F43030"

Libraries:
    -   moment (with locales)
    -   pqfDataCollectorLib
*/

'use strict';
moment.locale('de');

const DEFAULT_PROJECT_ID = 'F3F56AF9A81C429C884F4D1854123424'; // Set default project id here, for debugging
const DEFAULT_LANGUAGE = 'en'

const requiredItems = [
    'todoCode', 'todoName', 'todoOwner', 'todoAssignee', 'todoStatus', 
    'todoPriority', 'todoColor', 'todoBeg', 'todoEnd', 'todoDesc', 
    'todoComment', 'belongsToProject', 'belongsToTask'
];

// Check if reference is defined
if (typeof reference !== 'undefined') {
    var projectId = reference.id;
} else {
    var projectId = DEFAULT_PROJECT_ID;
}

// Check user settings
let loadedItemIds = null;
if (typeof client !== 'undefined') {
    loadedItemIds = [];
    // Distinguish between 'grid' and 'kanban' view
    if (client.screens[0].view[0] === 'grid') {
        for (let row of client.screens[0].grid.rows) {
            loadedItemIds.push(row.id);
        }
    }
    else if (client.screens[0].view[0] === 'kanban') {
        loadedItemIds = client.screens[0].kanban.items.map(item => item.itemid);
    }
    else {
        console.warn('Unknown view type: ' + client.screens[0].view[0]);
    }
} 
let user = null;
try {
    user = Pqf.acm.getCurrentUser();
} catch (error) {
    console.warn('Failed loading user information.');
}
let language = user ? user.language.split('-')[0] : DEFAULT_LANGUAGE;

// Load data
let jtf = pqfDataCollectorLib.jtf.getTodos(
    projectId, requiredItems, null, null, null, false);
console.log(jtf);

// Construct jsdata
jtf.data = jtf.data.filter(
    obj => !loadedItemIds || loadedItemIds.includes(obj.id));
var jtf_simplified = pqfDataCollectorLib.tools.simplifyJTF(
    jtf, 'DD/MM/YYYY');
var jsdata = pqfDataCollectorLib.tools.JTF2Table(jtf_simplified, language);

// Load meta data
let currentUser = pqfDataCollectorLib.tools.getCurrentUser();
let timestamp = pqfDataCollectorLib.tools.getTimestamp("DD/MM/YYYY", "HH:mm");
switch (language) {
    case 'en': 
        jsdata.docDesc = 'TODO List';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        break;
    case 'de':
        jsdata.docDesc = 'TODO-Liste';
        jsdata.exportedBy = `Exportiert von ${currentUser.name} am `+ 
        `${timestamp.date} um ${timestamp.time}`;
        break;
    default:
        jsdata.docDesc = 'TODO List';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        console.warn('Unknown language: ' + language);
        break;
}
jsdata.meta = pqfDataCollectorLib.tools.getProjectMeta(projectId);
jsdata.tooManyRows = jsdata.tableBody.length > 100 ? 
    "Can only display a maximum of 100 rows!" : null;

console.log(JSON.stringify(jsdata));

jsdata;