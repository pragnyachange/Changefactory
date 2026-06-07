/*
Author(s): LI

Description:

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "34B76FDA100C43489464A92ACF641A93"
    -   Export
        -   [JavaScriptExportDefinitionId] = "731D5D112FDB418AA24C09EBE1146ECD"

Libraries:
    -   moment (with locales)
    -   pqfDataCollectorLib
*/

'use strict';
moment.locale('de');

const DEFAULT_PORTFOLIO_ID = '0076A51CD30248CAA8B0FF59FA70EAE1';
const DEFAULT_CURRENCY_ID = 'CURRENCY-CHF';
const DEFAULT_LANGUAGE = 'en';

const requiredItems_gantt = [
    'progressAccumulated', 'taskBeg', 'taskEnd', 'taskDuration', 
    'timeAllocated_sum'
];
const requiredItems_customer = [
    'PrjCus-CustomerName', 'PrjCus-Address', 'PrjCus-OrderNo', 
    'PrjCus-ContactName', 'PrjCus-ContactPhone', 'PrjCus-ContactMail',
    'PrjCus-Notes'
];
const requiredItems_internal = [
    'PrjInt-PlannedStart', 'PrjInt-PlannedEnd', 'PrjInt-ProjectManager', 
    'PrjInt-AdditonalNotes'
];
const requiredRelations =  [
    'AA78979015B84325A16C440FBCAD9D3D', 
    '06FCCCAAA5BD45FAAE0297E081D91FDE',
    'EB1E1FA5DC3046968A66E6328F30390F'
];

// Check if reference is defined
if (typeof reference !== 'undefined') {
    var portfolioId = reference.id;
} else {
    var portfolioId = DEFAULT_PORTFOLIO_ID;
}

// Check user settings
let loadedItemIds = null;
let currencyId = null;
if (typeof client !== 'undefined') {
    loadedItemIds = client.screens[0].grid.rows.map(item => item.id);
    currencyId = client.screens.currency;
} else {
    currencyId = DEFAULT_CURRENCY_ID;
}
let user = null;
try {
    user = Pqf.acm.getCurrentUser();
} catch (error) {
    console.warn('Failed loading user information.');
}
let language = user ? user.language.split('-')[0] : DEFAULT_LANGUAGE;

// Get all project ids in the portfolio
const projectIds = [];
_loadProjects(portfolioId, projectIds);

