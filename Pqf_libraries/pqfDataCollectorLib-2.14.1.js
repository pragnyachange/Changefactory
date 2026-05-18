/**
 * @name PQFORCE JS 
 * @version 2.14.1
 * @file pqfDataCollectorLib.js
 * @description This library serves for generic data collection related to
 * projects
 * @author LI (INTRASOFT)
 * @pqfId C47130A5C7F84E019406DBEC1263BE1A
 * @created 2024-01-22
 * @modified 2025-12-11
 * @requires e430d37e331848788acbf975d600dd8e (pqfBasicLib.js), moment.js
 */

/**
 * PQFORCE Data Collector Library
 * 
 * @module pqfDataCollectorLib
 */
const pqfDataCollectorLib = (function () {

    let DEBUG = false;
    let DEFAULT_CURRENCY_ID = 'CURRENCY-CHF';

    let debug_level = DEBUG ? 1 : 0;

    /**
     * Set the debug mode of the library (default: false).
     * 
     * @param {boolean} debug - If true, debug messages are shown in the 
     *   console.
     */
    function _setDebugMode(debug) {
        DEBUG = debug;
        debug_level = DEBUG ? 1 : 0;
        pqfLib.setDebuggingMode(debug);
    }

    // DEFINITION OF CONSTANTS #################################################

    // Implemented items per category
    const implementedItems = {
        'todos': {
            'basic': ['todoCode', 'todoName'],
            'properties': [
                'todoStatus', 'todoPriority', 'todoColor', 
                'todoBeg', 'todoEnd', 'todoDesc', 'todoComment', 'properties'
            ],
            'relations_generic': [] // only marks that it exists
        },
        'gantt': {
            'basic': ['extractionIndex', 'level', 'taskType', 'taskName'],
            'generic': [
                'taskCode', 'taskDesc', 'taskOwner', 'taskColor',
                'projectManagementMethodPhase', 'requiredSkill', 'properties'
            ],
            'planning': [
                'taskBeg', 'taskEnd', 'taskDuration', 'progress', 
                'progressAccumulated', 'allocationState', 'allocatedResources', 
                'allocationType'
            ],
            'efforts': [
                'timeBudget', 'timeBudget_sum', 'timePlanned', 
                'timePlanned_sum', 'timeAllocated', 'timeAllocated_sum', 
                'timeActual', 'timeActual_sum', 'timeProvisional', 
                'timeProvisional_sum', 'timeActualPlusProvisional', 
                'timeActualPlusProvisional_sum', 'timeRemaining', 
                'timeRemaining_sum', 'timeForecast', 'timeForecast_sum'
            ],
            'costs': [
                'costsBudget', 'costsBudget_sum', 'costsPlanned', 
                'costsPlanned_sum', 'costsActual', 'costsActual_sum', 
                'costsProvisional', 'costsProvisional_sum', 
                'costsActualPlusProvisional', 'costsActualPlusProvisional_sum', 
                'costsRemaining', 'costsRemaining_sum', 'costsForecast', 
                'costsForecast_sum'
            ]
        },
        'risks': {
            'basic': ['riskCode'],
            'properties': [
                'riskName', 'riskDesc', 'riskDimension', 'riskLoss', 
                'riskBudget', 'properties'
            ],
            'assessment': [
                'op', 'opClass', 'opLimit', 'eol', 'eolClass', 'eolLimit', 'rr', 
                'rrClass', 'rrLimit'
            ]
        },
        'costpositions': {
            'basic': ['cpIndex', 'cpName'],
            'properties': [
                'cpDesc', 'cpBeg', 'cpEnd', 'cpAssignedWorkitems', 'properties'
            ],
            'costs': [
                'cpTypeGroup', 'cpType', 'cpCenter', 'payPlan', 'obligo', 
                'cpPlanned', 'cpSupplementary', 'cpForecast', 'cpActual', 
                'cpProvisional', 'cpRemaining'
            ]
        },
        'project': {
            'identification': ['prjCode', 'prjName', 'prjDesc', 'prjStatus'],
            'costFlows': [
                'BUDGET', 'PLAN', 'ACTUAL', 'PROVISIONAL', 
                'ACTUAL_PLUS_PROVISIONAL', 'REMAINING', 'FORECAST'
            ], 
        }
    }
    // Supported categories per topic. The category 'default' is always 
    // included and contains the basic items. It does not have a label.
    const supportedCategories = {
        'gantt': [
            {
                'id': 'generic',
                'label': { 'en': 'Generic', 'de': 'Allgemein' }
            },
            {
                'id': 'planning',
                'label': { 'en': 'Planning', 'de': 'Planung' }
            },
            {
                'id': 'efforts',
                'label': { 'en': 'Efforts', 'de': 'Aufwand' }
            },
            {
                'id': 'costs',
                'label': { 'en': 'Costs', 'de': 'Kosten' }
            }
        ],
        'risks': [
            {
                'id': 'properties',
                'label': { 'en': 'Properties', 'de': 'Eigenschaften' }
            },
            {
                'id': 'assessment',
                'label': { 'en': 'Assessment', 'de': 'Bewertung' }
            }
        ],
        'costpositions' : [
            {
                'id': 'properties',
                'label': { 'en': 'Properties', 'de': 'Eigenschaften' }
            },
            {
                'id': 'costs',
                'label': { 'en': 'Costs', 'de': 'Kosten' }
            }
        ],
        'todos': [
            {
                'id': 'properties',
                'label': { 'en': 'Properties', 'de': 'Eigenschaften' }
            },
            {
                'id': 'relations',
                'label': { 'en': 'Relations', 'de': 'Beziehungen' }
            }
        ]
    }

    const implementedTodoItems = _getImplementedItems('todos');
    const implementedGanttItems = _getImplementedItems('gantt');
    const implementedRiskItems = _getImplementedItems('risks');
    const implementedCPItems = _getImplementedItems('costpositions');
    const implementedProjectItems = _getImplementedItems('project');

    // TOP-LEVEL FUNCTIONS #####################################################

    /**
     * Function to generically extract data from a project. The data per topic
     * is stored in the "most appropriate" format (e.g., JTF for tabular data, 
     * JSON for bullet points, ...).
     * 
     * @param {string} prjId - The ID of the project.
     * @param {Object|string} [dataToExtract] - Configuration object. If "all", 
     *   all available data is extracted. If an Object, the data per specified 
     *   topic (attribute) is extracted. The data per topic can further be 
     *   specified, following the nomeclature of the lower-level functions.
     * @param {boolean} [simplify=false] - If true, the data is simplified, 
     *   i.e., all values are converted to data types that can be interpreted 
     *   by, for example, Excel. This overwrites the simplify parameters 
     *   specified in the dataToExtract object.
     * @returns {Object} The extracted data. Thereby, the data of each topic is 
     *   returned in a separate object, indexed by the topic name.
     * @example
     * // specifications
     * const dataToExtract = {
     *   "details": { "simplify": true, "dateFormat": "YYYY-MM-DD" },
     *   "relations": { "filterByTypes": ["74DC72CCC6A64961B15FE3D03DEC7A69"], "simplify": true },
     *   "gantt": { "requiredItems": ["taskCode", "taskName", "taskDesc", "taskOwner"], "filterByTasks": ["74DC72CCC6A64961B15FE3D03DEC7A69"], "simplify": true, "currencyId": "CURRENCY-CHF" },
     *   "todos": { "requiredItems": ["todoCode", "todoName", "todoStatus", "todoPriority"], "filterByTodos": ["74DC72CCC6A64961B15FE3D03DEC7A69"], "simplify": true },
     *   "risks": { "requiredItems": ["riskCode", "riskName", "riskDesc", "riskDimension"], "filterByRisks": ["74DC72CCC6A64961B15FE3D03DEC7A69"], "simplify": true, "currencyId": "CURRENCY-CHF" },
     *   "costpositions": { "requiredItems": ["cpIndex", "cpName"], "filterByCostpositions": ["74DC72CCC6A64961B15FE3D03DEC7A69"], "simplify": true },
     *   "cpTimelines": { "filterByCostpositions": ["74DC72CCC6A64961B15FE3D03DEC7A69"], "filterByFlows": ["BUDGET"], "beg": "2021-01-01", "end": "2021-12-31", "simplify": true, "currencyId": "CURRENCY-CHF" }
     * }
     * let projectData = pqfDataCollectorLib.getProjectSummary(projectId, dataToExtract);
     * projectData;
     * // returns object
     * {
     *   "details": { ... }, // JSON object, as in function description of json.getDetails()
     *   "relations": { ... }, // JSON object, " json.getRelations()
     *   "gantt": { ... }, // JTF object, " jtf.getGantt()
     *   "todos": { ... }, // JTF object, " jtf.getTodos()
     *   "risks": { ... }, // JTF object, " jtf.getRisks()
     *   "costpositions": { ... }, // JTF object, " jtf.getCostpositions()
     *   "cpTimelines": { ... } // JTF object, " jtf.getCPTimelines()
     * }
     * @alias .getProjectSummary
     * @memberof module:pqfDataCollectorLib
     */
    function _getProjectSummary(prjId, dataToExtract, simplify) {
        // Define supported topics
        const supportedPrjTopics = [
            'details', 'relations', 'gantt', 'todos', 'risks',
            'costpositions', 'cpTimelines'];
        // Apply default values
        if (!dataToExtract || dataToExtract == 'all') {
            dataToExtract = {};
            supportedPrjTopics.forEach(topic => {
                dataToExtract[topic] = {};
            });
        }
        // Sanity check
        else {
            Object.keys(dataToExtract).forEach(topic => {
                if (!supportedPrjTopics.includes(topic)) {
                    let message = 
                        "The topic " + topic + " is not supported for " +
                        "data extraction by the function getProjectSummary().";
                    pqfLib.utils.misc.log(
                        1, "error", "03A6F9F8DAF64F9EA6CC3182FC9C4F69", message);
                    delete dataToExtract[topic];
                }
            });
        }
        // Handle simplify parameter
        if (simplify == undefined) { simplify = false };
        if (simplify) {
            Object.keys(dataToExtract).forEach(topic => {
                dataToExtract[topic].simplify = true;
            });
        }
        // Define function mapping
        const topicFuncs = {
            'details': _getDetails,
            'relations': _getRelations,
            'gantt': _getGantt,
            'todos': _getTodos,
            'risks': _getRisks,
            'costpositions': _getCostpositions,
            'cpTimelines': _getCPTimelines
        }
        // Extract data
        let data = {};
        Object.keys(dataToExtract).forEach(topic => {
            // Load parameter keys of the function
            let funcParams = _getParamKeys(topicFuncs[topic]);
            // Add project id to dataToExtract
            if (funcParams.includes('prjId')) {
                dataToExtract[topic].prjId = prjId;
            } else if (funcParams.includes('objInfo')) {
                dataToExtract[topic].objInfo = {'id': prjId, 'type': 'Project'};
            } else {
                let message =
                    "The topic " + topic + " is not supported for " +
                    "data extraction by the function getProjectSummary().";
                pqfLib.utils.misc.log(
                    1, "error", "0EB7D9B8F666477A9F4A841A3ED637C2", message);
            }
            // Construct parameter array
            let params = Array(funcParams.length).fill(null);
            for (let i = 0; i < funcParams.length; i++) {
                if (Object.keys(dataToExtract[topic]).includes(funcParams[i])) {
                    params[i] = dataToExtract[topic][funcParams[i]];
                }
            }
            data[topic] = pqfLib.utils.apiFunc.exec_arr(null, topicFuncs[topic], params);
        });
        return data;
    }

    // JSON OBJECT #############################################################

    /**
     * Functions to extract data as JSON objects.
     * 
     * @namespace json
     * @memberof module:pqfDataCollectorLib
     */

    /**
     * Loads the object details, i.e., its indentification data, properties, and
     * subobjects, and returns them as a JSON object.
     * 
     * @param {Object|string} objInfo - Either an object specifying the type 
     *   and id of the object, from which the details should be extracted, or
     *   directly the id of the Project.
     * @param {boolean} [simplify=false] - If true, the properties are 
     *   simplified, i.e., all values are converted to data types that can be 
     *   interpreted by, for example, Excel.
     * @param {string} [dateFormat='DD.MM.YYYY'] - The format of the date.
     * @returns {Object} - An object containing the properties of the project
     *   and its subobjects. Thereby, the properties of each subobject are 
     *   stored in a separate object. The properties are indexed by their keys,
     *   where all '-' are replaced by '_'. For each property its label, value,
     *   and data type are stored.
     * @example
     * // for a Project
     * let projectDetails = pqfDataCollectorLib.json.getDetails(projectId);
     * projectDetails;
     * // returns
     * {
     *   "indentification": {
     *     "type": {
     *       "label": { "en": "Type", "de": "Typ" },
     *       "value": "Project",
     *       "type": "string"
     *     },
     *     ... // also includes code, name (as an enum!), description, createdAt, modifiedAt
     *   },
     *   "meta": { // only for projects
     *     "lifecycleState_enum": { ... }, // lifecycle state enum
     *     "beg": { ... }, // project start
     *     "end": { ... } // project end
     *   },
     *   "Project": { // properties of the object "Project"
     *     "property1": {
     *       "label": "Property 1",
     *       "value": "Value 1",
     *       "type": "string"
     *     },
     *     ...
     *   },
     *   "Subobject 1": { // properties of the first subobject
     *     ...
     *   },
     *   ...
     * }
     * // for, for example, a Project Report, the function call would need to be adapted as
     * let reportDetails = pqfDataCollectorLib.json.getDetails({ "type": "ProjectReport", "id": reportId });
     * reportDetails;
     * // returns
     * {
     *   "indentification": { ... }, // as for the project
     *   "ProjectReport": { // properties of the object "ProjectReport"
     *   "indicatorDimension1": {
     *     "dimension_enum": { ... }, // dimension enum (i.e., its name, icon, ...)
     *     "targetValue": { ... }, // target total value
     *     "actualValueCalculated": { ... }, // actual value calculated
     *     "actualValueManual": { ... }, // actual value manual
     *     "remainingValueCalculated": { ... }, // remaining value calculated
     *     "remainingValueManual": { ... }, // remaining value manual
     *     "forecastValueCalculated": { ... }, // forecast value calculated
     *     "forecastValueManual": { ... }, // forecast value manual
     *     "statusClassCalculated": { ... }, // status class calculated (enum)
     *     "statusClass": { ... }, // status class manual (enum)
     *     "trendClassCalculated": { ... }, // trend class calculated (enum)
     *     "trendClass": { ... }, // trend class manual (enum)
     *     "remark": { ... }, // remark
     *     "details": [ // Indicator details of this dimension
     *       {
     *         "detail_enum": { ... }, // detail enum (i.e., its name, icon, ...)
     *         ... // same as above
     *       },
     *       ...
     *     ]
     *   },
     *   ...
     * }
     * @alias .getDetails
     * @memberof module:pqfDataCollectorLib.json
     */
    function _getDetails(objInfo, simplify, dateFormat) { 
        // Apply default values
        let objectId = null;
        let objectType = null;
        if (typeof objInfo === 'object') {
            objectId = objInfo.id;
            objectType = objInfo.type;
        } else {
            objectId = objInfo;
            objectType = 'Project';
        }
        if (simplify === undefined) { simplify = false };
        if (!dateFormat) { dateFormat = "DD.MM.YYYY" };
        // Load the object and, if necessary, its subobjects
        let mainObject = null;
        let subObjects = null;
        let isReport = false;
        switch (objectType) {
            case 'Project':
                mainObject = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProject, objectId);
                break;
            case 'ProjectPortfolio':
                mainObject = pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectPortfolio, objectId);
                break;
            // Project Reports
            default:
                const reportTypedRequests = [
                    { 
                        types: Pqf.pm.getProjectReportTypes, 
                        report: Pqf.pm.getProjectReport 
                    },
                    { 
                        types: Pqf.pm.getProjectPortfolioReportTypes, 
                        report: Pqf.pm.getProjectPortfolioReport 
                    }
                ]
                if (reportTypedRequests.find(reqs => {
                    let reportTypes = pqfLib.utils.apiFunc.exec(Pqf.pm, reqs.types);
                    if (reportTypes && reportTypes.find(
                        obj => obj.id === objectType)) {
                        isReport = true;
                        mainObject = pqfLib.utils.apiFunc.exec(
                            Pqf.pm, reqs.report, objectType, objectId)
                        return true;
                    } else {
                        return false;
                    }
                })) {
                    break;
                }
                let message =
                    "The object type " + objectType + " is not (yet) " +
                    "supported by the function json.getDetails().";
                pqfLib.utils.misc.log(
                    1, "error", "8767F7F81E5D4FC9B9E20CA7254C3B91", message);
                return null;
        }
        if (objectType === 'Project') {
            subObjects = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectSubObjs, objectId);
        }

        // Create details object
        let details = {};
        // Map indentification data -> obviously, this is not a typo but internded ;)
        if (mainObject) {
            details['indentification'] = _getIdentification(mainObject);
        }
        // Map properties of main object
        if (mainObject) {
            let propertiesSummary = _getPropertiesSummary(
                mainObject.properties);
            // Replace '-' with '_' in the keys of project properties
            let updatedProperties = {};
            for (let key in propertiesSummary) {
                let updatedKey = key.replace(/-/g, '_');
                updatedProperties[updatedKey] = propertiesSummary[key];
            }
            details[objectType] = updatedProperties;
        }
        // Map properties of subobjects
        if (subObjects) {
            for (let subobject of subObjects) {
                let propertiesSummary = 
                    _getPropertiesSummary(subobject.properties);
                // Replace '-' with '_' in the keys of the subobject properties
                let updatedProperties = {};
                for (let key in propertiesSummary) {
                    let updatedKey = key.replace(/-/g, '_');
                    updatedProperties[updatedKey] = 
                    propertiesSummary[key];
                }
                details[subobject.type.replace(/-/g, '_')] = updatedProperties;
            }
        }
        // If project, map meta and classification data
        if (mainObject && objectType === 'Project') {
            // META
            details['meta'] = {};
            // Get lifecycle state
            let lifecycleStateObj = pqfLib.utils.apiFunc.exec(
                Pqf.lcy, Pqf.lcy.getObjectState, objectType, objectId);
            details['meta'].lifecycleState_enum = {
                'label': { 
                    'en': 'Lifecycle state', 
                    'de': 'Lebenszykluszustand' 
                },
                'value': null,
                'type': 'enum'
            }
            if (lifecycleStateObj) {
                details['meta'].lifecycleState_enum.value = _toEnum(
                    lifecycleStateObj);
            };
            // Get start and end date of project (active scenario)
            let activeScenario = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getProjectActiveScenario, objectId, true);
            let scenarioWorkItems = activeScenario ? 
                pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, activeScenario.id) : 
                null;
            let mainPhase = scenarioWorkItems ? scenarioWorkItems[0] : null;
            if (mainPhase) {
                details['meta']['beg'] = {
                    'label': { 'en': 'Project start', 'de': 'Projektstart' },
                    'value': mainPhase.beg,
                    'type': 'date'
                };
                details['meta']['end'] = {
                    'label': { 'en': 'Project end', 'de': 'Projektende' },
                    'value': moment(mainPhase.end).subtract(1, "days"),
                    'type': 'date'
                };
            }
            // CLASSIFICATION
            let classification = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getProjectClassification, objectId);
            if (classification) {
                classification.forEach(classScheme => {
                    details[classScheme.classificationSchemaId.replace(
                        /-/g, '_')] = _getClassSchemeData(classScheme);
                });
            }
        }
        // If report, get indicator data
        if (mainObject && isReport) {
            let dimensionDefinitions = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getIndicatorDimensionDefs, objectType);
            let detailDefinitions = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getIndicatorDetailDefs, objectType);
            if (dimensionDefinitions && detailDefinitions && mainObject.indicators) {
                for (let dimension of mainObject.indicators.dimensions) {
                    let dimensionData = _getIndicatorDimensionData(
                            dimension, dimensionDefinitions, detailDefinitions, 
                            true);
                    details[dimension.selection.dimension.replace(/-/g, '_')] = 
                        dimensionData;
                }
            }
        }
        // Check if properties should be simplified
        if (simplify) {
            let objectReferences = [];
            for (let object in details) {
                for (let property in details[object]) {
                    if (Array.isArray(details[object][property])) {
                        for (let indicator of details[object][property]) {
                            for (let objectKey in indicator) {
                                objectReferences.push(indicator[objectKey]);
                            }
                        }
                    } else {
                        objectReferences.push(details[object][property]);
                    }
                }
            }
            for (let objectReference of objectReferences) {
                let meta_old = {};
                meta_old.label = objectReference.label;
                meta_old.type = objectReference.type;
                let meta_new = _simplifyMeta(meta_old);
                let value_new = _simplifyValue(
                    objectReference.value, meta_old, dateFormat);
                objectReference.label = meta_new.label;
                objectReference.value = value_new;
                objectReference.type = meta_new.type;
            }
        }
        return details;
    }

    /**
     * Extracts the resources of a object per relation type and returns them 
     * as a JSON object.
     * 
     * @param {Object|string} objInfo - Either an object specifying the type 
     *   and id of the object, from which the details should be extracted, or
     *   directly the id of the Project.
     * @param {Array|string} [filterByTypes='all'] - The relation types by which 
     *   the output should be filtered.
     * @param {boolean} [simplify=false] - If true, the properties are 
     *   simplified, i.e., all values are converted to data types that can be 
     *   interpreted by, for example, Excel.
     * @returns {Object} - An object containing the resources per relation type.
     *   Thereby, the information about each relation is stored in a separate
     *   object, indexed by its ID. For each relation, the forward and backward
     *   resources are again stored in a separate object, indexed by either 
     *   'forward' or 'backward'. For each forward and backward relation its 
     *   label, values, and type are stored.
     * @example
     * // for a Project
     * let projectRelations = pqfDataCollectorLib.json.getRelations(projectId);
     * projectRelations;
     * // returns
     * {
     *   "RelationType1": {
     *     "forward": {
     *       "label": "Forward Label",
     *       "value": [ { ... }, ...], // multienum value
     *       "type": "multienum" or "string" // later if simplified
     *     },
     *     "backward": {
     *       ...
     *     }
     *   },
     *   ...
     * }
     * // for, for example, a Project Portfolio, the function call would need to be adapted as
     * let projectPortfolioRelations = pqfDataCollectorLib.tools.getRelations({ "type": "ProjectPortfolio", "id": projectPortfolioId });
     * @alias .getRelations
     * @memberof module:pqfDataCollectorLib.json
     */
    function _getRelations(objInfo, filterByTypes, simplify) { 
        // Apply default values
        let objectId = null;
        let objectType = null;
        if (typeof objInfo === 'object') {
            objectId = objInfo.id;
            objectType = objInfo.type;
        } else {
            objectId = objInfo;
            objectType = 'Project';
        }
        if (!filterByTypes) { filterByTypes = 'all' };
        if (simplify == undefined) { simplify = false };
        // Definition of directions (needed later)
        let directions = [
            { 'direction': 'forward', 'attName': 'nameForward' },
            { 'direction': 'backward', 'attName': 'nameBackward' }
        ];
        // Load all relations of the object 
        let relations = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getAllRelations, objectType, objectId, null, null,  
            null, true);
        if (!relations) { return null };
        // Filter relations according to filterByTypes
        if (filterByTypes !== 'all') {
            relations = relations.filter(obj =>
                filterByTypes.includes(obj.relationType));
        }
        // Get the objects associated with each relation
        let objsPerRelation = _getObjectsPerRelation(relations, objectId);
        // Create return object
        let resourcesPerRelation = {};
        for (let relationTypeId in objsPerRelation) {
            // Load relation definition
            let relationTypeObj = pqfLib.utils.apiFunc.exec(
                Pqf.pf, Pqf.pf.getRelationType, relationTypeId);
            if (!relationTypeObj) { continue };
            // If there are any foward leated resources, add them
            directions.forEach(dir => {
                if (objsPerRelation[relationTypeId][dir.direction].length > 0) {
                    if (!resourcesPerRelation[relationTypeId]) {
                        resourcesPerRelation[relationTypeId] = {};
                    }
                    resourcesPerRelation[relationTypeId][dir.direction] = {};
                    resourcesPerRelation[relationTypeId][dir.direction].label = 
                        relationTypeObj[dir.attName];
                    resourcesPerRelation[relationTypeId][dir.direction].value = 
                        objsPerRelation[relationTypeId][dir.direction];
                    resourcesPerRelation[relationTypeId][dir.direction].type = 
                        'multienum';
                }
            });
        }

        // Check if properties should be simplified
        if (simplify) {
            for (let relationTypeId in resourcesPerRelation) {
                let object = resourcesPerRelation[relationTypeId];
                directions.forEach(dir => {
                    if (object[dir.direction]) {
                        object[dir.direction].value = _simplifyValue(
                            object[dir.direction].value, {'type': 'multienum'});
                        object[dir.direction].type = 'string';
                    }
                });
            }            
        }

        return resourcesPerRelation;
    }

    // JTF (FOR TABLES) ########################################################

    /**
     * Functions to extract data as JTF which can then be nicely displayed as
     * tables.
     * 
     * @namespace jtf
     * @memberof module:pqfDataCollectorLib
     */

    /**
     * Extracts the information about the tasks of a project and converts it
     * into a JTF according to the given specifications.
     * 
     * @param {string} prjId - The ID of the project.
     * @param {Array|string} [requiredItems='all'] - The task items that should
     *   be extracted.
     * @param {Array|string} [filterByTasks='all'] - The task IDs for which the
     *   data should be extracted. Note: All parent tasks of the specified tasks
     *   are also extracted (even if they are not specified).
     * @param {Array|string} [filterByTaskTypes='all'] - The task types for which
     *   the data should be extracted (e.g., 'PROJECT_PHASE', ...).
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @param {string} [currencyId=DEFAULT_CURRENCY] - The currency ID in which
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const requiredItems = ['taskCode', 'taskName', 'taskDesc', 'taskOwner']; // Subset of implementedGanttItems
     * const filterByTasks = ['74DC72CCC6A64961B15FE3D03DEC7A69', 'A9D05ABA2EBE4106B48FC1F74150137D']; // UUIDs of tasks
     * const filterByTaskTypes = ['PROJECT_PHASE', 'PROJECT_FOLDER']; // Subset of ['PROJECT_PHASE', 'PROJECT_FOLDER', 'PROJECT_MILESTONE']
     * let ganttJTF = pqfDataCollectorLib.jtf.getGantt(projectId, requiredItems, filterByTasks, filterByTaskTypes);
     * ganttJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // default, generic, planning, efforts, costs
     *     "columns": [ ... ] // extractionIndex, level, taskType, taskName + selected requiredItems
     *   "data": [ 
     *     {
     *       "id": "74DC72CCC6A64961B15FE3D03DEC7A69", // UUID of task
     *       "data": [ ... ] // values of columns
     *     },
     *     ...
     *   ]
     * }
     * @alias .getGantt
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getGantt( 
        prjId, requiredItems, filterByTasks, filterByTaskTypes, simplify, 
        currencyId) {
        // Apply default values
        if (!requiredItems) { requiredItems = 'all' };
        if (!filterByTasks) { filterByTasks = 'all' };
        if (!filterByTaskTypes) { filterByTaskTypes = 'all' };
        if (simplify == undefined) { simplify = false };
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        // Load all tasks of the project
        let scenario = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectActiveScenario, prjId);
        if (!scenario || !scenario.id) { return null };
        let tasks_list = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getScenarioWorkItems, scenario.id, true);
        if (!tasks_list) { return null };
        // Build Gantt tree structure (i.e., associate extraction index and 
        // level)
        let tasks_wTreeInfo = _constructGanttTree(tasks_list);
        if (!tasks_wTreeInfo) {
            let message =
                "Could not construct Gantt tree structure for the project " +
                "with the id " + prjId + " in function jtf.getGantt().";
            pqfLib.utils.misc.log(
                1, "error", "EBBD4AE460B748DA897482E06961EF29", message);
            return null;
        }
        // Filter tasks according to filterByTasks (including parent tasks)
        if (filterByTasks !== 'all') {
            let filterByTasks_wParents = _includeParentIds(
                tasks_list, filterByTasks);
            tasks_wTreeInfo = tasks_wTreeInfo.filter(obj =>
                filterByTasks_wParents.includes(obj.id));
        }
        // Filter tasks according to filterByTaskType
        if (filterByTaskTypes !== 'all') {
            // Check for "unconventional" combinations of task types
            if (filterByTaskTypes.includes('PROJECT_PHASE') &&
                !filterByTaskTypes.includes('PROJECT_FOLDER')) {
                let message = 
                    "It is not advisable to filter tasks by 'PROJECT_PHASE' " +
                    "without also including 'PROJECT_FOLDER'.";
                pqfLib.utils.misc.log(
                    debug_level, "warn", "C2C4CE26CCEC4FE4A2C8C16D72C471F8", message);
            }
            tasks_wTreeInfo = tasks_wTreeInfo.filter(obj =>
                filterByTaskTypes.includes(obj.phaseType));
        }
        // Check if there are any tasks left - only needed for debugging
        let message = 
            "No tasks left after filtering in function jtf.getGantt().";
        pqfLib.utils.misc.log(
            (tasks_wTreeInfo.length === 0 && DEBUG) ? 1 : 0, "log",
            "34D17299AB9142A6916D676FC65C0EBD", message);
        // Construct JTF table
        let ganttJTF = _constructJTFObj(
            'gantt', requiredItems, currencyId, tasks_wTreeInfo, simplify, 
            {'key': 'prjId', 'value': prjId});
        return ganttJTF;
    }

    /**
     * Extracts the information about the todos of an object and converts it
     * into a JTF according to the given specifications.
     * 
     * @param {Object|string} objInfo - Either an object specifying the type 
     *   and id of the object, from which the details should be extracted, or
     *   directly the id of the Project.
     * @param {Array|string} [requiredItems='all'] - The
     *   TODO items that should be extracted.
     * @param {Array|string} [requiredRels='all'] - The relation types for
     *   which a column should be added to the JTF table. If 'all', all 
     *   explicit relation types are included.
     * @param {Array|string} [filterByTodos='all'] - The TODO IDs for  which the 
     *   data should be extracted.
     * @param {Array|string} [filterByRelTypes='all'] - The relation type ids 
     *   for which the data should be extracted. Affects the number of lines.
     * @param {boolean} [simplify=false] - If true, the JTF table data is 
     *   simplified in such a way that its cells can be interpreted by MS Excel. 
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const requiredItems = ['todoCode', 'todoName', 'todoStatus', 'todoPriority']; // Subset of implementedTodoItems
     * const filterByTodos = ['74DC72CCC6A64961B15FE3D03DEC7A69', 'A9D05ABA2EBE4106B48FC1F74150137D']; // UUIDs of todos
     * let todoJTF = pqfDataCollectorLib.jtf.getTodos(projectId, requiredItems, filterByTodos);
     * todoJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // default, properties, relations
     *     "columns": [ ... ] // todoCode + selected requiredItems
     *   "data": [ 
     *     {
     *       "id": "74DC72CCC6A64961B15FE3D03DEC7A69", // UUID of todo
     *       "data": [ ... ] // values of columns
     *     },
     *     ...
     *   ]
     * }
     * @alias .getTodos
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getTodos( 
        objInfo, requiredItems, requiredRels, filterByTodos, 
        filterByRelTypes, simplify) {
        let message = 
            "New input argument 'requiredRelations' has been added to the " +
            "function '_getTodos' in version 2.8.9.";
        pqfLib.utils.misc.log(
            debug_level, "warn", null, message);
        // Apply default values
        let objId = null;
        let objType = null;
        if (typeof objInfo === 'object') {
            objId = objInfo.id;
            objType = objInfo.type;
        } else {
            objId = objInfo;
            objType = 'Project';
        }
        if (!requiredItems) { requiredItems = 'all' };
        if (!requiredRels) { requiredRels = 'all' };
        if (!filterByTodos) { filterByTodos = 'all' };
        if (!filterByRelTypes) { filterByRelTypes = 'all' };
        if (simplify == undefined) { simplify = false };
        // Load all relation types of TODOs
        let relTypes_todo = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getAllRelationTypesForType, 'Todo');
        let todos = _loadTodos(
            objType, objId, relTypes_todo, filterByRelTypes, filterByTodos);
        if (!todos) { return null };
        // Construct relation column ids and append them to requiredItems
        let relColIds = _constructRelColumnIds(requiredRels, relTypes_todo)
        let requiredItems_composed = 
            (requiredItems == 'all' ? 
                _getImplementedItems('todos') : requiredItems
            ).concat(relColIds);
        // Construct JTF table
        let todoJTF = _constructJTFObj(
            'todos', requiredItems_composed, null, todos, simplify, 
            {'key': 'relTypes_todo', 'value': relTypes_todo});
        return todoJTF;
    }

    /**
     * Extracts the information about the risks of an object and converts it
     * into a JTF according to the given specifications.
     * 
     * @param {Object|string} objInfo - Either an object specifying the type 
     *   and id of the object, from which the details should be extracted, or
     *   directly the id of the Project.
     * @param {Array|string} [requiredItems='all'] - The risk items that should
     *   be extracted.
     * @param {Array|string} [filterByRisks='all'] - The risk IDs for which the
     *   data should be extracted.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @param {string} [currencyId=DEFAULT_CURRENCY] - The currency ID in which
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const requiredItems = ['riskCode', 'riskName', 'riskDesc', 'riskDimension']; // Subset of implementedRiskItems
     * const filterByRisks = ['74DC72CCC6A64961B15FE3D03DEC7A69', 'A9D05ABA2EBE4106B48FC1F74150137D']; // UUIDs of risks
     * let projectRisksJTF = pqfDataCollectorLib.jtf.getRisks(projectId, requiredItems, filterByRisks);
     * projectRisksJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // default, properties, assessment
     *     "columns": [ ... ] // riskCode + selected requiredItems
     *   "data": [ 
     *     {
     *       "id": "74DC72CCC6A64961B15FE3D03DEC7A69", // UUID of risk
     *       "data": [ ... ] // values of columns
     *     },
     *     ...
     *   ]
     * }
     * // for, for example, a Project Portfolio, the function call would need to be adapted as
     * let projectPortfoliRisksJTF = pqfDataCollectorLib.jtf.getRisks({ "type": "ProjectPortfolio", "id": projectPortfolioId });
     * @alias .getRisks
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getRisks( 
        objInfo, requiredItems, filterByRisks, simplify, currencyId) {
        // Apply default values
        let objectId = null;
        let objectType = null;
        if (typeof objInfo === 'object') {
            objectId = objInfo.id;
            objectType = objInfo.type;
        } else {
            objectId = objInfo;
            objectType = 'Project';
        }
        if (!requiredItems) { requiredItems = 'all' };
        if (!filterByRisks) { filterByRisks = 'all' };
        if (simplify == undefined) { simplify = false };
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        // Get all risks of the specified object
        const execProps = {
            'Project': {
                'obj': Pqf.rsk,
                'func': Pqf.rsk.getProjectRisks,
                'params': [objectId, null, currencyId]
            },
            'ProjectPortfolio': {
                'obj': Pqf.rsk,
                'func': Pqf.rsk.getProjectPortfolioRisks,
                'params': [objectId, null, currencyId]
            }
        }
        // Check if the object type is supported
        if (!execProps[objectType]) {
            let message = 
                "The object type " + objectType + " is not supported for " +
                "the extraction of risks in function jtf.getRisks().";
            pqfLib.utils.misc.log(
                1, "error", "C9F6740A801C4C02A41BC668BAE761CF", message);
            return null;
        }
        // Load all risks of the object
		let risks_list = pqfLib.utils.apiFunc.exec_arr(
            execProps[objectType].obj, execProps[objectType].func, 
            execProps[objectType].params);
        if (!risks_list) { return null };
        // Filter risks according to filterRiskIds
        if (filterByRisks !== 'all') {
            risks_list = risks_list.filter(
                obj => filterByRisks.includes(obj.id));
        }
        // Check if there are any risks left - only needed for debugging
        let message =
            "No risks left after filtering in function jtf.getRisks().";
        pqfLib.utils.misc.log(
            (risks_list.length === 0 && DEBUG) ? 1 : 0, "log",
            "966A96670B134E4BA07B0D36A76675F1", message);
        // Sort risks by riskRating (descending)
        risks_list.sort((a, b) => b.rating.riskRating - a.rating.riskRating);
        // Construct JTF table
        let risksJTF = _constructJTFObj(
            'risks', requiredItems, currencyId, risks_list, simplify);
        return risksJTF;
    }

    /**
     * Extracts the information about the cost positions of a project and
     * converts it into a JTF according to the given specifications.
     * 
     * @param {string} prjId - The ID of the project.
     * @param {Array|string} [requiredItems='all'] - The cost position items
     *   that should be extracted.
     * @param {Array|string} [filterByCostpositions='all'] - The cost position
     *   IDs for which the data should be extracted.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @param {string} [currencyId=DEFAULT_CURRENCY] - The currency ID in which
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const requiredItems = ['cpIndex', 'cpName', 'cpDesc', 'cpCosts']; // Subset of implementedCPItems
     * const filterByCostpositions = ['74DC72CCC6A64961B15FE3D03DEC7A69', 'A9D05ABA2EBE4106B48FC1F74150137D']; // UUIDs of cost positions
     * let costpositionsJTF = pqfDataCollectorLib.jtf.getCostpositions(projectId, requiredItems, filterByCostpositions);
     * costpositionsJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // default, properties, costs
     *     "columns": [ ... ] // cpIndex, cpName + selected requiredItems
     *   "data": [ 
     *     {
     *       "id": "74DC72CCC6A64961B15FE3D03DEC7A69", // UUID of cp
     *       "data": [ ... ] // values of columns
     *     },
     *     ...
     *   ]
     * }
     * @alias .getCostpositions
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getCostpositions( 
        prjId, requiredItems, filterByCostpositions, simplify, currencyId) {
        // Apply default values
        if (!requiredItems) { requiredItems = 'all' };
        if (!filterByCostpositions) { filterByCostpositions = 'all' };
        if (simplify == undefined) { simplify = false };
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        // Get all costpositions from the project
        let costpositions = pqfLib.utils.apiFunc.exec(
            Pqf.fco, Pqf.fco.getProjectCostsPositions, prjId, currencyId);
        if (!costpositions) { return null };
        // Filter costpositions according to filterCostIds
        if (filterByCostpositions !== 'all') {
            costpositions = costpositions.filter(obj =>
                filterByCostpositions.includes(obj.id));
        }
        // Construct JTF table
        let cpJTF = _constructJTFObj(
            'costpositions', requiredItems, currencyId, costpositions, 
            simplify);
        return cpJTF;
    }

    /**
     * Extracts the timelines of the cost positions (per year) of a project and 
     * converts them into a JTF according to the given specifications.
     * 
     * @param {string} prjId - The ID of the project.
     * @param {Array|string} [filterByCostpositions='all'] - The cost position
     *   IDs for which the data should be extracted.
     * @param {Array|string} [filterByFlows='all'] - The flow IDs for which the
     *   data should be extracted.
     * @param {string} [beg=null] - The start date of the timeline. If null, the
     *   earliest date is used.
     * @param {string} [end=null] - The end date of the timeline. If null, the
     *   latest date is used.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @param {string} [currencyId=DEFAULT_CURRENCY] - The currency ID in which
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const filterByCostpositions = ['74DC72CCC6A64961B15FE3D03DEC7A69', 'A9D05ABA2EBE4106B48FC1F74150137D']; // UUIDs of cost positions
     * const filterByFlows = ['BUDGET', 'PLANNED']; // ['BUDGET', 'PLANNED', 'ACTUAL', 'EXPECTEDPENDING', 'ACTUALPLUSEXPECTEDPENDING', 'REMAINING', 'FORECAST']
     * const beg = '2020-01-01'; // Start date of the timeline
     * const end = '2025-01-01'; // End date of the timeline (+1 day)
     * let cpTimelineJTF = pqfDataCollectorLib.jtf.getCostpositionsTimeline(projectId, filterByCostpositions, filterByFlows, beg, end);
     * cpTimelineJTF;
     * // returns
     * {
     *   "meta": {
     *     "categories": [ ... ], // default, years
     *     "columns": [ ... ] // cpName + flows per Year (e.g., BUDGET_2020, PLANNED_2020, ... , BUDGET_2021, PLANNED_2021, ...)
     *   "data": [ 
     *     {
     *       "id": "74DC72CCC6A64961B15FE3D03DEC7A69", // UUID of cp
     *       "data": [ ... ] // values of columns
     *     },
     *     ...
     *   ]
     * }
     * @alias .getCPTimelines
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getCPTimelines(
        prjId, filterByCostpositions, filterByFlows, beg, end, simplify, 
        currencyId) {
        // Apply default values
        if (!filterByCostpositions) { filterByCostpositions = 'all' };
        if (!filterByFlows) { filterByFlows = 'all' };
        if (!beg) { beg = null };
        if (!end) { end = null };
        if (simplify == undefined) { simplify = false };
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        // Load costs matrix
        let costsMatrix = pqfLib.utils.apiFunc.exec(
            Pqf.fco, Pqf.fco.getProjectCostsTimeline, prjId, beg, end,
            ['YEAR'], ['POSITION', 'FLOW'], currencyId);
        // Filter by costpositions
        let costsMatrix_f = JSON.parse(JSON.stringify(costsMatrix));
        if (filterByCostpositions !== 'all') {
            costsMatrix_f.groups = [];
            costsMatrix_f.hierarchy[0].items = [];
            for (let i=0; i < costsMatrix.hierarchy[0].items.length; i++) {
                if (filterByCostpositions.includes(
                    costsMatrix.hierarchy[0].items[i].id)) {
                    costsMatrix_f.groups.push(costsMatrix.groups[i]);
                    costsMatrix_f.hierarchy[0].items.push(
                        costsMatrix.hierarchy[0].items[i]);
                }
            }
        }
        // Filter by flows
        let costsMatrix_ff = JSON.parse(JSON.stringify(costsMatrix_f));
        if (filterByFlows !== 'all') {
			costsMatrix_ff.groups.forEach(group => {
				if (group) group.groups = [];
			});
            costsMatrix_ff.hierarchy[1].items = [];
            for (let i=0; i < costsMatrix_f.hierarchy[1].items.length; i++) {
                if (filterByFlows.includes(costsMatrix_f.hierarchy[1].items[i].id)) {
                    for (let j=0; j < costsMatrix_f.groups.length; j++) {
						if (!costsMatrix_ff.groups[j]) {
							costsMatrix_ff.groups[j] = { groups: [] };
						}
						costsMatrix_ff.groups[j].groups.push(costsMatrix_f.groups[j].groups[i]);
                    }
                    costsMatrix_ff.hierarchy[1].items.push(costsMatrix_f.hierarchy[1].items[i]);
                }
            }
        }
        // Construct JTF object
        let cpTimelineJTF = {
            'meta': {
                'categories': [
                    {
                        'id': 'default',
                        'label': { 'en': null, 'de': null }
                    }
                ], 
                'columns': [
                    {
                        'id': 'cpName',
                        'catid': 'default',
                        'type': 'string',
                        'label': { 
                            'en': 'Costpositions',
                            'de': 'Kostenpositionen'
                        },
                        "options": { "width": 200 }
                    }
                ] // cp nampes + flows per Year
            },
            'data': []
        }
        // Add categories and columns to JTF meta object
        let currency = _mapCurrency(currencyId);
        for (let year of costsMatrix_ff.calendar.layers[0].ranges) {
            // category
            cpTimelineJTF.meta.categories.push({
                'id': year.label,
                'label': { 'en': year.label, 'de': year.label }
            });
            // columns
            for (let flow of costsMatrix_ff.hierarchy[1].items) {
                cpTimelineJTF.meta.columns.push({
                    'id': flow.id + '_' + year.label,
                    'catid': year.label,
                    'type': 'money',
                    'label': { 
                        'en': flow.name + ' ' + year.label,
                        'de': flow.name + ' ' + year.label
                    },
                    'format': { 'currencyCode': currency }
                });
            }
        }
        // Load / push rows to JTF data object
        for (let i=0; i < costsMatrix_ff.groups.length; i++) {
            let cpTimeLine = costsMatrix_ff.groups[i];
            if (!cpTimeLine) continue;
            let cpTimelineRow = _getCPTimelineData(
                cpTimeLine, costsMatrix_ff.calendar.layers[0].ranges.length);
            let row = {
                'id': costsMatrix_ff.hierarchy[0].items[i].id,
                'data': [costsMatrix_ff.hierarchy[0].items[i].name].concat(
                    cpTimelineRow)
            };
            cpTimelineJTF.data.push(row);
        }
        // Check if JTF data should be simplified
        if (simplify) {
            cpTimelineJTF = _simplifyJTF(cpTimelineJTF);
        }
        return cpTimelineJTF;
    } 

    /**
     * Extracts the information about the projects of a portfolio and converts
     * it into a JTF according to the given specifications. Filters dublicate
     * projects.
     * 
     * @param {string} ppfId - The ID of the portfolio.
     * @param {Object|string} [requiredColumns='all'] - The columns that should 
     *   be included in the resulting JTF. If 'all', all available columns are
     *   included. Its attributs further specify the columns that should be
     *   included. 
     * @param {Array|string} [requiredColumns.identification] - The 
     *   identification columns that should be included. 
     * @param {Array|string} [requiredColumns.project] - The project properties 
     *   (by ID) that should be included. 
     * @param {Object|string} [requiredColumns.subObjects] - The subobject (by 
     *   type) that should be included. 
     * @param {Array|string} [requiredColumns.subObjects.SubObjectType1] - The
     *   properties of the subobject type that should be included. 
     * @param {Object|string} [requiredColumns.costs] - The cost columns that 
     *   should be included. 
     * @param {Array|string} [requiredColumns.costs.costFlows] - The cost flows 
     *   that should be included. Available cost flows are 'BUDGET', 'PLANNED',
     *   'ACTUAL', 'EXPECTEDPENDING', 'ACTUAL_PLUS_PROVISIONAL', 'REMAINING',
     *   'FORECAST'. 
     * @param {Array|string} [requiredColumns.relations] - The relation
     *   columns that should be included. If 'all' (default), all explicit
     *   relation types are considered. However, non explicit relations can also 
     *   be handled if their IDs are specified.
     * @param {Object|string} [filterBy='all'] - The filter criteria by which 
     *   the projects should be filtered. If all, no filters are applied. Its
     *   attributes further specify the filter criteria.
     * @param {Array|string} [filterBy.lcyStatus] - The lifecycle status IDs for
     *   which the data should be extracted.
     * @param {Object} [filterBy.properties] - The properties by which the 
     *   projects should be filtered.
     * @param {Object} [filterBy.properties.ofProject] - The properties of the
     *   project by which the projects should be filtered. Its attributes are
     *   the property IDs, the values are arrays with valid property values.
     * @param {Object} [filterBy.properties.ofSubObjects] - The subobject types
     *   by whose properties the projects should be filtered.
     * @param {Object} [filterBy.properties.ofSubObjects.SubObjectType1] - The
     *   properties of the subobject type by which the projects should be
     *   filtered. Its attributes are the property IDs, the values are arrays
     *   with valid property values.
     * @param {boolean} [includeSubportfolios=false] - If true, the projects of
     *   the subportfolios are also included in the JTF table.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const requiredColumns = {
     *   "identification": ["prjName", "prjStatus"],
     *   "project": ["att1", "att2", "att3"],
     *   "subObjects": {
     *     "SubObjectType1": ["att1", "att2"],
     *     "SubObjectType2": ["att1"]
     *   },
     *   "costs": {
     *     "costFlows": ["BUDGET", "PLANNED", "ACTUAL"]
     *   }
     * };
     * const filterBy = {
     *   "lcyStatus": ["74DC72CCC6A64961B15FE3D03DEC7A69", "A9D05ABA2EBE4106B48FC1F74150137D"],
     *   "properties": {
     *     "ofSubObjects": {
     *       "SubObjectType1": {
     *         "att2": ["value1", "value2"]
     *       }
     *     }
     *   }
     * };
     * let projectsJTF = pqfDataCollectorLib.jtf.getPortfolioOverview(portfolioId, requiredColumns, filterBy);
     * projectsJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // "identification", included property groups of "project" and "subObjects", "costs"
     *     "columns": [ ... ]
     *   },
     *   "data": [ ... ]
     * }
     * @alias .getPortfolioOverview
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getPortfolioOverview(
        ppfId, requiredColumns, filterBy, includeSubportfolios, simplify) {
        // Apply default values
        if (!requiredColumns) { requiredColumns = 'all' };
        if (!filterBy) { filterBy = 'all' };
        if (includeSubportfolios == undefined) { includeSubportfolios = false };
        if (simplify == undefined) { simplify = false };
        // Load all projects of the portfolio, only keep ids
        let prjs = _getProjectList(ppfId, includeSubportfolios);
        let prjIds = prjs.map(prj => prj.id);
        // filter dublicates
        prjIds = prjIds.filter((item, index) => prjIds.indexOf(item) === index);
        return _getProjectsOverview(
            prjIds, requiredColumns, filterBy, simplify);
    }

    /**
     * Extracts the information about the projects, given by their IDs, and 
     * converts it into a JTF according to the given specifications. This 
     * function is optimized for performance and will replace the function 
     * '_getProjects' in future versions.
     * 
     * @param {Array} prjIds - The IDs of the projects.
     * @param {Object} [requiredColumns='all'] - The columns that should be 
     *   included in the resulting JTF. Its form is extensively described in the
     *   function '_getPortfolioOverview'.
     * @param {Object} [filterBy='all'] - The filter criteria by which the
     *   projects should be filtered. Its form is extensively described in the
     *   function '_getPortfolioOverview'.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @param {string} [currencyId=DEFAULT_CURRENCY_ID] - The currency in which 
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const prjIds = ["74DC72CCC6A64961B15FE3D03DEC7A69", "A9D05ABA2EBE4106B48FC1F74150137D"];
     * const requiredColumns = { ... }; // check function '_getPortfolioOverview'
     * const filterBy = { ... }; // check function '_getPortfolioOverview'
     * let projectsJTF = pqfDataCollectorLib.jtf.getProjectsOverview(prjIds, requiredColumns, filterBy);
     * projectsJTF;
     * // returns JTF object
     * // check function '_getPortfolioOverview'
     * @alias .getProjectsOverview
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getProjectsOverview(
        prjIds, requiredColumns, filterBy, simplify, currencyId) {
        // Apply default values
        if (!requiredColumns) { requiredColumns = 'all' };
        if (!filterBy) { filterBy = 'all' };
        if (simplify == undefined) { simplify = false };
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        let currencyCode = _mapCurrency(currencyId);
        // Evaluate whether the project summaries must be loaded or if the 
        // project object itself is enough.
        let summaryRequired = true;
        const topicsOnProjectObj = ['identification', 'project'];
        if (requiredColumns !== 'all' && 
            Object.keys(requiredColumns).every(topic =>
                topicsOnProjectObj.includes(topic))
        ) {
            summaryRequired = false;
        } 
        // Load all project summaries of the specified projects. This must be
        // done in 100 project chunks to avoid a timeout.
        let prjSummaries = [];
        let prjIds_copy = JSON.parse(JSON.stringify(prjIds));
        while (prjIds_copy.length > 0) {
            if (summaryRequired) {
                prjSummaries = prjSummaries.concat(
                    pqfLib.utils.apiFunc.exec(
                        Pqf.pm, Pqf.pm.getProjectSummaries, 
                        prjIds_copy.splice(0, 100), currencyId));
            } else {
                prjObjs = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjects);
                prjObjs = prjObjs.filter(prj => prjIds_copy.includes(prj.id));
                prjSummaries = prjObjs.map(prj => {
                    return { 'project': prj };
                });
                prjIds_copy = [];
            }
        }
        if (!prjSummaries) { return null };
        // Filter projects according to filterBy
        prjSummaries = _filterProjectsSummaries(prjSummaries, filterBy);
        let message =
            "No projects left after filtering in function " +
            "jtf.getProjectsOverview().";
        pqfLib.utils.misc.log(
            (prjSummaries.length === 0 && DEBUG) ? 1 : 0, "log",
            "AE0A44E78E7F46EDAD1433FB3330222E", message);
        // Construct JTF meta object
        let meta = _constructProjectSummaryMeta(requiredColumns, currencyCode);
        // Construct JTF data object
        let data = _pushProjectsSummariesData(
            prjSummaries, requiredColumns, meta, currencyCode);
        // Construct JTF object
        let projectsJTF = {
            'meta': meta,
            'data': data
        }
        // Check if JTF data should be simplified
        if (simplify) {
            projectsJTF = _simplifyJTF(projectsJTF);
        }
        return projectsJTF;
    }

    /**
     * @deprecated since version 2.12.0
     * Calls the function '_getProjectsOverview' with the same input arguments.
     * 
     * @param {Array} prjIds - The IDs of the projects.
     * @param {Object} [requiredColumns='all'] - The columns that should be 
     *   included in the resulting JTF. Its form is extensively described in the
     *   function '_getPortfolioOverview'.
     * @param {Object} [filterBy='all'] - The filter criteria by which the
     *   projects should be filtered. Its form is extensively described in the
     *   function '_getPortfolioOverview'.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @param {string} [currencyId=DEFAULT_CURRENCY_ID] - The currency in which 
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const prjIds = ["74DC72CCC6A64961B15FE3D03DEC7A69", "A9D05ABA2EBE4106B48FC1F74150137D"];
     * const requiredColumns = { ... }; // check function '_getPortfolioOverview'
     * const filterBy = { ... }; // check function '_getPortfolioOverview'
     * let projectsJTF = pqfDataCollectorLib.jtf.getProjectsSummaries(prjIds, requiredColumns, filterBy);
     * projectsJTF;
     * // returns JTF object
     * // check function '_getPortfolioOverview'
     * @alias .getProjectsSummaries
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getProjectsSummaries(
        prjIds, requiredColumns, filterBy, simplify, currencyId) {
        let message = 
            "Renamed function '_getProjectsOverview' to " +
            "'_getProjectsOverview' in version 2.12.0. Please use the new " +
            "function name.";
        pqfLib.utils.misc.log(debug_level, "warn", null, message);
        _getProjectsOverview(
            prjIds, requiredColumns, filterBy, simplify, currencyId);
    }

    /**
     * @deprecated since version 2.12.0
     * Extracts the information about the projects of a portfolio and converts
     * it into a JTF according to the given specifications. Filters dublicate
     * projects.
     * 
     * @param {string} ppfId - The ID of the portfolio.
     * @param {Array|string} [requiredGroups='all'] - The project groups that
     *   should be extracted. Implemented groups are ['indentification', 
     *   'details' | { 'name': 'details_subSet', 'subObjs': ['Project', ...] },
     *   'management', 'relations']. Note that either 'details' or a subset of 
     *   { 'Project', 'Subobject1', ... } and "relations" or a subset of
     *   { 'RelationType1', ... } can be specified.
     * @param {Array|string} [filterByProjectStatus='all'] - The project status
     *   IDs for which the data should be extracted. 
     * @param {boolean} [includeSubportfolios=false] - If true, the projects of
     *   the subportfolios are also included in the JTF table.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const requiredGroups = ['indentification', 'details'];
     * const filterByProjectStatus = ['74DC72CCC6A64961B15FE3D03DEC7A69', 'A9D05ABA2EBE4106B48FC1F74150137D']; // UUIDs of project status
     * let projectsJTF = pqfDataCollectorLib.jtf.getProjects(portfolioId, requiredGroups, filterByProjectStatus);
     * projectsJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // default, indentification, details (i.e., default + specified requiredGroups)
     *     "columns": [ ... ] // project name, lifecycle state + items per group
     *   "data": [
     *     {
     *       "id": "74DC72CCC6A64961B15FE3D03DEC7A69", // UUID of project
     *       "data": [ ... ] // values of columns
     *     },
     *     ...
     *   ]
     * }
     * @alias .getProjects
     * @memberof module:pqfDataCollectorLib.jtf 
     */
    function _getProjects( 
        ppfId, requiredGroups, filterByProjectStatus, 
        includeSubportfolios, simplify) {
        let message =
            "New input argument 'includeSubportfolios' has been added to the " +
            "function '_getProjects' in version 2.8.0.";
        pqfLib.utils.misc.log(debug_level, "warn", null, message);
        message =
            "Deprecated since version 2.12.0. Use function " +
            "'_getPortfolioOverview' instead.";
        pqfLib.utils.misc.log(debug_level, "warn", null, message);
        // Apply default values
        if (!requiredGroups) { requiredGroups = 'all' };
        if (!filterByProjectStatus) { filterByProjectStatus = 'all' };
        if (includeSubportfolios == undefined) { includeSubportfolios = false };
        if (simplify == undefined) { simplify = false };
        // Load all projects of the portfolio
        let projects = _getProjectList(ppfId, includeSubportfolios);
        if (!projects) { return null };
        message = 
            "Protfolio with the id " + ppfId + " does not contain " +
            "any projects. It must contain at least one project for this " +
            " function to work!";
        pqfLib.utils.misc.log(
            (projects.length === 0 && DEBUG) ? 1 : 0, "warn", 
            "47A703868092444FBB296C8A19474342", message);
        // Filter dubplicate projects
        projects = projects.filter((obj, pos, arr) =>
            arr.map(mapObj => mapObj.id).indexOf(obj.id) === pos);
        // Filter projects according to filterProjectStatus
        for (let project of projects) {
            // Load lifecycle state of the project
            let lifecycleStateObj = pqfLib.utils.apiFunc.exec(
                Pqf.lcy, Pqf.lcy.getObjectState, 'Project', project.id);
            if (!lifecycleStateObj) { return null }; 
            project.lifecycleState_enum = _toEnum(lifecycleStateObj);
        }
        if (filterByProjectStatus !== 'all') {
            projects = projects.filter(obj =>
                filterByProjectStatus.includes(obj.lifecycleState_enum.id));
        }
        // Check if there are any projects left - only needed for debugging
        message =
            "No projects left after filtering in function jtf.getProjects().";
        pqfLib.utils.misc.log(
            (projects.length === 0 && DEBUG) ? 1 : 0, "log",
            "966A96670B134E4BA07B0D36A76675F1", message);
        // Construct JTF object
        let projectsJTF = {
            'meta': {
                'categories': [{
                    'id': 'default',
                    'label': { 'en': null, 'de': null }
                }],
                'columns': [
                    {
                        'id': 'projectName',
                        'catid': 'default',
                        'type': 'enum',
                        'label': { 'en': 'Project Name', 'de': 'Projektname' },
                        'options': { 'width': 200 }
                    },
                    {
                        'id': 'projectLifecycleState',
                        'catid': 'default',
                        'type': 'enum',
                        'label': { 
                            'en': 'Lifecyclestate', 
                            'de': 'Lebenszykluszustand' 
                        },
                        'options': { 'width': 100 },
                        'format': { 'showIcon': true }
                    }
                ]
            },
            'data': []
        }
        // Construct meta
        let exampleProject = projects[0];
        if (requiredGroups === 'all' || 
            requiredGroups.includes('indentification')) {
            projectsJTF.meta.categories.push({
                'id': 'indentification',
                'label': { 'en': 'Indentification', 'de': 'Indentifikation' }
            });
            projectsJTF.meta.columns = projectsJTF.meta.columns.concat([
                {
                    'id': 'confidential',
                    'catid': 'indentification',
                    'type': 'string',
                    'label': { 'en': 'Confidential', 'de': 'Vertraulich' },
                    'options': { 'width': 100 }
                },
                {
                    'id': 'portfolio',
                    'catid': 'indentification',
                    'type': 'multienum',
                    'label': { 'en': 'Portfolio', 'de': 'Portfolio' },
                    'options': { 'width': 200 },
                    'format': { 'showIcon': true }
                },
                {
                    'id': 'code',
                    'catid': 'indentification',
                    'type': 'string',
                    'label': { 'en': 'ID', 'de': 'ID' },
                    'options': { 'width': 100 }
                },
                {
                    'id': 'description',
                    'catid': 'indentification',
                    'type': 'html',
                    'label': { 'en': 'Description', 'de': 'Beschreibung' },
                    'options': { 'width': 200 }
                }
            ]);
        }
        if (requiredGroups === 'all' || 
            requiredGroups.includes('details')) {
            projectsJTF.meta.categories.push({
                'id': 'details',
                'label': { 'en': 'Details', 'de': 'Details' }
            });
            // Properties of main object and subobjects
            let exampleProperties = exampleProject.properties;
            let exampleSubObjects = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getProjectSubObjs, exampleProject.id);
            if (!exampleSubObjects) { return null };
            if (exampleSubObjects.length > 0) {
                for (let exampleSubObject of exampleSubObjects) {
                    exampleProperties = exampleProperties.concat(
                        exampleSubObject.properties);
                }
            }
            projectsJTF.meta.columns = projectsJTF.meta.columns.concat(
                _constructPropertiesColumnsMeta(exampleProperties, 'details'));
        }
        if (requiredGroups.some(group => {
                return (
                    typeof group === 'object' && 
                    group.name === 'details_subSet'
                );
            })) {
            let subObjs = requiredGroups.find(
                group => group.name === 'details_subSet').subSet;
            projectsJTF.meta.categories.push({
                'id': 'details',
                'label': { 'en': 'Details', 'de': 'Details' }
            });
            // Properties of main
            let exampleProperties = [];
            if (subObjs.includes('Project')) {
                exampleProperties = exampleProject.properties;
                subObjs = subObjs.filter(obj => obj !== 'Project');
            }
            let exampleSubObjects = [];
            subObjs.forEach(subObj => {
                exampleSubObjects.push(
                    pqfLib.utils.apiFunc.exec(
                        Pqf.pm, Pqf.pm.getProjectSubObj, exampleProject.id, 
                        subObj));
            });
            if (exampleSubObjects.length > 0) {
                for (let exampleSubObject of exampleSubObjects) {
                    exampleProperties = exampleProperties.concat(
                        exampleSubObject.properties);
                }
            }
            projectsJTF.meta.columns = projectsJTF.meta.columns.concat(
                _constructPropertiesColumnsMeta(exampleProperties, 'details'));
        }
        if (requiredGroups === 'all' || 
            requiredGroups.includes('management')) {
            projectsJTF.meta.categories.push({
                'id': 'management',
                'label': { 'en': 'Management', 'de': 'Management' }
            });
            projectsJTF.meta.columns = projectsJTF.meta.columns.concat([
                {
                    'id': 'method',
                    'catid': 'management',
                    'type': 'enum',
                    'label': { 'en': 'Method', 'de': 'Methode' },
                    'options': { 'width': 100 }
                },
                {
                    'id': 'methodPhase',
                    'catid': 'management',
                    'type': 'enum',
                    'label': { 'en': 'Phase', 'de': 'Phase' },
                    'options': { 'width': 100 }
                },
                {
                    'id': 'lifecycleState',
                    'catid': 'management',
                    'type': 'enum',
                    'label': { 
                        'en': 'Lifecyclestate', 
                        'de': 'Lebenszykluszustand' 
                    },
                    'options': { 'width': 100 },
                    'format': { 'showIcon': true }
                }
            ]);
        }
        if (requiredGroups === 'all' || 
            requiredGroups.includes('relations') || 
            requiredGroups.some(group => {
                return (
                    typeof group === 'object' && 
                    group.name === 'relations_subSet'
                );
            })
        ) {
            projectsJTF.meta.categories.push({
                'id': 'relations',
                'label': { 'en': 'Relations', 'de': 'Beziehungen' }
            });
            // Find all relation types
            let relationTypes = pqfLib.utils.apiFunc.exec(
                Pqf.pf, Pqf.pf.getAllRelationTypesForType, 'Project');
            if (!relationTypes) { return null };
            // Filter duplicate relation types
            relationTypes = relationTypes.filter((relationType, index, self) =>
                index === self.findIndex(obj => ( obj.id === relationType.id ))
            );
            // If only a subset of relation types should be displayed, filter
            if (requiredGroups.some(group => {
                return (
                    typeof group === 'object' &&
                    group.name === 'relations_subSet'
                );
            })) {
                let relSubSet = requiredGroups.find(
                    group => group.name === 'relations_subSet').subSet;
                relationTypes = relationTypes.filter(
                    obj => relSubSet.includes(obj.id));
            }
            // Add relation types to JTF meta object
            let relationsMeta = [];
            for (let relationType of relationTypes) {
                if (relationType.sourceTypes.includes('Project') &&
                    relationType.nameForward) {
                    relationsMeta.push({
                        'id': relationType.id + '_forward',
                        'catid': 'relations',
                        'type': 'multienum',
                        'label': { 
                            'en': relationType.nameForward, 
                            'de': relationType.nameForward 
                        },
                        'options': { 'width': 100 },
                        'format': { 'showIcon': true }
                    });
                }
                if (relationType.targetTypes.includes('Project') &&
                    relationType.nameBackward) {
                    relationsMeta.push({
                        'id': relationType.id + '_backward',
                        'catid': 'relations',
                        'type': 'multienum',
                        'label': { 
                            'en': relationType.nameBackward, 
                            'de': relationType.nameBackward 
                        },
                        'options': { 'width': 100 },
                        'format': { 'showIcon': true }
                    });
                }
            };
            // Sort relationsMeta by label
            relationsMeta.sort((a, b) => {
                if (a.label.en < b.label.en) { return -1 };
                if (a.label.en > b.label.en) { return 1 };
                return 0;
            });
            projectsJTF.meta.columns = projectsJTF.meta.columns.concat(
                relationsMeta);
        }
        // Load / push rows to JTF data object
        for (let project of projects) {    
            // DEFAULT
            let row = {
                'id': project.id,
                'data': [
                    _toEnum(project),
                    project.lifecycleState_enum
                ]
            }
            if (requiredGroups === 'all' ||
                requiredGroups.includes('indentification')) {
                let confidentialityObj = pqfLib.utils.apiFunc.exec(
                    Pqf.acm, Pqf.acm.getConfidentiality, 'Project', project.id);
                if (!confidentialityObj) { continue };
                let portfolios = [];
                for (let portfolio of project.portfolios) {
                    portfolios.push(_toEnum(portfolio));
                }
                row.data = row.data.concat([
                    confidentialityObj ? 
                        confidentialityObj.confidentiality : null,
                    portfolios,
                    project.code,
                    project.description
                ]);
            }
            if (requiredGroups === 'all' ||
                requiredGroups.includes('details')) {
                let properties = project.properties;
                let subObjects = pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectSubObjs, project.id);
                if (!subObjects) { continue };
                if (subObjects.length > 0) {
                    for (let subObject of subObjects) {
                        properties = properties.concat(subObject.properties);
                    }
                }
                let propertiesSummary = _getPropertiesSummary(properties);
                let propertiesMeta = projectsJTF.meta.columns.filter(
                    obj => obj.catid === 'details');
                let propertiesData_ordered = [];
                for (let propertyMeta of propertiesMeta) {
                    let propertySummary = propertiesSummary[propertyMeta.id];
                    if (propertySummary) {
                        propertiesData_ordered.push(propertySummary.value);
                    } else {
                        propertiesData_ordered.push(null);
                    }
                }
                row.data = row.data.concat(propertiesData_ordered);
            }
            if (requiredGroups.some(group => {
                return (
                    typeof group === 'object' && 
                    group.name === 'details_subSet'
                );
            })) {
                let subObjs = requiredGroups.find(
                    group => group.name === 'details_subSet').subSet;
                let properties = [];
                if (subObjs.includes('Project')) {
                    properties = project.properties;
                    subObjs = subObjs.filter(obj => obj !== 'Project');
                }
                let subObjects = [];
                subObjs.forEach(subObj => {
                    subObjects.push(
                        pqfLib.utils.apiFunc.exec(
                            Pqf.pm, Pqf.pm.getProjectSubObj, project.id, 
                            subObj));
                });
                if (subObjects.length > 0) {
                    for (let subObject of subObjects) {
                        properties = properties.concat(subObject.properties);
                    }
                }
                let propertiesSummary = _getPropertiesSummary(properties);
                let propertiesMeta = projectsJTF.meta.columns.filter(
                    obj => obj.catid === 'details');
                let propertiesData_ordered = [];
                for (let propertyMeta of propertiesMeta) {
                    let propertySummary = propertiesSummary[propertyMeta.id];
                    if (propertySummary) {
                        propertiesData_ordered.push(propertySummary.value);
                    } else {
                        propertiesData_ordered.push(null);
                    }
                }
                row.data = row.data.concat(propertiesData_ordered);
            }
            if (requiredGroups === 'all' ||
                requiredGroups.includes('management')) {
                let methodObj = pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectManagementMethod, project.id);
                let methodObj_enum = methodObj ? _toEnum(methodObj) : null;
                let methodPhaseObj = pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectManagementMethodPhase, project.id);
                let methodPhaseObj_enum = methodPhaseObj ? 
                    _toEnum(methodPhaseObj) : null;
                let lifecycleStateObj = pqfLib.utils.apiFunc.exec(
                    Pqf.lcy, Pqf.lcy.getObjectState, 'Project', project.id);
                let lifecycleState_enum = lifecycleStateObj ?
                    _toEnum(lifecycleStateObj) : null;
                row.data = row.data.concat([
                    methodObj_enum,
                    methodPhaseObj_enum,
                    lifecycleState_enum
                ]);
            }
            if (requiredGroups === 'all' ||
                requiredGroups.includes('relations') || 
                requiredGroups.some(group => {
                    return (
                        typeof group === 'object' && 
                        group.name === 'relations_subSet'
                    );
                })
            ) {
                let relationsJSON = _getRelations(project.id, 'all', false);
                let relationsMeta = projectsJTF.meta.columns.filter(
                    obj => obj.catid === 'relations');
                for (let relationMeta of relationsMeta) {
                    let relationTypeId = relationMeta.id.split('_')[0];
                    if (relationsJSON[relationTypeId]) {
                        if (relationsJSON[relationTypeId].forward &&
                            relationsJSON[relationTypeId].forward.label === 
                                relationMeta.label.en) {
                            row.data.push(
                                relationsJSON[relationTypeId].forward.value);
                        }
                        else if (relationsJSON[relationTypeId].backward &&
                            relationsJSON[relationTypeId].backward.label === 
                                relationMeta.label.en) {
                            row.data.push(
                                relationsJSON[relationTypeId].backward.value);
                        }
                        else { row.data.push(null) };
                    }
                    else { row.data.push(null) };
                }
            }
            projectsJTF.data.push(row);
        }
        // Check if JTF data should be simplified
        if (simplify) {
            projectsJTF = _simplifyJTF(projectsJTF);
        }
        return projectsJTF;
    }

    /**
     * @deprecated since version 2.2.0
     * Extracts the relations of a project and converts them into a JTF
     * according to the given specifications.
     * 
     * @param {string} prjId - The ID of the project.
     * @param {Array|string} [filterByTypes='all'] - The relation types by which 
     *   the output should be filtered.
     * @param {boolean} [simplify=false] - If true, the JTF table data is 
     *   simplified in such a way that its cells can be interpreted by MS Excel. 
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const filterByTypes = ['74DC72CCC6A64961B15FE3D03DEC7A69']; // UUID of a relation type
     * let relationsJTF = pqfDataCollectorLib.jtf.getRelations(projectId, filterByTypes);
     * relationsJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // relations
     *     "columns": [ ... ] // relation type 1 forward, relation type 1 backward, ...
     *   "data": [ 
     *     {
     *       "id": null,
     *       "data": [ ... ] // values of columns
     *     }
     *     ...
     *   ]
     * }
     * @alias .getRelations
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getRelations_old(prjId, filterByTypes, simplify) {
        let message = 
            "Deprecated since version 2.2.0. Use function " +
            "'_getRelations' instead.";
        pqfLib.utils.misc.log(debug_level, "warn", null, message);
        // Apply default values
        if (!filterByTypes) { filterByTypes = 'all' };
        if (simplify == undefined) { simplify = false };
        // Load all relations of the project 
        let relations = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getAllRelations, 'Project', prjId, null, null, null, 
            false);
        if (!relations) { return null };
        // Filter relations according to filterByTypes
        if (filterByTypes !== 'all') {
            relations = relations.filter(obj =>
                filterByTypes.includes(obj.relationType));
        }
        // Get the objects associated with each relation
        let objectsPerRelation = _getObjectsPerRelation(relations, prjId);
        // Construct JTF object
        let relationJTF = {
            'meta': {
                'categories': [
                    {
                        'id': 'relations',
                        'label': { 'en': 'Relations', 'de': 'Beziehungen' }
                    }
                ],
                'columns': []
            },
            'data': []
        };
        // Add columns to JTF meta object
        for (let relationTypeId in objectsPerRelation) {
            // Load relation definition
            let relationTypeObj = pqfLib.utils.apiFunc.exec(
                Pqf.pf, Pqf.pf.getRelationType, relationTypeId);
            if (!relationTypeObj) { continue };
            // Distinguish between forward and backward relations
            if (objectsPerRelation[relationTypeId].forward.length > 0) {
                relationJTF.meta.columns.push({
                    'id': relationTypeId + '_forward',
                    'catid': 'relations',
                    'type': 'multienum',
                    'label': 
                        {
                            'en': relationTypeObj.nameForward,
                            'de': relationTypeObj.nameForward
                        },
                    'format': { 'showIcon': true }
                });
            } 
            if (objectsPerRelation[relationTypeId].backward.length > 0) {
                relationJTF.meta.columns.push({
                    'id': relationTypeId + '_backward',
                    'catid': 'relations',
                    'type': 'multienum',
                    'label': 
                        {
                            'en': relationTypeObj.nameBackward,
                            'de': relationTypeObj.nameBackward
                        },
                    'format': { 'showIcon': true }
                });
            }
        }
        // Push data to JTF data object (only one row!)
        row = {
            'id': null,
            'data': []
        }
        for (let relationTypeId in objectsPerRelation) {
            if (objectsPerRelation[relationTypeId].forward.length > 0) {
                row.data.push(objectsPerRelation[relationTypeId].forward);
            }
            if (objectsPerRelation[relationTypeId].backward.length > 0) {
                row.data.push(objectsPerRelation[relationTypeId].backward);
            }
        }
        relationJTF.data.push(row);
        // Check if JTF data should be simplified
        if (simplify) {
            relationJTF = _simplifyJTF(relationJTF);
        }
        return relationJTF;
    }

    // JTF (FOR WIDGETS) #######################################################

    /**
     * Get the cost flow timelines of a project or a portfolio and convert them
     * into a JTF according to the given specifications. Thereby, the first 
     * column contains the date and the following columns contain the costs per
     * flow.
     * 
     * @param {string|Object} objInfo - The ID of the project or portfolio or
     *   an object containing the ID and the type of the object.
     * @param {string} [zoom='MONTH'] - The zoom level of the timeline. Possible
     *   values are 'YEAR', 'QUARTER', and 'MONTH'.
     * @param {string} [beg=null] - The start date of the timeline. If null, the
     *   earliest date is used.
     * @param {string} [end=null] - The end date of the timeline. If null, the
     *   latest date is used.
     * @param {boolean} [simplify=false] - If true, the JTF table data is
     *   simplified in such a way that its cells can be interpreted by MS Excel.
     *   Note that this is not recommended if the jtf is used for a widget as
     *   the dates are converted to strings.
     * @param {string} [currencyId=DEFAULT_CURRENCY] - The currency ID in which
     *   the costs should be displayed.
     * @returns {Object} The JTF table object including meta and data.
     * @example
     * // specifications
     * const objectInfo = '74DC72CCC6A64961B15FE3D03DEC7A69'; // UUID of a project
     * const zoom = 'MONTH';
     * let costFlowTimelinesJTF = pqfDataCollectorLib.jtf.getCostFlowTimelines(objectInfo, zoom);
     * costFlowTimelinesJTF;
     * // returns JTF object
     * {
     *   "meta": {
     *     "categories": [ ... ], // x-Axis, y-Axis
     *     "columns": [
     *       {
     *         "id": "timeindices", // always present
     *         "catid": "xAxis",
     *         "type": "daterange",
     *         "label": { "en": "Date", "de": "Datum" },
     *         "options": { "width": 200 }
     *       },
     *       {
     *         "id": "BUDGET", // flow ID
     *         "catid": "yAxis",
     *         "type": "money",
     *         "label": { "en": "Budget", "de": "Budget" },
     *         "format": { "currencyCode": "CHF" }
     *       },
     *       ... // remaining flows
     *     ]
     *   },
     *   "data": [
     *     {
     *       "id": "string describing the period" + i, // date + index
     *       "data": [
     *         {
     *           "start": "2021-01-01", // start date of the period
     *           "end": "2021-01-31" // end date of the period
     *         },
     *         {
     *           "amount": 1000, // amount of the flow
     *           "currencyCode": "CHF" // currency code
     *         },
     *         ... // remaining flows
     *       ]
     *     },
     *     ...
     *   ]
     * }
     * @alias .getCostFlowTimelines
     * @memberof module:pqfDataCollectorLib.jtf
     */
    function _getCostFlowTimelines(
        objInfo, zoom, beg, end, simplify, currencyId) {
        // Apply default values
        let objectId = null;
        let objectType = null;
        if (typeof objInfo === 'object') {
            objectId = objInfo.id;
            objectType = objInfo.type;
        } else {
            objectId = objInfo;
            objectType = 'Project';
        }
        if (!zoom) { zoom = 'MONTH' };
        if (!beg) { beg = null };
        if (!end) { end = null };
        if (simplify === undefined) { simplify = false };
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        // Get currency code
        let currency = _mapCurrency(currencyId);
        // Load costs matrix
        let costsMatrix = null;
        if (objectType === 'Project') {
            costsMatrix = pqfLib.utils.apiFunc.exec(
                Pqf.fco, Pqf.fco.getProjectCostsTimeline, objectId, beg, end,
                [zoom], ['FLOW'], currencyId);
            if (!costsMatrix) { return };
        } else if (objectType === 'ProjectPortfolio') {
            costsMatrix = pqfLib.utils.apiFunc.exec(
                Pqf.fco, Pqf.fco.getPortfolioCostsTimeline, objectId, beg, end,
                [zoom], ['FLOW'], currencyId);
            if (!costsMatrix) { return };
        } else {
            let message = 
                "The object type " + objectType + " is not supported by the " +
                "function '_getCostFlowTimelines'.";
            pqfLib.utils.misc.log(
                1, "error", "C1D33A0E04934680BF57FCFEEA4741E8", message);
        }
        if (!costsMatrix || !costsMatrix.hierarchy) {
            let message =
                "No costs matrix was found for the object with the ID " +
                objectId + " and the type " + objectType + " in the function " +
                "'_getCostFlowTimelines'.";
            pqfLib.utils.misc.log(
                debug_level, "warn", "C808F22CB37E4363AEFC1E992C4F6885", message);
            return null;
        }
        // Construct JTF object
        let costsJTF = {
            'meta': {
                'categories': [
                    {
                        'id': 'xAxis',
                        'label': { 'en': 'x-Axis', 'de': 'x-Achse' }
                    },
                    {
                        'id': 'yAxis',
                        'label': { 'en': 'y-Axis', 'de': 'x-Achse' }
                    }
                ], 
                'columns': [
                    {
                        'id': 'timeindices',
                        'catid': 'xAxis',
                        'type': 'daterange',
                        'label': { 
                            'en': 'Date',
                            'de': 'Datum'
                        },
                        "options": { "width": 200 }
                    }
                ] // cp nampes + flows per Year
            },
            'data': []
        }
        for (let item of costsMatrix.hierarchy[0].items) {
            costsJTF.meta.columns.push({
                'id': item.id,
                'catid': 'yAxis',
                'type': 'money',
                'label': { 
                    'en': item.name,
                    'de': item.name
                },
                'format': { 'currencyCode': currency }
            });
        }
        // Load / push rows to JTF data object
        for (let i=0; i < costsMatrix.calendar.layers[0].ranges.length; i++) {
            // Construct row (with date)
            let row = {
                'id': costsMatrix.calendar.layers[0].ranges[i].label + '_' + i,
                'data': [{
                    'start': costsMatrix.calendar.layers[0].ranges[i].first,
                    'end': costsMatrix.calendar.layers[0].ranges[i].last
                }]
            };
            // Add values to row
            for (let group of costsMatrix.groups) {
                if (group && group.layers && group.layers[0].ranges && 
                    group.layers[0].ranges[i]) {
                    row.data.push({
                        'amount': group.layers[0].ranges[i].amount,
                        'currencyCode': currency
                    });
                } else {
                    row.data.push(null);
                }
            }
            costsJTF.data.push(row);
        }
        // Check if JTF data should be simplified
        if (simplify) {
            costsJTF = _simplifyJTF(costsJTF, 'YYYY-MM-DD');
        }
        return costsJTF;
    }

    // TOOLS ###################################################################

    /**
     * Generally useful functions.
     * 
     * @namespace tools
     * @memberof module:pqfDataCollectorLib
     */

    /**
     * Get the property values for the given array of properties.
     * 
     * @param {Array} properties - The properties for which the values should be
     *   extracted.
     * @param {Object} [obj=null] - The object containing the properties. This
     *   is only needed for properties of type 'static.string'.
     * @returns {Array} The values of the properties.
     * @example
     * // Load project object (or any other object with properties)
     * let projectId = '74DC72CCC6A64961B15FE3D03DEC7A69';
     * let project = pqfDataCollectorLib.tools.pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getProject, projectId);
     * // Get values of the project's properties
     * let propertiesData = pqfDataCollectorLib.tools.getPropertiesData(project.properties);
     * propertiesData;
     * // returns
     * [
     *   "value1", // any of the supported data types
     *   "value2", // "
     *   ...
     * ]
     * @alias .getPropertiesData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getPropertiesData(properties, obj) { 
        let row = [];
        // Check if there are any properties
        if (properties) {
            // Iterate through all given properties
            for (let property of properties) {
                // Read property definition
                let propertyDefinition = pqfLib.utils.apiFunc.exec(
                    Pqf.pf, Pqf.pf.getPropertyDefinition, property.key);
                if (!propertyDefinition) { continue };
                let value = _getPropertyValue(property, propertyDefinition, obj);
                if (value !== 'layoutProperty') {
                    row.push(value);
                }
            }
        }
        return row;
    }

    /**
     * Get the property summaries, i.e. the label, value, and basetype of the
     * given properties.
     * 
     * @param {Array} properties - The properties for which the summaries should
     *   be extracted.
     * @param {Object} [obj=null] - The object containing the properties. This
     *   is only needed for properties of type 'static.string'.
     * @returns {Object} The summaries of the properties, indexed by their keys.
     * @example
     * // Load project object (or any other object with properties)
     * let projectId = '74DC72CCC6A64961B15FE3D03DEC7A69';
     * let project = pqfDataCollectorLib.tools.pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getProject, projectId);
     * // Get summaries of the project's properties
     * let propertiesSummary = pqfDataCollectorLib.tools.getPropertiesSummary(project.properties);
     * propertiesSummary;
     * // returns
     * {
     *   "propertyKey1": {
     *     "label": {
     *       "en": "Property Label 1",
     *       "de": "Property Label 1"
     *     }, // Both times in the user's language
     *     "value": "Property Value 1", // any of the supported data types
     *     "type": "Data type" // e.g., 'string', 'number', 'date', ...
     *   },
     *   ...
     * }
     * @alias .getPropertiesSummary
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getPropertiesSummary(properties, obj) { 
        let summary = {};
        // Check if there are any properties
        if (properties) {
            // Iterate through all given properties
            for (let property of properties) {
                // Read property definition
                let propertyDefinition = pqfLib.utils.apiFunc.exec(
                    Pqf.pf, Pqf.pf.getPropertyDefinition, property.key);
                if (!propertyDefinition) { continue };
                let value = _getPropertyValue(property, propertyDefinition, obj);
                if (value !== 'layoutProperty') {
                    let type = propertyDefinition.constraint.basetype;
                    if (type === 'url') { type = 'string' };
                    if (type === 'layout.line') { type = 'jtf' };
                    let propertySummary = {
                        'label': { // TODO: actually translate the label
                            'en': propertyDefinition.label,
                            'de': propertyDefinition.label
                        },
                        'value': value,
                        'type': type
                    }
                    summary[property.key] = propertySummary;
                }
            }
        }
        return summary;
    }

    /**
     * Get the data of a classification scheme.
     * 
     * @param {Object} classScheme - The classification scheme object containing
     *   its classification schema ID, data, classification ID, and score.
     * @returns {Object} The data of the classification scheme.
     * @example
     * const CLASS_SCHEME_ID = 'Project-Importance';
     * // Load project object
     * let projectId = '74DC72CCC6A64961B15FE3D03DEC7A69';
     * let project = pqfDataCollectorLib.tools.pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getProject, projectId);
     * // Get values of the specified classification scheme
     * let classScheme = project.classification.find(obj => obj.classificationSchemaId === CLASS_SCHEME_ID);
     * let classSchemeData = pqfDataCollectorLib.tools.getClassSchemeData(classScheme);
     * classSchemeData;
     * // returns
     * {
     *   "name_enum": {
     *     "label": { "en": "Classification Scheme", "de": "Klassifikationsschema" },
     *     "value": { ... }, // enum describing the classification schema
     *     "type": "enum"
     *   },
     *   "score": { ... }, // score of the classification
     *   "class": { ... }, // classification of the project in this scheme
     *   "data": [
     *     {
     *       "attName_enum": { ... }, // name of the attribute
     *       "attValue_enum": { ... }, // value of the attribute
     *       "points": { ... } // points of the attribute
     *     },
     *     ...
     *   ]
     * }
     * @alias .getClassSchemeData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getClassSchemeData(classScheme) { 
        let classSchemeData = {};
        // Get class scheme definition
        let classSchemeDef = pqfLib.utils.apiFunc.exec(
            Pqf.cls, Pqf.cls.getSchema, classScheme.classificationSchemaId);
        if (!classSchemeDef) { return null };
        // Get class scheme values
        classSchemeData.name_enum = {
            'label': {
                'en': 'Classification Scheme',
                'de': 'Klassifikationsschema'
            },
            'value': _toEnum(classSchemeDef),
            'type': 'enum'
        };
        classSchemeData.score = {
            'label': { 'en': 'Score', 'de': 'Score' },
            'value': classScheme.score,
            'type': 'number'
        }
        // Find actual classification
        let actualClass = null;
        let classesWithScoreFulfilled = classSchemeDef.classes.filter(
            obj => obj.minPoints <= classScheme.score);
        actualClass = classesWithScoreFulfilled.reduce(
            (maxClass, currentClass) => {
                return currentClass.minPoints > maxClass.minPoints ? 
                    currentClass : maxClass;
            }, classesWithScoreFulfilled[0]);
        classSchemeData.class = {
            'label': { 'en': 'Classification', 'de': 'Klassifikation' },
            'value': actualClass ? _toEnum(actualClass) : null,
            'type': 'enum'
        };
        // Map attributes
        classSchemeData.data = [];
        for (let dataPoint of classScheme.data) {
            let attribute = classSchemeDef.attributes.find(
                obj => obj.id === dataPoint.attributeId);
            let dataPointObject = {};
            dataPointObject.attName_enum = {
                'label': { 'en': 'Attribute Name', 'de': 'Attributname' },
                'value': _toEnum(attribute),
                'type': 'enum'
            };
            let attributeValue = attribute ? 
                attribute.values.find(obj => obj.id === dataPoint.valueId) :
                null;
            dataPointObject.attValue_enum = {
                'label': { 'en': 'Attribute Value', 'de': 'Attributwert' },
                'value': attributeValue ? _toEnum(attributeValue) : null,
                'type': 'enum'
            };
            dataPointObject.points = {
                'label': { 'en': 'Attribute Points', 'de': 'Attributpunkte' },
                'value': attributeValue ? attributeValue.points : null,
                'type': 'number'
            }
            classSchemeData.data.push(dataPointObject);
        }
        return classSchemeData;
    }

    /**
     * Get the data of one indicator dimension.
     * 
     * @param {Object} dimension - The dimension object of the indicator.
     * @param {Array} dimensionDefinitions - The definitions of the dimensions.
     *   Must include the dimension of the given dimension object.
     * @param {Array} detailDefinitions - The definitions of the details.
     *   Must include the details of the given dimension object.
     * @param {boolean} [includeDetails=true] - If true, the details of the
     *   dimension are included in the output.
     * @returns {Object} The data of the indicator dimension.
     * @example
     * let dimensionData = pqfDataCollectorLib.tools.getIndicatorDimensionData(dimension, dimensionDefinitions, detailDefinitions);
     * dimensionData;
     * // returns
     * {
     *   "dimension_enum": { ... }, // description of the dimension
     *   "targetValue": { ... }, // total target value of the dimension
     *   "actualValueCalculated": { ... }, // total calculated actual value of the dimension
     *   "actualValueManual": { ... }, // total manual actual value of the dimension
     *   "remainingValueCalculated": { ... }, // total calculated remaining value of the dimension
     *   "remainingValueManual": { ... }, // total manual remaining value of the dimension
     *   "forecastValueCalculated": { ... }, // total calculated forecast value of the dimension
     *   "forecastValueManual": { ... }, // total manual forecast value of the dimension
     *   "statusClassCalculated": { ... }, // total calculated status class of the dimension
     *   "statusClass": { ... }, // total manual status class of the dimension
     *   "trendClassCalculated": { ... }, // total calculated trend class of the dimension
     *   "trendClass": { ... }, // total manual trend class of the dimension
     *   "remark": { ... }, // total remark of the dimension
     *   "details": [
     *     {
     *       "detail_enum": { ... }, // description of the detail
     *       ... // values of the detail
     *     },
     *     ...
     *   ]
     * }
     * @alias .getIndicatorDimensionData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getIndicatorDimensionData( 
        dimension, dimensionDefinitions, detailDefinitions, includeDetails) {
        // Apply default values
        if (includeDetails == undefined) { includeDetails = true };
        // Construct dimension object
        let dimensionObject = {};
        // Dimension enum
        let dimensionDefinition = dimensionDefinitions.find(
            obj => obj.id === dimension.selection.dimension);
        dimensionObject.dimension_enum = {
            'label': { 
                'en': 'Dimension', 
                'de': 'Dimension' 
            },
            'value': null,
            'type': 'enum'
        }
        if (dimensionDefinition) {
            dimensionObject.dimension_enum.value = _toEnum(dimensionDefinition);
        }
        // Find dimension value type
        let dimensionValueType = null;
        let dimensionDetailDefinitions = detailDefinitions.filter(
            obj => obj.dimension === dimension.selection.dimension);
        let valueTypes = new Set();
        for (let detailDefinition of dimensionDetailDefinitions) {
            if (detailDefinition.valueType) {
                valueTypes.add(detailDefinition.valueType.basetype);
            }
        }
        if (valueTypes.size === 1) {
            dimensionValueType = 
                dimensionDetailDefinitions[0].valueType.basetype;
        }
        // Get total dimension values
        let total = _getIndicatorDetailData(
            dimension.total, dimensionValueType, dimension.targetTotal, 
            detailDefinitions, true);
        for (let key in total) {
            dimensionObject[key] = total[key];
        }
        // Get detail dimension values
        if (includeDetails && dimensionValueType) {
            dimensionObject.details = [];
            for (let detail of dimension.indicators) {
                let detailDefinition = detailDefinitions.find(
                    obj => obj.id === detail.selection.typeId);
                if (!detailDefinition) { 
                    let message =
                        "Could not find detail definition of indicator with " +
                        "ID " + detail.selection.typeId + " in function " +
                        "'_getIndicatorDimensionData'.";
                    pqfLib.utils.misc.log(
                        debug_level, "warn", "52020A4F18E1408291040C567D56DFE8", message);
                    continue; 
                };
                let detailObject = _getIndicatorDetailData(
                    detail, detailDefinition.valueType.basetype, 
                    detail.selection.targetValue, detailDefinition, false);
                dimensionObject.details.push(detailObject);
            }
        }
        return dimensionObject;
    }

    /**
     * Get the data of one indicator detail.
     * 
     * @param {Object} detail - The detail object of the indicator. The 
     *   valueType and targetValue must be specified separately to make this 
     *   function applicable for the TOTAL as well.
     * @param {string} valueType - The value type of the indicator.
     * @param {number} targetValue - The target value of the indicator.
     * @param {Object} detailDefinition - The definition object of the detail.
     * @param {boolean} [isTotal=false] - If true, the detail is considered as
     *   the total of the dimension.
     * @returns {Object} The data of the indicator detail.
     * @example
     * let detailData = pqfDataCollectorLib.tools.getIndicatorDetailData(detail, valueType, targetValue, detailDefinition);
     * detailData;
     * // returns
     * {
     *   "detail_enum": { ... }, // description of the detail (only included if isTotal is false)
     *   "targetValue": { ... }, // target value of the detail
     *   "actualValueCalculated": { ... }, // calculated actual value of the detail
     *   "actualValueManual": { ... }, // manual actual value of the detail
     *   "remainingValueCalculated": { ... }, // calculated remaining value of the detail
     *   "remainingValueManual": { ... }, // manual remaining value of the detail
     *   "forecastValueCalculated": { ... }, // calculated forecast value of the detail
     *   "forecastValueManual": { ... }, // manual forecast value of the detail
     *   "statusClassCalculated": { ... }, // calculated status class of the detail
     *   "statusClass": { ... }, // manual status class of the detail
     *   "trendClassCalculated": { ... }, // calculated trend class of the detail
     *   "trendClass": { ... }, // manual trend class of the detail
     *   "remark": { ... } // remark of the detail
     * }
     * @alias .getIndicatorDetailData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getIndicatorDetailData( 
        detail, valueType, targetValue, detailDefinition, isTotal) {
        // Apply default values
        if (typeof isTotal === 'undefined') { isTotal = false };
        // Map valueType
        valueType = _mapIndicatorType(valueType);
        // Construct detail object
        let detailObject = {};
        // ENUM (distinguish between indicator-total and indicator-detail)
        if (!isTotal) {
            detailObject.detail_enum = {
                'label': { 
                    'en': 'Indicator-Detail', 
                    'de': 'Indikatoren-Detail' 
                },
                'value': null,
                'type': 'enum'
            }
            if (detailDefinition) {
                detailObject.detail_enum.value = _toEnum(detailDefinition);
            }
        }
        // VALUES
        function _mapValues(label_en, label_de, value) {
            return {
                'label': { 'en': label_en, 'de': label_de },
                'value': _mapIndicatorValue(value, valueType),
                'type': valueType
            }
        }
        if (valueType) {
            detailObject.targetValue = _mapValues('PLAN', 'SOLL', targetValue);
            detailObject.actualValueCalculated = _mapValues(
                'ACTUAL (calculated)', 'IST (berechnet)', 
                detail.actualValueCalculated);
            detailObject.actualValueManual = _mapValues(
                'ACTUAL (manual)', 'IST (manuell)',
                detail.actualValueManual);
            detailObject.remainingValueCalculated = _mapValues(
                'REMAINING (calculated)', 'VERBLEIBEND (berechnet)',
                detail.remainingValueCalculated);
            detailObject.remainingValueManual = _mapValues(
                'REMAINING (manual)', 'VERBLEIBEND (manuell)',
                detail.remainingValueManual);
            detailObject.forecastValueCalculated = _mapValues(
                'FORECAST (calculated)', 'PROGNOSE (berechnet)',
                detail.forecastValueCalculated);
            detailObject.forecastValueManual = _mapValues(
                'FORECAST (manual)', 'PROGNOSE (manuell)',
                detail.forecastValueManual);
        }
        // CLASSIFICATIONS
        function _mapClassifications(label_en, label_de, value) {
            return {
                'label': { 'en': label_en, 'de': label_de },
                'value': value ? _toEnum(value) : null,
                'type': 'enum'
            }
        }
        let states = [
            {
                'label_en': 'Status (calculated)',
                'label_de': 'Status (berechnet)',
                'value': detail.statusClassCalculated
            }
        ];
        detailObject.statusClassCalculated = _mapClassifications(
            'Status (calculated)', 'Status (berechnet)',
            detail.statusClassCalculated);
        detailObject.statusClass = _mapClassifications(
            'Status (manual)', 'Status (manuell)',
            detail.statusClass);
        detailObject.trendClassCalculated = _mapClassifications(
            'Trend (calculated)', 'Trend (berechnet)',
            detail.trendClassCalculated);
        detailObject.trendClass = _mapClassifications(
            'Trend (manual)', 'Trend (manuell)',
            detail.trendClass);
        // REMARK
        detailObject.remark = {
            'label': { 'en': 'Remark', 'de': 'Bemerkung' },
            'value': detail.remark,
            'type': 'html'
        }
        return detailObject;
    }

    /**
     * Get the associated objects per relation of a object.
     * 
     * @param {Array} relations - The relations, for which the associated
     *   objects should be extracted.
     * @param {string} objectId - The ID of the object.
     * @returns {Object} The objects per relation of the project, indexed by
     *   their relation type ID.
     * @example
     * let objectsPerRelation = pqfDataCollectorLib.tools.getObjectsPerRelation(relations, objectId);
     * objectsPerRelation;
     * // returns
     * {
     *   "relationType_1": {
     *     "forward": [
     *       { ... }, // enum object
     *       ...
     *     ],
     *     "backward": [
     *       { ... }, // enum object
     *       ...
     *     ]
     *   },
     *   ...
     * }
     * @alias .getObjectsPerRelation
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getObjectsPerRelation(relations, objectId) { 
        // Group relations by relation type
        let relationsPerType = {};
        for (let relation of relations) {
            if (!relationsPerType[relation.relationType]) {
                relationsPerType[relation.relationType] = [];
            }
            relationsPerType[relation.relationType].push(relation);
        }
        // Get objects per relation
        let objsPerRelation = {};
        for (let relationType in relationsPerType) {
            objsPerRelation[relationType] = {
                'forward': [],
                'backward': []
            };
            // Iterate through all relations of the current type
            for (let relation of relationsPerType[relationType]) {
                // Check if forward or backward relation
                isForward = false;
                if (relation.source.id === objectId) {
                    isForward = true;
                }
                // Get the object short (i.e., its type and ID)
                let objShort = isForward ? relation.target : relation.source;
                let objEnum = _mapObjectShort(objShort);
                if (!objEnum) { continue };
                isForward ?
                    objsPerRelation[relationType].forward.push(objEnum) :
                    objsPerRelation[relationType].backward.push(objEnum);
            }
        }
        return objsPerRelation;
    }

    /**
     * Get the data of the given task.
     * 
     * @param {Object} task - The task for which the data should be extracted.
     * @param {Array} [requiredItems='all'] - The task items that should be 
     *   extracted.
     * @param {boolean} [summationRequired] - If true, some of the specified
     *   items require summation (special API call).
     * @param {Object} [projectId=null] - The ID of the project. Required if the
     *   project management method phase should be extracted.
     * @param {string} [currencyId=DEFAULT_CURRENCY] - The currency ID in which 
     *   the costs should be displayed.
     * @returns {Array} The data of the task.
     * @example
     * // specifications
     * const requiredItems = ['taskName', 'taskOwner', 'taskColor', 'projectManagementMethodPhase']; // Subset of implementedGanttItems
     * let taskData = pqfDataCollectorLib.tools.getTaskData(task, requiredItems, null, projectId);
     * taskData;
     * // returns
     * [
     *   "Task Name", // string
     *   { ... }, // task owner enum object
     *   ...
     * ]
     * @alias .getTaskData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getTaskData( 
        task, requiredItems, summationRequired, projectId, currencyId) {
        let row = [];
        // Apply default values
        if (!requiredItems) { requiredItems = 'all' };
        if (summationRequired === undefined) {
            summationRequired = false;
            for (let item of 
                (requiredItems === 'all' ? 
                    implementedGanttItems : requiredItems)) {
                if (item.startsWith('time') || item.startsWith('costs') || 
                    item === 'progress') {
                    summationRequired = true;
                    break;
                }
            }
        }
        if (!currencyId) { currencyId = DEFAULT_CURRENCY_ID };
        // If sum items are required, load the corresponding data
        let sumData = null;
        if (summationRequired) {
            sumData = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getWorkItemAccumulatedValues, task.id, null, 
                null, currencyId);
        }
        // Filter requiredItems if the given task is a milestone / folder
        let requiredItems_copy = 
            (requiredItems === 'all' ? 
                implementedGanttItems : requiredItems).slice();
        const implementedGanttItems_milestone = [
            'extractionIndex', 'level', 'taskType', 'taskName', 'taskCode', 
            'taskDesc', 'taskOwner', 'taskColor', 'taskBeg', 'properties'
        ];
        const implementedGanttItems_folder = [ 
            'extractionIndex', 'level', 'taskType', 'taskName', 'taskCode', 
            'taskDesc', 'properties'
        ];
        if (task.phaseType === 'PROJECT_MILESTONE') {
            for (let i=0; i < requiredItems_copy.length; i++) {
                if (!implementedGanttItems_milestone.includes(
                    requiredItems_copy[i])){
                    requiredItems_copy[i] = 'phMilestone';
                }
            }
        }
        if (task.phaseType === 'PROJECT_FOLDER') {
            for (let i=0; i < requiredItems_copy.length; i++) {
                if (!implementedGanttItems_folder.includes(
                    requiredItems_copy[i])){
                    requiredItems_copy[i] = 'phFolder';
                }
            }
        }
        // Load macro allocations of the task
        let macroAllocations = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getWorkItemMacroAllocations, task.id);
        // Helper function (to avoid code duplication)
        function _mapCosts(path) {
            let pathArr = path.split('.');
            let costObj = sumData[pathArr[0]];
            for (let i=1; i < pathArr.length; i++) {
                costObj = costObj[pathArr[i]];
            }
            return _toMoney(costObj);
        }
        // Iterate through all required task items
        for (let item of requiredItems_copy) {
            switch (item) {
                // Handle placeholders of milestones
                case 'phMilestone':
                case 'phFolder':
                    row.push(null);
                    break;
                // BASIC
                case 'extractionIndex':
                    row.push(task.extractionIndex);
                    break;
                case 'level':
                    row.push(task.level);
                    break;
                case 'taskType': 
                    row.push(task.phaseType);
                    break;
                case 'taskName':
                    row.push(task.name);
                    break;
                // GENERIC
                case 'taskCode':
                    row.push(task.code);
                    break;
                case 'taskDesc': 
                    row.push(task.description);
                    break;
                case 'taskOwner':
                    let owner_enum = null;
                    if (task.owner) {
                        owner_enum = _toEnum(task.owner);
                    }
                    row.push(owner_enum);
                    break;
                case 'taskColor':
                    let color_enum = null;
                    if (task.color) {
                        let taskColor = pqfLib.utils.apiFunc.exec(
                            Pqf.pf, Pqf.pf.getEnumValue, "COLOR", task.color, 
                            true);
                        color_enum = taskColor ? _toEnum(taskColor) : null;
                    }
                    row.push(color_enum);
                    break;
                case 'projectManagementMethodPhase':
                    // Check if project ID is specified
                    if (!projectId) {
                        let message =
                            "For the extraction of the project management " +
                            "method phase, the project ID must be specified " +
                            "when calling the function '_getTaskData'.";
                        pqfLib.utils.misc.log(
                            debug_level, "warn", "533D506ADBF84815A3057595B0066455",
                            message);
                        row.push(null);
                        break;
                    }
                    let pmPhase_enum = null;
                    if (task.projectManagementMethodPhaseId) {
                        let managementMethod = pqfLib.utils.apiFunc.exec(
                            Pqf.pm, Pqf.pm.getProjectManagementMethod, 
                            projectId);
                        let pmPhaseObj = managementMethod ?
                            pqfLib.utils.apiFunc.exec(
                                Pqf.pm, Pqf.pm.getPmMethodPhase, 
                                managementMethod.id, 
                                task.projectManagementMethodPhaseId) : 
                            null;
                        pmPhase_enum = pmPhaseObj ? _toEnum(pmPhaseObj) : null;
                    }
                    row.push(pmPhase_enum);
                    break;
                case 'requiredSkill':
                    let skill_enum = null;
                    if (task.requiredSkill) {
                        skill_enum = _toEnum(task.requiredSkill);
                    }
                    row.push(skill_enum);
                    break;
                // PLANNING
                case 'taskBeg':
                    row.push(task.beg ? 
                        moment(task.beg).format("YYYY-MM-DD") : null);
                    break;
                case 'taskEnd':
                    row.push(task.end ?
                        moment(task.end).subtract(1, "days").format(
                            "YYYY-MM-DD") :
                        null);
                    break;
                case 'taskDuration':
                    row.push(task.beg && task.end ? 
                        "P" + moment(task.end).diff(task.beg, "days") + "DT" : 
                        null);
                    break;
                case 'progress':
                    row.push(sumData ? sumData.progress : null);
                    break;
                case 'progressAccumulated':
                    row.push(sumData ? sumData.progressAccumulated : null);
                    break;
                case 'allocationState':
                    if (!macroAllocations) { 
                        row.push(null);
                        break 
                    };
                    let worstAlloactionStatePrio = 0;
                    let allocationStateValue = null;
                    for (let allocation of macroAllocations) {
                        let allocationStatePrio = _mapAllocationState2Prio(
                            allocation.state);
                        if (allocationStatePrio > 
                            worstAlloactionStatePrio) {
                            worstAlloactionStatePrio = allocationStatePrio;
                            allocationStateValue = allocation.state;
                        }
                    }
                    if (!allocationStateValue) {
                        row.push(null);
                        break;
                    }
                    let allocationState = pqfLib.utils.apiFunc.exec(
                        Pqf.pf, Pqf.pf.getEnumValue, 
                        "AllocationWorkflowState", allocationStateValue, true);
                    let allocationState_enum = allocationState ?
                        _toEnum(allocationState) : null;
                    row.push(allocationState_enum);
                    break;
                case 'allocatedResources':
                    if (!macroAllocations) { 
                        row.push(null);
                        break 
                    };
                    let resources = [];
                    for (let allocation of macroAllocations) {
                        let resource = pqfLib.utils.apiFunc.exec(
                            Pqf.res, Pqf.res.getResource, 
                            allocation.resourceId);
                        if (!resource) { continue };
                        resources.push(_toEnum(resource));
                    }
                    row.push(resources);
                    break;
                case 'allocationType':
                    let allocationType = null;
                    if (macroAllocations && macroAllocations.length > 0) {
                        allocationType = macroAllocations.some(allocation => 
                            allocation.amountType === "OF_AVAILABILITY" || 
                            allocation.amountType === "OF_FTE") ? 
                            "Time-Driven" : "Effort-Driven";
                    }
                    row.push(allocationType);
                    break;
                case 'properties': 
                    row.push({
                        'properties_data': _getPropertiesData(task.properties)
                    });
                    break;
                // EFFORT
                case 'timeBudget':
                    row.push(task.timeBudget);
                    break;
                case 'timeBudget_sum':
                    row.push(sumData ? sumData.timeBudgetAccumulated : null);
                    break;
                case 'timePlanned':
                    row.push(task.planned);
                    break;
                case 'timePlanned_sum':
                    row.push(sumData ? sumData.timePlannedAccumulated : null);
                    break;
                case 'timeAllocated':
                    row.push(sumData ? sumData.resourceAllocations : null);
                    break;
                case 'timeAllocated_sum':
                    row.push(sumData ? 
                        sumData.resourceAllocationsAccumulated : null);
                    break;
                case 'timeActual':
                    row.push(sumData ? sumData.resourceActuals : null);
                    break;
                case 'timeActual_sum':
                    row.push(sumData ? 
                        sumData.resourceActualsAccumulated : null);
                    break;
                case 'timeProvisional':
                    row.push(sumData ? sumData.timeExpectedPending : null);
                    break;
                case 'timeProvisional_sum':
                    row.push(sumData ?
                        sumData.timeExpectedPendingAccumulated : null);
                    break;
                case 'timeActualPlusProvisional':
                    let timeActualPlusProvisional = sumData ?
                        moment.duration(sumData.resourceActuals) + 
                        moment.duration(sumData.timeExpectedPending) : 
                        null;
                    row.push(moment.duration(
                        timeActualPlusProvisional).toISOString());
                    break;
                case 'timeActualPlusProvisional_sum':
                    let timeActualPlusProvisional_sum = sumData ?
                        moment.duration(sumData.resourceActualsAccumulated) + 
                        moment.duration(
                            sumData.timeExpectedPendingAccumulated) : 
                        null;
                    row.push(moment.duration(
                        timeActualPlusProvisional_sum).toISOString());
                    break;
                case 'timeRemaining':
                    row.push(sumData ? sumData.timeRemaining : null);
                    break;
                case 'timeRemaining_sum':
                    row.push(sumData ? sumData.timeRemainingAccumulated : null);
                    break;
                case 'timeForecast':
                    let timeForecast = sumData ?
                        moment.duration(sumData.resourceActuals) + 
                        moment.duration(sumData.timeExpectedPending) +
                        moment.duration(sumData.timeRemaining) : 
                        null;
                    row.push(moment.duration(timeForecast).toISOString());
                    break;
                case 'timeForecast_sum':
                    let timeForecast_sum = sumData ?
                        moment.duration(sumData.resourceActualsAccumulated) + 
                        moment.duration(
                            sumData.timeExpectedPendingAccumulated) +
                        moment.duration(sumData.timeRemainingAccumulated) : 
                        null;
                    row.push(moment.duration(timeForecast_sum).toISOString());
                    break;
                // COSTS
                case 'costsBudget':
                    row.push(_mapCosts('costsBudget'));
                    break;
                case 'costsBudget_sum':
                    row.push(_mapCosts('costsBudgetAccumulated'));
                    break;
                case 'costsPlanned':
                    row.push(_mapCosts('costs.forecastTotal.planned'));
                    break;
                case 'costsPlanned_sum':
                    row.push(_mapCosts(
                        'costsAccumulated.forecastTotal.planned'));
                    break;
                case 'costsActual':
                    row.push(_mapCosts('costs.forecastTotal.actual'));
                    break;
                case 'costsActual_sum':
                    row.push(_mapCosts(
                        'costsAccumulated.forecastTotal.actual'));
                    break;
                case 'costsProvisional':
                    row.push(_mapCosts('costs.forecastTotal.expectedPending'));
                    break;
                case 'costsProvisional_sum':
                    row.push(_mapCosts(
                        'costsAccumulated.forecastTotal.expectedPending'));
                    break;
                case 'costsActualPlusProvisional':
                    let costsActual = _mapCosts('costs.forecastTotal.actual');
                    let costsProvisional = _mapCosts(
                        'costs.forecastTotal.expectedPending');
                    let costsActualPlusProvisional = 
                        (costsActual || costsProvisional) ?
                            {
                                'currencyCode': costsActual ?
                                    costsActual.currencyCode : 
                                    costsProvisional.currencyCode,
                                'amount': 
                                    costsActual.amount + costsProvisional.amount
                            } : null;
                    row.push(costsActualPlusProvisional);
                    break;
                case 'costsActualPlusProvisional_sum':
                    let costsActual_sum = _mapCosts(
                        'costsAccumulated.forecastTotal.actual');
                    let costsProvisional_sum = _mapCosts(
                        'costsAccumulated.forecastTotal.expectedPending');
                    let costsActualPlusProvisional_sum =
                        (costsActual_sum || costsProvisional_sum) ?
                            {
                                'currencyCode': costsActual_sum ?
                                    costsActual_sum.currencyCode :
                                    costsProvisional_sum.currencyCode,
                                'amount':
                                    costsActual_sum.amount + 
                                    costsProvisional_sum.amount
                            } : null;
                    row.push(costsActualPlusProvisional_sum);
                    break;
                case 'costsRemaining':
                    row.push(_mapCosts('costs.forecastTotal.remaining'));
                    break;
                case 'costsRemaining_sum':
                    row.push(_mapCosts(
                        'costsAccumulated.forecastTotal.remaining'));
                    break;
                case 'costsForecast': 
                    row.push(_mapCosts('costs.forecast'));
                    break;
                case 'costsForecast_sum':
                    row.push(_mapCosts('costsAccumulated.forecast'));
                    break;
                default:
                    let message = 
                        "Unknown / not yet implemented Gantt item: " + item;
                    pqfLib.utils.misc.log(
                        debug_level, "warn", "FA63BDA0BD814C83A2DE6E8ACB302246", message);
            }
        }
        return row;
    }

    /**
     * Loads / maps the specified items of a TODO object.
     * 
     * @param {Object} todo - The TODO object.
     * @param {Array|string} [requiredItems='all'] - The TODO items that 
     *   should be extracted.
     * @returns {Array} The extracted data of the TODO object.
     * @example
     * // specifications
     * const requiredItems = ['todoName', 'todoStatus', 'todoPriority', 'todoColor'] // Subset of implementedTodoItems
     * let todoData = pqfDataCollectorLib.tools.getTodoData(todo, requiredItems);
     * todoData;
     * // returns
     * [
     *   "TODO Name", // string
     *   { ... }, // TODO status enum object
     *   ...
     * ]
     * @alias .getTodoData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getTodoData(todo, requiredItems) { 
        let row = [];
        // Apply default values
        if (!requiredItems) { requiredItems = 'all' };
        // Iterate through all required TODO items
        let message = null;
        for (let item of 
            (requiredItems === 'all' ? implementedTodoItems : requiredItems)) {
            switch (item) {
                case 'todoCode':
                    row.push(todo.code);
                    break;
                case 'todoName':
                    row.push(todo.name);
                    break;
                case 'todoStatus':
                    row.push(_toEnum(todo.state));
                    break;
                case 'todoPriority':
                    if (!todo.marker) {
                        row.push(null);
                        break;
                    }
                    switch (todo.marker) {
                        case 'CDE68BA071A2445F8B58D770B212E008':
                            row.push('Low');
                            break;
                        case 'DF8586B06ADA4DA587BE1936BEE2022D':
                            row.push('Medium');
                            break;
                        case '1F08A59E18FB489D9CC4649CD5F4BF83':
                            row.push('High');
                            break;
                        default:
                            message =
                                "Unknown priority marker: " + todo.marker + 
                                " for TODOs in function '_getTodoData'.";
                            pqfLib.utils.misc.log(
                                1, "error", "C3FBDE4639D4409CAFDF114B34E917DE",
                                message);
                            row.push(null);
                    }
                    break;
                case 'todoColor':
                    if (!todo.color) {
                        row.push(null); 
                        break;
                    }
                    let color = pqfLib.utils.apiFunc.exec(
                        Pqf.pf, Pqf.pf.getEnumValue, 'COLOR-TODO',
                        todo.color, true);
                    row.push(_toEnum(color));
                    break;
                case 'todoBeg':
                    row.push(
                        todo.validityStart ?
                            moment(todo.validityStart).format("YYYY-MM-DD") :
                            null
                    );
                    break;
                case 'todoEnd':
                    row.push(
                        todo.validityEnd ? 
                            moment(todo.validityEnd).subtract(
                                1, "days").format("YYYY-MM-DD") :
                            null
                    );
                    break;
                case 'todoDesc':
                    row.push(todo.description);
                    break;
                case 'todoComment':
                    // Find last comment 
                    let comment = null;
                    if (todo.lifecycleHistory) {
                        for (let object of todo.lifecycleHistory) {
                            if (object.remark) {
                                comment = object.remark;
                                break;
                            }
                        }
                    }
                    row.push(comment);
                    break;
                case 'properties':
                    row.push({ 
                        'properties_data': _getPropertiesData(todo.properties) 
                    });
                    break;
                // Note: Relations handled in default
                default:
                    if (item.startsWith('rel_')) {
                        // Find relations of the specific type
                        let relTypeId = item.substring(8);
                        let relsOfType = todo.relations.filter(
                            rel => rel.relationType === relTypeId);
                        // Find object shorts of all relations of this type
                        let isForward = item.substring(4,8) === 'for_';
                        let objShorts = [];
                        relsOfType.forEach(rel => {
                            // Check if the relation needs to be considered
                            // (or if it points in the oposite direction)
                            let consider = false;
                            if ((isForward && rel.source.id === todo.id) ||
                                (!isForward && rel.target.id === todo.id)) {
                                consider = true;
                            }
                            if (consider) {
                                objShorts.push(
                                    isForward ? rel.target : rel.source);
                            }
                        });
                        // Map objects
                        let objEnums = [];
                        objShorts.forEach(objShort => {
                            let objEnum = _mapObjectShort(objShort);
                            if (objEnum) {
                                objEnums.push(objEnum);
                            }
                        });
                        row.push(objEnums);
                        break;
                    }
                    row.push(null);
                    message = 
                        "Unknown / not yet implemented TODO item: " + item + 
                        " in function '_getTodoData'.";
                    pqfLib.utils.misc.log(
                        1, "error", "C70EB6F3ACCC4872B1F4DBAE9D9A8534", 
                        message);
            }
        }
        return row;
    }

    /**
     * Loads / maps the specified items of a risk object.
     * 
     * @param {Object} risk - The risk object.
     * @param {Array|string} [requiredItems='all'] - The risk items that
     *   should be extracted.
     * @param {boolean} [riskMappingRequired] - If true, the risk ratings are
     *   mapped to classes and limits. If not specified, it is checked if any
     *   classification mapping is required.
     * @returns {Array} The extracted data of the risk object.
     * @example
     * // specifications
     * const requiredItems = ['riskName', 'riskDesc', 'riskDimension', 'riskLoss'] // Subset of implementedRiskItems
     * let riskData = pqfDataCollectorLib.tools.getRiskData(risk, requiredItems);
     * riskData;
     * // returns
     * [
     *   "Risk Name", // string
     *   "Risk Description", // html (i.e., rich text)
     *   ...
     * ]
     * @alias .getRiskData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getRiskData( 
        risk, requiredItems, riskMappingRequired) {
        let row = [];
        // Apply default values
        if (!requiredItems) { requiredItems = 'all' };
        if (riskMappingRequired === undefined) {
            const itemWithClassification = [
                'opClass', 'opLimit', 'eolClass', 'eolLimit', 'rrClass', 
                'rrLimit'
            ];
            riskMappingRequired = (requiredItems === 'all' ? 
                implementedRiskItems : requiredItems).some(
                item => itemWithClassification.includes(item));
        }
        // If necessary, map risk ratings
        let riskRating_mapped = null;
        if (riskMappingRequired) {
            riskRating_mapped = _mapRiskAssessment(risk.rating);
        }
        // Iterate through all required risk items
        for (let item of 
            (requiredItems === 'all' ? implementedRiskItems : requiredItems)) {
            switch (item) {
                // BASIC
                case 'riskCode':
                    row.push(risk.code);
                    break;
                // PROPERTIES
                case 'riskName':
                    row.push(risk.name);
                    break;
                case 'riskDesc': 
                    row.push(risk.description);
                    break;
                case 'riskDimension':
                    let dimensionObj = null;
                    if (risk.dimension) {
                        let riskDimensions = pqfLib.utils.apiFunc.exec(
                            Pqf.pm, Pqf.pm.getIndicatorDimensionDefs, 
                            'ProjectReport');
                        dimensionObj = riskDimensions ? 
                            riskDimensions.find(
                                obj => obj.id === risk.dimension) :
                            null;
                    }
                    row.push(_toEnum(dimensionObj));
                    break;
                case 'riskLoss':
                    row.push(risk.loss && risk.loss.converted ?
                        {
                            "currencyCode": _mapCurrency(
                                risk.loss.converted.currency),
                            "amount": risk.loss.converted.amount
                        } : null);
                    break;
                case 'riskBudget':
                    row.push(risk.riskBudget && risk.riskBudget.converted ?
                        {
                            "currencyCode": _mapCurrency(
                                risk.riskBudget.converted.currency),
                            "amount": risk.riskBudget.converted.amount
                        } : null);
                    break;
                case 'properties':
                    row.push({ 
                        'properties_data': _getPropertiesData(risk.properties) 
                    });
                    break;
                // CURRENT RISK ASSESSMENT 
                case 'op':
                    row.push(risk.rating.occurrenceProbability);
                    break;
                case 'opClass':
                    row.push(riskRating_mapped.opClass);
                    break;
                case 'opLimit':
                    row.push(riskRating_mapped.opLimit);
                    break;
                case 'eol':
                    row.push(risk.rating.extentOfLoss);
                    break;
                case 'eolClass':
                    row.push(riskRating_mapped.eolClass);
                    break;
                case 'eolLimit':
                    row.push(riskRating_mapped.eolLimit);
                    break;
                case 'rr':
                    row.push(risk.rating.riskRating);
                    break;
                case 'rrClass':
                    row.push(riskRating_mapped.rrClass);
                    break;
                case 'rrLimit':
                    row.push(riskRating_mapped.rrLimit);
                    break;
                default:
                    let message = 
                        "Unknown / not yet implemented risk item: " + item +
                        " in function '_getRiskData'.";
                    pqfLib.utils.misc.log(
                        1, "error", "BDE24AF4B7BA4A3EB10B1B9799EDCF6C", message);
                    row.push(null);
            }
        }
        return row;
    }

    /**
     * Loads the specified items of a cost position object.
     * 
     * @param {Object} cp - The cost position object.
     * @param {Array|string} [requiredItems='all'] - The cost position items
     *   that should be extracted.
     * @returns {Array} The extracted data of the cost position object.
     * @example
     * // specifications
     * const requiredItems = ['cpName', 'cpDesc', 'cpBeg', 'cpEnd', 'cpAssignedWorkitems'] // Subset of implementedCPItems
     * let cpData = pqfDataCollectorLib.tools.getCPData(cp, requiredItems);
     * cpData;
     * // returns
     * [
     *   "Cost Position Name", // string
     *   "Cost Position Description", // html (i.e., rich text)
     *   ...
     * ]
     * @alias .getCPData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getCPData(cp, requiredItems) { 
        let row = [];
        // Calculate forecast
        let forecast = null;
        if ((requiredItems === 'all' ? 
            implementedCPItems : requiredItems).includes('cpForecast')) {
            forecast = _calculateCostForecast(cp);
        }
        // If necessary, load costs type object
        let costsTypeObj = null;
        if ((requiredItems === 'all' ?
            implementedCPItems : requiredItems).some(
                item => ['cpTypeGroup', 'cpType'].includes(item))) {
            if (cp.costsType) {
                costsTypeObj = pqfLib.utils.apiFunc.exec(
                    Pqf.fco, Pqf.fco.getCostsType, cp.costsType.id);
            } 
        }
        // Iterate through all required costposition items
        for (let item of requiredItems) {
            switch (item) {
                // BASIC
                case 'cpIndex':
                    row.push(cp.sortIndex);
                    break;
                case 'cpName':
                    row.push(cp.name);
                    break;
                // PROPERTIES
                case 'cpDesc':
                    row.push(cp.description);
                    break;
                case 'cpBeg':
                    row.push(
                        cp.validityStart ?
                            moment(cp.validityStart).format("YYYY-MM-DD") :
                            null
                    );
                    break;
                case 'cpEnd':
                    row.push(
                        cp.validityEnd ? 
                            moment(cp.validityEnd).subtract(
                                1, "days").format("YYYY-MM-DD") :
                            null);
                    break;
                case 'cpAssignedWorkitems':
                    let assignedWorkItems = [];
                    cp.assignedWorkItems.forEach(workItem => {
                        assignedWorkItems.push(_toEnum(workItem));
                    });
                    row.push(assignedWorkItems);
                    break;
                case 'properties':
                    row.push({ 
                        'properties_data': _getPropertiesData(cp.properties)
                    });
                    break;
                // COSTS
                case 'cpTypeGroup':
                    row.push(costsTypeObj ? _toEnum(costsTypeObj.group) : null);
                    break;
                case 'cpType':
                    row.push(_toEnum(costsTypeObj));
                    break;
                case 'cpCenter':
                    let cpCenterObj = null;
                    if (cp.costsCenter) {
                        cpCenterObj = pqfLib.utils.apiFunc.exec(
                            Pqf.pf, Pqf.pf.getEnumValue,
                            cp.costsCenter.type, cp.costsCenter.id, true);
                    }
                    row.push(_toEnum(cpCenterObj));
                    break;
                case 'payPlan': 
                    let payPlanObj = null;
                    if (cp.payPlan) {
                        payPlanObj = pqfLib.utils.apiFunc.exec(
                            Pqf.pf, Pqf.pf.getEnumValue,
                            cp.payPlan.type, cp.payPlan.id, true);
                    }
                    row.push(_toEnum(payPlanObj));
                    break;
                case 'obligo':
                    row.push(cp.obligo);
                    break;
                case 'cpPlanned': 
                    row.push(_toMoney(cp.plannedAmount.converted));
                    break;
                case 'cpSupplementary':
                    row.push(_toMoney(cp.supplementaryAmount.converted));
                    break;
                case 'cpForecast':
                    row.push(_toMoney(forecast));
                    break;
                case 'cpActual':
                    row.push(_toMoney(cp.actualAmount));
                    break;
                case 'cpProvisional':
                    row.push(_toMoney(cp.provisionalAmount));
                case 'cpRemaining':
                    row.push(_toMoney(cp.remainingAmount.converted));
                    break;
                default:
                    let message = 
                        "Unknown / not yet implemented costposition item: " +
                        item + " in function '_getCPData'.";
                    pqfLib.utils.misc.log(
                        1, "error", "FC0AC12CCD3B4844B2DC65A809B139F6", message);
                    row.push(null);
            }
        }
        return row;
    }

    /**
     * Loads the timeline data of a cost position.
     * 
     * @param {Object} cpTimeline - The cost position timeline object (i.e., 
     *   costsMatrix.groups[i]).
     * @param {Number} numberOfYears - The number of years that should be
     *   extracted.
     * @returns {Array} - The extracted timeline data of the cost position.
     * @example
     * let cpTimelineData = pqfDataCollectorLib.tools.getCPTimelineData(costsMatrix.groups[i], costsMatrix_ff.groups[i].groups.length);
     * cpTimelineData;
     * // returns
     * [
     *   value1 // year 1, flow 1
     *   value2 // year 1, flow 2
     *   ...
     * ]
     * @alias .getCPTimelineData
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getCPTimelineData(cpTimeline, numberOfYears) {
        let row = [];
        // Iterate over years
        for (let yearInd=0; yearInd < numberOfYears; yearInd++) {
            // Iterate over flows
            for (let flowInd=0; flowInd < cpTimeline.groups.length; flowInd++) {
                let value = 
                    cpTimeline.groups[flowInd] && 
                    cpTimeline.groups[flowInd].layers[0].ranges[yearInd] ? 
                        {
                            "currencyCode": _mapCurrency(
                                cpTimeline.groups[flowInd].layers[0].
                                ranges[yearInd].currency),
                            "amount": cpTimeline.groups[flowInd].layers[0].
                                ranges[yearInd].amount
                        } : null;
                row.push(value);
            }
        }
        return row;
    }

    /**
     * Loads the project meta data.
     * 
     * @param {string} projectId - The ID of the project.
     * @returns {Object} - An object containing the name, description, and code
     *   of the project.
     * @example
     * let projectMeta = pqfDataCollectorLib.tools.getProjectMeta(projectId);
     * projectMeta;
     * // returns
     * {
     *   "name": "Project Name", // string
     *   "description": "Project Description", // string
     *   "code": "Project Code", // string
     *   "lifecycleState": { ... }, // enum
     * }
     * @alias .getProjectMeta
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getProjectMeta(projectId) { 
        // Load the project
        let project = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProject, projectId);
        if (!project) { return null };
        // Create project meta object
        let projectMeta = {
            'name': project.name,
            'description': project.description,
            'code': project.code
        }
        // Get lifecycle state
        let lifecycleStateObj = pqfLib.utils.apiFunc.exec(
            Pqf.lcy, Pqf.lcy.getObjectState, 'Project', projectId);;
        projectMeta.lifecycleState = _toEnum(lifecycleStateObj);
        // Get start and end date of project (active scenario)
        let activeScenario = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectActiveScenario, projectId, true);
        let scenarioWorkItems = activeScenario ?
            pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, activeScenario.id) :
            null;
        let mainPhase = scenarioWorkItems ? scenarioWorkItems[0] : null;
        projectMeta.beg = mainPhase ? mainPhase.beg : null;
        projectMeta.end = mainPhase ? mainPhase.end : null;
        return projectMeta;
    }

    /**
     * Constructs / retreives the object tree of the given object.
     * 
     * @param {Object} rootObj - The information about the root object, i.e., 
     *   its ID and type.
     * @param {string} rootObj.id - The ID of the root object.
     * @param {string} rootObj.type - The type of the root object.
     * @param {Array} knotTypes - The types of objects that should be considered
     *   as knots. I.e., objects that potentially have sub-objects and should be
     *   included in the object tree.
     * @param {Array} leafTypes - The types of objects that should be considered
     *   as leaves. 
     * @param {string} [method='slim'] - The method for constructing the object
     *   tree. The following methods are available:
     *   - 'slim': Data is loaded iteratively, faster if only a few objects are
     *     included in the tree.
     *   - 'bulk': Data is loaded in bulk, faster if many objects are included
     *     in the tree.
     * @returns {Object} - The object tree of the given object.
     * @example
     * // specifications
     * let rootObj = {
     *   "id": "HRM-OU-ROOT",
     *   "type": "HRM-RES-TYP-OU"
     * };
     * const knotTypes = ['HRM-RES-TYP-OU', 'HRM-RES-TYP-TEA'];
     * const leafTypes = ['HRM-RES-TYP-EMP'];
     * let objectTree = pqfDataCollectorLib.tools.getObjectTree(rootObj, knotTypes, leafTypes);
     * objectTree;
     * // returns
     * { // enum object
     *   "id": "HRM-OU-ROOT",
     *   "name": "Name of the root object",
     *   "description": "Description of the root object",
     *   "iconRef": "Icon reference of the root object",
     *   "color": "Color of the root object",
     *   "leaves": [ // i.e., objects of different type (e.g., HRM-RES-TYP-EMP) that do not have sub-objects
     *     { // enum object
     *       "id": "6BFFA60C0D5C544EADC13131A7330344", // ID of the child object
     *       "name": "Name",
     *       "description": "Description",
     *       "iconRef": "Icon reference",
     *       "color": "Color"
     *     },
     *     ...
     *   ],
     *   "subTrees": [ // i.e., objects of the same type (e.g., HRM-RES-TYP-OU) that have sub-objects
     *     { // enum object
     *       "id": "DD72545D0FB855A9879DD28F5A575F5B",
     *       "name": "Name",
     *       "description": "Description",
     *       "iconRef": "Icon reference",
     *       "color": "Color",
     *       "subObjects": [ ... ],
     *       "subTrees": [ ... ]
     *     },
     *     ...
     *   ]
     * }
     * @alias .getObjectTree
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getObjectTree( 
        rootObj, knotTypes, leafTypes, method) { 
        // Apply default values
        if (!method) { method = 'slim' };
        // Construct tree with selected method
        if (method === 'slim') {
            return _getObjectTree_slim(rootObj, knotTypes, leafTypes);
        }
        if (method === 'bulk'){
            return _getObjectTree_bulk(rootObj, knotTypes, leafTypes);
        }
        let message = 
            "Unknown method for constructing object tree: " + method + 
            " in function '_getObjectTree'.";
        pqfLib.utils.misc.log(
            1, "error", "19DAEE45A1444D399A14CAF01CC6B633", message);
    }

    /**
     * Flattens object tree from top-down, starting with the root object, its
     * leaves, and its subTrees (iteratively).
     * 
     * @param {Object} objectTree - The object tree.
     * @returns {Array} - The flattened object tree.
     * @example
     * let flatTree = pqfDataCollectorLib.tools.flattenObjectTree(objectTree);
     * flatTree;
     * // returns
     * [
     *   { ... }, // root object
     *   { ... }, // leaf object 1
     *   ...
     *   { ... }, // leaf object n
     *   { ... }, // subTree object 1
     *   { ... }, // subTree 1 leave 1
     *   ...
     *   { ... }, // subTree 1 leave m
     *   { ... }, // subTree object 2
     *   ...
     * ]
     * @alias .flattenObjectTree
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _flattenObjectTree(objectTree) { 
        if (!objectTree) { return null }
        // Initialize flat tree array with root object
        let flatTree = [_toEnum(objectTree)];
        // Append leaves
        objectTree.leaves.forEach(leaf => {
            flatTree.push(_toEnum(leaf));
        });
        // Append subTrees
        objectTree.subTrees.forEach(subTree => {
            let flatSubTree = _flattenObjectTree(subTree);
            flatTree = flatSubTree ? flatTree.concat(flatSubTree) : flatTree;
        });
        return flatTree;
    }

    function _getWorkItmesWithTreeInfo(objInfo) {
        // Apply default values
        let objId = null;
        let objType = null;
        if (typeof objInfo === 'object') {
            objId = objInfo.id;
            objType = objInfo.type;
        } else {
            objId = objInfo;
            objType = 'Project';
        }
        // Load workitems of active scenario
        let scenarioId = null;
        if (objType === 'Project') {
            let scenario = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getProjectActiveScenario, objId);
            if (!scenario) { return null };
            scenarioId = scenario.id;
        } else if (objType === 'Scenario') {
            scenarioId = objId;
        } else {
            let message =
                "Unknown object type for workitem tree: " + objType +
                " in function '_getWorkItmesWithTreeInfo'.";
            pqfLib.utils.misc.log(
                1, "error", "6F1A1CB321A744B4AE0678B51CF6F426", message);
            return null;
        }
        let workItems = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getScenarioWorkItems, scenarioId, true);
        if (!workItems) { return null };
        // Construct Gantt tree
        return _constructGanttTree(workItems);
    }

    /**
     * Loads a list of all projects of the specified portfolio.
     * 
     * @param {string} portfolioId - The ID of the portfolio.
     * @param {boolean} [includeSubportfolios=true] - If true, projects of
     *   subportfolios are included in the list.
     * @returns {Array} - A list of all projects of the specified portfolio.
     * @example
     * let projectList = pqfDataCollectorLib.tools.getProjectList(portfolioId);
     * projectList;
     * // returns
     * [
     *   { ... }, // project object
     *   ...
     * ]
     * @alias .getProjectList
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getProjectList(portfolioId, includeSubportfolios) { 
        // Apply default values
        if (includeSubportfolios === undefined) { includeSubportfolios = true };
        // Load projects of the portfolio
        let projects = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectPortfolioProjects, portfolioId);
        if (!projects) { return null; };
        // If required, load projects of subportfolios
        if (includeSubportfolios) {
            function _getProjectsInSubportfolios(portfolioId) {
                let projects_subPfs = [];
                // Load subportfolios of the portfolio
                let subPfs = pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectPortfolioSubPortfolios, 
                    portfolioId);
                if (!subPfs) { return null };
                // Itterate thourgh all subportfolios
                for (let subPf of subPfs) {
                    // Append projects of the subportfolio
                    let projects_subPf = pqfLib.utils.apiFunc.exec(
                        Pqf.pm, Pqf.pm.getProjectPortfolioProjects, 
                        subPf.id);
                    if (!projects_subPf) { return null };
                    projects_subPfs = projects_subPfs.concat(projects_subPf);
                    // Append projects of subportfolios of the subportfolio
                    projects_subPfs = projects_subPfs.concat(
                        _getProjectsInSubportfolios(subPf.id, projects_subPfs));
                }
                return projects_subPfs;
            }
            // Load projects of subportfolios
            projects = projects.concat(
                _getProjectsInSubportfolios(portfolioId, projects));
        }
        return projects;
    }

    /**
     * Loads information about the current user.
     * 
     * @returns {Object} - An object containing the name and email of the
     *   current user.
     * @example
     * let currentUser = pqfDataCollectorLib.tools.getCurrentUser();
     * currentUser;
     * // returns
     * {
     *   "name": "Max Mustermann",
     *   "email": "max.musterman@pqforce.com"
     * }
     * @alias .getCurrentUser
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getCurrentUser() { 
        // Get the current user
        var currentUser = pqfLib.utils.apiFunc.exec(Pqf.acm, Pqf.acm.getCurrentUser);
        if (!currentUser) { return null; }
        let user = {
            'name': currentUser.resource ? 
                currentUser.resource.name : currentUser.name,
            'email': currentUser.email
        }
        return user;
    }

    /**
     * Gets the current timestamp in the specified format.
     * 
     * @param {string} [dateFormat='DD.MM.YYYY'] - The format of the date.
     * @param {string} [timeFormat='HH:mm:ss'] - The format of the time.
     * @returns {Object} - An object containing the current date and time.
     * @example
     * let timestamp = pqfDataCollectorLib.tools.getTimestamp();
     * timestamp;
     * // returns
     * {
     *   "date": "01.01.2021",
     *   "time": "12:00:00"
     * }
     * @alias .getTimestamp
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getTimestamp(dateFormat, timeFormat) { 
        // Apply default values
        if (!dateFormat) { dateFormat = "DD.MM.YYYY" };
        if (!timeFormat) { timeFormat = "HH:mm:ss" };
        return {
            'date': moment().format(dateFormat),
            'time': moment().format(timeFormat)
        }
    }

    /**
     * Creates a hash of the given JSON object. Most parts of the code is copied
     * from here: https://github.com/bryc .
     * 
     * @param {Object} jsonObject - The JSON object.
     * @param {Number} [seed=0] - The seed for the hash function.
     * @returns {Number} - The hash of the configuration object.
     * @example
     * let hash = pqfDataCollectorLib.tools.createHash(jsonObject);
     * hash;
     * // returns
     * 1234567890
     * @alias .createHash
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _createHash(jsonObject, seed) { 
        if (seed === undefined) {
            seed = 0;
        }
        // Create string from the configuration object
        let configString = JSON.stringify(jsonObject);
        // Copied from https://github.com/bryc
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for(let i = 0, ch; i < configString.length; i++) {
            ch = configString.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

    /**
     * Map a currency ID to the currency code.
     * 
     * @param {String} currencyId - The ID of the currency.
     * @returns {String} - The code of the currency.
     * @example
     * let currencyCode = pqfDataCollectorLib.tools.mapCurrency(currencyId);
     * currencyCode;
     * // returns
     * "EUR"
     * @alias .mapCurrency
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _mapCurrency(currencyId) { 
        if (!currencyId) { return null; }
        let currency = pqfLib.utils.apiFunc.exec(Pqf.fco, Pqf.fco.getCurrency, currencyId);
        return currency ? currency.code : null;
    }

    /**
     * 
	 * @param {string|Object} docInfo - Name of the document created, or an 
     *   object with name and description
	 * @param {Object} pqfObject - Object that the report will be linked to as 
     *   a document
     * @param {Object} pqfObject.type - Type of the object.
     * @param {string} pqfObject.id - ID of the object.
     * @param {Object} jtfTable - The JTF table object including meta and data.
	 * @param {string} [folderId=null] - ID of the folder into which the report 
     *   will be saved (null = root folder)
     * @param {Object} [jtfMeta=null] - Meta information about the JTF.
     * @param {string} [jtfMeta.type='JTFdataCollectorExport'] - Type of the
     *   JTF.
     * @param {string} [jtfMeta.id=_createHash(jtfTable)] - ID of the file.
     * @param {Object} [jtfMeta.code={"en": "JTF", "de": "JTF"}] - Code of the
     *   JTF.
     * @param {Object} [jtfMeta.name={...}] - Name of the JTF.
     * @param {Object} [jtfMeta.description={...}] - Description of the JTF.
     * @returns {Object} - The document link created.
     * @example
     * pqfObject = { type: 'Project', id: '74DC72CCC6A64961B15FE3D03DEC7A69' }
     * let jtfTable = pqfDataCollectorLib.jtf.getGantt('74DC72CCC6A64961B15FE3D03DEC7A69');
     * pqfDataCollectorLib.tools.saveJTF('Gantt Export', pqfObject, jtfTable);
     * @alias .saveJTF
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _saveJTF(docInfo, pqfObject, jtfTable, folderId, jtfMeta) {
        let now = moment();
		// Load / create document name and description
		let myDocName = null;
		let myDocDesc = null;
		if(typeof docInfo == "string") {
			myDocName = docInfo;
			myDocDesc = 
                "Am " + now.format("DD.MM.YYYY HH:mm:ss") + " mit JS generiert";
		} else if(typeof docInfo == "object") {
			myDocName = docInfo.name;
			myDocDesc = docInfo.description;
		} else {
			throw new Error("Argument 'docName' invalid.");
		}
        // Load object type and ID
		let myObjectType = null;
		let myObjectId = null;
		if(typeof pqfObject == "object" && pqfObject !== null) {
			myObjectType = pqfObject.type;
			myObjectId = pqfObject.id;
		} else {
			throw new Error("Argument 'pqfObject' invalid.");
		}
        // Load / create folder ID
		let myFolderId = null;
		if(folderId == null || (typeof folderId == "string")) {
			myFolderId = folderId;
		} else {
			throw new Error("Argument 'folderId' invalid.");
		}
        // Load / create file meta information
		let mimeType = "application/x.pqf.table.json";
        let type = "JTFdataCollectorExport";
        //let id = _createHash(jtfTable).toString();
        let uuids = pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1);
        let id = uuids ? uuids.newUuids[0] : null;
        let code = { "en": "JTF", "de": "JTF" };
        let name = { 
            "en": "JTF Export from " + now.format("DD.MM.YYYY HH:mm:ss"), 
            "de": "JTF Export vom " + now.format("DD.MM.YYYY HH:mm:ss")
        };
        let description = { 
            "en": "JTF export generated with the pqfDataCollectorLib.", 
            "de": "JTF export generiert mit der pqfDataCollectorLib." 
        };
        if (jtfMeta) {
            if (jtfMeta.type) {
                type = jtfMeta.type;
            }
            if (jtfMeta.id) {
                id = jtfMeta.id;
            }
            if (jtfMeta.code) {
                code = jtfMeta.code;
            }
            if (jtfMeta.name) {
                name = jtfMeta.name;
            }
            if (jtfMeta.description) {
                description = jtfMeta.description;
            }
        }
        // Create the JTF object
        let jtf = {
            'mimeType': mimeType,
            'type': type,
            'id': id,
            'code': code,
            'name': name,
            'description': description,
            'createdAt': now.toISOString(),
            'createdBy': _getCurrentUser() ? _getCurrentUser().name : null,
            'meta': jtfTable.meta,
            'data': jtfTable.data,
            'charts': jtfTable.charts
        }
        // If a file with the same name is already linked to this object, 
        // delete the link
        let docLinks = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getDocumentLinks, myObjectType, myObjectId, 
            folderId);
        if (docLinks && docLinks.length > 0) {
            for (let link of docLinks) {
                if (link.url) {
                    // Read name of the linked document
                    let urlParts = link.url.split("?");
                    let urlParamString = urlParts.length > 1 ? // para. string
                        urlParts[1] : null;
                    let urlParams = urlParamString ? // array of parameters
                        urlParamString.split("&") : null;
                    let docName_link = null; // name of linked document
                    if (urlParams) {
                        for (let param of urlParams) {
                            if (param.startsWith("name")) {
                                docName_link = param.substring(5);
                                break;
                            }
                        }
                    }
                    // Parse docName_link
                    if (docName_link) {
                        docName_link = docName_link.replace(/%20/g, " ");
                    }
                    // If the name of the linked document is the same as the
                    // name of the new document, delete the link
                    if (docName_link === myDocName) {
                        Pqf.pf.delDocumentLink(
                            myObjectType, myObjectId, link.id);
                    }
                }
            }
        }
        // Save the JTF object
        let attachmentLink = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.addAttachmentJsonAndLink, myObjectType, myObjectId, 
            mimeType, myDocName, null, myDocDesc, null, folderId, jtf);
		let docLink = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getDocumentLink, myObjectType, myObjectId,
            attachmentLink ? attachmentLink.id : null);
		return docLink;
    }

    /**
     * Simplifies a JTF table by converting all complex cell values to data 
     * types that can be interpreted by, for example, Excel.
     * 
     * @param {Object} jtfTable - The JTF table object including meta and data.
     * @param {string} [dateFormat='DD.MM.YYYY'] - The format of the date cells.
     * @returns {Object} - The simplified JTF table object.
     * @example
     * let jtfTable = pqfDataCollectorLib.jtf.getGantt('74DC72CCC6A64961B15FE3D03DEC7A69');
     * let simplifiedJTF = pqfDataCollectorLib.tools.simplifyJTF(jtfTable);
     * simplifiedJTF;
     * // returns
     * {
     *   "meta": {
     *     "categories": [...], // not changed
     *     "columns": [
     *       {
     *         "id": "id", // not changed
     *         "catid": "id", // not changed
     *         "type": "string", // string, number -> not changed; html, boolean, date, enum, multienum -> string; duration, money -> number
     *         "label": { ... }, // not changed
     *         "options": { ... }, // adapted to match new type
     *         "format": { ... } // adapted to match new type
     *       },
     *       ...
     *     ]
     *   },
     *   "data": [
     *     {
     *       "id": "id", // not changed
     *       "data": [
     *         "value1", // probably changed (as indicated in the column meta data)
     *         "value2", // "
     *         ...
     *       ]
     *     },
     *     ...
     *   ]
     * }
     * @alias .simplifyJTF
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _simplifyJTF(jtfTable, dateFormat) { 
        if (!jtfTable) { return null };
        // Apply default values
        if (!dateFormat) { dateFormat = "DD.MM.YYYY" };
        // Create simplified JTF table object
        let jtfTable_simplified = {
            'meta': {
                'options': jtfTable.meta.options,
                'categories': jtfTable.meta.categories,
                'columns': []
            },
            'data': []
        }
        // Adapt column meta data
        for (let column of jtfTable.meta.columns) {
            jtfTable_simplified.meta.columns.push(_simplifyMeta(column));
        }
        // Simplify data
        for (let row of jtfTable.data) {
            let row_simplified = {
                'id': row.id,
                'data': []
            };
            // Iterate through all cells of the row
            for (let i=0; i < jtfTable.meta.columns.length; i++) {
                row_simplified.data.push(
                    _simplifyValue(row.data[i], jtfTable.meta.columns[i], 
                        dateFormat
                    )
                );
            }
            jtfTable_simplified.data.push(row_simplified);
        }
        return jtfTable_simplified;
    }

    /**
     * Reduces a JTF table by removing all columns that are not included in the
     * given list of column IDs. Returns the reduced JTF table. If a column ID
     * is not found in the JTF table, a warning is logged and null is returned.
     * 
     * @param {Object} jtfTable - The JTF table object including meta and data.
     * @param {Array} columnIds - The IDs of the columns that should be included
     *   in the reduced JTF table.
     * @returns {Object} - The reduced JTF table object.
     * @example
     * let jtfTable = pqfDataCollectorLib.jtf.getGantt('74DC72CCC6A64961B15FE3D03DEC7A69');
     * let reducedJTF = pqfDataCollectorLib.tools.reduceJTF(jtfTable, ['columnIdA', 'columnIdB', ...]);
     * reducedJTF;
     * // returns
     * {
     *   "meta": {
     *     "categories": [...], // not changed
     *     "columns": [
     *       {
     *         "id": "columnIdA", // not changed
     *         ...
     *       },
     *       {
     *         "id": "columnIdB", // not changed
     *         ...
     *       },
     *       ...
     *     ]
     *   },
     *   "data": [
     *     {
     *       "id": "id1", // not changed
     *       "data": [
     *         "value1A", // not changed
     *         "value1B", // not changed
     *         ...
     *       ]
     *     },
     *     {
     *       "id": "id2", // not changed
     *       "data": [
     *         "value2A", // not changed
     *         "value2B", // not changed
     *         ...
     *       ]
     *     },
     *     ...
     *   ]
     * }
     * @alias .reduceJTF
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _reduceJTF2Columns(jtfTable, columnIds) {
        if (!jtfTable) { return null };
        // Check if any of the row IDs occur more than once
        if (jtfTable.data.some( (row, i, arr) => 
                arr.findIndex(obj => obj.id === row.id) !== i)) {
            let message = 
            "Faulty JTF table detected when calling function " + 
            "'reduceJTF2Columns'. Row IDs are not unique.";
            pqfLib.utils.misc.log(
                1, "error", "FE96612DB20D4E83BEC157F2B2015343", message);
            return null;
        }
        // Create "empty" JTF table
        let jtfTable_reduced = {
            'meta': {
                'categories': jtfTable.meta.categories,
                'columns': []
            },
            'data': []
        }
        // Iterate through all given column ids, add the corresponding columns
        // (meta and data!)
        for (let columnId of columnIds) {
            // Find the column index of the column with the given ID
            let columnIndex = jtfTable.meta.columns.findIndex(
                obj => obj.id === columnId);
            if (columnIndex === -1) {
                let message =
                    "Column with given ID " + columnId + " not found in " +
                    "JTF table when calling function 'reduceJTF2Columns'.";
                pqfLib.utils.misc.log(
                    1, "error", "DBCCE9D448BD4A7EBAD2668BC15B977E", message);
                return null;
            }
            jtfTable_reduced.meta.columns.push(
                jtfTable.meta.columns[columnIndex]);
            for (let row of jtfTable.data) {
                if (!jtfTable_reduced.data.find(obj => obj.id === row.id)) {
                    jtfTable_reduced.data.push({
                        'id': row.id,
                        'data': []
                    });
                }
                jtfTable_reduced.data.find(obj => obj.id === row.id).data.push(
                    row.data[columnIndex]
                );
            }
        }
        // Overwrite the meta and data attributes of the given jtfTable with the 
        // new values (keeps other attributes unchanged)
        jtfTable.meta = jtfTable_reduced.meta;
        jtfTable.data = jtfTable_reduced.data;
        return jtfTable;
    }

    function _restructureJTFColumns(jtfTable, columnIds) {
        if (!jtfTable) { return null };
        // Check if the given column IDs match the column IDs in the JTF table
        if (jtfTable.meta.columns.length !== columnIds.length ||
            jtfTable.meta.columns.some(col => 
                !columnIds.includes(col.id))
        ) {
            let message =
                "Column IDs do not match the column IDs in the JTF table " +
                "when calling function 'restructureJTFColumns'. To reduce " +
                "the JTF table, use the function 'reduceJTF2Columns'.";
            pqfLib.utils.misc.log(
                1, "error", "455707E3475C42F7826596D20D951997", message);
            return null;
        }
        // Create "empty" JTF table that will be filled with restructured values
        let jtfTable_restructured = {
            'meta': {
                'categories': jtfTable.meta.categories,
                'columns': []
            },
            'data': jtfTable.data.map(row => { 
                return {"id": row.id, "data": []} })
        };
        // Construct the mapping index for the new column order
        let newColumnIndices = [];
        jtfTable.meta.columns.forEach(col => {
            newColumnIndices.push(columnIds.findIndex(obj => obj === col.id));
        });
        // Iterate through all new column IDs and push the corresponding values
        newColumnIndices.forEach(newColInd => {
            jtfTable_restructured.meta.columns.push(
                jtfTable.meta.columns[newColInd]);
            jtfTable_restructured.data.forEach((row, i) => {
                row.data.push(jtfTable.data[i].data[newColInd]);
            });
        });
        // Overwrite the meta and data attributes of the given jtfTable with the
        // new values (keeps other attributes unchanged)
        jtfTable.meta = jtfTable_restructured.meta;
        jtfTable.data = jtfTable_restructured.data;
        return jtfTable;
    }

    /**
     * Simplifies a JTF table (IN-PLACE!) by converting all complex cell values 
     * of a specific column to data types that can be interpreted by, for 
     * example, MS Excel.
     * 
     * @param {Object} jtfTable - The JTF table object including meta and data.
     * @param {string} columnId - The ID of the column that should be 
     *   simplified.
     * @param {string} [dateFormat='DD.MM.YYYY'] - The format of the date cells.
     * @alias .simplifyJTFColumn
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _simplifyJTFColumn(jtfTable, columnId, dateFormat) { 
        if (!jtfTable) { return null };
        // Apply default values
        if (!dateFormat) { dateFormat = "DD.MM.YYYY" };
        // Find column index
        let columnIndex = jtfTable.meta.columns.findIndex(
            obj => obj.id === columnId);
        if (columnIndex === -1) {
            let message = 
                "Column with ID " + columnId + " not found in JTF table " +
                "when calling function 'simplifyJTFColumn'.";
            pqfLib.utils.misc.log(
                1, "error", "182AFE47D0414AD386338C5968DA75BA", message);
            return null;
        }
        // Make a copy of the old column meta 
        let columnMeta_old = JSON.parse(JSON.stringify(
            jtfTable.meta.columns[columnIndex]
        ));
        // Simplify column meta
        jtfTable.meta.columns[columnIndex] = _simplifyMeta(columnMeta_old);
        // Simplify data
        for (let row of jtfTable.data) {
            row.data[columnIndex] = _simplifyValue(
                row.data[columnIndex], columnMeta_old, dateFormat);
        }
    }

    /**
     * Converts JTF data to a simple object with a 1D header and 2D body (i.e.,
     * a table).
     * 
     * @param {Object} jtfTable - The JTF table object including meta and data.
     * @param {string} [language='en'] - The language of the header.
     * @param {boolean} [considerGrouping=true] - If true, the table is grouped
     *   by the column that is defined in the JTF meta data.
     * @returns {Object} - The table object.
     * @example
     * let jtfTable = pqfDataCollectorLib.jtf.getGantt(projectId, null, null, null, true);
     * let table = pqfDataCollectorLib.tools.JTF2Table(jtfTable);
     * table;
     * // returns
     * {
     *   "tableHeader": ["columnLabel1", "columnLabel2", ...],
     *   "tableBody": [
     *     ["cell11", "cell12", ...],
     *     ...
     *   ]
     * }
     * @alias .JTF2Table
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _JTF2Table(jtfTable, language, considerGrouping) { 
        if (!jtfTable) { return null };
        // Apply default values
        if (!language) { language = 'en' };
        // Check if the table shall be grouped
        if (considerGrouping && 
            jtfTable.meta.options &&
            jtfTable.meta.options.groupBy && 
            jtfTable.meta.columns.some(col => 
                col.id === jtfTable.meta.options.groupBy.columnId)
        ) {
            return _JTF2Table_grouped(
                jtfTable, language, jtfTable.meta.options.groupBy.columnId);
        }
        // Else, create a simple table
        let table = {
            'tableHeader': [],
            'tableBody': []
        };
        // Create header
        for (let column of jtfTable.meta.columns) {
            table.tableHeader.push(
                column.label ? column.label[language] : null);
        }
        // Create body
        for (let row of jtfTable.data) {
            let bodyRow = [];
            for (let cell of row.data) {
                bodyRow.push(cell);
            }
            table.tableBody.push(bodyRow);
        }
        return table;
    }

    /**
     * Returns the keys of the parameters of a function.
     * 
     * @param {Function} func - The function.
     * @returns {Array} - The keys of the parameters.
     * @example
     * let paramKeys = pqfDataCollectorLib.tools.getParamKeys(pqfDataCollectorLib.getProjectSummary);
     * paramKeys;
     * // returns
     * ["prjId", "dataToExtract"]
     * @alias .getParamKeys
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getParamKeys(func) {
        let funcStr = func.toString();
        let paramStr = funcStr.substring(
            funcStr.indexOf("(") + 1, funcStr.indexOf(")"));
        let params = paramStr.split(",");
        // Get rid of leading spaces
        for (let i = 0; i < params.length; i++) {
            params[i] = params[i].trim();
        }
        return params;
    }

    /**
     * Returns the implemented item column ids for the given topic. These ids
     * can be used to specify which columns should be included in the export. 
     * They have to be specified in the parameter 'requiredItems'.
     * 
     * @param {string} topic - The topic for which the implemented item column
     *   ids should be returned.
     * @returns {Array} - The implemented item column ids.
     * @example
     * let implementedItems = pqfDataCollectorLib.tools.getImplementedItems('gantt');
     * implementedItems;
     * // returns
     * ["id", "name", "beg", ...]
     * @alias .getImplementedItems
     * @memberof module:pqfDataCollectorLib.tools
     */
    function _getImplementedItems(topic) {
        if (!implementedItems[topic]) { 
            let message = 
                "The function 'getImplementedItems' can not be used for the " +
                "topic " + topic + ".";
            pqfLib.utils.misc.log(
                1, "error", "E3855C9B86AB4B0BB3C1B254E8447FC6", message);
            return null;
        }
        return Object.values(implementedItems[topic]).flat();
    }

    // HELPERFUNCTIONS (NOT EXPORTED) ##########################################

    // GENERAL

    /**
     * Creates a new object with a subset of the properties of the given object.
     * The resulting object can then be interpreted by the client as an enum 
     * object (inlcuding, e.g., an icon reference and a color).
     * 
     * @param {Object} obj - The object to be converted.
     * @returns {Object} - The enum object.
     */
    function _toEnum(obj) { 
        return pqfLib.utils.misc.toEnum(obj);
    }

    /**
     * Converts an object with the attributes 'currency' and 'amount' to a 
     * money object.
     * @param {Object} obj - The object to be converted. Converts its attributes
     *   'currency' and 'amount' to 'currencyCode' and 'amount'.
     * @returns {Object} - The money object.
     */
    function _toMoney(obj) { 
        if (!obj) { return null; }
        return {
            'currencyCode': _mapCurrency(obj.currency),
            'amount': obj.amount
        }
    }

    /**
     * Maps the object short (i.e., its type and id) to an enum.
     * @param {Object} objShort - The object short containing the type and id.
     * @returns {Object} - The enum object.
     */
    function _mapObjectShort(objShort) { 
        if (!objShort) { return null };
        // Define the function map
        const execProps_explicit = {
            'Project': {
                'obj': Pqf.pm,
                'func': Pqf.pm.getProject,
                'params': [objShort.id]
            },
            'ProjectPortfolio': {
                'obj': Pqf.pm,
                'func': Pqf.pm.getProjectPortfolio,
                'params': [objShort.id]
            },
            'ProjectRisk': {

            },
            'Meeting': {
                'obj': Pqf.mtg,
                'func': Pqf.mtg.getMeeting,
                'params': [objShort.id]
            },
            'Phase': {
                'obj': Pqf.pm,
                'func': Pqf.pm.getWorkItem,
                'params': [objShort.id]
            },
            'Todo': {
                'obj': Pqf.pi,
                'func': Pqf.pi.getProjectItem,
                'params': ['Todo', objShort.id]
            },
            'ProjectRisk': {
                'obj': Pqf.rsk,
                'func': Pqf.rsk.getProjectRiskById,
                'params': [objShort.id]
            }
        };
        const execProps_generic = {
            'HRM_generic': {
                'obj': Pqf.res,
                'func': Pqf.res.getResource,
                'params': [objShort.id]
            },
            'ProjectReport_generic': {
                'obj': Pqf.pm,
                'func': Pqf.pm.getProjectReport,
                'params': [objShort.type, objShort.id]
            },
            'ProjectPortfolioReport_generic': {
                'obj': Pqf.pm,
                'func': Pqf.pm.getProjectPortfolioReport,
                'params': [objShort.type, objShort.id]
            }
        };
        // Check if the object type is known
        if (execProps_explicit[objShort.type]) {
            return _toEnum(pqfLib.utils.apiFunc.exec_arr(
                execProps_explicit[objShort.type].obj, 
                execProps_explicit[objShort.type].func, 
                execProps_explicit[objShort.type].params));
        } else {
            // Try to load the object with the generic function
            let obj = null;
            // Turn off notifications for this part
            DEBUG_old = DEBUG;
            DEBUG = false;
            Object.keys(execProps_generic).forEach(key => {
                if (obj) { return };
                obj = pqfLib.utils.apiFunc.exec_arr(
                    execProps_generic[key].obj, execProps_generic[key].func, 
                    execProps_generic[key].params);
            });
            DEBUG = DEBUG_old;
            // Print warning, if the object could not be loaded
            let message = 
                "The object of type " + objShort.type + " and ID " +
                objShort.id + " could not be loaded while calling function " +
                "'_mapObjectShort'.";
            pqfLib.utils.misc.log(
                (DEBUG && !obj) ? 1 : 0, "warn", 
                "AC989A5AC5284A5ABBFD36A9CC4FD2C3", message);
            return _toEnum(obj);
        }
    }

    /**
     * Checks if the given object type is a report.
     * 
     * @param {string} objType - The type of the object.
     * @returns {boolean} - True if the object is a report, false otherwise.
     */
    function _isReport(objType) { 
        let projectReportTypes = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectReportTypes);
        if (projectReportTypes && 
            projectReportTypes.find(type => type.id === objType)) {
            return true;
        }
        let projectPortfolioReportTypes = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectPortfolioReportTypes);
        if (projectPortfolioReportTypes &&
            projectPortfolioReportTypes.find(type => type.id === objType)) {
            return true;
        }
        return false;
    }

    /**
     * Checks if the given object type is a resource.
     * 
     * @param {string} objType - The type of the object.
     * @returns {boolean} - True if the object is a resource, false otherwise.
     */
    function _isResource(objType) { 
        let resourceTypes = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResourceTypes);
        if (resourceTypes && 
            resourceTypes.find(type => type.id === objType)) {
            return true;
        }
        return false;
    }

    /**
     * Get the identification information of an object.
     * 
     * @param {Object} obj - The object.
     * @returns {Object} - The identification information.
     */
    function _getIdentification(obj) {
        if (!obj) { return null };
        return {
            'type': {
                'label': { 'en': 'Type', 'de': 'Typ' },
                'value': obj.type,
                'type': 'string'
            },
            'code': {
                'label': { 'en': 'ID', 'de': 'ID' },
                'value': obj.code,
                'type': 'string'
            },
            'name': {
                'label': { 'en': 'Name', 'de': 'Name' },
                'value': _toEnum(obj),
                'type': 'enum'
            },
            'description': {
                'label': { 'en': 'Description', 'de': 'Beschreibung' },
                'value': obj.description,
                'type': 'html'
            },
            'createdAt': {
                'label': { 'en': 'Created at', 'de': 'Erstellt am' },
                'value': obj.createdAt,
                'type': 'date'
            },
            'createdBy': {
                'label': { 'en': 'Created by', 'de': 'Erstellt von' },
                'value': _toEnum(obj.createdBy),
                'type': 'enum'
            },
            'modifiedAt': {
                'label': { 'en': 'Modified at', 'de': 'Geändert am' },
                'value': obj.modifiedAt,
                'type': 'date'
            },
            'modifiedBy': {
                'label': { 'en': 'Modified by', 'de': 'Geändert von' },
                'value': _toEnum(obj.modifiedBy),
                'type': 'enum'
            },
            'validityStart': {
                'label': { 
                    'en': 'Validity start', 
                    'de': 'Gültigkeitsbeginn' 
                },
                'value': obj.validityStart,
                'type': 'date'
            },
            'validityEnd': {
                'label': { 'en': 'Validity end', 'de': 'Gültigkeitsende' },
                'value': moment(obj.validityEnd).subtract(1, "days"),
                'type': 'date'
            }
        }
    }

    /**
     * Generic function to construct a JTF object, including its meta and data 
     * parts. 
     * 
     * @param {string} topic - The topic of the JTF object. Supported topics are
     *   'gantt', 'risks', 'costpositions', and 'todos'.
     * @param {Array} requiredItems - The column ids that should be included in 
     *   the JTF object. This in particular includes the relation column ids for
     *   the topic 'todos'.
     * @param {string} currencyId - The ID of the currency that should be used.
     * @param {Array} data_raw - The raw data that should be included in the JTF
     *   object. Generally speaking, this is an array of PQFORCE objects (like 
     *   workitems, risks, etc.).
     * @param {boolean} simplify - If true, the data is simplified.
     * @param {Array} params - Additional parameters that are required for the
     *   construction of the JTF object. They need to be specified in a key
     *   - value pair format.
     * @returns {Object} - The JTF object.
     */
    function _constructJTFObj( 
        topic, requiredItems, currencyId, data_raw, simplify, 
        ...params) {
        // Check if topic can be handled
        if (!_checkJTFTopic(topic)) { return null; }
        // Handle required items being set to 'all'
        requiredItems = requiredItems === 'all' ? 
            _getImplementedItems(topic) : requiredItems;
        // Some of the functions require a "modification" parameter (boolean) 
        // to efficiently handle the required items
        let modRequired = false;
        switch (topic) {
            case 'gantt':
                for (let item of requiredItems) {
                    if (item.startsWith('time') || item.startsWith('costs') || 
                        item === 'progress') {
                            modRequired = true;
                        break;
                    }
                }
                break;
            case 'risks':
                const itemWithClassification = [
                    'opClass', 'opLimit', 'eolClass', 'eolLimit', 'rrClass', 
                    'rrLimit'
                ];
                modRequired = requiredItems.some(
                    item => itemWithClassification.includes(item));
                break;
            case 'costpositions':
            case 'todos':
                break;
            default:
                let message = 
                    "The topic " + topic + " can not be handled by the " +
                    "function '_constructJTFObj'.";
                pqfLib.utils.misc.log(
                    1, "error", "46F8192D03C14688A0F9D007BBC441CE", message);
                return null;
        }
        // Function to read params
        function _getValue(key) {
            let valObj = params.find(par => par.key == key);
            return valObj ? valObj.value : null;
        };
        // Define execution properties
        let currency = _mapCurrency(currencyId);
        const execProps = {
            'gantt': {
                '_getColumnMeta': _getGanttColumnMeta,
                '_getData': _getTaskData,
                'constructJTF_params': [currency],
                'getData_params': [modRequired, _getValue('prjId'), currencyId]
            },
            'risks': {
                '_getColumnMeta': _getRiskColumnMeta,
                '_getData': _getRiskData,
                'constructJTF_params': [currency],
                'getData_params': [modRequired]
            },
            'costpositions': {
                '_getColumnMeta': _getCPColumnMeta,
                '_getData': _getCPData,
                'constructJTF_params': [],
                'getData_params': []
            },
            'todos': {
                '_getColumnMeta': _getTodoColumnMeta,
                '_getData': _getTodoData,
                'constructJTF_params': [_getValue('relTypes_todo')],
                'getData_params': []
            }
        };
        // Handle case of empty data
        let prop_example = data_raw[0] ? data_raw[0].properties : [];
        // Construct JTF object without data
        let jtfObj = _constructJTFObj_woData(
            topic, supportedCategories[topic], implementedItems[topic].basic, 
            requiredItems, prop_example, execProps[topic]._getColumnMeta, 
            execProps[topic].constructJTF_params);
        // Push data to JTF object
        jtfObj = _pushJTFData(
            jtfObj, data_raw, execProps[topic]._getData, 
            execProps[topic].getData_params, simplify);
        return jtfObj;
    }

    /**
     * Constructs a JTF object without data (i.e., a skeleton with meta data).
     * 
     * @param {string} topic - The topic of the JTF object. Supported topics are
     *   'gantt', 'risks', 'costpositions', and 'todos'.
     * @param {Array} categories - The categories of the JTF object with their
     *   IDs and labels (excluding the default category).
     * @param {Array} defaultItems - The default items that should be included
     *   in the JTF object. They are always included in the default category.
     * @param {Array} requiredItems - The items that should be included in the
     *   JTF object. They are distributed over the other categories. For topics
     *   with a generic category, the items must already be specified (i.e., 
     *   should not be 'all') and the generic category must be included in the
     *   categories array with the appendix '_generic'. Furthermore, the 
     *   generic times must have appropriate prefixes (e.g., 'rel_' for 
     *   relations).
     * @param {Object} prop_example - An array that contains the properties of 
     *   an example object. It is used to determine the data type of the
     *   properties column.
     * @param {Function} _getColumnMeta - The function to get the column meta
     *   data for a specific topic.
     * @param {Array} params - Additional parameters that are required by the 
     *   _getColumnMeta function.
     * @returns {Object} - The JTF object without data.
     */
    function _constructJTFObj_woData( 
        topic, categories, defaultItems, requiredItems, 
        prop_example, _getColumnMeta, params) {
        // Check if topic can be handled
        if (!_checkJTFTopic(topic)) { return null; }
        // Handle required items being set to 'all'
        requiredItems = requiredItems === 'all' ? 
            _getImplementedItems(topic) : requiredItems;
        // Delete default items from required items
        requiredItems = requiredItems.filter(
            item => !defaultItems.includes(item));
        // Construct object if all items per category
        let itemsByCategory = {
            'default': defaultItems
        };
        // Add categories
        categories.forEach( catObj => { itemsByCategory[catObj.id] = []; });
        // Push items to categories (or drop them if they are unknown)
        requiredItems.forEach(item => {
            let catObj = categories.find(catObj => {
                // Normal case
                if (implementedItems[topic][catObj.id] &&
                    implementedItems[topic][catObj.id].includes(item)) {
                    return catObj;
                } 
                // Handle generic cases
                else if (implementedItems[topic][catObj.id + '_generic']) {
                    switch (catObj.id) {
                        case 'relations': 
                            if (item.startsWith('rel_')) { return catObj; }
                            else { return null };
                        default:
                            let message =
                                "Category " + catObj.id + " is marked as " +
                                "_generic but can not (yet) be handled by " +
                                "function '_constructJTFObj_woData'.";
                            pqfLib.utils.misc.log(
                                1, "error", "3BD456EBF8614070852B2772417B18DC",
                                message);
                    }
                }
            });
            if (catObj) { itemsByCategory[catObj.id].push(item) }
            else { 
                let message = 
                    "Item " + item + " not found in any category while " +
                    "calling function '_constructJTFObj_woData'.";
                pqfLib.utils.misc.log(
                    debug_level, "warn", "F5A2CACB4C0E4C9894710877DBFFC311", message);
            }
        });
        // Construct JTF meta object
        let jtfObj = _constructJTFSkeleton();
        categories.forEach(cat => {
            if (itemsByCategory[cat.id].length > 0) {
                jtfObj.meta.categories.push(cat);
            }
        });
        // Add columns to JTF meta object
        jtfObj.meta.columns = _constructJTFColumnsMeta(
            itemsByCategory, _getColumnMeta, prop_example, params);
        return jtfObj;
    }

    /**
     * Checks if the given topic can be handled by the function set constructing
     * JTFs.
     * 
     * @param {string} topic - The topic of the JTF object. Supported topics are
     *   'gantt', 'risks', 'costpositions', and 'todos'.
     * @returns {boolean} - True if the topic can be handled, false otherwise.
     */
    function _checkJTFTopic(topic) { 
        if (!implementedItems[topic] || !supportedCategories[topic]) {
            let message = 
                "The topic " + topic + " can not be handled by the " +
                "function set constructing JTFs.";
            pqfLib.utils.misc.log(
                1, "error", "5BA216E2EC014E37B7E0BEE2DC0D0502", message);
            return false;
        }
        return true;
    }

    /**
     * Constructs a JTF skeleton object. 
     * 
     * @returns {Object} - The JTF skeleton object.
     */
    function _constructJTFSkeleton() { 
        return {
            'meta': {
                'categories': [
                    {
                        'id': 'default',
                        'label': { 'en': null, 'de': null }
                    }
                ],
                'columns': []
            },
            'data': []
        };
    }

    /**
     * Pushes data to a JTF object.
     * 
     * @param {Object} jtfObj - The JTF object including the meta information.
     * @param {Array} data_raw - The raw data that should be included in the JTF
     *   object. Generally speaking, this is an array of PQFORCE objects (like
     *   workitems, risks, etc.).
     * @param {Function} _getData - The function to get the data for a specific
     *   topic.
     * @param {Array} params - Additional parameters that are required by the
     *   _getData function.
     * @param {boolean} simplify - If true, the data is simplified.
     */
    function _pushJTFData( 
        jtfObj, data_raw, _getData, params, simplify) {
        // Push data to JTF object
        data_raw.forEach(data => {
            // Construct parameters for this data element
            let params_data = 
                [data, jtfObj.meta.columns.map(col => col.id)].concat(params);
            let row = {
                'id': data.id,
                'data': _getData.apply(null, params_data)
            }
            jtfObj.data.push(row);
        });
        // Flatten JTF object if required
        if (jtfObj.meta.columns.map(col => col.id).includes('properties')) {
            jtfObj = _flattenJTF(jtfObj);
        }
        // Simplify JTF object if required
        if (simplify) {
            jtfObj = _simplifyJTF(jtfObj);
        }
        return jtfObj;
    }

    /**
     * Constructs the columns meta data for a JTF table.
     * 
     * @param {Array} itemsByCategory - The items grouped by category.
     * @param {Function} _getColumnMeta - The function to get the column meta
     *   data for a specific topic.
     * @param {Array} [properties=null] - The properties of the objects. Only 
     *   needed it 'properties' is included in the itemsByCategory.
     * @param {Array} params - Additional parameters that are required by the 
     *   _getColumnMeta function.
     * @returns {Array} - The columns meta data for the JTF table.
     */
    function _constructJTFColumnsMeta( 
        itemsByCategory, _getColumnMeta, properties, params) {
        let columns = [];
        for (let category in itemsByCategory) {
            for (let item of itemsByCategory[category]) {
                let columnMeta = null;
                if (item === 'properties') {
                    // Construct placeholder for properties
                    let placeholder = { 
                        'id': 'properties',
                        'properties_columnsMeta': 
                        _constructPropertiesColumnsMeta(properties)
                    };
                    // Adapt catid
                    placeholder.properties_columnsMeta.forEach(obj => {
                        obj.catid = category;
                    });
                    columns.push(placeholder); // placeholder
                } else {
                    columnMeta = _getColumnMeta.apply(
                        null, [item].concat(params));
                    if (!columnMeta) {
                        let message =
                            "Could not load meta info for item " + item + 
                            " while calling function " +
                            "'_constructJTFColumnsMeta'.";
                        pqfLib.utils.misc.log(
                            1, "error", "9216B8C632624F61886D0077A0787C9C",
                            message);
                        continue;
                    }
                    columns.push({
                        'id': item,
                        'catid': category,
                        'type': columnMeta.type,
                        'label': columnMeta.label,
                        'options': columnMeta.options,
                        'format': columnMeta.format
                    });
                }
            }
        }
        return columns;
    }

    /**
     * For JTFs where a generic amount of properties have been loaded, these
     * properties are now "flattened" into the JTF data object.
     * 
     * @param {Object} jtfTable - The JTF table object including meta and data.
     * @returns {Object} - The flattened JTF table object.
     */
    function _flattenJTF(jtfTable) { 
        if (!jtfTable) { return null; }
        // Check if the JTF table has a 'properties' placeholder
        let propertiesIndex = jtfTable.meta.columns.findIndex(
            obj => obj.id === 'properties');
        if (propertiesIndex === -1) {
            let message = 
                "JTF table does not contain a 'properties' column so there " +
                "is no need to flatten it.";
            pqfLib.utils.misc.log(
                debug_level, "log", "29022194D71E4369A128BC8E15DB43D0", message);
            return jtfTable;
        }
        // Adapt meta data
        let newColumnsMeta = [];
        for (let column of jtfTable.meta.columns) {
            if (column.id === 'properties') {
                for (let propertiesColumnMeta of 
                    column.properties_columnsMeta) {
                    newColumnsMeta.push(propertiesColumnMeta);
                }
            } else {
                newColumnsMeta.push(column);
            }
        }
        jtfTable.meta.columns = newColumnsMeta;
        // Adapt data
        for (let row of jtfTable.data) {
            let propertiesData = row.data[propertiesIndex].properties_data;
            let newRow = row.data.slice(0, propertiesIndex);
            if (propertiesData) {
                for (let propertyData of propertiesData) {
                    newRow.push(propertyData);
                }
            }
            newRow = newRow.concat(row.data.slice(propertiesIndex + 1));
            row.data = newRow;
        }
        return jtfTable;
    }

    /**
     * Simplifies meta information of a data cell (e.g., column header, ...).
     * 
     * @param {Object} meta - The meta information of the data cell. Must, at 
     *   least, contain the type (indicated by key 'type').
     * @returns {Object} - The simplified meta information of the data cell.
     */
    function _simplifyMeta(meta) { 
        // id, catid, and options are kept
        let meta_simplified = {};
        if (typeof meta.id != 'undefined') {
            meta_simplified.id = meta.id;
        }
        if (typeof meta.catid != 'undefined') {
            meta_simplified.catid = meta.catid;
        }
        if (typeof meta.options != 'undefined') {
            meta_simplified.options = meta.options;
        }
        // type, label, and format are simplified
        switch (meta.type) {
            // keep type and label, drop format
            case 'string':
                meta_simplified.type = meta.type; 
                if (typeof meta.label != 'undefined') {
                    meta_simplified.label = meta.label;
                }
                break;
            // keep type, add unit to label, keep format.digits
            case 'number':
                meta_simplified.type = meta.type;
                if (typeof meta.label != 'undefined') {
                    meta_simplified.label = {};
                    // If unit is specified, add it to label
                    if (meta.format && meta.format.unit) {
                        for (let language of Object.keys(meta.label)) {
                            meta_simplified.label[language] = 
                                meta.label[language] + 
                                ' (' + meta.format.unit + ')';
                        }
                    } else {
                        meta_simplified.label = meta.label;
                    }
                }
                if (typeof meta.format != 'undefined') {
                    meta_simplified.format = {};
                    if (typeof meta.format.digits != 'undefined') {
                        meta_simplified.format.digits = meta.format.digits;
                    }
                }
                break;
            // to string, keep label, drop format
            case 'html': 
            case "boolean":
            case "date":
            case "enum":
            case 'multienum':
            case "attachment":
                meta_simplified.type = 'string';
                if (typeof meta.label != 'undefined') {
                    meta_simplified.label = meta.label;
                }
                break;
            // to number, add unit to label, keep format.digits
            case "duration":
                meta_simplified.type = 'number';
                if (typeof meta.label != 'undefined') {
                    meta_simplified.label = {};
                    // Get unit
                    let unit = null;
                    if (meta.format && meta.format.unit) {
                        switch (meta.format.unit) {
                            case "hour":
                                unit = "h";
                                break;
                            case "day":
                                unit = "d";
                                break;
                            case "week":
                                unit = "w";
                                break;
                            case "month":
                                unit = "m";
                                break;
                            default:
                                let message = 
                                    "Simplification of JTF duration unit " +
                                    meta.format.unit + " can not (yet) be " +
                                    "handled by function '_simplifyMeta'.";
                                pqfLib.utils.misc.log(
                                    1, "error", 
                                    "80A6DC6F491341349B1B5F69C1D5781D",
                                    message);
                        }
                    }
                    // Default unit is 'h'
                    else { unit = "h" }
                    // If unit is specified, add it to label, drop format
                    if (unit) {
                        for (let language of Object.keys(meta.label)) {
                            meta_simplified.label[language] = 
                                meta.label[language] + ' (' + unit + ')';
                        }
                    } else {
                        meta_simplified.label = meta.label;
                    }
                }
                if (typeof meta.format != 'undefined') {
                    meta_simplified.format = {};
                    if (typeof meta.format.digits != 'undefined') {
                        meta_simplified.format.digits = meta.format.digits;
                    }
                }
                break;
            // to number, add currency to label, keep format.digits
            case "money":
                meta_simplified.type = 'number';
                if (typeof meta.label != 'undefined') {
                    meta_simplified.label = {};
                    // If currency is specified, add it to label
                    if (meta.format && meta.format.currencyCode) {
                        for (let language of Object.keys(meta.label)) {
                            meta_simplified.label[language] = 
                                meta.label[language] +
                                ' (' + meta.format.currencyCode + ')';
                        }
                    } else {
                        meta_simplified.label = meta.label;
                    }
                }
                if (typeof meta.format != 'undefined') {
                    meta_simplified.format = {};
                    if (typeof meta.format.digits != 'undefined') {
                        meta_simplified.format.digits = meta.format.digits;
                    }
                }
                break;
            case "jtf":
                meta_simplified.type = 'table';
                if (typeof meta.label != 'undefined') {
                    meta_simplified.label = meta.label;
                }
                break;
            default:
                let message = 
                    "Simplification of JTF column type " + meta.type +
                    " can not (yet) be handled by function '_simplifyMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "34C8B8D827274F0493CF199402D9F78B",
                    message);
        }
        return meta_simplified;
    }

    /**
     * Simplifies the value of a data cell (e.g., cell of row, ...).
     * 
     * @param {any} value - The value of the data cell.
     * @param {Object} meta_old - The initial (i.e., old) meta information of 
     *   the data cell.
     * @param {string} [dateFormat] - The format of the date cells.
     * @returns {any} - The simplified value of the data cell.
     */
    function _simplifyValue(value, meta_old, dateFormat) { 
        // Convert value to simplified value
        let value_simplified = null;
        switch (meta_old.type) {
            // keep
            case 'string':
                value_simplified = value;
                break;
            // Convert to number, round to format.digits
            case 'number':
                if (typeof meta_old.format != 'undefined' && 
                    meta_old.format.digits) {
                    value_simplified = _round(value, meta_old.format.digits);
                } else {
                    value_simplified = _round(value, 2);
                }
                break;
            case 'duration':
                if (value) {
                    if (typeof meta_old.format != 'undefined' &&
                        meta_old.format.unit) {
                        switch (meta_old.format.unit) {
                            case "hour":
                                value_simplified = 
                                    moment.duration(value, 'hours').asHours();
                                break;
                            case "day":
                                value_simplified = 
                                    moment.duration(value, 'days').asDays();
                                break;
                            case "week":
                                value_simplified = 
                                    moment.duration(value, 'weeks').asWeeks();
                                break;
                            case "month":
                                value_simplified = 
                                    moment.duration(value, 'months').asMonths();
                                break;
                            default:
                                let message =
                                    "Simplification of JTF duration unit " +
                                    meta_old.format.unit + " can not (yet) " +
                                    "be handled by function '_simplifyValue'.";
                                pqfLib.utils.misc.log(
                                    1, "error", 
                                    "C3E886006C3649518A8E535B8E50FE0E",
                                    message);
                        }
                    } 
                    // Default unit is 'hour'
                    else {
                        value_simplified = 
                            moment.duration(value, 'hours').asHours();
                    }
                }
                if (typeof meta_old.format != 'undefined' && 
                    meta_old.format.digits) {
                    value_simplified = _round(value_simplified, 
                        meta_old.format.digits);
                } else {
                    value_simplified = _round(value_simplified, 2);
                } 
                break;
            case 'money':
                if (typeof meta_old.format != 'undefined' && 
                    meta_old.format.digits) {
                    value_simplified = _round(
                        value ? value.amount : null, meta_old.format.digits);
                } else {
                    value_simplified = _round(value ? value.amount : null, 2);
                }
                break;
            // Convert to string
            case 'html': 
                value_simplified = Html.decode(value);
                break;
            case 'boolean':
                value_simplified = value ? 'true' : 'false';
                break;
            case 'date':
                value_simplified = value ? 
                    moment(value).format(dateFormat) : null;
                break;
            case 'enum':
                value_simplified = value ? value.name : null;
                break;
            case 'multienum':
                if (value) {
                    value_simplified = '';
                    for (let item of value) {
                        value_simplified += item.name + ', ';
                    }
                    if (value_simplified.length > 0) {
                        value_simplified = value_simplified.slice(0, -2);
                    }
                }
                break;
            case 'jtf':
                // Simply return JTF
				if (value) {
					value_simplified = _JTF2Table(_simplifyJTF(value));
				}
                break;
            case 'attachment':
                value_simplified = value ? value.hash : null;
                break;
            default:
                let message = 
                    "Simplification of JTF cell type " + meta_old.type +
                    " can not (yet) be handled by function '_simplifyValue'.";
                pqfLib.utils.misc.log(
                    1, "error", "636DEBFF4E27433BB4D7626C39925A64", message);
        }
        return value_simplified;
    }

    /**
     * Converts a JTF object to a simple table object with a header and a body.
     * Furthermore, the table rows are grouped by a specified column (similar
     * to the client).
     * 
     * @param {Object} jtfTable - The JTF table object including meta and data.
     * @param {string} [language] - The language in which the table should be
     *  displayed. If not specified, the default language is used.
     * @param {string} byColId - The ID of the column by which the rows should
     * be grouped.
     * @returns {Object} - The simple table object.
     */
    function _JTF2Table_grouped(jtfTable, language, byColId) {
        // Apply default language
        language = language ? language : 'en';
        // Check if JTF table is valid
        if (!jtfTable) { return null; }
        // Create grouped table
        let table = {
            'tableHeader': [],
            'tableBody': []
        };
        // Find the index of the group column
        let groupColInd = jtfTable.meta.columns.findIndex(
            column => column.id === byColId);
        // Find index of first unhidden column (used as column index to write 
        // group name)
        let firstUnhiddenColInd = jtfTable.meta.columns.findIndex(
            column => !column.options || !column.options.hidden);
        if (firstUnhiddenColInd > groupColInd) {
            firstUnhiddenColInd -= 1;
        }
        if (firstUnhiddenColInd === -1) {
            let message =
                "No unhidden column found in JTF table while converting it " +
                "to a grouped table in function '_JTF2Table_grouped'.";
            pqfLib.utils.misc.log(
                debug_level, "log", "7F9BE4AD63044182A858BB3AAD0814AC", message);
            return table;
        }
        // Create header
        jtfTable.meta.columns.forEach(column => {
            if (column.id !== byColId) {
                table.tableHeader.push(
                    column.label ? column.label[language] : null);
            }
        });
        // Group rows
        let colsPerGroup = {};
        jtfTable.data.forEach(row => {
            // Check if the group already exists
            if (!colsPerGroup[row.data[groupColInd]]) {
                colsPerGroup[row.data[groupColInd]] = [];
            }
            // Add row ID to group
            colsPerGroup[row.data[groupColInd]].push(row.id);
        });
        // Determine the indices of the columns whose values should be summed
        let sumColsInd = [];
        jtfTable.meta.columns.forEach((column, index) => {
            if (column.type === 'number' && (
                    !column.options || !column.options.aggregation ||
                    column.options.aggregation === 'sum')
            ) {
                sumColsInd.push({
                    'jtfIndex': index,
                    'tableIndex': index > groupColInd ? index-1 : index
                });
            }
        });
        if (sumColsInd.map(obj => obj.jtfIndex).includes(groupColInd)) {
            sumColsInd.splice(sumColsInd.indexOf(groupColInd), 1);
        }
        if (sumColsInd.map(obj => obj.tableIndex).includes(0)) {
            let message =
                "Issue detected in function '_JTF2Table_grouped'." +
                "The first column can not be summed up when converting a " +
                "JTF table to a grouped table as this column is used for " +
                "grouping.";
            pqfLib.utils.misc.log(
                debug_level, "warn", "33F0C5B839494A6C891EEAB471DC21DD", message);
            sumColsInd.splice(
                sumColsInd.map(obj => obj.tableIndex).indexOf(0), 1);
        }
        // Create body
        Object.keys(colsPerGroup).forEach(group => {
            // Define a new row subset for this group
            let row_subset = [];
            // Push group header
            let row_header = new Array(table.tableHeader.length).fill(null);
            row_header[firstUnhiddenColInd] = group;
            row_subset.push(row_header);
            // Push rows while, if necessary, adding up values
            colsPerGroup[group].forEach(rowId => {
                let row = jtfTable.data.find(row => row.id === rowId);
                // Create date row
                let row_data = [];
                row.data.forEach((cell, index) => {
                    if (index !== groupColInd) {
                        row_data.push(cell);
                    }
                });
                row_subset.push(row_data);
                // Add up values if necessary
                sumColsInd.map(obj => obj.tableIndex).forEach(index => {
                    row_subset[0][index] = 
                        (row_subset[0][index] ? row_subset[0][index] : 0) + 
                        (row_data[index] ? row_data[index] : 0);
                });
            });
            // Push row subset to body
            table.tableBody = table.tableBody.concat(row_subset);
        });
        return table;
    }

    /**
     * Generic function to round a number to a specified number of decimals.
     * 
     * @param {Number} value - The number to be rounded. If null, the return 
     *   value is null too.
     * @param {Number} [decimals] - The number of decimals to round to. If 
     *   not specified, the number is not rounded.
     * @returns {Number} - The rounded number.
     */
    function _round(value, decimals) { 
        if (value === null) {
            return null;
        }
        if (!decimals) {
            return value;
        }
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    /**
     * Constructs / retreives the object tree of the given object by iteratively
     * loading the sub-objects of the object. So-far, only the HRM and PPM 
     * module objects are supported by this method.
     * 
     * @param {Object} rootObj - The information about the root object, i.e., 
     *   its ID and type.
     * @param {string} rootObj.id - The ID of the root object.
     * @param {string} rootObj.type - The type of the root object.
     * @param {Array} knotTypes - The types of objects that should be considered
     *   as knots. I.e., objects that potentially have sub-objects and should be
     *   included in the object tree.
     * @param {Array} leafTypes - The types of objects that should be considered
     *   as leaves. 
     * @returns {Object} - The object tree of the given object.
     */
    function _getObjectTree_slim(rootObj, knotTypes, leafTypes) { 
        let tree = {};
        // Find type-class
        let typeClass = _checkTypeClass(rootObj.type);
        if (typeClass) {
            // Load root object and its children
            let root = null;
            let root_children = null;
            if (typeClass === 'HRM') {
                root = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResource, rootObj.id);
                root_children = pqfLib.utils.apiFunc.exec(
                    Pqf.res, Pqf.res.getResourceChildren, rootObj.id);
                if (!root || !root_children) { return };
            } else if (typeClass === 'PPF') {
                root = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectPortfolio, rootObj.id);
                if (!root) { return };
                root_children = pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectPortfolioProjects, rootObj.id);
                if (!root_children) { return };
                root_children = root_children.concat(pqfLib.utils.apiFunc.exec(
                    Pqf.pm, Pqf.pm.getProjectPortfolioSubPortfolios, rootObj.id)
                );
                if (!root_children) { return };
            }
            // Create root enum object
            tree = _toEnum(root);
            tree.leaves = [];
            tree.subTrees = [];
            // Iterate over children
            for (let child of root_children) {
                // Check if its a leaf or a subtree
                if (leafTypes.includes(child.type)) {
                    tree.leaves.push(_toEnum(child));
                } else if (knotTypes.includes(child.type)) {
                    let childObj = {
                        'id': child.id,
                        'type': child.type
                    };
                    tree.subTrees.push(
                        _getObjectTree_slim(childObj, knotTypes, leafTypes)
                    );
                } 
            }
            return tree;
        }
        // fallback
        else {
            let message =
                "It is not (yet) possible to create an object tree with the " +
                "slim method (function '_getObjectTree_slim') for the object " +
                "type " + rootObj.type + ".";
            pqfLib.utils.misc.log(
                1, "error", "C16E5429F1CA47F3B52EDFD33F1D2C1E", message);
            return null;
        }
    }

    /**
     * Constructs / retreives the object tree of the given object by loading 
     * all data at once.
     * 
     * @param {Object} rootObj - The information about the root object, i.e., 
     *   its ID and type.
     * @param {string} rootObj.id - The ID of the root object.
     * @param {string} rootObj.type - The type of the root object.
     * @param {Array} knotTypes - The types of objects that should be considered
     *   as knots. I.e., objects that potentially have sub-objects and should be
     *   included in the object tree.
     * @param {Array} leafTypes - The types of objects that should be considered
     *   as leaves. 
     * @returns {Object} - The object tree of the given object.
     */
    function _getObjectTree_bulk(rootObj, knotTypes, leafTypes) { 
        let tree = {};
        // Find type-class
        let typeClass = _checkTypeClass(rootObj.type);
        // PPF not (yet) supported
        if (typeClass) {
            switch (typeClass) {
                case 'HRM':
                    // Load hierarchy data
                    let hierarchy = pqfLib.utils.apiFunc.exec(
                        Pqf.res, Pqf.res.getResourceHierarchy);
                    if (!hierarchy) { return };
                    // Grow tree
                    tree = _growTree_bulk_method1(
                        hierarchy, rootObj.id, knotTypes, leafTypes);
                    return tree;
                case 'PPF':
                    // Load data
                    let ppfs = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectPortfolios);
                    let prjs = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjects);
                    if (!ppfs || !prjs) { return };
                    // Grow tree
                    tree = _growTree_bulk_method2(
                        ppfs, prjs, rootObj.id);
                    return tree;
            }
        }
        // fallback
        else {
            let message = 
                "It is not (yet) possible to create an object tree with the " +
                "bulk method (function '_getObjectTree_bulk') for the object " +
                "type " + rootObj.type + ".";
            pqfLib.utils.misc.log(
                1, "error", "793342FD71504BE980D75D192D05846B", message);
            return null;
        }
    }

    /**
     * Recursively grows a tree from a given root object where the data is 
     * given in a bulk manner.
     * 
     * @param {Array} hierarchy - The needed data with hierarchy information.
     * @param {string} rootId - The ID of the (current) root object.
     * @param {Array} knotTypes - The types of objects that should be considered
     *   as knots. I.e., objects that potentially have sub-objects and should be
     *   included in the object tree.
     * @param {Array} leafTypes - The types of objects that should be considered
     *   as leaves.
     * @returns {Object} - The tree object. null if the method fails.
     */
    function _growTree_bulk_method1( 
        hierarchy, rootId, knotTypes, leafTypes) {
        // Find root object
        let root = hierarchy.find(obj => obj.id === rootId);
        // Create root enum object
        if (root) {
            let tree = _toEnum(root);
            tree.leaves = [];
            tree.subTrees = [];
            // Find children
            let children = hierarchy.filter(
                obj => obj.ancestors.find(ancestor => ancestor.id === rootId));
            // Sort children
            let knots = children.filter(obj => knotTypes.includes(obj.type));
            let leaves = children.filter(obj => leafTypes.includes(obj.type));
            // Iterate over children
            for (let knot of knots) {
                tree.subTrees.push(
                    _growTree_bulk_method1(
                        hierarchy, knot.id, knotTypes, leafTypes)
                );
            }
            for (let leaf of leaves) {
                tree.leaves.push(_toEnum(leaf));
            }
            return tree;
        }
        let message =
            "Could not find object with the ID " + rootId + " in the " +
            "resource hierarchy while calling function " +
            "'_growTree_bulk_method1'.";
        pqfLib.utils.misc.log(
            1, "error", "C3D782CE3861453EB8AE358D5FBFCFD2", message);
        return null;
    }

    function _growTree_bulk_method2(
        ppfs, prjs, rootId) {
        // Find root object
        let root = ppfs.find(obj => obj.id === rootId);
        if (root) {
            let tree = _toEnum(root);
            tree.leaves = [];
            tree.subTrees = [];
            // Find children
            let leaves = prjs.filter(obj => 
                obj.portfolios.map(ppf => ppf.id).includes(rootId));
            let knots = ppfs.filter(obj => obj.parentPortfolioId === rootId);
            // Iterate over children
            for (let knot of knots) {
                tree.subTrees.push(
                    _growTree_bulk_method2(ppfs, prjs, knot.id)
                );
            }
            for (let leaf of leaves) {
                tree.leaves.push(_toEnum(leaf));
            }
            return tree;
        }
    }

    /**
     * Returns type class of the given object type (if valid, i.e., known). 
     * Known object types are HRM objects and Project Portfolio objects.
     * 
     * @param {string} objType - The object type.
     * @returns {string} - The type class of the object type. Null if the object
     *   type is not valid.
     */
    function _checkTypeClass(objType) { 
        // Find type-class
        let typeClass = null;
        let resourceTypes = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResourceTypes);
        let resourceTypeIds = resourceTypes ? 
            resourceTypes.map(obj => obj.id) : [];
        if (resourceTypeIds.includes(objType)) {
            typeClass = 'HRM';
        } else if (objType === 'ProjectPortfolio') {
            typeClass = 'PPF';
        }
        // Check if the object type is valid
        let validTypeClasses = ['HRM', 'PPF'];
        return validTypeClasses.includes(typeClass) ? typeClass : null;
    }

    // PROPERTIES

    /**
     * Gets the value of a property given the property object and its 
     * definition.
     * 
     * @param {Object} property - The property object.
     * @param {Object} propDef - The property definition object.
     * @param {Object} [obj=null] - The object that owns the property, only relevant for object type static.string.
     * @returns {any} - The value of the property. 'layoutProperty' if the
     *   property is a layout property. Note that this is different from null!
     */
    function _getPropertyValue(property, propDef, obj) { 
        // Depending on the property base-type, read value in a 
        // different way
        switch (propDef.constraint.basetype) {
            // Skip purely layouting properties
            case "layout.placeholder":
            case "layout.space":
            case "layout.group":
            case "layout.tab":
                return 'layoutProperty';
            // For .line, the value could correspond to a dynamic table
            case "layout.line":
                // Check if the property corresponds to a dynamic table
                if (propDef.constraint.properties) {
                    let grid = 
                        propDef.constraint.properties.find(
                            p => p.key === "grid");
                    if(grid && grid.value) {
                        let value = _constructDynamicTableJTF(property.value);
                        return value;
                    }
                }
                return 'layoutProperty';
            // The following types do not require any special treatment
            case "html":
            case "string":
            case "number":
            case "url":
            case "date":
            case "money":
                return property.value;
            // For boolean values, return "true" or "false"
            // Note: Probably not complete!
            case "boolean":
                let value = null;
                if (property.value === "true" || 
                    property.value === "X") {
                    value = true;
                } else if (property.value === "false" || 
                    !property.value) {
                    value = false;
                }
                return value;
            // Handle enum values
            case "enum":
                return _getEnumValue(property, propDef);
            case "multienum":
                // Split string by commas
                let valueIds = [];
                if (property.value) {
                    valueIds = property.value.split(",");
                    // Get rid of leading and trailing quotes
                    valueIds = valueIds.map(
                        x => x.replace(/^"(.*)"$/, '$1'));
                }
                let values = [];
                for (let valueId of valueIds) {
                    let enumValue = _getEnumValue(
                        {'key': property.key, 'value': valueId}, propDef)
                    // Only push if value could be loaded
                    if (enumValue) { values.push(enumValue); }
                }
                return values;
            case "attachment":
                if (!property.value) { return null; }
                // Parse string
                let arr = property.value.substring(5).split(",");
                return {
                    'hash': arr[0],
                    'filename': arr[1],
                }
            case "static.string":
                if (!obj) {
                    let message =
                        "No object provided for property with key " +
                        property.key + " of basetype 'static.string' in " +
                        "function '_getPropertyValue'.";
                    pqfLib.utils.misc.log(
                        1, "error", "C5E96D25BDE0435C9FC95B032EA00C16", message);
                    return null;
                }
                return obj[propDef.constraint.properties.find(prop => prop.key === "from").value];
            default:
                let message =
                    "Unknown property basetype: " + 
                    propDef.constraint.basetype + " in function " +
                    "'_getPropertyValue'.";
                pqfLib.utils.misc.log(
                    1, "error", "ED05F4C2229D4E79A537E1A0F9E8AA26", message);
        }
    }

    /**
     * Constructs the columns meta data for the given properties.
     * 
     * @param {Array} properties - The properties.
     * @param {string} [catid='properties'] - The category ID of the properties.
     * @returns {Array} - The columns meta data for the properties.
     */
    function _constructPropertiesColumnsMeta(properties, catid) { 
        // Apply default value
        if (!catid) { catid = 'properties' };
        let columnsMeta = [];
        // Check if there are any properties
        if (properties) {
            for (let property of properties) {
                // Read property definition
                let propertyDefinition = pqfLib.utils.apiFunc.exec(
                    Pqf.pf, Pqf.pf.getPropertyDefinition, property.key);
                if (!propertyDefinition) { continue; }
                // Construct column meta data
                function _colMeta(type, format) {
                    return {
                        'id': property.key,
                        'catid': catid,
                        'type': type,
                        'label': {
                            'en': propertyDefinition.label,
                            'de': propertyDefinition.label
                        },
                        'format': format    
                    }
                }
                switch (propertyDefinition.constraint.basetype) {
                    // Skip purely layouting properties
                    case "layout.placeholder":
                    case "layout.space":
                    case "layout.group":
                    case "layout.tab":
                        break;
                    // Skip jtf's, as they can't be displayed in a cell of a 
                    // table anyway
                    case "jtf":
                        break;
                    case "html":
                        columnsMeta.push(_colMeta('html'));
                        break;
                    case "boolean":
                        columnsMeta.push(_colMeta('boolean'));
                        break;
                    case "string":
                    case "url":
                        columnsMeta.push(_colMeta('string'));
                        break;
                    case "number":
                        columnsMeta.push(_colMeta('number'));
                        break;
                    case "date":
                        columnsMeta.push(
                            _colMeta('date', { 'format': 'DD.MM.YYYY' }));
                        break;
                    case "enum":
                        columnsMeta.push( 
                            _colMeta('enum', { 'showIcon': true }));
                        break;
                    case "multienum":
                        columnsMeta.push(
                            _colMeta('multienum', { 'showIcon': true }));
                        break;
                }
            }
        }
        return columnsMeta;
    }

    /**
     * Loads the enum value of a property.
     * 
     * @param {Object} property - The property object with key and value.
     * @param {Object} propDef - The property definition object.
     * @returns {Object} - The enum value of the property.
     */
    function _getEnumValue(property, propDef) { 
        // Check if property has a value
        if (!property.value) {
            return null;
        }
        // Get url of the source
        let urlString = null;
        urlString = propDef.constraint.properties.find(
            obj => obj.key === "sourceurl").value;
        if (!urlString) {
            let message = 
                "No source url specified for enum property with key " +
                property.key + " in function '_getEnumValue'.";
            pqfLib.utils.misc.log(
                1, "error", "F37EEEC2B90C45899A55442783E19DB8", message);
            return data;
        }
        // Determine url version
        let url_arr = urlString.split("/");
        let urlVersion = url_arr[2];
        // Parse URL
        let dataType = null;
        let objectType = null;
        let tableId = null;
        if (urlVersion === "V1") {
            dataType = url_arr[1];
            objectType = url_arr[3];
            tableId = url_arr[4];
        } else if (urlVersion === "V2") {
            dataType = url_arr[3];
            objectType = url_arr[4];
            tableId = url_arr[5];
        } else {
            let message = 
                "Unknown url version: " + urlVersion + " in function " +
                "'_getEnumValue'.";
            pqfLib.utils.misc.log(
                1, "error", "56EB3D81EC504F1A9D527FD1793D64D5", message);
            return data;
        }
        // Define execution properties
        const execProps = {
            'PF': {
                'obj': Pqf.pf,
                'func': Pqf.pf.getEnumValue,
                'params': [tableId, property.value, true]
            },
            'RES': {
                'obj': Pqf.res,
                'func': Pqf.res.getResource,
                'params': [property.value]
            },
            'PM':  {
                'obj': Pqf.pm,
                'func': objectType === 'Project' ? 
                    Pqf.pm.getProject : Pqf.pm.getProjectPortfolio,
                'params': [property.value]
            },
            'FCO': {
                'obj': Pqf.fco,
                'func': Pqf.fco.getCostsType,
                'params': [property.value]
            },
            'TDP': {
                'obj': Pqf.tdp,
                'func': Pqf.tdp.getForeignKeyReference,
                'params': [tableId, property.value]
            }
        };
        // Check if the data type is known
        if (!execProps[dataType]) {
            let message = 
                "Unknown data type for enum property with key " +
                property.key + " in function '_getEnumValue'.";
            pqfLib.utils.misc.log(
                1, "error", "D4F47A5F078A4C6FA0EBC32146C882DA", message);
            return null;
        }
        // Execute function
        let obj = pqfLib.utils.apiFunc.exec_arr(
            execProps[dataType].obj, execProps[dataType].func, 
            execProps[dataType].params);
        return _toEnum(obj);
    }

    /**
     * Constructs a JTF table from a dynamic table. Note that these tables are
     * given as HTML strings.
     * 
     * @param {string} table_html - The HTML string of the dynamic table.
     * @returns {Object} - The JTF table object.
     */
    function _constructDynamicTableJTF(table_html) { 
        if (!table_html) {
            let defaultJtf = {
                'meta': {
                    'columns': []
                },
                'data': []
            }
            let message =
                "Client hasn't initialized the dynamic table yet. Therefore, " +
                "a simple JS Object of the form " + JSON.stringify(defaultJtf) +
                " is returned by function '_constructDynamicTableJTF'.";
            pqfLib.utils.misc.log(
                debug_level, "warn", "95E464EE7DA84A189E25CAE9351F7D33", message);
            return defaultJtf;
        };
        // Parse table
        // get rid of leading and trailing <table> tags
        table_html = table_html.replace(/^<table><tbody>/, '');
        table_html = table_html.replace(/<\/tbody><\/table>$/, '');
        // split table into rows
        let rows = _splitByTags(table_html, '<tr', '/tr>');
        if (!rows) {
            let message = 
                "Failed to split dynamic table into rows in function " +
                "'_constructDynamicTableJTF'.";
            pqfLib.utils.misc.log(
                1, "error", "ED0CE9A3A0374FFCB50812981AE866A3", message);
            return null;
        }
        // get rid of leading and trailing tags per row
        rows = rows.map(row => row.replace(/^<tr>/, ''));
        rows = rows.map(row => row.replace(/<\/tr>$/, ''));
        // split rows into cells
        let table = {
            'tableHeader': [],
            'tableBody': []
        };
        for (let i=0; i < rows.length; i++) {
            if (i === 0) {
                let cells = rows[i].split(/<\/th>/);
                cells.pop();
                cells = cells.map(cell => cell.replace(/^<th>/, ''));
                table.tableHeader = cells;
            } else {
                let cells = _splitByTags(rows[i], '<td', '/td>');
                if (!cells) {
                    let message = 
                        "Failed to split row into cells in function " +
                        "'_constructDynamicTableJTF'.";
                    pqfLib.utils.misc.log(
                        1, "error", "6315666208D54994BD081B3DD506FDFB", 
                        message);
                    return null;
                }
                cells = cells.map(cell => cell.replace(/^<td>/, ''));
                cells = cells.map(cell => cell.replace(/<\/td>$/, ''));
                table.tableBody.push(cells);
            }
        }

        // Construct properties array for header and all rows
        let properties_header = [];
        for (let cell of table.tableHeader) {
            properties_header.push({
                'key': cell.split(':')[0],
                'value': null
            });
        }
        let properties_body = [];
        for (let row of table.tableBody) {
            let properties_row = [];
            for (let i=0; i < row.length; i++) {
                let info = table.tableHeader[i].split(':');
                let value = null;
                if (info[1] === 'html') {
                    value = row[i];
                } 
                // i.e., by default
                else {
                    value = Html.decode(row[i]);
                }
                let property = {
                    'key': info[0],
                    'value': value
                }
                properties_row.push(property);
            }
            properties_body.push(properties_row);
        }

        // Construct JTF table
        let jtfTable = {
            'meta': {
                'columns': []
            },
            'data': []
        };
        // Construct columns meta
        jtfTable.meta.columns = _constructPropertiesColumnsMeta(
            properties_header);
        // Construct data
        let uuids = pqfLib.utils.apiFunc.exec(
            Pqf.clf, Pqf.clf.newUuids, properties_body.length);
        properties_body.forEach((properties_row, i) => {
            let row = {
                'id': uuids.newUuids[i],
                'data': _getPropertiesData(properties_row)
            };
            jtfTable.data.push(row);
        });
        return jtfTable;
    }

    /**
     * Splits a given string by leading and trailing tags ond the "highest" 
     * level. For example, if the string is "<tr><tr></tr></tr><tr></tr>", the
     * function would return ["<tr><tr></tr></tr>", "<tr></tr>"].
     * 
     * @param {string} string - The string to be split.
     * @param {string} lead_tag - The leading tag.
     * @param {string} trail_tag - The trailing tag.
     * @returns {Array} - The split string.
     */
    function _splitByTags(string, lead_tag, trail_tag) { 
        // Define helper function
        function _getMatchingSubstringIndices(string, substring) {
            let indices = [];
            let index = string.indexOf(substring);
            while (index !== -1) {
                indices.push(index);
                index = string.indexOf(substring, index + 1);
            }
            return indices;
        }
        // Get indices of leading and trailing tags
        let lead_inds = _getMatchingSubstringIndices(string, lead_tag);
        let trail_inds = _getMatchingSubstringIndices(string, trail_tag);
        // Sanity check
        if (lead_inds.length != trail_inds.length) {
            let message = 
                "Number of leading and trailing tags does not match in " +
                "function '_splitByTags'.";
            pqfLib.utils.misc.log(
                1, "error", "86EDF58F2BD345708B28B74BE1BE7B5B", message);
            return null;
        }
        // Positions of highest level lead tags for corresponding trail tags
        let lead4trail_poss = [];
        for (let i=0; i < trail_inds.length; i++) {
            for (let j=0; j < lead_inds.length; j++) {
                if (trail_inds[i] < lead_inds[j]) {
                    lead4trail_poss.push(j-1);
                    break;
                }
                if (j == lead_inds.length-1) {
                    lead4trail_poss.push(j)
                }
            }
        }
        // Positions of upper-level leading and trailing tags
        let trail_poss = lead4trail_poss.filter((ind, i) => { 
            return ind == i 
        });
        let lead_poss = [0].concat(
            trail_poss.slice(0, trail_poss.length-1).map(ind => ind+1));
        // Filter highest level leading and trailing tags
        lead_inds = lead_inds.filter((_, i) => lead_poss.includes(i));
        trail_inds = trail_inds.filter((_, i) => trail_poss.includes(i));
        // Sanity check
        if (lead_inds.length != trail_inds.length) {
            let message = 
                "Number of leading and trailing tags does not match after " +
                "filtering for highest level in function '_splitByTags'.";
            pqfLib.utils.misc.log(
                1, "error", "E6278BC1B550460198FB691C56EF7E29", message);
            return null;
        }
        // Split string by tags
        let substrings = [];
        for (let i=0; i < lead_inds.length; i++) {
            substrings.push(
                string.substring(lead_inds[i], trail_inds[i]+trail_tag.length));
        }
        return substrings;
    }

    // DETAILS

    /**
     * Maps (i.e., parses) the value of indicators.
     * 
     * @param {any} value - The value of the indicator.
     * @param {string} type - The type of the indicator.
     * @returns {any} - The mapped value of the indicator.
     */
    function _mapIndicatorValue(value, type) {
        if (!value) { return null };
        if (type === 'money') {
            // Parse value, i.e., get rid of all '\"' and split by ','
            let moneyArr = value.replace(/\"/g, '').split(',');
            return {
                'amount': moneyArr[0],
                'currencyCode': _mapCurrency(moneyArr[1])
            };
        }
        return value;
    }

    /**
     * Maps the type of indicators.
     * 
     * @param {string} type - The type of the indicator.
     * @returns {string} - The mapped type of the indicator.
     */
    function _mapIndicatorType(type) {
        if (!type) { return null }
        if (type === 'timespan') {
            return 'duration';
        }
        return type;
    }

    // GANTT

    /**
     * Simple function to map the given item to the corresponding Gantt column
     * meta data.
     * 
     * @param {string} item - The item to be mapped.
     * @param {string} currency - The currency code.
     * @returns {Object} - The Gantt column meta data.
     */
    function _getGanttColumnMeta(item, currency) { 
        let columnMeta = {};
        switch (item) {
            // BASIC
            case 'extractionIndex':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': '#',
                    'de': '#'
                };
                columnMeta.options = {
                    'width': 50,
                    'aggregation': null
                };
                columnMeta.format = {
                    'digits': 0
                };
                break;
            case 'level':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Level',
                    'de': 'Level'
                };
                columnMeta.options = {
                    'width': 50,
                    'aggregation': null
                };
                columnMeta.format = {
                    'digits': 0
                };
                break;
            case 'taskType':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Type',
                    'de': 'Typ'
                };
                break;
            case 'taskName':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Task',
                    'de': 'Aufgabe'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            // GENERIC
            case 'taskCode':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'ID',
                    'de': 'ID'
                };
                columnMeta.options = {
                    'width': 50
                };
                break;
            case 'taskDesc':
                columnMeta.type = 'html';
                columnMeta.label = {
                    'en': 'Remarks',
                    'de': 'Bemerkungen'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            case 'taskOwner':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Task Owner',
                    'de': 'Taskbesitzer'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'taskColor':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Task Color',
                    'de': 'Taskfarbe'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'projectManagementMethodPhase':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Project Phase',
                    'de': 'Projektphase'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'requiredSkill':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Skill',
                    'de': 'Skill'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            // PLANNING
            case 'taskBeg':
                columnMeta.type = 'date';
                columnMeta.label = {
                    'en': 'Start Date',
                    'de': 'Startdatum'
                };
                columnMeta.format = {
                    'format': 'DD.MM.YYYY'
                };
                break;
            case 'taskEnd':
                columnMeta.type = 'date';
                columnMeta.label = {
                    'en': 'End Date',
                    'de': 'Enddatum'
                };
                columnMeta.format = {
                    'format': 'DD.MM.YYYY'
                };
                break;
            case 'taskDuration':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Task Duration',
                    'de': 'Taskdauer'
                };
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'day',
                    'digits': 0
                };
                break;
            case 'progress':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Progress',
                    'de': 'Fortschritt'
                };
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': '%',
                    'digits': 0
                };
                break;
            case 'progressAccumulated':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Ø Progress',
                    'de': 'Ø Fortschritt'
                };
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': '%',
                    'digits': 0
                };
                break;
            case 'allocationState':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Allocation State',
                    'de': 'Allokationsstatus'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'allocatedResources':
                columnMeta.type = 'multienum';
                columnMeta.label = {
                    'en': 'Allocations',
                    'de': 'Allokationen'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'allocationType':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Allocation Type',
                    'de': 'Allokationstyp'
                };
                break;
            // Note: 'properties' are handled separately
            // EFFORT
            case 'timeBudget':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Budget',
                    'de': 'Budget'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeBudget_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Budget',
                    'de': '∑ Budget'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timePlanned':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Rough plan',
                    'de': 'Grobplan'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timePlanned_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Rough plan',
                    'de': '∑ Grobplan'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeAllocated':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Allocated',
                    'de': 'Alloziert'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeAllocated_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Allocated',
                    'de': '∑ Alloziert'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeActual':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Actual',
                    'de': 'Ist'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeActual_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Actual',
                    'de': '∑ Ist'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeProvisional':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Provisional',
                    'de': 'Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeProvisional_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Provisional',
                    'de': '∑ Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeActualPlusProvisional':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Actual + Provisional',
                    'de': 'Ist + Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeActualPlusProvisional_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Actual + Provisional',
                    'de': '∑ Ist + Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeRemaining':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Remaining',
                    'de': 'Ausstehend'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeRemaining_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Remaining',
                    'de': '∑ Ausstehend'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeForecast':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': 'Forecast',
                    'de': 'Prognose'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            case 'timeForecast_sum':
                columnMeta.type = 'duration';
                columnMeta.label = {
                    'en': '∑ Forecast',
                    'de': '∑ Prognose'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'unit': 'hour'
                };
                break;
            // COSTS
            case 'costsBudget':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Budget',
                    'de': 'Budget'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsBudget_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Budget',
                    'de': '∑ Budget'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsPlanned':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Plan',
                    'de': 'Plan'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsPlanned_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Plan',
                    'de': '∑ Plan'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsActual':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Actual',
                    'de': 'Ist'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsActual_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Actual',
                    'de': '∑ Ist'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsProvisional':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Provisional',
                    'de': 'Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsProvisional_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Provisional',
                    'de': '∑ Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsActualPlusProvisional':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Actual + Provisional',
                    'de': 'Ist + Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsActualPlusProvisional_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Actual + Provisional',
                    'de': '∑ Ist + Provisorisch'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsRemaining':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Remaining',
                    'de': 'Ausstehend'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsRemaining_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Remaining',
                    'de': '∑ Ausstehend'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsForecast':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Forecast',
                    'de': 'Prognose'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'costsForecast_sum':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': '∑ Forecast',
                    'de': '∑ Prognose'
                }
                columnMeta.options = {
                    'aggregation': null
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            default:
                let message = 
                    "Could not determine type and label for item " + item + 
                    " in function '_getGanttColumnMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "314A1C6025D74999854F67C7DF93F245", message);
        }
        return columnMeta;
    }

    /**
     * Constructs a Gantt tree from the given tasks.
     * 
     * @param {Array} tasks - The tasks.
     * @returns {Array} - The tasks with tree info.
     */
    function _constructGanttTree(tasks) { 
        // Find root task
        let rootTask = tasks.find(obj => obj.parentPhaseId === null);
        if (!rootTask) {
            let message = 
                "No root task found while constructing Gantt tree in " +
                "function '_constructGanttTree'.";
            pqfLib.utils.misc.log(
                1, "error", "83792BCAAC254AF89BD588883B2DFC51", message);
            return null;
        }
        // Add tree info
        rootTask.extractionIndex = 1;
        rootTask.level = 0;
        // Find all children
        let children = tasks.filter(obj => obj.parentPhaseId === rootTask.id);
        // Recursively handle children
        function _ganttTreeChildren(childTasks, nextExtractionIndex, level) {
            // Sort children 
            childTasks.sort((a, b) => a.sortIndex - b.sortIndex);
            // Iterate through children
            for (let childTask of childTasks) {
                // Add tree info
                childTask.extractionIndex = nextExtractionIndex;
                nextExtractionIndex++;
                childTask.level = level;
                // Find all children
                let grandChildren = tasks.filter(
                    obj => obj.parentPhaseId === childTask.id);
                // Recursively handle children
                nextExtractionIndex = _ganttTreeChildren(
                    grandChildren, nextExtractionIndex, level + 1);
            
            }
            return nextExtractionIndex;
        }
        _ganttTreeChildren(children, 2, 1);
        return tasks;
    }

    /**
     * Checks the given array of task ids for the existence of the parent tasks
     * and includes them in the array.
     * 
     * @param {Array} tasks_list - The list of all tasks.
     * @param {Array} filterByTasks - The array of task ids to be checked.
     * @returns {Array} - The array of task ids including the parent tasks.
     */
    function _includeParentIds(tasks_list, filterByTasks) {
        // Recursive function to get all parent tasks of a task
        function _pushTaskIds(taskId) {
            let task = tasks_list.find(obj => obj.id === taskId);
            // Check if the task exists
            if (!task) {
                let message = 
                    "The task with the id " + taskId + " couldn't be found " +
                    "while executing function '_includeParentIds'.";
                pqfLib.utils.misc.log(
                    1, "error", "3512161FFCAC4B5089C5E6595146E82E", message);
                return null;
            }
            // Check if the task is already included
            if (filterByTasks_wParents.includes(taskId)) {
                return null;
            } 
            filterByTasks_wParents.push(taskId);
            if (task && 
                task.parentPhaseId && 
                !filterByTasks_wParents.includes(task.parentPhaseId)) {
                _pushTaskIds(task.parentPhaseId);
            }
        }
        // For all tasks in filterByTasks, also include their parent tasks
        let filterByTasks_wParents = [];
        for (let taskId of filterByTasks) {
            _pushTaskIds(taskId);
        }
        return filterByTasks_wParents;
    }

    /**
     * Maps the given allocation state to a priority value.
     * 
     * @param {String} stateValue - The value of the allocation state.
     * @returns {Number} - The priority value, the higher the "more urgent / 
     *   important". 0 if no mapping could be found or stateValue is null.
     */
    function _mapAllocationState2Prio(stateValue) { 
        // Handle case where stateValue is null
        if (!stateValue) {
            return 0;
        }
        switch (stateValue) {
            case "ALLOC_STATE_APPROVED":
                return 1;
            case "ALLOC_STATE_REQUESTED":
                return 2;
            case "ALLOC_STATE_NEW":
                return 3;
            case "ALLOC_STATE_CHANGED":
                return 4;
            case "ALLOC_STATE_REJECTED":
                return 5;
            default:
                let message = 
                    "Could not map allocation state " + stateValue +
                    " to priority in function '_mapAllocationState2Prio'.";
                pqfLib.utils.misc.log(
                    1, "error", "403D415C9408427F8B64163C24CC9B2B", message);
                return 0;
        }
    }

    // TODO

    /**
     * Simple function to map the given item to the corresponding Todo JTF
     * column meta
     * 
     * @param {String} item - The item to be mapped.
     * @param {Array} [relTypes_todo=null] - The relation types for todos. If 
     *   not provided, they will be loaded each time a relation is encountered.
     * @returns {Object} - An object containing the Todo JTF column type and
     *   label.
     */
    function _getTodoColumnMeta(item, relTypes_todo) {
        let columnMeta = {};
        switch (item) {
            // BASIC
            case 'todoCode':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'ID',
                    'de': 'ID'
                };
                columnMeta.options = {
                    'width': 50
                };
                break;
            case 'todoName':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Name',
                    'de': 'Name'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            // PROPERTIES
            case 'todoStatus':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Status',
                    'de': 'Status'
                };
                columnMeta.format =  { 
                    'showIcon': true // faulty ref
                };
                break;
            case 'todoPriority':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Priority',
                    'de': 'Priorität'
                };
                break;
            case 'todoColor':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Color',
                    'de': 'Farbe'
                };
                columnMeta.format =  { 
                    'showIcon': true 
                };
                break;
            case 'todoBeg':
                columnMeta.type = 'date';
                columnMeta.label = {
                    'en': 'Earliest Start Date',
                    'de': 'Frühster Startzeitpunkt'
                };
                columnMeta.format = {
                    'format': 'DD.MM.YYYY'
                };
                break;
            case 'todoEnd':
                columnMeta.type = 'date';
                columnMeta.label = {
                    'en': 'Deadline',
                    'de': 'Deadline'
                };
                columnMeta.format = {
                    'format': 'DD.MM.YYYY'
                };
                break;
            case 'todoDesc':
                columnMeta.type = 'html';
                columnMeta.label = {
                    'en': 'Description',
                    'de': 'Beschreibung'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            case 'todoComment':
                columnMeta.type = 'html';
                columnMeta.label = {
                    'en': 'Comment',
                    'de': 'Kommentar'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            // Note: 'properties' are handled separately
            // Note: RELATIONS are handled in default
            default:
                // Check if item is a relation 
                if (item.startsWith('rel_')) {
                    // Check if todo relation types have already been loaded
                    if (!relTypes_todo) {
                        relTypes_todo = pqfLib.utils.apiFunc.exec(
                            Pqf.pf, Pqf.pf.getAllRelationTypesForType, 'Todo');
                    }
                    // Get relation type
                    let relType = relTypes_todo.find(
                        obj => obj.id === item.substring(8));
                    if (!relType) {
                        let message = 
                            "Could not find relation type for relation " + 
                            item + " in function '_getTodoColumnMeta'.";
                        pqfLib.utils.misc.log(
                            1, "error", "C931AC3677EC4D01B5B3193A7D9DA99D", 
                            message);
                        break;
                    }
                    columnMeta.type = 'multienum';
                    columnMeta.label = {
                        'en': item.substring(4,8) == 'for_' ? 
                            relType.nameForward : relType.nameBackward,
                        'de': item.substring(4,8) == 'for_' ? 
                            relType.nameForward : relType.nameBackward,
                    };
                    columnMeta.options = {
                        'width': 200
                    };
                    columnMeta.format =  { 
                        'showIcon': false 
                    };
                    break;
                }
                let message = 
                    "Unknown / not yet implemented Todo JTF column " + item +
                    " in function '_getTodoColumnMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "FD976E1B71A640FF869BCF5139F1EE7E", message);
        }
        return columnMeta;
    }
    
    function _loadTodos(
        objType, objId, relTypes_todo, filterByRelTypes, filterByTodos) {
        // Handle generic types (like reports, ...)
        let objType_generic = objType;
        if (_isReport(objType)) { objType_generic = 'Report' };
        if (_isResource(objType)) { objType_generic = 'Resource' };
        // Filter forward relation types
        let relTypes_forward = relTypes_todo.filter(
            obj => obj.sourceTypes.includes('Todo'));
        // Define relation target types per object type which should be 
        // considered
        const specs_perObjType = {
            'Project': [
                { 'type': 'Project', 'onlyExplicit': false },
                { 'type': 'ProjectPortfolio', 'onlyExplicit': true }
            ],
            'ProjectPortfolio': [
                { 'type': 'ProjectPortfolio', 'onlyExplicit': true }
            ],
            'ProjectRisk': [
                { 'type': 'ProjectRisk', 'onlyExplicit': false }
            ],
            'Meeting': [
                { 'type': 'Meeting', 'onlyExplicit': true }
            ],
            'Report': [
                { 'type': objType, 'onlyExplicit': true }
            ],
            'Resource': [
                { 'type': objType, 'onlyExplicit': true }
            ]
        }
        // Load all report types and push them to the specs_perObjType (where 
        // appropriate)
        let projectReportTypes = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectReportTypes);
        if (projectReportTypes) {
            projectReportTypes.forEach(typeObj => {
                specs_perObjType['Project'].push(
                    { 'type': typeObj.id, 'onlyExplicit': true });
            });
        }
        let projectPortfolioReportTypes = pqfLib.utils.apiFunc.exec(
            Pqf.pm, Pqf.pm.getProjectPortfolioReportTypes);
        if (projectPortfolioReportTypes) {
            projectPortfolioReportTypes.forEach(typeObj => {
                specs_perObjType['ProjectPortfolio'].push(
                    { 'type': typeObj.id, 'onlyExplicit': true });
            });
        }
        // assert
        if (!specs_perObjType[objType_generic]) {
            let message =
                "The object type " + objType + " is not (yet) supported by " +
                "the function '_getTodos'.";
            pqfLib.utils.misc.log(
                1, "error", "1F228165EB5949BDB34628783BA691A6", message);
            return null;
        }
        // Get relation types that should (potentially) be considered for this 
        // object type
        let relTypes_wSpecs = {}; 
        relTypes_forward.forEach(relType => {
            if (specs_perObjType[objType_generic].map(obj => obj.type).some(
                type => relType.targetTypes.includes(type))) {
                // Apply filter (if necessary)
                if (filterByRelTypes === 'all' ||
                    filterByRelTypes.includes(relType.id)) {
                    relTypes_wSpecs[relType.id] = {
                        'targets': relType.targetTypes,
                        'explicit': relType.explicit
                    };
                }
            }
        });
        // Load todos
        let todos = [];
        console.log("relTypes_wSpecs: " + JSON.stringify(relTypes_wSpecs));
        Object.keys(relTypes_wSpecs).forEach(relTypeId => {
            relTypes_wSpecs[relTypeId].targets.forEach(targetType => {
                // Check if for this source and target type combination the 
                // todos shall be loaded
                let targetSpec = specs_perObjType[objType_generic].find(
                    obj => obj.type === targetType)
                if (!targetSpec || (targetSpec.onlyExplicit &&
                        !relTypes_wSpecs[relTypeId].explicit) ) {
                    return null;
                }
                // Load todos given the relation type points to the object in 
                // question
                if (targetType === objType) {
                    let todos_new = pqfLib.utils.apiFunc.exec(
                        Pqf.pi, Pqf.pi.getProjectItemSummariesByRef,
                        'Todo', relTypeId, objType, objId);
                    if (todos_new) { todos = todos.concat(todos_new) };
                } 
                // Load todos given the relation type points to a specific 
                // object type (e.g., ProjectPortfolio for Project)
                else if (objType === 'Project' && 
                    targetType === 'ProjectPortfolio') {
                    // Load the project object
                    let project = Pqf.pm.getProject(objId);
                    // Map its parent portfolio ids
                    let portfolioIds = project.portfolios.map(obj => obj.id);
                    // Load todos for each portfolio by the given relation type
                    portfolioIds.forEach(portfolioId => {
                        let todos_new = pqfLib.utils.apiFunc.exec(
                            Pqf.pi, Pqf.pi.getProjectItemSummariesByRef,
                            'Todo', relTypeId, targetType, portfolioId);
                        if (todos_new) { todos = todos.concat(todos_new) };
                    });
                } 
                else if (objType === 'Project' && 
                    projectReportTypes.map(typeObj => typeObj.id).includes(
                        targetType)) {
                    // Load all project reports of this project
                    let reports = pqfLib.utils.apiFunc.exec(
                        Pqf.pm, Pqf.pm.getProjectReports, objId);
                    // For each report, load todos by the given relation type
                    reports.forEach(report => {
                        let todos_new = pqfLib.utils.apiFunc.exec(
                            Pqf.pi, Pqf.pi.getProjectItemSummariesByRef,
                            'Todo', relTypeId, targetType, report.id);
                        if (todos_new) { todos = todos.concat(todos_new) };
                    });
                }
                else if (objType === 'ProjectPortfolio' && 
                    projectPortfolioReportTypes.map(
                        typeObj => typeObj.id).includes(targetType)) {
                    // Load all project reports of this project
                    let reports = pqfLib.utils.apiFunc.exec(
                        Pqf.pm, Pqf.pm.getProjectPortfolioReports, objId);
                    // For each report, load todos by the given relation type
                    reports.forEach(report => {
                        let todos_new = pqfLib.utils.apiFunc.exec(
                            Pqf.pi, Pqf.pi.getProjectItemSummariesByRef,
                            'Todo', relTypeId, targetType, report.id);
                        if (todos_new) { todos = todos.concat(todos_new) };
                    });
                }
                else {
                    let message = 
                        "The source and target type combination " + objType +
                        " -> " + targetType + " is not (yet) supported by " +
                        "function '_loadTodos'.";
                    pqfLib.utils.misc.log(
                        1, "error", "B9F2063805644F698A31EC5D1F46E1CA", 
                        message);
                }
            })
        });
        // Get rid of duplicates
        todos = todos.filter((obj, pos, arr) =>
            arr.map(mapObj => mapObj.id).indexOf(obj.id) === pos);
        // Filter todos according to filterTodoIds
        if (filterByTodos !== 'all') {
            todos = todos.filter(obj =>
                filterByTodos.includes(obj.id));
        }
        return todos;
    }

    function _constructRelColumnIds(requiredRels, relTypes_todo) {
        // For each relation type column, push its ID + 'rel_' and 
        // 'for_' || 'bac_' to the array
        let relColIds = [];
        if (requiredRels !== 'all') {
            requiredRels.forEach(rel => { // rel is an id
                let relType = relTypes_todo.find(obj => obj.id === rel);
                if (relType) {
                    let isForward = relType.sourceTypes.includes('Todo');
                    relColIds.push(
                        'rel_' + (isForward ? 'for_' : 'bac_') + rel); 
                } else {
                    let message = 
                        "The specified relation type with the id " + rel +
                        " could not be found while constructing relation " +
                        "column ids in function '_constructRelColumnIds'.";
                    pqfLib.utils.misc.log(
                        1, "error", "D1CDB32BDE2A4E1FAD0493C2EC4F3881",
                        message);
                }
            });
        } else {
            relTypes_todo.forEach(rel => { // rel is an object
                if (rel.explicit) {
                    let isForward = rel.sourceTypes.includes('Todo');
                    relColIds.push(
                        'rel_' + (isForward ? 'for_' : 'bac_') + rel.id);
                }
            });
        }
        // Filter for duplicates
        relColIds = relColIds.filter( 
            (obj, pos, arr) => arr.indexOf(obj) === pos);
        // If there are relations among todos themselves, add the backward
        let bacRels = [];
        relColIds.forEach(rel => {
            let relObj = relTypes_todo.find(obj => obj.id === rel.substring(8));
            if (relObj.targetTypes.includes('Todo') && 
                relObj.sourceTypes.includes('Todo')) {
                bacRels.push('rel_bac_' + relObj.id);
            }
        });
        relColIds = relColIds.concat(bacRels);
        // Sort relations by sortindex
        relColIds.sort((a, b) => {
            let relObj_a = relTypes_todo.find(obj => obj.id === a.substring(8));
            let relObj_b = relTypes_todo.find(obj => obj.id === b.substring(8));
            let sortInd_a = a.substring(4,8) == 'for_' ?
                relObj_a.sortIndexForward : relObj_a.sortIndexBackward;
            let sortInd_b = b.substring(4,8) == 'for_' ?
                relObj_b.sortIndexForward : relObj_b.sortIndexBackward;
            return sortInd_a - sortInd_b;
        });
        return relColIds;
    }

    // RISKS

    /**
     * Map the risk classifications and levels given their respective rating.
     * 
     * @param {Object} rating - The rating object.
     * @returns {Object} - The rating object with the classification and level 
     *   values mapped. The object has the following form:
     *     mappedRating = {
     *       "opClass": { ... }, // enum
     *       "opLimit": "Occurrence Probability Limit",
     *       "eolClass": { ... }, // enum
     *       "eolLimit": "Extent of Loss Limit",
     *       "rrClass": { ... }, // enum
     *       "rrLimit": "Risk Rating Limit"
     *     }
     */
    function _mapRiskAssessment(rating) { 
        let mappedRating = {};
        // Get the rating matrix
        let riskMatrix = pqfLib.utils.apiFunc.exec(
            Pqf.rsk, Pqf.rsk.getRiskMatrixDefinition);
        if (!riskMatrix) { return null; }
        // Map the classification values
        if (riskMatrix) {
            let op_mapped =
                riskMatrix.occurrenceProbabilityClassifications.find(
                    obj => obj.id ===
                        rating.occurrenceProbabilityClassification);
            mappedRating.opClass = _toEnum(op_mapped);
            mappedRating.opLimit = op_mapped.limit;
            let eol_mapped =
                riskMatrix.extentOfLossClassifications.find(
                    obj => obj.id === rating.extentOfLossClassification);
            mappedRating.eolClass = _toEnum(eol_mapped);
            mappedRating.eolLimit = eol_mapped.limit;
            let rr_mapped =
                riskMatrix.riskRatingClassifications.find(
                    obj => obj.id === rating.riskRatingClassification);
            mappedRating.rrClass = _toEnum(rr_mapped);
            mappedRating.rrLimit = rr_mapped.limit;
        }
        return mappedRating;
    }

    /**
     * Simple function to map the given item to the corresponding Risk JTF
     * column meta.
     * 
     * @param {String} item - The item to be mapped.
     * @param {String} currency - The currency in which the costs are displayed.
     * @returns {Object} - An object containing the Risk JTF column meta info.
     */
    function _getRiskColumnMeta(item, currency) {
        let columnMeta = {};
        switch (item) {
            // BASIC
            case 'riskCode':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Code',
                    'de': 'Code'
                };
                columnMeta.options = {
                    'width': 50
                };
                break;
            // PROPERTIES
            case 'riskName':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Name',
                    'de': 'Name'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            case 'riskDesc':
                columnMeta.type = 'html';
                columnMeta.label = {
                    'en': 'Description',
                    'de': 'Beschreibung'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            case 'riskDimension':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Dimension',
                    'de': 'Dimension'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'riskLoss':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Amount of loss',
                    'de': 'Schadenshöhe'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'riskBudget':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'Risk budget',
                    'de': 'Risikobudget'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            // Note: 'properties' are handled separately
            // CURRENT RISK ASSESSMENT
            case 'op':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Occurrence Probability (value)',
                    'de': 'Eintretenswahrscheinlichkeit (Wert)'
                };
                columnMeta.options = {
                    'aggregation': null
                }
                break;
            case 'opClass':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Occurrence Probability',
                    'de': 'Eintretenswahrscheinlichkeit'
                };
                columnMeta.format = {
                    'showIcon': true
                }
                break;
            case 'opLimit':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Occurrence Probability (limit)',
                    'de': 'Eintrerenswahrscheinlichkeit (Limit)'
                };
                columnMeta.options = {
                    'aggregation': null
                }
                break;
            case 'eol':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Extent of Loss (value)',
                    'de': 'Schadensausmass (Wert)'
                };
                columnMeta.options = {
                    'aggregation': null
                }
                break
            case 'eolClass':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Extent of Loss',
                    'de': 'Schadensausmass'
                };
                columnMeta.format = {
                    'showIcon': true
                }
                break;
            case 'eolLimit':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Extent of Loss (limit)',
                    'de': 'Schadensausmass (Limit)'
                };
                columnMeta.options = {
                    'aggregation': null
                }
                break;
            case 'rr':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Risk Rating (value)',
                    'de': 'Risikoklasse (Wert)'
                };
                columnMeta.options = {
                    'aggregation': null
                }
                break;
            case 'rrClass':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Risk Rating',
                    'de': 'Risikoklasse'
                };
                columnMeta.format = {
                    'showIcon': true
                }
                break;
            case 'rrLimit':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'Risk Rating (limit)',
                    'de': 'Risikoklasse (Limit)'
                };
                columnMeta.options = {
                    'aggregation': null
                }
                break;
            default:
                let message = 
                    "Could not determine type and label for item " + item +
                    " in function '_getRiskColumnMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "CA059610717445CE82ABC3AD81A25B6F", message);
        }
        return columnMeta;
    }

    // COSTPOSITIONS

    /**
     * Calculate the forecasted cost of a costposition, depending on the 
     * forecast scheme.
     * 
     * @param {Object} cp - The cost position object.
     * @returns {Object} - The forecasted cost. The object has the following
     *   form:
     *     forecast = {
     *       "amount": <number>,
     *       "currency": <string>
     *     }
     */
    function _calculateCostForecast(cp) { 
        if (cp.forecastScheme === "PlannedPlusSupplementary") {
            return {
                "amount":
                    cp.plannedAmount.converted.amount +
                    cp.supplementaryAmount.converted.amount,
                "currency": cp.plannedAmount.converted.currency
            };
        } else if (cp.forecastScheme === "ActualPlusRemaining") {
            return {
                "amount": 
                    cp.actualAmount.amount +
                    cp.remainingAmount.converted.amount,
                "currency": cp.actualAmount.currency
            };
        } else {
            let message =
                "Forcast scheme " + cp.forecastScheme + " can not (yet) be " +
                "handled by function '_calculateCostForecast'.";
            pqfLib.utils.misc.log(
                1, "error", "3D2E5281FDB14A49BF0D60E3CF1B1102", message);
        }
    }

    /**
     * Simple function to map the given item to the corresponding CP JTF
     * column meta.
     * 
     * @param {String} item - The item to be mapped.
     * @param {String} currency - The currency in which the costs are displayed.
     * @returns {Object} - An object containing the CP JTF column meta info.
     */
    function _getCPColumnMeta(item, currency) {
        let columnMeta = {};
        switch (item) {
            // BASIC
            case 'cpIndex':
                columnMeta.type = 'number';
                columnMeta.label = {
                    'en': 'PLAN',
                    'de': 'PLAN'
                };
                columnMeta.options = {
                    'width': 50
                };
                columnMeta.format = {
                    'digits': 0
                };
                break;
            case 'cpName':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'Name',
                    'de': 'Name'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            // PROPERTIES
            case 'cpDesc':
                columnMeta.type = 'html';
                columnMeta.label = {
                    'en': 'Description',
                    'de': 'Beschreibung'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            case 'cpBeg':
                columnMeta.type = 'date';
                columnMeta.label = {
                    'en': 'From',
                    'de': 'Von'
                };
                columnMeta.format = {
                    'format': 'DD.MM.YYYY'
                };
                break;
            case 'cpEnd':
                columnMeta.type = 'date';
                columnMeta.label = {
                    'en': 'To',
                    'de': 'Bis'
                };
                columnMeta.format = {
                    'format': 'DD.MM.YYYY'
                };
                break;
            case 'cpAssignedWorkitems':
                columnMeta.type = 'multienum';
                columnMeta.label = {
                    'en': 'Assigned tasks',
                    'de': 'Zugeordnete Tasks'
                };
                columnMeta.format = {
                    'showIcon': false
                };
                break;
            // Note: 'properties' are handled separately
            // COSTS
            case 'cpTypeGroup':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Cost Type Group',
                    'de': 'Kostenartengruppe'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'cpType':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Cost Type',
                    'de': 'Kostenart'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'cpCenter':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Cost Container',
                    'de': 'Kostenstelle'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'payPlan':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Pay Plan',
                    'de': 'Zahlungsplan'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            case 'obligo':
                columnMeta.type = 'boolean';
                columnMeta.label = {
                    'en': 'Commissioned',
                    'de': 'Beauftragt'
                };
                break;
            case 'cpPlanned':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'PLAN initial',
                    'de': 'PLAN Initial'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'cpSupplementary':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'PLAN deviation',
                    'de': 'PLAN Abweichung'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'cpForecast':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'FORECAST',
                    'de': 'PROGONOSE'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'cpActual':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'ACTUAL',
                    'de': 'IST'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'cpProvisional':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'PROVISIONAL',
                    'de': 'PROVISORISCH'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            case 'cpRemaining':
                columnMeta.type = 'money';
                columnMeta.label = {
                    'en': 'REMAINING',
                    'de': 'AUSSTEHEND'
                };
                columnMeta.format = {
                    'currencyCode': currency
                };
                break;
            default:
                let message = 
                    "Could not determine type and label for item " + item +
                    " in function '_getCPColumnMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "60C7E3E14BBF453DA00D1D19F21A6429", message);
        }
        return columnMeta;
    }

    // PROJECT SUMMARY

    function _filterProjectsSummaries(prjSummaries, filterBy) {
        if (filterBy !== 'all') {   
            // Filter by lifecycle status
            if (filterBy.lcyStatus && filterBy.lcyStatus !== 'all') {
                prjSummaries = prjSummaries.filter(obj =>
                    filterBy.lcyStatus.includes(obj.project.status));
            }
            // Filter by properties
            function _filterByProperties(_getObj, props) {
                // Iterate over all properties
                Object.keys(props).forEach(propKey => {
                    // Filter by property values
                    prjSummaries = prjSummaries.filter(obj => {
                        // Get property obj
                        let subObj = _getObj(obj);
                        if (!subObj) {
                            let message = 
                                "Failed to load the subobject with type " +
                                subObjType + " for the project with the id " +
                                obj.project.id + " in function " +
                                "'_filterProjectsSummaries'.";
                            pqfLib.utils.misc.log(
                                1, "error", "29519B93FAA74F04AF6D24E57DF73BC5",
                                message);
                            return false;
                        }
                        let propObj = subObj.properties.find(prop =>
                            prop.key === propKey);
                        if (!propObj) {
                            let message = 
                                "Property with the id " + propKey +
                                " couldn't be found for the project with the " +
                                "id " + obj.project.id + " in function " +
                                "'_filterProjectsSummaries'.";
                            pqfLib.utils.misc.log(
                                1, "error", "1105F3709BB6473EBBCCB66EDFEB1916",
                                message);
                            return false;
                        }
                        return props[propKey].includes(propObj.value);
                    });
                });
            }
            if (filterBy.properties) {
                // Project properties
                if (filterBy.properties.ofProject) {
                    // Iterate over all properties
                    _filterByProperties(
                        obj => obj.project, filterBy.properties.ofProject);
                }
                // Subobject properties
                if (filterBy.properties.ofSubObjects) {
                    // Iterate over all subobjects
                    Object.keys(filterBy.properties.ofSubObjects).forEach(
                        subObjType => {
                            // Iterate over all properties
                            _filterByProperties(
                                obj => obj.subObjects.find(
                                    subObj => subObj.type === subObjType), 
                                filterBy.properties.ofSubObjects[subObjType]);
                        }
                    );
                }
            }
        }
        return prjSummaries;
    }

    /**
     * Construct the meta data for the project summary.
     * 
     * @param {Object} requiredColumns - The columns to be displayed in the
     *   project summary. Its form is extensively described in the function
     *   _getPortfolioOverview.
     * @param {String} currencyCode - The currency in which the costs are
     *   displayed.
     * @returns {Object} - The project summary meta data.
     */
    function _constructProjectSummaryMeta(requiredColumns, currencyCode) {
        // Apply default filter
        if (!requiredColumns || requiredColumns === 'all') {
            requiredColumns = {
                "identification": "all",
                "project": "all",
                "subObjects": "all",
                "costs": "all",
                "relations": "all"
            }
        }
        // Handle "subObjects" === "all"
        if (requiredColumns.subObjects === 'all') {
            // Load all sub object types
            let subObjectTypes = pqfLib.utils.apiFunc.exec(
                Pqf.pm, Pqf.pm.getProjectSubObjTypes);
            if (!subObjectTypes) {
                let message = 
                    "Could not load project subobject types in function " +
                    "'_constructProjectSummaryMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "F27669AA6DD04C3F89263DAC380529C2", message);
                return null;
            }
            requiredColumns.subObjects = {};
            subObjectTypes.forEach(subObjType => {
                requiredColumns.subObjects[subObjType.id] = "all";
            });
        }
        let projectSummaryMeta = {
            "categories": [],
            "columns": []
        };
        // Handle "Identification" columns
        if (requiredColumns.identification) {
            projectSummaryMeta.categories.push({
                "id": "identification",
                "label": null
            });
            (requiredColumns.identification === "all" ?
                implementedItems.project.identification : 
                requiredColumns.identification
            ).forEach(item => {
                let columnMeta = _getProjectIdentificationColumnMeta(item);
                columnMeta.id = item;
                columnMeta.catid = "identification";
                projectSummaryMeta.columns.push(columnMeta);
            });
        }
        // Handle "Project" columns
        if (requiredColumns.project) {
            // Load meta data for project properties
            let meta = _getObjectPropertyMeta(
                "Project", requiredColumns.project);
            // Append to projectSummaryMeta
            projectSummaryMeta.categories =
                projectSummaryMeta.categories.concat(meta.categories);
            projectSummaryMeta.columns =
                projectSummaryMeta.columns.concat(meta.columns);
        }
        // Handle "SubObjects" columns
        if (requiredColumns.subObjects) {
            // Load project property definitions (for default categories)
            let prjPropDefs = pqfLib.utils.apiFunc.exec(
                Pqf.pf, Pqf.pf.getPropertyDefinitions, "Project");
            if (!prjPropDefs) {
                let message = 
                    "Could not load project property definitions in function " +
                    "'_constructProjectSummaryMeta'.";
                pqfLib.utils.misc.log(
                    1, "error", "4A027AAD39144121B54508B87BD9B02F", message);
                return null;
            }
            Object.keys(requiredColumns.subObjects).forEach(subObjType => {
                if (!requiredColumns.subObjects[subObjType]) {
                    return;
                }
                // Check for "default category"
                let defaultCatPropDef = prjPropDefs.find(propDef => {
                    if (!propDef.constraint.basetype === "layout.group") {
                        return false;
                    };
                    let contentProp = propDef.constraint.properties.find(
                        prop => prop.key === "content");
                    if (!contentProp) { return false; }
                    let typeProp = propDef.constraint.properties.find(
                        prop => prop.key === "type");
                    if (!typeProp) { return false; }
                    return (
                        contentProp.value === "subobject" &&
                        typeProp.value === subObjType);
                });
                let defaultCat = defaultCatPropDef ? 
                    defaultCatPropDef.id : null;
                // Load meta data for sub object
                let meta = _getObjectPropertyMeta(
                    subObjType, requiredColumns.subObjects[subObjType], 
                    defaultCat);
                // Append to projectSummaryMeta
                projectSummaryMeta.categories = 
                    projectSummaryMeta.categories.concat(meta.categories);
                projectSummaryMeta.columns =
                    projectSummaryMeta.columns.concat(meta.columns);
            });
        }
        // Handle "Costs" columns
        if (requiredColumns.costs) {
            let meta = _constructMetaFromCostColumnRequirements(
                requiredColumns.costs, currencyCode);
            // Append to projectSummaryMeta
            projectSummaryMeta.categories =
                projectSummaryMeta.categories.concat(meta.categories);
            projectSummaryMeta.columns =
                projectSummaryMeta.columns.concat(meta.columns);
        }
        // Handle "Relations" columns
        if (requiredColumns.relations) {
            let meta = _constructRelMetaFromRelationRequirements(
                requiredColumns.relations);
            // Append to projectSummaryMeta
            projectSummaryMeta.categories =
                projectSummaryMeta.categories.concat(meta.categories);
            projectSummaryMeta.columns =
                projectSummaryMeta.columns.concat(meta.columns);
        }
        return projectSummaryMeta;
    }

    /**
     * Simple function to map the given item to the corresponding Project JTF
     * column meta.
     * 
     * @param {String} item - The item to be mapped.
     * @returns {Object} - An object containing the Project JTF column meta 
     *   info.
     */
    function _getProjectIdentificationColumnMeta(item) {
        let columnMeta = {};
        switch (item) {
            case 'prjCode':
                columnMeta.type = 'string';
                columnMeta.label = {
                    'en': 'ID',
                    'de': 'ID'
                };
                columnMeta.options = {
                    'width': 50
                };
                break;
            case 'prjName':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Name',
                    'de': 'Name'
                };
                columnMeta.options = {
                    'width': 200
                };
                columnMeta.format = {
                    'showIcon': false
                };
                break;
            case 'prjDesc':
                columnMeta.type = 'html';
                columnMeta.label = {
                    'en': 'Description',
                    'de': 'Beschreibung'
                };
                columnMeta.options = {
                    'width': 200
                };
                break;
            case 'prjStatus':
                columnMeta.type = 'enum';
                columnMeta.label = {
                    'en': 'Status',
                    'de': 'Status'
                };
                columnMeta.format = {
                    'showIcon': true
                };
                break;
            default:
                let message = 
                    "The function '_getProjectIdentificationColumnMeta' can " +
                    "not handle the item " + item + ".";
                pqfLib.utils.misc.log(
                    1, "error", "8EFD053DDBD44F7097CEA728BD7161C5", message);
        }
        return columnMeta;
    }

    /**
     * Load the meta data for the given object type and filter. The layout.group
     * properties are considered as categories.
     * 
     * @param {String} objectType - The object type for which the meta data
     *   should be loaded.
     * @param {Array|string} [filterByPropIds = 'all'] - The property IDs to be 
     *   considered. If 'all', all properties are considered.
     * @param {String} [defaultCat = null] - The default category for the
     *   first properties. This is "overwritten" as soon as a layout.group
     *   property is encountered.
     * @returns {Object} - The meta data for the given object type and filter.
     */
    function _getObjectPropertyMeta(objectType, filterByPropIds, defaultCat) {
        // Apply default filterByPropIds
        if (!filterByPropIds) { filterByPropIds = 'all' };
        // Load property definitions
        let propDefs = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getPropertyDefinitions, objectType);
        if (!propDefs) {
            let message = 
                "Could not load property definitions for object type " +
                objectType + " in function '_getObjectPropertyMeta'.";
            pqfLib.utils.misc.log(
                1, "error", "07DAD99B98B24584B583DB9E01B92FA0", message);
            return null;
        }
        // Filter property definitions according to filterByPropIds
        if (filterByPropIds !== 'all') {
            propDefs = propDefs.filter(obj => filterByPropIds.includes(obj.id));
        }
        return _constructMetaFromPropertyDefinitions(propDefs, defaultCat);
    }

    /**
     * Construct the meta data for the given property definitions. The
     * layout.group properties are considered as categories.
     * 
     * @param {Array} propDefs - The property definitions.
     * @param {String} [defaultCat = null] - The default category for the
     *   first properties. This is "overwritten" as soon as a layout.group
     *   property is encountered.
     * @returns {Object} - The meta data for the given property definitions.
     */
    function _constructMetaFromPropertyDefinitions(propDefs, defaultCat) {
        let meta = {
            "categories": [],
            "columns": []
        };
        let currentCat = defaultCat;
        propDefs.forEach(propDef => {
            switch (propDef.constraint.basetype) {
                case "layout.placeholder": 
                case "layout.space":
                case "layout.line":
                case "layout.tab":
                    break;
                case "layout.group":
                    meta.categories.push({
                        "id": propDef.id,
                        "label": propDef.label
                    });
                    currentCat = propDef.id;
                    break;
                default:
                    meta.columns.push({
                        "id": propDef.id,
                        "catid": currentCat,
                        "type": propDef.constraint.basetype,
                        "label": propDef.label
                    });
            }
        });
        return meta;
    }

    /**
     * Construct the meta data for the cost columns in the project summary.
     * 
     * @param {Object} costsColReqs - The cost column requirements. Its form is
     *   extensively described in the function _getPortfolioOverview.
     * @param {String} currencyCode - The currency in which the costs are
     *   displayed.
     * @returns {Object} - The meta data for the cost columns in the project
     *   summary.
     */
    function _constructMetaFromCostColumnRequirements(
        costsColReqs, currencyCode) {
        let meta = {
            "categories": [
                {
                    "id": "costs",
                    "label": { 'en': 'Costs', 'de': 'Kosten' }
                }
            ],
            "columns": []
        };
        if (costsColReqs !== 'all' && (
                costsColReqs.costFlows == null || 
                costsColReqs.costFlows.length === 0)
        ) {
            let message =
                "No cost flows specified when calling function " +
                "'_constructMetaFromCostColumnRequirements'. " +
                "Therefore, no cost columns will be included in the project " +
                "summary.";
            pqfLib.utils.misc.log(
                1, "warning", "01632AF23BE14155A9EE84224B62C933", message);
            return meta;
        }
        // Handle "Total" columns
        ((costsColReqs === 'all' || costsColReqs.costFlows === 'all') ? 
            implementedItems.project.costFlows : costsColReqs.costFlows
        ).forEach(item => {
            meta.columns.push({
                "id": item + "_total",
                "catid": "costs",
                "type": "money",
                "label": {
                    'en': item + ' (total)',
                    'de': item + ' (Total)'
                },
                "format": {
                    'currencyCode': currencyCode
                }
            })
        });
        // Handle "Cost Type" columns
        if (costsColReqs.costTypes === 'all' || (
                typeof costsColReqs.costTypes === 'object' &&
                costsColReqs.costTypes.length > 0)
        ) {
            let message =
                "Cost Type columns are not (yet) supported by the function " +
                "_constructMetaFromCostColumnRequirements. These " +
                "specifications are simply ignored.";
            pqfLib.utils.misc.log(
                debug_level, "warn", "677FC9AE0F4D4C2899A11B47DA92678B", message);
        }
        // Handle "Time range" columns
        if (costsColReqs.timeRanges === 'all' || (
                typeof costsColReqs.timeRanges === 'object' &&
                costsColReqs.timeRanges.length > 0)
        ) {
            let message =
                "Time range columns are not (yet) supported by the function " +
                "_constructMetaFromCostColumnRequirements. These " +
                "specifications are simply ignored.";
            pqfLib.utils.misc.log(
                debug_level, "warn", "78E797F1063C4778B8B7AECA49786601", message);
        }
        return meta;
    }   

    /**
     * Construct the meta data for the relation columns in the project
     * summary.
     * 
     * @param {Object} relColReqs - The relation column requirements. Its form
     *   is extensively described in the function _getPortfolioOverview.
     * @returns {Object} - The meta data for the relation columns in the project
     *   summary. The column id is the relation type ID + direction (forward or
     *   backward).
     */
    function _constructRelMetaFromRelationRequirements(relColReqs) {
        let meta = {
            "categories": [
                {
                    "id": "relations",
                    "label": { 'en': 'Relations', 'de': 'Beziehungen' }
                }
            ],
            "columns": []
        }
        // Load all relation types
        let relTypes = pqfLib.utils.apiFunc.exec(
            Pqf.pf, Pqf.pf.getAllRelationTypesForType, "Project");
        if (!relTypes) {
            let message =
                "Could not load relation types in function " +
                "'_constructRelMetaFromRelationRequirements'.";
            pqfLib.utils.misc.log(
                1, "error", "4AA4C19D2E9C467083674551E3D2F8DC", message);
            return null;
        }
        // Filter relation types according to relColReqs
        if (relColReqs !== 'all') {
            relTypes = relTypes.filter(obj => relColReqs.includes(obj.id)); 
            relTypes.sort((a, b) => {
                if (relColReqs.indexOf(a.id) < relColReqs.indexOf(b.id)) {
                    return -1;
                } else if (
                    relColReqs.indexOf(a.id) > relColReqs.indexOf(b.id)
                ) {
                    return 1;
                } else {
                    return 0;
                }
            });
        } else{
            // If "all", only explicit relation types are considered
            relTypes = relTypes.filter(relType => relType.explicit);
        }
        // Add relation types to meta
        relTypes.forEach(relType => {
            let dirAndLabel = [];
            if (relType.sourceTypes.includes('Project') &&
                relType.nameForward
            ) {
                dirAndLabel.push({
                    "dir": "forward",
                    "label": relType.nameForward
                });
            }
            if (relType.targetTypes.includes('Project') &&
                relType.nameForward
            ) {
                dirAndLabel.push({
                    "dir": "backward",
                    "label": relType.nameBackward
                });
            }
            dirAndLabel.forEach(dirAndLabel => {
                meta.columns.push({
                    "id": relType.id + "_" + dirAndLabel.dir,
                    "catid": "relations",
                    "type": "multienum",
                    "label": {
                        "en": dirAndLabel.label
                    },
                    "options": { "width": 100 },
                    "format": { "showIcon": true }
                });
            });
        });
        // Filter out duplicates
        meta.columns = meta.columns.filter((col, index, self) =>
            index === self.findIndex(c => c.id === col.id)
        );
        // Sort columns by label
        meta.columns.sort((a, b) => {
            if (a.label.en < b.label.en) return -1;
            if (a.label.en > b.label.en) return 1;
            return 0;
        });
        return meta;
    }

    /**
     * Returns the project-summaries-jtf data for the given project summaries 
     * and filter options.
     * 
     * @param {Array} prjSummaries - The project summaries.
     * @param {Object} requiredColumns - The columns to be displayed in the
     *   project summary. Its form is extensively described in the function
     *   _getPortfolioOverview.
     * @param {Object} meta - The meta data for the project summary.
     * @param {String} currencyCode - The currency in which the costs are
     *   displayed.
     * @returns {Array} - The project-summaries-jtf data.
     */
    function _pushProjectsSummariesData(
        prjSummaries, requiredColumns, meta, currencyCode) {
        let data = [];
        let idt_requiredItems = meta.columns.filter(col =>
            col.catid === "identification").map(col => col.id);
        let cos_requiredItems = meta.columns.filter(col =>
            col.catid === "costs").map(col => col.id);
        let rel_requiredItems = meta.columns.filter(col =>
            col.catid === "relations").map(col => col.id);
        prjSummaries.forEach(prjSummary => {
            let uuids = pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1);
            let row = {
                "id": uuids.newUuids[0],
                "data": []
            };
            // Handle "Identification" columns
            if (requiredColumns == "all" || requiredColumns.identification) {
                row.data = row.data.concat(
                    _getProjectIdentificationData(
                        prjSummary, idt_requiredItems));
            }
            // Handle "Project" columns
            function _pushProps(props) {
                // Filter properties that are not in meta
                props = props.filter(prop => meta.columns.map(
                    col => col.id).includes(prop.key));
                // Get the property data and push it to the row
                let propData = _getPropertiesData(props);
                row.data = row.data.concat(propData);
            }
            if (requiredColumns == "all" || requiredColumns.project) {
                _pushProps(prjSummary.project.properties);
            }
            // Handle "SubObjects" columns
            if (requiredColumns == "all" || requiredColumns.subObjects) {
                let subObjects = requiredColumns.subObjects;
                if (requiredColumns == "all") {
                    let subObjectTypes = pqfLib.utils.apiFunc.exec(
                        Pqf.pm, Pqf.pm.getProjectSubObjTypes);
                    if (!subObjectTypes) {
                        let message =
                            "Failed to load subobject types in function " +
                            "'_pushProjectsSummariesData'.";
                        pqfLib.utils.misc.log(
                            1, "error", "9A28264E14334FE5B47CF67A075C07CD",
                            message);
                        return;
                    }
                    subObjects = {};
                    subObjectTypes.forEach(subObjType => {
                        subObjects[subObjType.id] = "all";
                    });
                }
                Object.keys(subObjects).forEach(subObjType => {
                    let subObject = prjSummary.subObjects.find(
                        obj => obj.type === subObjType);
                    if (!subObject) {
                        // Handle case where subobject is not available
                        let subObjMeta = _getObjectPropertyMeta(subObjType);
                        let fakeProps = subObjMeta.columns.map(col => {
                            return {
                                "key": col.id,
                                "value": null
                            };
                        });
                        subObject = { "properties": fakeProps };
                    }
                    _pushProps(subObject.properties);
                });
            }
            // Handle "Costs" columns
            if (requiredColumns == "all" || requiredColumns.costs) {
                let costData = _getProjectCostsData(
                    prjSummary, cos_requiredItems, currencyCode);
                row.data = row.data.concat(costData);
            }
            data.push(row);
            // Handle "Relations" columns
            if (requiredColumns == "all" || requiredColumns.relations) {
                let relData = _getRelationsData(
                    prjSummary, rel_requiredItems);
                row.data = row.data.concat(relData);
            }
        });
        return data;
    }

    /**
     * Get the project summary data for the given project summaries required 
     * columns and filter options.
     * 
     * @param {Array} prjSummaries - The project summaries.
     * @param {Object} requiredColumns - The identification columns to be 
     *   displayed in the project summary jtf.
     * @returns {Array} - The project summary data.
     */
    function _getProjectIdentificationData(prjSummary, requiredItems) {
        let row = [];
        requiredItems.forEach(item => {
            switch (item) {
                case 'prjCode':
                    row.push(prjSummary.project.code);
                    break;
                case 'prjName':
                    row.push(_toEnum(prjSummary.project));
                    break;
                case 'prjDesc':
                    row.push(prjSummary.project.description);
                    break;
                case 'prjStatus':
                    row.push(_toEnum(pqfLib.utils.apiFunc.exec(
                        Pqf.lcy, Pqf.lcy.getState, prjSummary.project.status)));
                    break;
                default:
                    let message =
                        "Unknown / not yet implemented Project JTF column " +
                        item + " in function '_getProjectIdentificationData'.";
                    pqfLib.utils.misc.log(
                        debug_level, "warn", "BA33E472DA574D94AAA472411B8F6011",
                        message);
            }
        });
        return row;
    }

    /**
     * Get the costs data for the given project summary and required items.
     * 
     * @param {Object} prjSummary - The project summary.
     * @param {Array} requiredItems - The required items (column IDs) for the
     *   costs.
     * @param {String} currencyCode - The currency in which the costs are
     *   displayed.
     * @returns {Array} - The costs data.
     */
    function _getProjectCostsData(prjSummary, requiredItems, currencyCode) {
        let row = [];
        // Define mapping between column IDs and attribute names
        const colId2Attr = {
            "BUDGET": "costsBudget",
            "PLAN": "costsPlanned",
            "ACTUAL": "costsActual",
            "PROVISIONAL": "costsExpectedPending",
            "ACTUAL_PLUS_PROVISIONAL": "actPlsProv",
            "REMAINING": "costsRemaining",
            "FORECAST": "costsForecast"
        };
        // Handle "Total" columns
        let requiredItems_total = requiredItems.filter(item =>
            item.endsWith("_total"));
        requiredItems_total.forEach(item => {
            let attrName = colId2Attr[item.substring(0, item.length - 6)];
            let amount = null;
            if (attrName === "actPlsProv") {
                amount = 
                    (prjSummary.costsActual ? 
                        prjSummary.costsActual.amount : 0) + 
                    (prjSummary.costsExpectedPending ? 
                        prjSummary.costsExpectedPending.amount : 0);
            } else {
                amount = prjSummary[attrName] ? 
                    prjSummary[attrName].amount : 0;
            }
            row.push({
                "amount": amount,
                "currencyCode": currencyCode
            });
        });
        // Handle "Cost Type" columns
        // TODO!
        // Handle "Time range" columns
        // TODO!
        return row;
    }

    function _getRelationsData(prjSummary, requiredItems) {
        let row = [];
        requiredItems.forEach(item => {
            let item_arr = item.split("_");
            let relTypeId = item_arr[0];
            let direction = item_arr[1];
            let rels = [];
            if (direction === "forward") {
                rels = prjSummary.relations.filter(rel =>
                    rel.relationType === relTypeId &&
                    rel.source.id === prjSummary.project.id);
            } else if (direction === "backward") {
                rels = prjSummary.relations.filter(rel =>
                    rel.relationType === relTypeId &&
                    rel.target.id === prjSummary.project.id);
            } else {
                let message =
                    "Unknown direction " + direction + " in function " +
                    "'_getRelationsData'.";
                pqfLib.utils.misc.log(
                    1, "error", "B5EFD79924F447DCA4891D65211BF58F", message);
            }
            // Map relations to source / target objects
            let objsPerRel = _getObjectsPerRelation(
                rels, prjSummary.project.id);
            // Push returned objects to row
            let objs = objsPerRel[relTypeId] ?
                (objsPerRel[relTypeId][direction] ?
                    objsPerRel[relTypeId][direction] : []) : [];
            row.push(objs);
        });
        return row;
    }

    return {
        'setDebugMode': _setDebugMode,
        'getProjectSummary': _getProjectSummary,
        'json': {
            'getDetails': _getDetails,
            'getRelations': _getRelations
        },
        'jtf': {
            'getGantt': _getGantt,
            'getTodos': _getTodos,
            'getRisks': _getRisks,
            'getCostpositions': _getCostpositions,
            'getCPTimelines': _getCPTimelines,
            'getPortfolioOverview': _getPortfolioOverview,
            'getProjectsOverview': _getProjectsOverview,
            'getProjectsSummaries': _getProjectsSummaries,
            'getProjects': _getProjects,
            'getRelations': _getRelations_old,
            'getCostFlowTimelines': _getCostFlowTimelines
        },
        'tools': {
            'getPropertiesData': _getPropertiesData,
            'getPropertiesSummary': _getPropertiesSummary,
            'getClassSchemeData': _getClassSchemeData,
            'getIndicatorDimensionData': _getIndicatorDimensionData,
            'getIndicatorDetailData': _getIndicatorDetailData,
            'getObjectsPerRelation': _getObjectsPerRelation,
            'getTaskData': _getTaskData,
            'getTodoData': _getTodoData,
            'getRiskData': _getRiskData,
            'getCPData': _getCPData,
            'getCPTimelineData': _getCPTimelineData,
            'getProjectMeta': _getProjectMeta,
            'getObjectTree': _getObjectTree,
            'flattenObjectTree': _flattenObjectTree,
            'getWorkItmesWithTreeInfo': _getWorkItmesWithTreeInfo,
            'getProjectList': _getProjectList,
            'getCurrentUser': _getCurrentUser,
            'getTimestamp': _getTimestamp,
            'createHash': _createHash,
            'mapCurrency': _mapCurrency,
            'saveJTF': _saveJTF,
            'simplifyJTF': _simplifyJTF,
            'reduceJTF2Columns': _reduceJTF2Columns,
            'restructureJTFColumns': _restructureJTFColumns,
            'simplifyJTFColumn': _simplifyJTFColumn,
            'JTF2Table': _JTF2Table,
            'exec': pqfLib.utils.apiFunc.exec,
            'exec_arr': pqfLib.utils.apiFunc.exec_arr,
            'getParamKeys': _getParamKeys,
            'getImplementedItems': _getImplementedItems,
            'toEnum': pqfLib.utils.misc.toEnum
        }
    };
}) ();