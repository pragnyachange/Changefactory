/*
Author(s): LI

Description:

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "D4A811A934AE4FD6830C44DB22C8CDBD"
    -   Export
        -   [JavaScriptExportDefinitionId] = "DB8B08B633E147DFB3096EAA226F8022"

Libraries:
    -   moment (with locales)
    -   pqfDataCollectorLib
*/

'use strict';
moment.locale('de');

const DEFAULT_PROJECT_ID = 'F3F56AF9A81C429C884F4D1854123424'; // Set default project id here, for debugging
const DEFAULT_CURRENCY_ID = 'CURRENCY-CHF';
const DEFAULT_LANGUAGE = 'en';

const requiredItems = [
    'taskName', 'taskCode', 'taskDesc', 'taskColor', 'taskBeg',
    'taskEnd', 'taskDuration', 'progress', 'progressAccumulated',
    'allocatedResources', 'allocationType', 'timeAllocated', 'timeAllocated_sum'
];

// Check if reference is defined
if (typeof reference !== 'undefined') {
    var projectId = reference.id;
} else {
    var projectId = DEFAULT_PROJECT_ID;
}

// Check user settings
if (typeof client === 'undefined') {
    var client = null;
}
const filterByTasks = client ? 
    client.screens[0].gantt.items.map(obj => obj.id) : 'all';
let currencyId = client ? 
    client.screens[0].units.currency : DEFAULT_CURRENCY_ID;
let user = null;
try {
    user = Pqf.acm.getCurrentUser();
} catch (error) {
    console.warn('Failed loading user information.');
}
let language = user ? user.language.split('-')[0] : DEFAULT_LANGUAGE;

// Load data
const ganttJTF = pqfDataCollectorLib.jtf.getGantt(
    projectId, requiredItems, null, 'all', false, currencyId);

// Construct jsdata
ganttJTF.data = ganttJTF.data.filter(
    obj => filterByTasks === 'all' || filterByTasks.includes(obj.id));
var ganttJTF_simplified = pqfDataCollectorLib.tools.simplifyJTF(
    ganttJTF, 'DD/MM/YYYY');
var jsdata = pqfDataCollectorLib.tools.JTF2Table(ganttJTF_simplified, language);

// Manipulate data to match the excel template
// Find max level
let maxLevel = 0;
for (let row of jsdata.tableBody) {
    if (row[1] > maxLevel) {
        maxLevel = row[1];
    }
}
// For number adjustment
let number = Array(maxLevel).fill(0);
let prevLevel = 0;
for (let row of jsdata.tableBody) {
    // Divide progress by 100
    row[10] = row[10] ? row[10]/100 : null;
    row[11] = row[11] ? row[11]/100 : null;
    // If level is 0, set numbering to null (main task)
    if (row[1] === 0) { 
        row[0] = null; 
        continue;
    } 
    // If level is lower than previous, reset numbering for all higher levels
    if (row[1] < prevLevel) {
        for (let i = row[1]; i < number.length; i++) {
            number[i] = 0;
        }
    }
    // Update numbering
    number[row[1]-1]++;
    row[0] = number.slice(0, row[1]).join('.');
    // Update previous level
    prevLevel = row[1];
}

// Load meta data
let currentUser = pqfDataCollectorLib.tools.getCurrentUser();
let timestamp = pqfDataCollectorLib.tools.getTimestamp("DD/MM/YYYY", "HH:mm");
jsdata.meta = pqfDataCollectorLib.tools.getProjectMeta(projectId);
switch (language) {
    case 'en': 
        jsdata.docDesc = 'Gantt View';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        jsdata.docTitles = {
            'generic': 'GENERIC',
            'planning': 'PLANNING',
            'efforts': 'EFFORTS'
        };
        break;
    case 'de':
        jsdata.docDesc = 'Gantt-Ansicht';
        jsdata.exportedBy = `Exportiert von ${currentUser.name} am `+ 
        `${timestamp.date} um ${timestamp.time}`;
        jsdata.docTitles = {
            'generic': 'GENERELL',
            'planning': 'PLANUNG',
            'efforts': 'AUFWÄNDE'
        };
        break;
    default:
        jsdata.docDesc = 'Gantt View';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        jsdata.docTitles = {
            'generic': 'GENERIC',
            'planning': 'PLANNING',
            'efforts': 'EFFORTS'
        };
        console.warn('Unknown language: ' + language);
        break;
}
jsdata.tooManyRows = jsdata.tableBody.length > 100 ? "Can only display a maximum of 100 rows!" : null;

console.log(JSON.stringify(jsdata));

jsdata;