// Construct JTF
let jtf = {
    'meta': {
        'categories': [
            {
                'id': 'projects',
                'label': { 'en': 'Projects', 'de': 'Projekte' }
            },
            {
                'id': 'projectPorperties',
                'label': { 'en': 'Properties', 'de': 'Eigenschaften' }
            },
            {
                'id': 'customer',
                'label': { 'en': 'Customer/Issuer', 'de': 'Kunde/Auftraggeber' }
            },
            {
                'id': 'internalInformation',
                'label': { 'en': 'Internal Information', 'de': 'Interne Informationen' }
            },
            {
                'id': 'management',
                'label': { 'en': 'Management', 'de': 'Management' }
            },
            {
                'id': 'relations',
                'label': { 'en': 'Relations', 'de': 'Beziehungen' }
            },
            {
                'id': 'generic',
                'label': { 'en': 'Generic', 'de': 'Generisch' }
            },
            {
                'id': 'planning',
                'label': { 'en': 'Planning', 'de': 'Planung' }
            },
            {
                'id': 'efforts',
                'label': { 'en': 'Efforts', 'de': 'Aufwände' }
            }
        ],
        'columns': [
            // PROJECT
            {
                'id': 'meta.name',
                'catid': 'projects',
                'type': 'string',
                'label': { 'en': '', 'de': '' },
                'options': { 'width': 200 }
            },
            // PROPERTIES
            {
                'id': 'meta.code',
                'catid': 'projectPorperties',
                'type': 'string',
                'label': { 'en': 'ID', 'de': 'ID' },
                'options': { 'width': 50 }
            },
            {
                'id': 'meta.description',
                'catid': 'projectPorperties',
                'type': 'html',
                'label': { 'en': 'Description', 'de': 'Beschreibung' },
                'options': { 'width': 200 }
            },
            // CUSTOMER
            {
                'id': 'customerProp.PrjCus_CustomerName',
                'catid': 'customer',
                'type': 'enum',
                'label': { 'en': 'Customers name', 'de': 'Kundenname' },
                'options': { 'width': 100 },
                'format': { 'showIcon': false }
            },
            {
                'id': 'customerProp.PrjCus_Address',
                'catid': 'customer',
                'type': 'string',
                'label': { 'en': 'Address', 'de': 'Adresse' },
                'options': { 'width': 200 }
            },
            {
                'id': 'mecustomerPropta.PrjCus_OrderNo',
                'catid': 'customer',
                'type': 'string',
                'label': { 'en': 'Order number', 'de': 'Bestellnummer' },
                'options': { 'width': 100 }
            },
            {
                'id': 'customerProp.PrjCus_ContactName',
                'catid': 'customer',
                'type': 'enum',
                'label': { 'en': 'Name', 'de': 'Name' },
                'options': { 'width': 100 },
                'format': { 'showIcon': false }
            },
            {
                'id': 'customerProp.PrjCus_ContactPhone',
                'catid': 'customer',
                'type': 'string',
                'label': { 'en': 'Phone Number', 'de': 'Telefonnummer' },
                'options': { 'width': 100 }
            },
            {
                'id': 'customerProp.PrjCus_ContactMail',
                'catid': 'customer',
                'type': 'string',
                'label': { 'en': 'Email', 'de': 'Email' },
                'options': { 'width': 100 }
            },
            {
                'id': 'customerProp.PrjCus_Notes',
                'catid': 'customer',
                'type': 'html',
                'label': { 'en': 'Notes', 'de': 'Notizen' },
                'options': { 'width': 200 }
            },
            // INTERNAL INFORMATION
            {
                'id': 'internalProp.PrjInt_PlannedStart',
                'catid': 'internalInformation',
                'type': 'date',
                'label': { 
                    'en': 'Planned start date', 
                    'de': 'Geplanter Start' 
                },
                'options': { 'width': 100 },
                'format': { 'format': 'DD/MM/YYYY'}
            },
            {
                'id': 'internalProp.PrjInt_PlannedEnd',
                'catid': 'internalInformation',
                'type': 'date',
                'label': { 'en': 'Planned end date', 'de': 'Geplantes Ende' },
                'options': { 'width': 100 },
                'format': { 'format': 'DD/MM/YYYY'}
            },
            {
                'id': 'internalProp.PrjInt_ProjectManager',
                'catid': 'internalInformation',
                'type': 'enum',
                'label': { 'en': 'Project manager', 'de': 'Projektleitung' },
                'options': { 'width': 100 },
                'format': { 'showIcon': true }
            },
            {
                'id': 'internalProp.PrjInt_AdditonalNotes',
                'catid': 'internalInformation',
                'type': 'html',
                'label': { 
                    'en': 'Additional notes', 
                    'de': 'Zusätzliche Notizen' 
                },
                'options': { 'width': 200 }
            },
            // MANAGEMENT
            {
                'id': 'meta.lifecycleState',
                'catid': 'management',
                'type': 'enum',
                'label': { 'en': 'Status', 'de': 'Status' },
                'options': { 'width': 100 },
                'format': { 'showIcon': true }
            },
            // RELATIONS
            {
                'id': 'relationData.AA78979015B84325A16C440FBCAD9D3D',
                'catid': 'relations',
                'type': 'multienum',
                'label': { 
                    'en': 'Partial project manager / Task owner', 
                    'de': 'Teilprojektleitung / Aufgabenverantwortlicher' 
                },
                'options': { 'width': 100 },
                'format': { 'showIcon': true }
            },
            {
                'id': 'relationData.06FCCCAAA5BD45FAAE0297E081D91FDE',
                'catid': 'relations',
                'type': 'multienum',
                'label': { 
                    'en': 'Project manager / Task owner', 
                    'de': 'Projektleitung / Aufgabenverantwortlicher' 
                },
                'options': { 'width': 100 },
                'format': { 'showIcon': true }
            },
            {
                'id': 'relationData.EB1E1FA5DC3046968A66E6328F30390F',
                'catid': 'relations',
                'type': 'multienum',
                'label': { 'en': 'Project staff', 'de': 'Projektteam' },
                'options': { 'width': 100 },
                'format': { 'showIcon': true }
            },
            // GENERIC
            {
                'id': 'gantt.progerssAccumulated',
                'catid': 'generic',
                'type': 'number',
                'label': { 'en': 'Progress', 'de': 'Fortschritt' },
                'options': { 
                    'aggregation': null,
                    'width': 100 
                },
                'format': { 
                    'digits': 0,
                    'unit': '%'
                }
            },
            // PLANNING
            {
                'id': 'gantt.taskBeg',
                'catid': 'planning',
                'type': 'date',
                'label': { 'en': 'Start date', 'de': 'Startdatum' },
                'options': { 'width': 100 },
                'format': { 'format': 'DD/MM/YYYY'}
            },
            {
                'id': 'gantt.taskEnd',
                'catid': 'planning',
                'type': 'date',
                'label': { 'en': 'End date', 'de': 'Enddatum' },
                'options': { 'width': 100 },
                'format': { 'format': 'DD/MM/YYYY'}
            },
            {
                'id': 'gantt.taskDuration',
                'catid': 'planning',
                'type': 'duration',
                'label': { 'en': 'Task Duration', 'de': 'Dauer' },
                'options': { 'width': 100 },
                'format': { 
                    'digits': 0,
                    'unit': 'day'
                }
            },
            // EFFORTS
            {
                'id': 'gantt.timeAllocated_sum',
                'catid': 'efforts',
                'type': 'duration',
                'label': { 'en': 'Allocated', 'de': 'Geplant' },
                'options': { 
                    'aggregation': 'sum',
                    'width': 100 
                },
                'format': {
                    'digits': 2,
                    'unit': 'hour'
                
                }
            }
        ]
    },
    'data': []
}
// Load data for each project
for (let projectId of projectIds) {
    let row = new Array(jtf.meta.columns.length).fill(null);
    // Load data
    // meta
    let meta = pqfDataCollectorLib.tools.getProjectMeta(projectId);
    row[0] = meta.name;
    row[1] = meta.code;
    row[2] = meta.description;
    row[14] = meta.lifecycleState;
    // customer
    let customerObj = null;
    try {
        customerObj = Pqf.pm.getProjectSubObj(projectId, "Project-Customer");
    } catch (error) {
        console.warn(
            'Failed loading customer properties of project with id ' + 
            projectId);
    }
    if (customerObj) {
        let properties = [];
        for (let requiredProp of requiredItems_customer) {
            properties.push(
                customerObj.properties.find(
                    prop => prop.key === requiredProp
                )
            );
        }
        let customerProp = pqfDataCollectorLib.tools.getPropertiesData(
            properties);
        for (let i=3; i<10; i++) {
            row[i] = customerProp[i-3];
        }
    }
    // internal
    let internalObj = null;
    try {
        internalObj = Pqf.pm.getProjectSubObj(
            projectId, "Project-InternalInformation");
    } catch (error) {
        console.warn(
            'Failed loading internal properties of project with id ' + 
            projectId);
    }
    if (internalObj) {
        let properties = [];
        for (let requiredProp of requiredItems_internal) {
            properties.push(
                internalObj.properties.find(
                    prop => prop.key === requiredProp
                )
            );
        }
        let internalProp = pqfDataCollectorLib.tools.getPropertiesData(
            properties);
        for (let i=10; i<14; i++) {
            row[i] = internalProp[i-10];
        }
    }
    // relations
    let relations = null;
    try {
        relations = Pqf.pf.getAllRelations(
            'Project', projectId, null, null, null, false);
    } catch (error) {
        console.warn(
            "Could not load relations of the project with the id " + 
            projectId + "Error: " + error);
    }
    if (relations) {
        let relations_filtered = [];
        for (let requiredRelation of requiredRelations) {
            let relation = relations.find(
                relation => relation.relationType === requiredRelation
            );
            if (relation) {
                relations_filtered.push(relation);
            }
        }
        let relationData = pqfDataCollectorLib.tools.getObjectsPerRelation(
            relations_filtered, projectId);
        if (relationData['AA78979015B84325A16C440FBCAD9D3D']) {
            row[15] = 
                relationData['AA78979015B84325A16C440FBCAD9D3D'].forward;
        }
        if (relationData['06FCCCAAA5BD45FAAE0297E081D91FDE']) {
            row[16] = 
                relationData['06FCCCAAA5BD45FAAE0297E081D91FDE'].forward;
        }
        if (relationData['EB1E1FA5DC3046968A66E6328F30390F']) {
            row[17] = 
                relationData['EB1E1FA5DC3046968A66E6328F30390F'].forward;
        }
    }
    // gantt
    let mainPhase = null;
    try {
        let activeScenario = Pqf.pm.getProjectActiveScenario(projectId, true);
        mainPhase = Pqf.pm.getScenarioWorkItems(activeScenario.id)[0];
    } catch (error) {
        console.warn(
            'Failed loading main phase of project with id ' + projectId);
    }
    if (mainPhase) {
        let gantt = pqfDataCollectorLib.tools.getTaskData(
            mainPhase, requiredItems_gantt, true, projectId, currencyId);
        for (let i=18; i<23; i++) {
            row[i] = gantt[i-18];
        }
    }
    // Push data
    jtf.data.push({'id': projectId, 'data': row});
}

