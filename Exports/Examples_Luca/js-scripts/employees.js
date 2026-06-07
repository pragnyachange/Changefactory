/*
Author(s): LI

Description:

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "3A75DD0301394689BAE235592F764008"
    -   Export
        -   [JavaScriptExportDefinitionId] = "BD7DAE29946A409183C5280A6F89713F"

Libraries:
    -   moment (with locales)
    -   pqfDataCollectorLib
*/

'use strict';
moment.locale('de');

const DEFAULT_PROJECT_ID = 'F3F56AF9A81C429C884F4D1854123424'; // Set default project id here, for debugging

// Check user settings 
if (typeof client !== 'undefined') {
    console.log(client);
} 
let user = null;
try {
    user = Pqf.acm.getCurrentUser();
} catch (error) {
    console.warn('Failed loading user information.');
}
let language = user ? user.language.split('-')[0] : DEFAULT_LANGUAGE;

// Check if reference is defined
if (typeof reference !== 'undefined') {
    var projectId = reference.id;
} else {
    var projectId = DEFAULT_PROJECT_ID;
}

// Get data
let jsdata = {};
jsdata.details = pqfDataCollectorLib.json.getDetails(
    projectId, true, "DD/MM/YYYY");
jsdata.meta = pqfDataCollectorLib.tools.getProjectMeta(projectId);

// General Info
let currentUser = pqfDataCollectorLib.tools.getCurrentUser();
let timestamp = pqfDataCollectorLib.tools.getTimestamp("DD/MM/YYYY", "HH:mm");
switch (language) {
    case 'en': 
        jsdata.docDesc = 'Details View';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
            `${timestamp.date} at ${timestamp.time}`;
        jsdata.docTitles = {
            'indentification': 'INDENTIFICATION',
            'customers': 'CUSTOMERS / ISSUERS',
            'contact': 'CONTACT PERSON',
            'internal': 'INTERNAL INFORMATION'
        };
        jsdata.meta.labels = {
            'id': 'ID',
            'name': 'Name',
            'description': 'Description'
        };
        break;
    case 'de':
        jsdata.docDesc = 'Detail-Ansicht';
        jsdata.exportedBy = `Exportiert von ${currentUser.name} am `+ 
            `${timestamp.date} um ${timestamp.time}`;
        jsdata.docTitles = {
            'indentification': 'IDENTIFIZIERUNG',
            'customers': 'KUNDE / AUFTRAGGEBER',
            'contact': 'KONTAKTPERSON',
            'internal': 'INTERNE ANGABEN'
        };
        jsdata.meta.labels = {
            'id': 'ID',
            'name': 'Name',
            'description': 'Beschreibung'
        };
        break;
    default:
        jsdata.docDesc = 'Details View';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
            `${timestamp.date} at ${timestamp.time}`;
        jsdata.docTitles = {
            'indentification': 'INDENTIFICATION',
            'customers': 'CUSTOMERS / ISSUERS',
            'contact': 'CONTACT PERSON',
            'internal': 'INTERNAL INFORMATION'
        };
        jsdata.meta.labels = {
            'id': 'ID',
            'name': 'Name',
            'description': 'Description'
        };
        console.warn('Unknown language: ' + language);
        break;
}

// Output resulting JSON object
console.log(JSON.stringify(jsdata));

jsdata;