// Create jsdata object
let jtf_simplified = pqfDataCollectorLib.tools.simplifyJTF(jtf, 'DD/MM/YYYY');
// Filter out projects that are not loaded in the UI
if (loadedItemIds) {
    jtf_simplified.data = jtf_simplified.data.filter(
        row => loadedItemIds.includes(row.id));
}
// Convert to table
let jsdata = pqfDataCollectorLib.tools.JTF2Table(jtf_simplified, language);
// Adapt table body to match Excel template
let data_running = [[]];
data_running[0].push("Running");
for (let i = 1; i < jsdata.tableHeader.length; i++) {
    data_running[0].push(null);
};
let data_closed = [[]];
data_closed[0].push("Closed");
for (let i = 1; i < jsdata.tableHeader.length; i++) {
    data_closed[0].push(null);
};
for (let row of jsdata.tableBody) {
    // Percentages
    row[18] = row[18] ? row[18]/100 : 0;
    // Push to the correct array
    if (row[14] && 
        ['Active', 'Aktiv', 'Actif', 'Active'].includes(row[14])) {
        data_running.push(row);
    } else if (row[14] && 
        ['Closed', 'Abgeschlossen', 'Finie', 'Closed'].includes(row[14])) {
        data_closed.push(row);
    } else {
        console.warn(
            "Observed unexpected project status: " + meta.lifecycleState);
    }
}
jsdata.tableBody = [];
if (data_running.length > 1) {
    jsdata.tableBody = data_running;
}
if (data_closed.length > 1) {
    jsdata.tableBody = jsdata.tableBody.concat(data_closed);
}

// Add needed information for the excel export
let currentUser = pqfDataCollectorLib.tools.getCurrentUser();
let timestamp = pqfDataCollectorLib.tools.getTimestamp("DD/MM/YYYY", "HH:mm");
switch (language) {
    case 'en': 
        jsdata.docDesc = 'Project List';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        jsdata.docTitles = {
            'project': 'PROJECT(S)',
            'properties': 'PROPERTIES',
            'customer': 'CUSTOMER / ISSUER',
            'internal': 'INTERNAL INFORMATION',
            'management': 'MANAGEMENT',
            'relations': 'RELATIONS',
            'generic': 'GENERIC',
            'planning': 'PLANNING',
            'efforts': 'EFFORTS',
            'main_project': 'PROJECT',
            'main_time': 'TIME'
        };
        break;
    case 'de':
        jsdata.docDesc = 'Projektliste';
        jsdata.exportedBy = `Exportiert von ${currentUser.name} am `+ 
        `${timestamp.date} um ${timestamp.time}`;
        jsdata.docTitles = {
            'project': 'PROJEKTE',
            'properties': 'EIGENSCHAFTEN',
            'customer': 'KUNDE / AUFTRAGGEBER',
            'internal': 'INTERNE ANGABEN',
            'management': 'MANAGEMENT',
            'relations': 'BEZIEHUNGEN',
            'generic': 'GENERELL',
            'planning': 'PLANUNG',
            'efforts': 'AUFWÄNDE',
            'main_project': 'PROJEKT',
            'main_time': 'ZEIT'
        };
        break;
    default:
        jsdata.docDesc = 'Project List';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        jsdata.docTitles = {
            'project': 'PROJECT(S)',
            'properties': 'PROPERTIES',
            'customer': 'CUSTOMER / ISSUER',
            'internal': 'INTERNAL INFORMATION',
            'management': 'MANAGEMENT',
            'relations': 'RELATIONS',
            'generic': 'GENERIC',
            'planning': 'PLANNING',
            'efforts': 'EFFORTS',
            'main_project': 'PROJECT',
            'main_time': 'TIME'
        };
        console.warn('Unknown language: ' + language);
        break;
}
try {
    let portfolio = Pqf.pm.getProjectPortfolio(portfolioId);
    jsdata.portfolioName = portfolio.name;
} catch (error) {
    console.warn('Failed loading portfolio with id ' + portfolioId + '.');
}
jsdata.tooManyRows = jsdata.tableBody.length > 102 ? 
    "Can only display a maximum of 100 rows!" : null;

console.log(JSON.stringify(jsdata));

jsdata;

// HELPER FUNCTIONS ############################################################

function _loadProjects(portfolioId, projectIds) {
    // Load subportfolios of the portfolio
    try {
        var subPortfolios = Pqf.pm.getProjectPortfolioSubPortfolios(
            portfolioId);
    } catch (error) {
        console.warn('Failed loading subportfolios of portfolio with id ' + 
            portfolioId + '.');
    }
    // Recursively load projects of subportfolios
    for (let subPortfolio of subPortfolios) {
        _loadProjects(subPortfolio.id, projectIds);
    }
    // Load projects of the portfolio
    try {
        var projects = Pqf.pm.getProjectPortfolioProjects(portfolioId);
    } catch (error) {
        console.warn(
            'Failed loading projects of portfolio with id ' + portfolioId);
    }
    // Push project ids to the array
    for (let project of projects) {
        projectIds.push(project.id);
    }
}