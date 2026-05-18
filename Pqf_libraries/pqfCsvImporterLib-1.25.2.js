/**
 * @name PQFORCE JS CSV Import Library
 * @version 1.25.2
 * @file pqfCsvImporterLib.js
 * @description This library serves as a basis for the CSV Importer.
 * See the <a href="https://community.pqforce.com/">Community</a> for further details.
 * @author DH (INTRASOFT), LI (INTRASOFT)
 * @pqfId 68E43A6391034CC39DE91E6A2C5BD823
 * @created 2023-01-22
 * @modified 2025-12-11
 * @requires e430d37e331848788acbf975d600dd8e (pqfBasicLib.js), moment.js, CSV2JSON.js, JSON2HTML.js
 */

const pqfCsvImportLib = (function () {
    "use strict";

	const DEBUG = true;
	
	const IMPORT_OBJECT_TYPE_PROPERTY_ID = "doc-import-type";
	const PROCESSING_TYPE_PROPERTY_ID = "doc-processing-type";
	const IS_IMPORTABLE_PROPERTY_ID = "doc-is-importable";
	const DELIMITER_PROPERTY_ID = "doc-delimiter-type";
	const DO_PROCESS_PROPERTY_ID = "doc-do-process";
	const IMPORT_LOG_PROPERTY_ID = "doc-processing-log";
	
	const MAX_NUM_IMPORT_LOGS = 5; // Keep this number not too high. A big log slows down saving and rendering it.
	
	const IMPORT_OBJECT_TYPE_IDS = Pqf.pf.getEnumValuesTranslated("IMPORT-OBJECT-TYPE").map(x => x.id);
	const PROCESSING_STEPS = ["FAILED", "SKIPPED", "INVALID", "VALIDATED", "CREATED", "UPDATED", "DELETED"];
	const OBJECT_TYPES_WITH_SUBOBJECTS = ["Project"];
	const NOW = moment().format("DD.MM.YYYY HH:mm:ss");

	const CURRENCIES = Pqf.fco.getCurrencies();
	const DEFAULT_CURRENCY_ID = Pqf.fco.getHomeCurrency().id;

	const LOCATIONS = Pqf.res.getHolidayLocales();

	const INIT_STATE_PROJECT = Pqf.lcy.getTypeInitialState("Project");
	const INIT_STATE_SCENARIO = Pqf.lcy.getTypeInitialState("Scenario");
	const DEFAULT_COST_POS_NAME = "Sammelposition";
	const DEFAULT_COST_POS_NAME_CREATED = "Automat. angelegt beim Import von Ist-Positionen";
	
	const RES_LINK_TYPES = Pqf.res.getResourceLinkTypes();
	
	//-------------------------------------------
	// Private module variables (calculated once depending on the object type to be imported)
	//-------------------------------------------
	let _lifecycleStateSeparator = "/";
	let _csvSeparator = ";";
	let _whitespaceRegex = new RegExp("\\s", "g");
	let _whitespaceReplaceWith = "";
	let _maxNumRecordsPerRun = 100; // Default, can be set by public function setMaxNumRecordsPerRun(maxNumRecords)
	let _minNumSecondsPerRun = 60;
	let _shifts = null;
	let _standardWorktime = null;
	let _numShifts = null;
	let _standardHoursPerShift = null;
	
	//-------------------------------------------
	// Template for import logs
	//-------------------------------------------
	const JSON2HTML_LOG_TEMPLATE = {
		"<>": "li",
		"style": "font-size: 80%;",
		"html": [
			{
				"<>": "b",
				"text": "${user}, ${timestamp}"
			},
			{
				"<>": "ul",
				"html": [
					{
						"<>": "li",
						"{}": function () { return (this.processingInfo); },
						"html": [
							{
								"html": "${action}"
							}
						]
					},
					{
						"<>": "li",
						"{}": function () { return (this.processingInfo); },
						"html": [
							{
								"html": "${numRecordsProcessed}"
							}
						]
					},
					{
						"<>": "li",
						"{}": function () { return (this.processingInfo); },
						"html": [
							{
								"html": "${numRecordsRemaining}"
							}
						]
					},
					{
						"<>": "li",
						"{}": function () { return (this.processingInfo); },
						"html": [
							{
								"html": "${time}"
							}
						]
					}
				]
			}
		]
	};	

 	//-------------------------------------------
	// Import object definitions (expected CSV columns)
	//-------------------------------------------

    const PROJECT_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null, // will be true or false after application if *all* columns are valid
        "validationInfo": "", // will contain an information string after application
		"refs": { // will be an object with the names of the attributes that serve as the object/parent/superparent/source/target reference, e.g., "refs": {"objectRef": "code", "parentRef": "portfolio"}
			"objectRef": null,
			"parentRef": null
		},
        "columns": [
			{
                "name": "mainPortfolio",
                "pattern": "^(ProjectPortfolio)/(id)(:parentRef)$|^(ProjectPortfolio)/(name)(:exact|:includes|:isIncluded|:isIncludedInNonNumbers)(:parentRef)$|^(ProjectPortfolio)/([^/:]*)(:prop)(:exact|:includes|:isIncluded|:isIncludedInNonNumbers)(:parentRef)$",
                "mandatory": "1", // must be one of "?", "0+", "1", "1+"
                "csvHeadersFound": null, // will contain an array of objects of the form {"raw": string, "objectType": string, "subType": string, "attribute": string, "isProp": boolean, "isRef": boolean }
                "valid": null, // will be true or false after application
                "validationInfo": "" // will contain an information string after application
            },{
                "name": "otherPortfolio",
                "pattern": "^(ProjectPortfolio)/(id)(:[1-9])$|^(ProjectPortfolio)/(name)(:exact|:includes|:isIncluded)(:[1-9])$|^(ProjectPortfolio)/([^/:]*)(:prop)(:exact|:includes|:isIncluded)(:[1-9])$",
                "mandatory": "0+", // must be one of "?", "0+", "1", "1+"
                "csvHeadersFound": null, // will contain an array of objects of the form {"raw": string, "objectType": string, "subType": string, "attribute": string, "isProp": boolean, "isRef": boolean }
                "valid": null, // will be true or false after application
                "validationInfo": "" // will contain an information string after application
            }, {
                "name": "id",
                "pattern": "^(Project)/(id)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "code",
                "pattern": "^(Project)/(code)(:objectRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "name",
                "pattern": "^(Project)/(name)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "description",
                "pattern": "^(Project)/(description)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "property",
                "pattern": "^(Project)/([^/:]*)(:prop)(:enumId)?(:date)?(:enumName)?(:money)?(:ignoreWhitespace)?(:exact|:includes|:isIncluded)?(:objectRef)?$|^(Project)/([^/]*)/([^/:]*)(:prop)(:enumId)?(:date)?(:enumName)?(:money)?(:ignoreWhitespace)?(:exact|:includes|:isIncluded)?(:objectRef)?$",
                "mandatory": "0+",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "lifecycle",
                "pattern": "^(Project)/(LifecycleStates)/(id)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "startDate",
                "pattern": "^(ProjectScenario)/(startDate)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "endDate",
                "pattern": "^(ProjectScenario)/(endDate)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "copyScenario",
                "pattern": "^(ProjectScenario)/(copyId)(:withTodos)?(:withAllocations)?(:deleteActive)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "lifecycleScenario",
                "pattern": "^(ProjectScenario)/(LifecycleStates)/(id)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const PROJECT_SCENARIO_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"parentRef": null
		},
        "columns": [{
                "name": "project",
                "pattern": "^(Project)/(id)(:parentRef)$|^(Project)/(code)(:parentRef)$|^(Project)/(name)(:parentRef)$|^(Project)/([^/:]*)(:prop)(:parentRef)$|^(Project)/([^/]*)/([^/:]*)(:prop)(:parentRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(ProjectScenario)/(id)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "name",
                "pattern": "^(ProjectScenario)/(name)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "description",
                "pattern": "^(ProjectScenario)/(description)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "property",
                "pattern": "^(ProjectScenario)/([^/:]*)(:prop)(:enumId)?(:date)?(:objectRef)?$",
                "mandatory": "0+",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "maintask",
                "pattern": "^(MainTask)/(name)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "beg",
                "pattern": "^(MainTask)/(beg)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "end",
                "pattern": "^(MainTask)/(end)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
			}, {
                "name": "lifecycle",
                "pattern": "^(ProjectScenario)/(LifecycleStates)/(id)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
		]
    };

    const WORKITEM_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"superparentRef": null
		},
        "columns": [
			{
                "name": "project",
                "pattern": "^(Project)/(id)(:superparentRef)$|^(Project)/(code)(:superparentRef)$|^(Project)/(name)(:superparentRef)$|^(Project)/([^/:]*)(:prop)(:superparentRef)$|^(Project)/([^/]*)/([^/:]*)(:prop)(:superparentRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, 
            {
                "name": "id",
                "pattern": "^(WorkItem)/(id)(:parentRef)?(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "code",
                "pattern": "^(WorkItem)/(code)(:parentRef)?(:objectRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "name",
                "pattern": "^(WorkItem)/(name)(:parentRef)?(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "description",
                "pattern": "^(WorkItem)/(description)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "property",
                "pattern": "^(WorkItem)/([^/:]*)(:prop)(:enumId)?(:date)?(:parentRef)?(:objectRef)?$",
                "mandatory": "0+",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "startDate",
                "pattern": "^(WorkItem)/(startDate)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "endDate",
                "pattern": "^(WorkItem)/(endDate)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "parent",
                "pattern": "^(WorkItem)/(parent)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const PROJECT_COSTS_ACTUAL_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"parentRef": null,
			"superparentRef": null
		},
        "columns": [{
                "name": "project",
                "pattern": "^(Project)/(id)(:superparentRef)$|^(Project)/(code)(:superparentRef)$|^(Project)/(name)(:superparentRef)$|^(Project)/([^/:]*)(:prop)(:superparentRef)(:exact|:includes|:isIncluded)?$|^(Project)/([^/]*)/([^/:]*)(:prop)(:superparentRef)(:exact|:includes|:isIncluded)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "costsPosition",
                "pattern": "^(ProjectCostsPosition)/(id)(:parentRef)$|^(ProjectCostsPosition)/(costsType)(:parentRef)(:exact|:includes|:isIncluded)?(:createIfMissing)?$|^(ProjectCostsPosition)/([^/:]*)(:prop)(:parentRef)(:exact|:includes|:isIncluded)?(:createIfMissing)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(ProjectCostsActual)/(id)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "name",
                "pattern": "^(ProjectCostsActual)/(name)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "description",
                "pattern": "^(ProjectCostsActual)/(description)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "amount",
                "pattern": "^(ProjectCostsActual)/(amount)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "currencyCode",
                "pattern": "^(ProjectCostsActual)/(currencyCode)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "timeOfPayment",
                "pattern": "^(ProjectCostsActual)/(timeOfPayment)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "property",
                "pattern": "^(ProjectCostsActual)/([^/:]*)(:prop)(:enumId)?(:date)?(:objectRef)?$",
                "mandatory": "0+",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const PROJECT_EFFORT_ACTUAL_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"parentRef": null
		},
        "columns": [{
                "name": "project",
                "pattern": "^(Project)/(id)(:parentRef)$|^(Project)/(code)(:parentRef)$|^(Project)/(name)(:parentRef)$|^(Project)/([^/:]*)(:prop)(:parentRef)(:exact|:includes|:isIncluded)?$|^(Project)/([^/]*)/([^/:]*)(:prop)(:parentRef)(:exact|:includes|:isIncluded)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "workItem",
                "pattern": "^(ProjectWorkItem)/(id)$|^(ProjectWorkItem)/(code)(:ignoreIfMissing)?$|^(ProjectWorkItem)/(name)(:exact|:includes|:isIncluded)?(:ignoreIfMissing)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resource",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(name)$|^(Resource)/(HRM-RES-TYP-EMP)/([^/:]*)(:prop)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(ProjectEffortActual)/(id)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "day",
                "pattern": "^(ProjectEffortActual)/(day)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "duration",
                "pattern": "^(ProjectEffortActual)/(duration)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "comment",
                "pattern": "^(ProjectEffortActual)/(comment)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const EMPLOYEE_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"parentRef": null,
			"targetRef": "-"
		},
		"columns": [{
                "name": "orgunit",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(id)(:parentRef)$|^(Resource)/(HRM-RES-TYP-OU)/(name)(:parentRef)$|^(Resource)/(HRM-RES-TYP-OU)/([^/:]*)(:prop)(:parentRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(id)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "name",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(name)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "description",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(description)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "linkType",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(linkType)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "email",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(email)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "username",
                "pattern": "^(User)/(name)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "userid",
                "pattern": "^(User)/(id)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "property",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/([^/:]*)(:prop)(:enumId)?(:date)?(:objectRef)?$",
                "mandatory": "0+",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "location",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(location)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "baseload",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(baseload)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "workload",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(workload)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "validAfter",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(validAfter)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "costPerHour",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(costPerHour)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "currencyCode",
                "pattern": "^(Resource)/(HRM-RES-TYP-EMP)/(currencyCode)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const ORGUNIT_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"parentRef": null
		},
		"columns": [{
                "name": "orgunit",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(id)(:parentRef)$|^(Resource)/(HRM-RES-TYP-OU)/(name)(:parentRef)$|^(Resource)/(HRM-RES-TYP-OU)/([^/:]*)(:prop)(:parentRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(id)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "name",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(name)(:objectRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "description",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(description)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "property",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/([^/:]*)(:prop)(:enumId)?(:date)?(:objectRef)?$",
                "mandatory": "0+",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "location",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(location)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "baseload",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(baseload)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "workload",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(workload)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "validAfter",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(validAfter)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "costPerHour",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(costPerHour)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "currencyCode",
                "pattern": "^(Resource)/(HRM-RES-TYP-OU)/(currencyCode)$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const PROJECT_RELATION_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"sourceRef": null,
			"targetRef": null
		},
        "columns": [{
                "name": "type",
                "pattern": "^(RelationType)/(id)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(Relation)/(id)(:objectRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "projectId",
                "pattern": "^(Project)/(id)(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "projectCode",
                "pattern": "^(Project)/(code)(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "projectProp",
                "pattern": "^(Project)/([^/:]*)(:prop)(:ignoreWhitespace)?(:exact|:includes|:isIncluded)?(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "projectSubobjProp",
                "pattern": "^(Project)/([^/]*)/([^/:]*)(:prop)(:ignoreWhitespace)?(:exact|:includes|:isIncluded)?(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceType",
                "pattern": "^(ResourceType)/(id)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceId",
                "pattern": "^(Resource)/(id)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceName",
                "pattern": "^(Resource)/(name)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceProp",
                "pattern": "^(Resource)/([^/:]*)(:prop)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const PROJECTPORTFOLIO_RELATION_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"sourceRef": null,
			"targetRef": null
		},
        "columns": [{
                "name": "type",
                "pattern": "^(RelationType)/(id)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "id",
                "pattern": "^(Relation)/(id)(:objectRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "portfolioId",
                "pattern": "^(ProjectPortfolio)/(id)(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "portfolioName",
                "pattern": "^(ProjectPortfolio)/(name)(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "portfolioProp",
                "pattern": "^(ProjectPortfolio)/([^/:]*)(:prop)(:sourceRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceType",
                "pattern": "^(ResourceType)/(id)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceId",
                "pattern": "^(Resource)/(id)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceName",
                "pattern": "^(Resource)/(name)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "resourceProp",
                "pattern": "^(Resource)/([^/:]*)(:prop)(:targetRef)?$",
                "mandatory": "?",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }
        ]
    };

    const ALLOCATION_CSV_IMPORT_STRUCTURE_TEMPLATE = {
        "valid": null,
        "validationInfo": "",
		"refs": {
			"objectRef": null,
			"superparentRef": null,
			"parentRef": null,
			"targetRef": null
		},
        "columns": [{
                "name": "id",
                "pattern": "^(MacroAllocation)/(id)(:objectRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
                "name": "project",
                "pattern": "^(Project)/(id)(:superparentRef)$|^(Project)/(code)(:superparentRef)$|^(Project)/(name)(:superparentRef)$|^(Project)/([^/:]*)(:prop)(:superparentRef)$|^(Project)/([^/]*)/([^/:]*)(:prop)(:superparentRef)$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
				"name": "workItem",
				"pattern": "^(WorkItem)/(id)(:parentRef)?$|^(WorkItem)/(code)(:parentRef)?$|^(WorkItem)/(name)(:parentRef)?$|^(WorkItem)/([^/:]*)(:prop)(:parentRef)?$",
				"mandatory": "1",
				"csvHeadersFound": null,
				"valid": null,
				"validationInfo": ""
			}, {
                "name": "resource",
                "pattern": "^(Resource)/(id)(:targetRef)?$|^(Resource)/(code)(:targetRef)?$|^(Resource)/(name)(:targetRef)?$|^(Resource)/([^/:]*)(:prop)(:targetRef)?$",
                "mandatory": "1",
                "csvHeadersFound": null,
                "valid": null,
                "validationInfo": ""
            }, {
				"name": "allocationAmount",
				"pattern": "^(Allocation)/(amount)$",
				"mandatory": "1",
				"csvHeadersFound": null,
				"valid": null,
				"validationInfo": ""
			}, {
				"name": "allocationUnit",
				"pattern": "^(Allocation)/(unit)$",
				"mandatory": "1",
				"csvHeadersFound": null,
				"valid": null,
				"validationInfo": ""
			}
        ]
    };

	//-------------------------------------------
	// Public functions of this library
	//-------------------------------------------

	function _setCsvSeparator(separator) {
		_csvSeparator = separator;
	}
	
	function _setMaxNumRecordsPerRun(maxNumRecords) {
		_maxNumRecordsPerRun = maxNumRecords;
	}
	
	function _setMinNumSecondsPerRun(minNumSeconds) {
		_minNumSecondsPerRun = minNumSeconds;
	}
	
	function _markLibraryDocAsImportable(doc, folderIds) {
		let isImportable = null;
		if (typeof folderIds === 'string' || folderIds instanceof String) {
			folderIds = [folderIds];
		}
		if(folderIds.includes(doc.parentFolder)) {
			if(doc.type == "LibraryModule/DocumentLink") {
				let attachmentStringMatches = doc.url.match(/\.\.\/PF\/V1\/Attachment\/(.*)\?name=/);
				if(attachmentStringMatches && attachmentStringMatches.length > 1) {
					let attachmentDetails = null;
					try {
						attachmentDetails = Pqf.pf.getAttachmentDetails(attachmentStringMatches[1]);
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
					if(attachmentDetails && attachmentDetails.mimeType == "text/csv") {
						isImportable = "X";
					}
				}
			}
			let prop = doc.properties.find(x => x.key == IS_IMPORTABLE_PROPERTY_ID);
			if(prop) {
				prop.value = isImportable;
				Pqf.pf.putDocumentLink("LibraryModule", "F78087A93A97432BA68DB4BB5531C141", doc.id, doc);
				if(isImportable) {
					DEBUG ? console.log("Document " + doc.name + " marked as importable.") : null;
					return true;
				}
			}
		} else {
			DEBUG ? console.log("Folder ID " + doc.parentFolder + " not in the list of monitored folders, which is " + JSON.stringify(folderIds)) : null;
		}
		return false;
	}
	
	function _processCsvDocument(doc, restrictionRules) {
		let timeStart = moment();
		let remSeconds = pqfLib.utils.misc.getRemainingJsQuota();
		let docProcessingSummary = {};
		let isImportable = doc.properties.find(x => x.key == IS_IMPORTABLE_PROPERTY_ID).value;
		let doProcess = doc.properties.find(x => x.key == DO_PROCESS_PROPERTY_ID).value;
		if(doc.type == "LibraryModule/DocumentLink" && isImportable && doProcess) {
			if(remSeconds < _minNumSecondsPerRun) {
				let minTimeRequired = pqfLib.utils.format.round(_minNumSecondsPerRun, 2);
				DEBUG ? console.log("Min time required: " + minTimeRequired + "s") : null;
				let warning = "Too little quota left to run this script (" + pqfLib.utils.format.round(remSeconds, 2) + "s, but " + minTimeRequired + "s required per run)";
				console.warn(warning);
				docProcessingSummary = {
					"action": warning,
					"numRecordsProcessed": "No records processed",
					"numRecordsRemaining": "Wait to get more quota (600s per hour)"
				};
			} else {
				DEBUG ? console.log("Timer started...") : null;
				// --------------------------------------------------
				// Start processing if document is importable (i.e., a CSV file) and checkbox is set
				// --------------------------------------------------
				
				// --------------------------------------------------
				// Get the import object type and the IDs of the container objects into which imports are allowed
				// --------------------------------------------------
				let importObjectType = _getImportObjectType(doc);
				DEBUG ? console.log("importObjectType = " + JSON.stringify(importObjectType)) : null;
				let containerObjectIds = _subsumedPermissions(importObjectType, restrictionRules);
				DEBUG ? console.log("containerObjectIds = " + JSON.stringify(containerObjectIds)) : null;
				
				if(!IMPORT_OBJECT_TYPE_IDS.includes(importObjectType)) {
					// --------------------------------------------------
					// Import object type not recognized
					// --------------------------------------------------
					docProcessingSummary = {
						"action": importObjectType ? "Invalid import object type " + importObjectType : "No import object type specified",
						"numRecordsProcessed": "No records processed",
						"numRecordsRemaining": "Check import configuration"
					};					
				} else if(containerObjectIds &&
						  ((containerObjectIds.portfolios && containerObjectIds.portfolios.length == 0) ||
						   (containerObjectIds.orgUnits && containerObjectIds.orgUnits.length == 0))) {
					// --------------------------------------------------
					// Import not allowed
					// --------------------------------------------------
					docProcessingSummary = {
						"action": "User not allowed to execute this kind of import",
						"numRecordsProcessed": "No records processed",
						"numRecordsRemaining": "Check your permissions"
					};
				} else {
					// --------------------------------------------------
					// Process CSV data (considering the restrictions)
					// --------------------------------------------------
					_processingCsvDocument(doc, importObjectType, containerObjectIds, docProcessingSummary, timeStart);
				}
			}
			// --------------------------------------------------
			// Uncheck document and write action log
			// --------------------------------------------------
			let quotaLeft = pqfLib.utils.format.round(remSeconds, 2);
			let timeTaken = pqfLib.utils.format.round(moment().diff(timeStart, "seconds", true), 2);
			DEBUG ? console.log("JS Quota left:     " + quotaLeft + "s") : null;
			docProcessingSummary.time = " Took <i>" + timeTaken + "s</i> (" + quotaLeft + "s left)";
			
			_postProcessingCsvDocument(doc, docProcessingSummary);
		}
	}
 
	function _subsumedPermissions(importObjectType, rules) {
		// Given an import object type and a set of restriction rules,
		// calculates a list of containers (array of object IDs) into which the user is allowed to import objects.
		// Note: null = any container, [] = no container
		let allowedContainers = {
			"portfolios": [],
			"orgUnits": []
		};
		rules.forEach(function(rule) {
			if(allowedContainers) {
				let newContainers = _getAllowedImportContainers(rule, importObjectType);
				if(newContainers) {
					if(newContainers.portfolios) {
						allowedContainers.portfolios = allowedContainers.portfolios.concat(newContainers.portfolios);
					} else {
						DEBUG ? console.log("Rule allows to import into any portfolio") : null;
						allowedContainers.portfolios = null;
					}
					if(newContainers.orgUnits) {
						allowedContainers.orgUnits = allowedContainers.orgUnits.concat(newContainers.orgUnits);
					} else {
						DEBUG ? console.log("Rule allows to import into any org unit") : null;
						allowedContainers.orgUnits = null;
					}
				} else {
					DEBUG ? console.log("Rule allows to import into any container") : null;
					allowedContainers = null;
				}
			}
		});
		return allowedContainers;
	}
	
	function _getAllowedImportContainers(rule, objectType) {
		DEBUG ? console.log("Checking restriction rule " + JSON.stringify(rule)) : null;
		let containers = {
			"portfolios": [],
			"orgUnits": []
		};
		let thisUser = Pqf.acm.getCurrentUser();
		let thisUserRoleIds = Pqf.acm.getUserRoleAssignments(thisUser.id).map(x => x.id);
		if(rule.users) {
			if(rule.users.includes(thisUser.name)) { // user is allowed
				DEBUG ? console.log("User " + thisUser.name + " is allowed") : null;
				if(rule.roles) {
					thisUserRoleIds.forEach(function(roleId) {
						if(rule.roles.includes(roleId)) { // user has permissive role
							DEBUG ? console.log("User has permissive role " + roleId) : null;
							if(rule.importRealm) {
								if(rule.importRealm.objectType == objectType) { // rule is applicable for the given object type
									if(rule.importRealm.containers) {
										if(rule.importRealm.containers.portfolios) {
											if(containers && containers.portfolios) { // update the containers
												containers.portfolios = containers.portfolios.concat(rule.importRealm.containers.portfolios);
											}
										} else {
											container.portfolios = null;
										}
										if(rule.importRealm.containers.orgUnits) {
											if(containers && containers.orgUnits) { // update the containers
												containers.orgUnits = containers.orgUnits.concat(rule.importRealm.containers.orgUnits);
											}
										} else {
											container.orgUnits = null;
										}
									} else { // any portfolio container is allowed for the given object type!
										containers = null;
									}
								}
							} else { // any import is allowed!
								containers = null;
							}
						}
					});
				} else { // any role is allowed
					if(rule.importRealm) {
						if(rule.importRealm.objectType == objectType) { // rule is applicable for the given object type
							if(rule.importRealm.containers) {
								if(rule.importRealm.containers.portfolios) {
									if(containers && containers.portfolios) { // update the containers
										containers.portfolios = containers.portfolios.concat(rule.importRealm.containers.portfolios);
									}
								} else {
									container.portfolios = null;
								}
								if(rule.importRealm.containers.orgUnits) {
									if(containers && containers.orgUnits) { // update the containers
										containers.orgUnits = containers.orgUnits.concat(rule.importRealm.containers.orgUnits);
									}
								} else {
									container.orgUnits = null;
								}
							} else { // any portfolio container is allowed for the given object type!
								containers = null;
							}
						}
					} else { // any import is allowed!
						containers = null;
					}
				}
			}
		} else { // any user is allowed
			DEBUG ? console.log("Any user is allowed, hence also " + thisUser.name) : null;
			if(rule.roles) {
				thisUserRoleIds.forEach(function(roleId) {
					if(rule.roles.includes(roleId)) { // user has permissive role
						DEBUG ? console.log("User has permissive role " + roleId) : null;
						if(rule.importRealm) {
							if(rule.importRealm.objectType == objectType) { // rule is applicable for the given object type
								if(rule.importRealm.containers) {
									if(rule.importRealm.containers.portfolios) {
										if(containers && containers.portfolios) { // update the containers
											containers.portfolios = containers.portfolios.concat(rule.importRealm.containers.portfolios);
										}
									} else {
										container.portfolios = null;
									}
									if(rule.importRealm.containers.orgUnits) {
										if(containers && containers.orgUnits) { // update the containers
											containers.orgUnits = containers.orgUnits.concat(rule.importRealm.containers.orgUnits);
										}
									} else {
										container.orgUnits = null;
									}
								} else { // any portfolio container is allowed for the given object type!
									containers = null;
								}
							}
						} else { // any import is allowed!
							DEBUG ? console.log("User is allowed to import anything!") : null;
							containers = null;
						}
					}
				});
			} else { // any role is allowed
				if(rule.importRealm) {
					if(rule.importRealm.objectType == objectType) { // rule is applicable for the given object type
						if(rule.importRealm.containers) {
							if(rule.importRealm.containers.portfolios) {
								if(containers && containers.portfolios) { // update the containers
									containers.portfolios = containers.portfolios.concat(rule.importRealm.containers.portfolios);
								}
							} else {
								container.portfolios = null;
							}
							if(rule.importRealm.containers.orgUnits) {
								if(containers && containers.orgUnits) { // update the containers
									containers.orgUnits = containers.orgUnits.concat(rule.importRealm.containers.orgUnits);
								}
							} else {
								container.orgUnits = null;
							}
						} else { // any portfolio container is allowed for the given object type!
							containers = null;
						}
					}
				} else { // any import is allowed!
					containers = null;
				}			
			}
		}
		return containers;
	}
 
	function _processingCsvDocument(doc, importObjectType, containerObjectIds, docProcessingSummary, timeStart) {
		let docProcessingStep = null;
		
		DEBUG ? console.log("Processing document " + doc.name + " (id = " + doc.id + ", url = " + doc.url + ")...") : null;
		DEBUG ? console.log("Time elapsed: " + moment().diff(timeStart, "seconds") + "s") : null;

		let processingType = doc.properties.find(x => x.key == PROCESSING_TYPE_PROPERTY_ID).value;
		if(processingType) {
			let attachmentId = doc.url.match(/\.\.\/PF\/V1\/Attachment\/(.*)\?name=/) || doc.url.match(/\/API\/V2\/PF\/Attachment\/(.*)\?file=/);
			if(attachmentId && attachmentId.length > 0) {
				attachmentId = attachmentId[1];
				let csvRaw = null;
				try {
					csvRaw = Pqf.pf.getAttachmentText(attachmentId, null); // returns a string
				} catch(err) {
					DEBUG ? console.error(err) : null;
				}
				if(csvRaw) {
					// Check if a delimiter type was selected
					const _mapDelimiter = {
						"IMPORT-DELIMITER-TYPE-COM": ",",
						"IMPORT-DELIMITER-TYPE-SEM": ";"
					}
					let delimiterEnumObj = doc.properties.find(x => x.key == DELIMITER_PROPERTY_ID);
					let delimiter = delimiterEnumObj ? _mapDelimiter[delimiterEnumObj.value] : null;
					if(delimiter) {
						_setCsvSeparator(delimiter);
					}
					// Load records from CSV data
					let records = null;
					try {
						records = CSVJSON.csv2json(csvRaw, {"separator": _csvSeparator, "parseJSON": false});
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
					if(records) {
						if(records.length > 0) {
							
							//--------------------------------------------------
							// Extract column header infos and validate them
							//--------------------------------------------------
							let validatedHeaders = _validateCsvHeaders(Object.keys(records[0]), importObjectType);
							
							DEBUG ? console.log("validatedHeaders = " + JSON.stringify(validatedHeaders)) : null;
							
							if(validatedHeaders.valid) {
							
								let validActualId = null;
								
								// --------------------------------------------------
								// Load objects that are needed as reference data
								// --------------------------------------------------
								let refObjects = _loadReferenceObjects(importObjectType, validatedHeaders, containerObjectIds);
								DEBUG ? console.log("Time elapsed: " + moment().diff(timeStart, "seconds") + "s") : null;
			
								// --------------------------------------------------
								// Process all records
								// --------------------------------------------------
								let recordCounterProcessed = 0;
								let recordCounterDoneBefore = 0;
								let headerId = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0].raw;
								let recordId = null;
								let headerValExecuted = null;
								let headerValInfo = null;
								records.forEach(function(record) {
									recordId = record[headerId];
									headerValExecuted = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0].raw;
									headerValInfo = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0].raw;
									let doProcessRecord = false;
									switch(processingType) {
										case "IMPORT-PROCESSING-TYPE-RES":
											record[headerValExecuted] = null;
											record[headerValInfo] = null;
											if(validatedHeaders.refs.objectRef != "id") {
												record[headerId] = null;
											}
											recordCounterProcessed++;
											break;
										case "IMPORT-PROCESSING-TYPE-VAL":
											doProcessRecord = true;
											recordCounterProcessed++;
											break;
										case "IMPORT-PROCESSING-TYPE-IMP":
											if(record[headerValExecuted] == "INVALID") {
												record[headerValInfo] = "Record ignored because it is invalid";
												recordCounterDoneBefore++;
											} else if(["UPDATED", "CREATED"].includes(record[headerValExecuted])) {
												record[headerValInfo] = "Record ignored because it was processed in a previous run";
												recordCounterDoneBefore++;
											} else {
												if(recordCounterProcessed < _maxNumRecordsPerRun) {
													doProcessRecord = true;
													recordCounterProcessed++;
												} else {
													record[headerValExecuted] = "SKIPPED";
													record[headerValInfo] = "Not yet processed because reached max. number of records in this run";
												}
											}
											break;
										case "IMPORT-PROCESSING-TYPE-DEL":
											if(recordId) { // only process records that have an id
												if(recordCounterProcessed < _maxNumRecordsPerRun) {
													doProcessRecord = true;
													recordCounterProcessed++;
												} else {
													record[headerValExecuted] = "SKIPPED";
													record[headerValInfo] = "Not yet processed because reached max. number of records in this run";
												}
											} else if(record[headerValExecuted] == "DELETED") {
												record[headerValInfo] = "Record ignored because it was deleted in a previos run";
												recordCounterDoneBefore++;
											} else {
												record[headerValExecuted] = "SKIPPED";
												record[headerValInfo] = "Record ignored because it has no ID";
												recordCounterDoneBefore++;
											}
											break;
									}
									if(doProcessRecord) {
										record = _processRecord(record, importObjectType, validatedHeaders, refObjects, processingType);
									}
								});
		
								// --------------------------------------------------
								// Create new attachment with updated CSV data and update doc variable
								// --------------------------------------------------
								_updateDoc(doc, records);
								
								let numRecordsRemaining = null;
								switch(processingType) {
									case "IMPORT-PROCESSING-TYPE-RES":
									case "IMPORT-PROCESSING-TYPE-VAL":
										numRecordsRemaining = 0;
										break;
									case "IMPORT-PROCESSING-TYPE-IMP":
									case "IMPORT-PROCESSING-TYPE-DEL":
										numRecordsRemaining = records.length - (recordCounterProcessed + recordCounterDoneBefore);
										break;
								}
								docProcessingStep = "CSV document <i>" + doc.name + "</i> processed: "
									+ (validatedHeaders.validationInfo ? validatedHeaders.validationInfo : "All headers ok");
								DEBUG ? console.log(docProcessingStep) : null;
								DEBUG ? console.log("Time elapsed: " + moment().diff(timeStart, "seconds") + "s") : null;
								docProcessingSummary.action = docProcessingStep;
								docProcessingSummary.numRecordsProcessed =  "<i>" + recordCounterProcessed + "</i> records processed";
								if(["IMPORT-PROCESSING-TYPE-IMP", "IMPORT-PROCESSING-TYPE-DEL"].includes(processingType)) {
									docProcessingSummary.numRecordsProcessed += (recordCounterProcessed == _maxNumRecordsPerRun ? " (maximum per run reached)" : " (maximum is " + _maxNumRecordsPerRun + ")");
								}
								docProcessingSummary.numRecordsRemaining = numRecordsRemaining + " records still unprocessed";
		
							} else {
								docProcessingStep = "Header structure of CSV document <i>" + doc.name + "</i> not valid: " + validatedHeaders.validationInfo;
								DEBUG ? console.log(docProcessingStep) : null;
								docProcessingSummary.action = docProcessingStep;
								docProcessingSummary.numRecordsProcessed = "No records processed";
								docProcessingSummary.numRecordsRemaining = records.length + " records unprocessed";
							}
						} else {
							docProcessingStep = "CSV document " + doc.name + " containts no records.";
							DEBUG ? console.log(docProcessingStep) : null;
							docProcessingSummary.action = docProcessingStep;
							docProcessingSummary.numRecordsProcessed = "No records processed";
							docProcessingSummary.numRecordsRemaining = "---";
						}
					} else {
						docProcessingStep = "Could not parse CSV document " + doc.name + ".";
						DEBUG ? console.log(docProcessingStep) : null;
						docProcessingSummary.action = docProcessingStep;
						docProcessingSummary.numRecordsProcessed = "No records processed";
						docProcessingSummary.numRecordsRemaining = "---";
					}
				} else {
					docProcessingStep = "No attachment found with id = " + attachmentId + ".";
					DEBUG ? console.log(docProcessingStep) : null;
					docProcessingSummary.action = docProcessingStep;
					docProcessingSummary.numRecordsProcessed = "No records processed";
					docProcessingSummary.numRecordsRemaining = "---";
				}
			} else {
				docProcessingStep = "No attachment found for this document link.";
				DEBUG ? console.log(docProcessingStep) : null;
				docProcessingSummary.action = docProcessingStep;
				docProcessingSummary.numRecordsProcessed = "No records processed";
				docProcessingSummary.numRecordsRemaining = "---";						
			}
		} else {
			docProcessingStep = "No processing type selected.";
			DEBUG ? console.log(docProcessingStep) : null;
			docProcessingSummary.action = docProcessingStep;
			docProcessingSummary.numRecordsProcessed = "No records processed";
			docProcessingSummary.numRecordsRemaining = "---";
		}
	}
	
	function _getImportObjectType(doc) {
		let importObjectType = doc.properties.find(x => x.key == IMPORT_OBJECT_TYPE_PROPERTY_ID).value;
		switch(importObjectType) {
			case "IMPORT-OBJECT-TYPE-RES-HRM-EMP":
			case "IMPORT-OBJECT-TYPE-RES-HRM-OU":
				// Calculate basic parameters needed to set availabilities
				_shifts = Pqf.res.getResourceShifts();
				_numShifts = _shifts.length;
				/* // Outdated due to change in API call output
				_standardWorktime = Pqf.res.getResourceGroupStandardWorktimes().find(x => x.id === "RG-HRM").standardWorktime;
				_standardHoursPerShift = moment.duration(_standardWorktime[0]).asHours() / _numShifts; // Corresponds to 100% workload
				*/
				// Adapted to new output of Pqf.res.getResourceGroupStandardWorktimes (since 4.21.0)
				let standardWorktimeObj = Pqf.res.getResourceGroupStandardWorktimes().find(x => x.id === "RG-HRM");
				_standardWorktime = moment.duration(standardWorktimeObj.timePerWeek).asHours() / standardWorktimeObj.daysPerWeek; // Hours per day, corresponds to 100% workload
				_standardHoursPerShift = _standardWorktime / _numShifts; // Hours per shift, corresponds to 100% workload
				break;
		}
		return importObjectType;
	}
	
	function _postProcessingCsvDocument(doc, docProcessingSummary) {
		doc.properties.find(x => x.key == DO_PROCESS_PROPERTY_ID).value = null;
		let importLogEntry = {
			"user": pqfLib.utils.misc.getCurrentUserName(),
			"timestamp": NOW,
			"processingInfo": docProcessingSummary
		};
		// Note: The variable "importLogEntry" holds the whole history of imports. Its form is an array of "entry" objects.
		// Each "entry" object is of the following form:
		// {
		//    "user": string,
		//    "timestamp": string,
		//    "processingInfo": {"action": string, "numRecordsProcessed": string, "numRecordsRemaining": string, "time": string}
		// }
		let savedData = store.load(doc.id);
		let importLog = null;
		if(savedData) {
			importLog = savedData.importLog;
		}
		if(Array.isArray(importLog)) {
			importLog.unshift(importLogEntry); // add entry to beginning of array
			if(importLog.length > MAX_NUM_IMPORT_LOGS) {
				importLog = importLog.slice(0, MAX_NUM_IMPORT_LOGS - importLog.length);
			}
		} else {
			importLog = [importLogEntry]; // create new array with first entry
		}
		store.save(doc.id, {"importLog": importLog });
		let importLogHtml = "<ul>" + json2html.render(importLog, JSON2HTML_LOG_TEMPLATE) + "</ul>";
		doc.properties.find(x => x.key == IMPORT_LOG_PROPERTY_ID).value = importLogHtml;
		Pqf.pf.putDocumentLink("LibraryModule", "F78087A93A97432BA68DB4BB5531C141", doc.id, doc);
	}
	
	function _emptyLibraryFolder(folderId, recursive) {
		let docs = Pqf.pf.getDocumentLinks("LibraryModule", "F78087A93A97432BA68DB4BB5531C141", folderId, recursive);
		let error = false;
		try {
			docs.forEach(doc => Pqf.pf.delDocumentLink("LibraryModule", "F78087A93A97432BA68DB4BB5531C141", doc.id));
		} catch(err) {
			DEBUG ? console.error(err) : null;
			error = err;
		}
		return error;
	}

	//-------------------------------------------
	// Private functions
	//-------------------------------------------

    function _validateCsvHeaders(csvHeaders, objectType) {
        let csvImportStructure = null;
        switch (objectType) {
        case "IMPORT-OBJECT-TYPE-PRJ":
            csvImportStructure = JSON.parse(JSON.stringify(PROJECT_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-PRJ-SCO":
            csvImportStructure = JSON.parse(JSON.stringify(PROJECT_SCENARIO_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-PRJ-WORKITEM":
            csvImportStructure = JSON.parse(JSON.stringify(WORKITEM_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-PRJ-CST-ACT":
            csvImportStructure = JSON.parse(JSON.stringify(PROJECT_COSTS_ACTUAL_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT":
            csvImportStructure = JSON.parse(JSON.stringify(PROJECT_EFFORT_ACTUAL_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-RES-HRM-EMP":
            csvImportStructure = JSON.parse(JSON.stringify(EMPLOYEE_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-RES-HRM-OU":
            csvImportStructure = JSON.parse(JSON.stringify(ORGUNIT_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-PRJ-REL":
            csvImportStructure = JSON.parse(JSON.stringify(PROJECT_RELATION_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
        case "IMPORT-OBJECT-TYPE-PORTF-REL":
            csvImportStructure = JSON.parse(JSON.stringify(PROJECTPORTFOLIO_RELATION_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
            break;
		case "IMPORT-OBJECT-TYPE-ALLOC": 
			csvImportStructure = JSON.parse(JSON.stringify(ALLOCATION_CSV_IMPORT_STRUCTURE_TEMPLATE)); // clone template object
			break;
        default:
            return {
				"validationInfo": "objectType " + objectType + " undefined",
				"valid": false,
				"ref": null
			};
        }
		// Add two mandatory extra columns where validation information can be written per record
		csvImportStructure.columns.push(
		{
			"name": "validationExecuted",
			"pattern": "^(Validation)/(executed)$",
			"mandatory": "1",
			"csvHeadersFound": null,
			"valid": null,
			"validationInfo": ""
        },
		{
			"name": "validationInfo",
			"pattern": "^(Validation)/(info)$",
			"mandatory": "1",
			"csvHeadersFound": null,
			"valid": null,
			"validationInfo": ""
        }
		);
        csvImportStructure.valid = true;
        let csvHeadersUsed = csvHeaders.map(function(x) {
			    return {"text": x, "used": false};
			});
        csvImportStructure.columns.forEach(function (column) {
            _setColumnHeadersFound(column, csvHeadersUsed);
            _validateMandatory(column);
            if (!column.valid) {
                csvImportStructure.valid = false;
                csvImportStructure.validationInfo += "Column with header pattern <i>" + column.pattern + "</i> invalid or not found. ";
            }
        });
		csvHeadersUsed.forEach(function(csvHeader) {
			if(!csvHeader.used) {
				csvImportStructure.validationInfo += "Header of CSV column <i>" + csvHeader.text + "</i> cannot be parsed, column therefore ignored. ";
			}
		});
		_validateRefs(csvImportStructure);
		if(csvImportStructure.valid) { // Refs have not been found multiple times, but check if *all* refs have been found
			Object.entries(csvImportStructure.refs).map(x => x[0]).forEach(function(key) {
				if(!csvImportStructure.refs[key]) {
					csvImportStructure.valid = false;
					csvImportStructure.validationInfo += "Mandatory reference " + key + " not found in column definitions. ";
				}
			});
		}
        return csvImportStructure;
    }

    function _setColumnHeadersFound(column, csvHeadersUsed) {
        let regex = new RegExp(column.pattern);
		let columnValid = false;
        csvHeadersUsed.forEach(function (header) {
            let found = header.text.match(regex);
            if (found) {
				columnValid = true;
				header.used = true;
                found.shift(); // remove first element (total pattern found)
                let components = found.filter(x => (typeof x === "undefined" ? false : true)); // remove "undefined" items
                let newColumn = {
                    "raw": header.text,
                    "objectType": null,
                    "subType": null,
                    "attribute": null,
                    "isProp": typeof components.find(x => x === ":prop") !== "undefined",
                    "isDate": typeof components.find(x => x === ":date") !== "undefined",
                    "isEnumId": typeof components.find(x => x === ":enumId") !== "undefined",
					"isEnumName": typeof components.find(x => x === ":enumName") !== "undefined",
					"isMoney": typeof components.find(x => x === ":money") !== "undefined",
                    "withTodos": typeof components.find(x => x === ":withTodos") !== "undefined",
                    "withAllocations": typeof components.find(x => x === ":withAllocations") !== "undefined",
                    "deleteActive": typeof components.find(x => x === ":deleteActive") !== "undefined",
                    "objectRef": typeof components.find(x => x === ":objectRef") !== "undefined",
                    "parentRef": typeof components.find(x => x === ":parentRef") !== "undefined",
                    "superparentRef": typeof components.find(x => x === ":superparentRef") !== "undefined",
                    "sourceRef": typeof components.find(x => x === ":sourceRef") !== "undefined",
                    "targetRef": typeof components.find(x => x === ":targetRef") !== "undefined",
					"ignoreWhitespace": typeof components.find(x => x === ":ignoreWhitespace") !== "undefined",
					"matchingType": components.find(x => [":exact", ":includes", ":isIncluded", ":isIncludedInNonNumbers"].includes(x)) || ":exact",
					"createIfMissing": typeof components.find(x => x === ":createIfMissing") !== "undefined",
					"ignoreIfMissing": typeof components.find(x => x === ":ignoreIfMissing") !== "undefined"
                };
                components = components.filter(x => (x === ":prop" || x === ":date" || x === ":enumId" || x === ":enumName" || x === ":money" || x === ":withTodos" || x === ":withAllocations" || x === ":deleteActive" || x === ":objectRef" || x === ":parentRef" || x === ":superparentRef" || x === ":sourceRef" || x === ":targetRef" || x === ":exact"  || x === ":ignoreWhitespace" || x === ":includes" || x === ":isIncluded" || x === ":isIncludedInNonNumbers" || x === ":createIfMissing" || x === ":ignoreIfMissing" || x.match(/:[1-9]/) ? false : true));
                newColumn.objectType = components[0];
                if (components.length > 2) {
                    newColumn.subType = components[1];
                    newColumn.attribute = components[2];
                } else if (components.length > 1) {
                    newColumn.attribute = components[1];
                } else {
                    newColumn = null;
                }
                if (newColumn) {
                    column.csvHeadersFound ? column.csvHeadersFound.push(newColumn) : (column.csvHeadersFound = [newColumn]);
                }
			}
        });
		if(columnValid) {
			column.validationInfo += "Column relevant. ";
		} else {
			column.validationInfo += "Column ignored. ";
		}
    }

    function _validateMandatory(column) {
        let timesFound = column.csvHeadersFound ? column.csvHeadersFound.length : 0;
        switch (column.mandatory) {
        case "?":
            if (timesFound == 0) {
                column.valid = true;
                column.validationInfo += "No column for " + column.name + " found";
            } else if (timesFound == 1) {
                column.valid = true;
                column.validationInfo += "1 column for " + column.name + " found";
            } else {
                column.valid = false;
                column.validationInfo += "Too many columns for " + column.name + " found";
            }
            break;
        case "0+":
            column.valid = true;
            column.validationInfo += timesFound + " column(s) for " + column.name + " found";
            break;
        case "1":
            if (timesFound == 0) {
                column.valid = false;
                column.validationInfo += "No column for " + column.name + " found";
            } else if (timesFound == 1) {
                column.valid = true;
                column.validationInfo += "Unique column for " + column.name + " found";
            } else {
                column.valid = false;
                column.validationInfo += "Too many columns for " + column.name + " found";
            }
            break;
        case "1+":
            if (timesFound == 0) {
                column.valid = false;
                column.validationInfo += "No column for " + column.name + " found";
            } else {
                column.valid = true;
                column.validationInfo += timesFound + " column(s) for " + column.name + " found";
            }
            break;
        default:
            column.valid = false;
        }
    }

	function _validateRefs(csvImportStructure) {
		let refs = csvImportStructure.refs;
		Object.entries(refs).map(x => x[0]).forEach(function(key) {
			csvImportStructure.columns.forEach(function(column) {
				if(column.csvHeadersFound) {
					column.csvHeadersFound.forEach(function(header) {
						if(header[key]) {
							if(!refs[key] || refs[key] == "-") {
								refs[key] = column.name;
							} else { // found more than one of this ref
								csvImportStructure.valid = false;
								csvImportStructure.validationInfo = "Reference " + key + " found multiple times in column definitions";
							}
						}
					});
				}
			});
		});
	}
	
	function _loadReferenceObjects(importObjectType, validatedHeaders, containerObjectIds) {
		let refObjects = {};
		// Load project references
		if(["IMPORT-OBJECT-TYPE-PRJ", "IMPORT-OBJECT-TYPE-PRJ-CST-ACT", "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT", "IMPORT-OBJECT-TYPE-PRJ-REL", "IMPORT-OBJECT-TYPE-PRJ-SCO", "IMPORT-OBJECT-TYPE-PRJ-WORKITEM", "IMPORT-OBJECT-TYPE-ALLOC"].includes(importObjectType)) {
			
			// Get all projects
			refObjects.projects = Pqf.pm.getProjects();
			
			// Filter for projects in container objects (i.e., in given portfolios)
			if(containerObjectIds && containerObjectIds.portfolios) {
				refObjects.projects = refObjects.projects.filter(function(project) {
					return project.portfolios.some(function(portfolio) { return containerObjectIds.portfolios.includes(portfolio.id); });
				});
			}
			
			// Also load relevant subobject if project reference is subobject property
			let subobjectType = null;
			switch(importObjectType) {
				case "IMPORT-OBJECT-TYPE-PRJ":
					if(validatedHeaders.refs.objectRef === "property") {
						subobjectType = validatedHeaders.columns.find(x => x.name === "property").csvHeadersFound.find(x => x.objectRef).subType;
					}
					break;
				case "IMPORT-OBJECT-TYPE-PRJ-CST-ACT":
				case "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT":
					subobjectType = validatedHeaders.columns.find(x => x.name === "project").csvHeadersFound[0].subType;
					break;
				case "IMPORT-OBJECT-TYPE-PRJ-REL":
					if(validatedHeaders.refs.sourceRef === "projectSubobjProp") {
						subobjectType = validatedHeaders.columns.find(x => x.name === "projectSubobjProp").csvHeadersFound[0].subType;
					}
					break;
			}
			if(subobjectType) { // project ref is a property of a subobject, thus load that subobject
				refObjects.projects.forEach(function(prj) {
					let subobject = null;
					try {
						subobject = Pqf.pm.getProjectSubObj(prj.id, subobjectType);
					} catch(err) {
						DEBUG ? console.log("Could not load subobject " + subobjectType + " of project " + prj.id) : null;
					}
					prj.subObjects = [];
					if(subobject) {
						prj.subObjects.push(subobject);
					}
				});     
			}
		}
		// Load portfolio references
		if(["IMPORT-OBJECT-TYPE-PRJ", "IMPORT-OBJECT-TYPE-PORTF-REL"].includes(importObjectType)) {
			
			// Get all portfolios
			refObjects.portfolios = Pqf.pm.getProjectPortfolios();
			// Filter for container objects (i.e., given portfolios)
			if(containerObjectIds && containerObjectIds.portfolios) {
				refObjects.portfolios = refObjects.portfolios.filter(function(portfolio) {
					return containerObjectIds.portfolios.includes(portfolio.id);
				});
			}
		}
		// Load employee references
		if(["IMPORT-OBJECT-TYPE-RES-HRM-EMP", "IMPORT-OBJECT-TYPE-PRJ-REL", "IMPORT-OBJECT-TYPE-PORTF-REL", "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT", "IMPORT-OBJECT-TYPE-ALLOC"].includes(importObjectType)) {
			
			// Get all employees
			refObjects.employees = Pqf.res.getResourceHierarchyByType("HRM-RES-TYP-EMP");
			
			// Filter for employees in the container objects (i.e., in the given org units)
			if(containerObjectIds && containerObjectIds.orgUnits) {
				refObjects.employees = refObjects.employees.filter(function(employee) {
					let parent = null;
					if(employee.ancestors) {
						parent = employee.ancestors.find(x => x.type == "HRM-RES-TYP-OU");
					}
					return parent ? containerObjectIds.orgUnits.includes(parent.id) : false;
				});
			}
			// Also load properties if employee reference is a property
			let isProp = false;
			switch(importObjectType) {
				case "IMPORT-OBJECT-TYPE-RES-HRM-EMP":
					if(validatedHeaders.refs.objectRef === "property") {
						isProp = true;
					}
					break;
				case "IMPORT-OBJECT-TYPE-ALLOC":
					if(validatedHeaders.columns.find(x => x.name === "resource").csvHeadersFound[0].isProp) {
						isProp = true;
					}
					break;
				case "IMPORT-OBJECT-TYPE-PRJ-REL":
				case "IMPORT-OBJECT-TYPE-PORTF-REL":
					if(validatedHeaders.refs.targetRef === "resourceProp") {
						isProp = true;
					}
					break;
				case "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT":
					isProp = validatedHeaders.columns.find(x => x.name === "resource").csvHeadersFound[0].isProp;
					break;
			}
			if(isProp) { // employee ref is a property, thus load all resources
				let res = [];
				refObjects.employees.forEach(function(emp) {
					try {
						res.push(Pqf.res.getResource(emp.id));
					} catch(err) {
						DEBUG ? console.log("Could not load resource " + emp.id) : null;
					}
				});
				refObjects.employees = res;
			}
			
		}
		// Load org unit references
		if(["IMPORT-OBJECT-TYPE-RES-HRM-EMP", "IMPORT-OBJECT-TYPE-RES-HRM-OU"].includes(importObjectType)) {
			
			// Get all org units
			refObjects.orgUnits = Pqf.res.getResourcesByType("HRM-RES-TYP-OU");
			
			// Filter for container objects (i.e., given org units)
			if(containerObjectIds && containerObjectIds.orgUnits) {
				refObjects.orgUnits = refObjects.orgUnits.filter(function(orgUnit) {
					let parent = null;
					if(orgUnit.ancestors) {
						parent = orgUnit.ancestors.find(x => x.type == "HRM-RES-TYP-OU");
					}
					return parent ? containerObjectIds.orgUnits.includes(parent.id) : false;
				});
			}			
			
			// Also load properties if org unit reference is a property
			let isProp = false;
			switch(importObjectType) {
				case "IMPORT-OBJECT-TYPE-RES-HRM-EMP":
				case "IMPORT-OBJECT-TYPE-RES-HRM-OU":
					if(validatedHeaders.refs.parentRef === "property") {
						isProp = true;
					}
					break;
			}
			if(isProp) { // org unit ref is a property, thus load all resources
				let res = [];
				refObjects.orgUnits.forEach(function(ou) {
					try {
						res.push(Pqf.res.getResource(ou.id));
					} catch(err) {
						DEBUG ? console.log("Could not load resource " + ou.id) : null;
					}
				});
				refObjects.orgUnits = res;
			}
		}
		// Load user references
		if(["IMPORT-OBJECT-TYPE-RES-HRM-EMP"].includes(importObjectType)) {
			refObjects.users = Pqf.acm.getUsers();
		}

		return refObjects;
	}

	function _processRecord(record, objectType, validatedHeaders, refObjects, processingType) {
		switch(objectType) {
			case "IMPORT-OBJECT-TYPE-PRJ":
				record = _processProjectRecord(record, validatedHeaders, refObjects.projects, refObjects.portfolios, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-PRJ-SCO":
				record = _processProjectScenario(record, validatedHeaders, refObjects.projects, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-PRJ-WORKITEM":
				record = _processProjectWorkItem(record, validatedHeaders, refObjects.projects, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-PRJ-CST-ACT":
				record = _processProjectCostsActualRecord(record, validatedHeaders, refObjects.projects, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT":
				record = _processProjectEffortRecord(record, validatedHeaders, refObjects.projects, refObjects.employees, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-RES-HRM-EMP":
			case "IMPORT-OBJECT-TYPE-RES-HRM-OU":
				record = _processResourceRecord(record, validatedHeaders, refObjects.employees, refObjects.orgUnits, refObjects.users, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-PRJ-REL":
				record = _processEmployeeRelation(record, validatedHeaders, "Project", refObjects.projects, refObjects.employees, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-PORTF-REL":
				record = _processEmployeeRelation(record, validatedHeaders, "ProjectPortfolio", refObjects.portfolios, refObjects.employees, processingType);
				break;
			case "IMPORT-OBJECT-TYPE-ALLOC":
				record = _processAllocationRecord(record, validatedHeaders, refObjects.projects, refObjects.employees, processingType);
				break;
			default:
				console.error("objectType " + objectType + " undefined");
		}
		return record;    
	}

	function _updateLifecycle(objectType, object, stateIds) {
		let result = "";
		let initialStateId = stateIds.shift();
		try {
			if((objectType == "Scenario" && object.status === INIT_STATE_SCENARIO.id && initialStateId === INIT_STATE_SCENARIO.id) ||
			   (objectType == "Project" && object.status === INIT_STATE_PROJECT.id && initialStateId === INIT_STATE_PROJECT.id)) {
				let currentStateId = initialStateId;
				stateIds.forEach(function(nextStateId) {
					let reachableStates = Pqf.lcy.getStateTransitions(currentStateId);
					let transitionFound = reachableStates.find(x => x.to.id === nextStateId);
					if(transitionFound) {
						try {
							Pqf.lcy.upgradeObject(objectType, object.id, transitionFound.id, "Transition done by importer");
						} catch(err) {
							console.error("Pqf.lcy.upgradeObject failed:");
							DEBUG ? console.error(err) : null;
							result += " Updating " + objectType + " lifecycle failed: " + err;
						}
						currentStateId = nextStateId;
					} else {
						throw new Error("Successive state with ID " + nextStateId + " unknown");
					}
				});
			}
		} catch(err) {
			DEBUG ? console.error(err) : null;
			result += " Updating " + objectType + " lifecycle failed: " + err;
		}
		return result;
	}

	function _processProjectRecord(record, validatedHeaders, projectRefs, portfolioRefs, processingType) {
		let header = null;
		let value = null;
		let validationExecuted = null;
		let validationInfo = "";
		let docProcessingStep = "";
		
		switch(processingType) {
			case "IMPORT-PROCESSING-TYPE-DEL":
				// Check if id of record exists
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				value = record[header.raw].toString();
				if(value != null) {
					try{
						Pqf.pm.delProject(value);
						validationInfo += "Project deleted";
						validationExecuted = "DELETED";
						record[header.raw] = null;
					} catch(err) {
						DEBUG ? console.error(err) : null;
						validationInfo += "Could not delete project - check id";
						validationExecuted = "FAILED";
					}
				} else {
					validationInfo += "ID missing - cannot delete project";
				}
				break;
			case "IMPORT-PROCESSING-TYPE-VAL":
			case "IMPORT-PROCESSING-TYPE-IMP":
				// Check if reference value of record exists
				header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef).csvHeadersFound[0];
				value = record[header.raw].toString();
				
				if(value != null) { // Reference value exists, check if project with this reference already exists
					let feature = null;
					if(["id","code","name"].includes(validatedHeaders.refs.objectRef)) {
						feature = validatedHeaders.refs.objectRef;
					} else { // objectRef is property
						feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
					}
					let projectRef = _findRefObject(projectRefs, feature, value, header.matchingType, header.ignoreWhitespace);
					let project = null;
					let projectSubobjects = null;
					let projectId = null;
					if(projectRef && projectRef.length == 1) { // One project with this reference value indeed already exists
						projectRef = projectRef[0];
						projectId = projectRef.id;
						if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							validationInfo += "Project can be updated";
							validationExecuted = "VALIDATED";
							header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
							record[header.raw] = projectId;
						}
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							validationInfo += "Updated existing project";
							validationExecuted = "UPDATED";
						}
					} else if(projectRef && projectRef.length == 0) { // Create a new project in parent ref object (main portfolio)
					
						// Get id of main portfolio and create the new project in this portfolio
						let columnName = validatedHeaders.refs.parentRef;
						header = validatedHeaders.columns.find(x => x.name === columnName).csvHeadersFound[0];
						value = record[header.raw].toString();
						let feature = null;
						if(header.isProp) {
							feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
						} else {
							feature = header.attribute;
						}
						let portfolioRef = _findRefObject(portfolioRefs, feature, value, header.matchingType, header.ignoreWhitespace);
						if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							if(portfolioRef && portfolioRef.length == 1) {
								portfolioRef = portfolioRef[0];
								validationInfo += "Project can be created in portfolio " + value + ". ";
								validationExecuted = "VALIDATED";
							} else if(portfolioRef && portfolioRef.length > 1) {
								validationInfo += "Cannot create project - portfolio " + value + " multiple times found. ";
								validationExecuted = "INVALID";
							} else {
								validationInfo += "Cannot create project - portfolio " + value + " not found. ";
								validationExecuted = "INVALID";
							}
						}
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							if(portfolioRef && portfolioRef.length == 1) {
								portfolioRef = portfolioRef[0];
								project = Pqf.pm.addProjectPortfolioProject(portfolioRef.id);
								projectId = project.id;
								docProcessingStep = "Project created in portfolio " + value + ". ";
								DEBUG ? console.log(docProcessingStep) : null;
								validationInfo += docProcessingStep;
								validationExecuted = "CREATED";
							} else if(portfolioRef && portfolioRef.length > 1) {
								docProcessingStep = "Cannot create project - portfolio " + value + " multiple times found. ";
								DEBUG ? console.log(docProcessingStep) : null;
								validationInfo += docProcessingStep;
								validationExecuted = "INVALID";
							} else {
								docProcessingStep = "Cannot create project - portfolio " + value + " not found. ";
								DEBUG ? console.log(docProcessingStep) : null;
								validationInfo += docProcessingStep;
								validationExecuted = "INVALID";								
							}
						}
					}

					if(projectId && processingType == "IMPORT-PROCESSING-TYPE-IMP") {
						
						// Update the properties of the project and its subobjects
						project = Pqf.pm.getProject(projectId);
						projectSubobjects = Pqf.pm.getProjectSubObjs(projectId);
						_setProjectDetails(project, projectSubobjects, validatedHeaders, record);
						
						try {							
							Pqf.pm.putProject(projectId, project);
							DEBUG ? console.log("Project " + project.name + " (" + project.id + ") updated.") : null;
						} catch(err) {
							console.error("Pqf.pm.putProject(" + projectId + ",[projectObject]) failed:");
							DEBUG ? console.error(err) : null;
							if(validationExecuted == "CREATED") {
								Pqf.pm.delProject(projectId);
								validationInfo += "Creating the project failed: " + err;
								projectId = null;
							} else if(validationExecuted == "UPDATED"){
								validationInfo += "Updating the project failed:" + err;
							} else {
								validationInfo += err;
							}
							validationExecuted = "FAILED";
						}
						
						if(projectId) { // No errors occurred while putting project
							
							// Update all subobjects
							projectSubobjects.forEach(function(subobj) {
								try {
									Pqf.pm.putProjectSubObj(projectId, subobj.type, subobj);
									DEBUG ? console.log("Subobject " + subobj.type + " of project " + project.name + " (" + project.id + ") updated.") : null;
								} catch(err) {
									console.error("Pqf.pm.putProjectSubObj: type = " + subobj.type + " failed:");
									DEBUG ? console.error(err) : null;
									validationInfo += "Updating the subobject " + subobj.type + " failed: " + err;
									validationExecuted = "FAILED";
								}
							});
							
							// Copy a scenario?
							let scenario = null;
							header = validatedHeaders.columns.find(x => x.name === "copyScenario");
							let copyScenarioId = null;
							if(header.csvHeadersFound) {
								header = header.csvHeadersFound[0];
							
								// Delete active scenario first?
								let currentlyActiveScenario = null;
								try {
									currentlyActiveScenario = Pqf.pm.getProjectActiveScenario(projectId, false);
								} catch(err) {
									DEBUG ? console.log(err) : null;
								}
								if(currentlyActiveScenario && header.deleteActive) {
									Pqf.pm.delProjectScenario(currentlyActiveScenario.id);
								}
								
								copyScenarioId = record[header.raw].toString();
							}
							let scenarioRef = null;
							if (copyScenarioId) {
								// Copy scenario
								scenarioRef = Pqf.pm.addProjectScenario(projectId, copyScenarioId, false, false, false, true, header.withAllocations, false, false, header.withTodos); // Include dependencies
								scenario = Pqf.pm.getProjectScenario(scenarioRef.id);
								DEBUG ? console.log("Scenario " + scenario.id + " created for project " + project.name + " (" + project.id + ").") : null;
							}
							
							// Set lifecycle state of scenario?
							header = validatedHeaders.columns.find(x => x.name === "lifecycleScenario");
							if(header.csvHeadersFound && scenario) {
								header = header.csvHeadersFound[0];
								value = record[header.raw].toString();
								let lifecycleStateIds = value.split(_lifecycleStateSeparator);
								let result = _updateLifecycle("Scenario", scenario, lifecycleStateIds);
								DEBUG ? console.log("Lifecycle of scenario " + scenario.id + " updated.") : null;
								if(result) {
									validationInfo += result;
									validationExecuted = "FAILED";
								}
							}
							
							// Update the main task of the active scenario if scenario data are present (start/end date)
							header = validatedHeaders.columns.find(x => x.name === "startDate");
							if(header.csvHeadersFound) {
								header = header.csvHeadersFound[0];
								let startDate = _getValidDate(record[header.raw].toString());
								if(startDate) {
									let activeScenario = null;
									try {
										activeScenario = (scenario ? scenario : Pqf.pm.getProjectActiveScenario(projectId, false));
									} catch(err) {
										DEBUG ? console.error(err) : null;
									}
									if(activeScenario) {
										// Name the scenario (this prevents the scenario template JS to afterwards override it, if such a scenario template exists)
										activeScenario.name = project.name;
										Pqf.pm.putProjectScenario(activeScenario.id, activeScenario);
										DEBUG ? console.log("Name of active scenario with ID " + activeScenario.id + " updated to " + project.name) : null;
										// Get main task
										let workItems = Pqf.pm.getScenarioWorkItems(activeScenario.id, false, null);
										let mainTask = workItems[0];
										// Set name of main task
										mainTask.name = project.name;
										Pqf.pm.putWorkItem(mainTask.id, mainTask);
										DEBUG ? console.log("Name of maintask updated to " + project.name) : null;
										// Move main task (incl. subtree) to match start date
										//Pqf.pm.moveWorkItem(mainTask.id, moment(startDate).format("YYYY-MM-DD"), "SUBTREE/FLEXIBLEDEPENDENCIES");
										Pqf.pm.moveWorkItem(mainTask.id, moment(startDate).format("YYYY-MM-DD"), "FLEXIBLEDEPENDENCIES");
										DEBUG ? console.log("Active scenario moved to start date " + moment(startDate).format("YYYY-MM-DD")) : null;
										// Set end date of main task?
										header = validatedHeaders.columns.find(x => x.name === "endDate");
										if(header.csvHeadersFound) {
											header = header.csvHeadersFound[0];
											let endDate = _getValidDate(record[header.raw].toString());
											if(endDate && moment(endDate).isAfter(moment(startDate))) {
												mainTask.beg = moment(startDate).toISOString();
												mainTask.end = moment(endDate).add(1, "days").toISOString();
												Pqf.pm.putWorkItem(mainTask.id, mainTask);
												DEBUG ? console.log("End date of maintask set to " + moment(endDate).format("YYYY-MM-DD")) : null;
											}
										}
									}
								}
							}
							
							// Update the project lifecycle if lifecycle data present in the CSV data
							header = validatedHeaders.columns.find(x => x.name === "lifecycle");
							if(header.csvHeadersFound) {
								header = header.csvHeadersFound[0];
								value = record[header.raw].toString();
								let lifecycleStateIds = value.split(_lifecycleStateSeparator);
								let result = _updateLifecycle("Project", project, lifecycleStateIds);
								DEBUG ? console.log("Lifecycle of project " + project.name + " (" + project.id + ") updated.") : null;
								if(result) {
									validationInfo += result;
									validationExecuted = "FAILED";
								}
							}
							
							// Link project with other portfolios?
							let otherPortfolioHeaders = validatedHeaders.columns.find(x => x.name === "otherPortfolio").csvHeadersFound;
							if(otherPortfolioHeaders) {
								otherPortfolioHeaders.forEach(function(portfolioHeader) {
									value = record[portfolioHeader.raw].toString();
									if(value) {
										let feature = null;
										if(portfolioHeader.isProp) {
											feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
										} else {
											feature = portfolioHeader.attribute;
										}
										let portfolioRef = _findRefObject(portfolioRefs, feature, value, portfolioHeader.matchingType, portfolioHeader.ignoreWhitespace);
										if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
											if(portfolioRef && portfolioRef.length == 1) {
												portfolioRef = portfolioRef[0];
												validationInfo += "Project can be linked to portfolio " + value + ". ";
												validationExecuted = "VALIDATED";
											} else if(portfolioRef && portfolioRef.length > 1){
												validationInfo += "Cannot link project with portfolio " + value + " - portfolio multiple times found. ";
												validationExecuted = "INVALID";
											} else {
												validationInfo += "Cannot link project with portfolio " + value + " - portfolio not found. ";
												validationExecuted = "INVALID";
											}
										}
										if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
											if(portfolioRef && portfolioRef.length == 1) {
												portfolioRef = portfolioRef[0];
												Pqf.pm.linkProject(projectId, portfolioRef.id);
												projectId = project.id;
												validationInfo += "Project linked to portfolio " + value + ". ";
												validationExecuted = "CREATED";
											} else if(portfolioRef && portfolioRef.length > 1){
												validationInfo += "Cannot link project with portfolio " + value + " - portfolio multiple times found. ";
												validationExecuted = "INVALID";
											} else {
												validationInfo += "Cannot link project with portfolio " + value + " - portfolio not found. ";
												validationExecuted = "INVALID";
											}
										}
									}
								});
							}
							
							// Update id column in CSV file
							header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
							record[header.raw] = projectId;
						}
					}
										
				} else { // reference value missing
					validationInfo += "Missing reference value";
				}
				break;
		}
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _processProjectCostsActualRecord(record, validatedHeaders, projects, processingType) {
		let header = null;
		let value = null;
		let feature = null;
		let validationExecuted = null;
		let validationInfo = "";

		//--------------------------------------------------
		// Validate project reference
		//--------------------------------------------------
		let validProjectId = null;
		header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.superparentRef).csvHeadersFound[0];
		if(["id","code","name"].includes(validatedHeaders.refs.superparentRef)) {
			feature = validatedHeaders.refs.superparentRef;
		} else { // objectRef is property
			feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
		}
		value = record[header.raw].toString();
		let projectRef = _findRefObject(projects, feature, value, header.matchingType, header.ignoreWhitespace);
		if(projectRef && projectRef.length == 1) {
			
			projectRef = projectRef[0];
			validProjectId = projectRef.id;
			validationInfo += "Project found (" + validProjectId + ") | ";
			
			// --------------------------------------------------
			// Get default cost position for this project
			// --------------------------------------------------
			let allCostPos = Pqf.fco.getProjectCostsPositions(validProjectId, null);
			let defaultCostPos = allCostPos.find(x => x.name === DEFAULT_COST_POS_NAME);
			
			//--------------------------------------------------
			// Validate cost position reference
			//--------------------------------------------------
			header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.parentRef).csvHeadersFound[0];
			value = record[header.raw].toString();
			let {validCostsPosId, validationExecutedCostsPos, validationInfoCostsPos} =
				_validateCostsPositionReference(validProjectId, value, header.attribute, header.matchingType, defaultCostPos ? defaultCostPos.id : null, header.createIfMissing, processingType);
			validationExecuted = validationExecutedCostsPos;
			validationInfo += validationInfoCostsPos;
			
			if(validCostsPosId) {
				validationInfo += "Costs position found (" + validCostsPosId + ") | ";
				let {validActualId, validationExecutedActual, validationInfoActual} = _processActualRecord(record, validProjectId, validCostsPosId, validatedHeaders, processingType);
				validationExecuted = validationExecutedActual;
				validationInfo += validationInfoActual;
				if(validActualId) {
					// Update record id
					header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
					record[header.raw] = validActualId;
				}
			} else if(validationExecuted) {
				validationInfo += "Cannot check validity of costs actual";
			} else {
				DEBUG ? console.warn("   Skipping record: Referenced costs position not found.") : null;
			}
			
		} else if(projectRef && projectRef.length > 1) {
			DEBUG ? console.warn("   Skipping record: Referenced project multiple times found.") : null;
			validationExecuted = "INVALID";
			validationInfo += "Referenced project multiple times found. ";			
		} else {
			DEBUG ? console.warn("   Skipping record: Referenced project not found.") : null;
			validationExecuted = "INVALID";
			validationInfo += "Referenced project not found. ";			
		}
		// --------------------------------------------------
		// Write back validation results
		// --------------------------------------------------
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _processProjectEffortRecord(record, validatedHeaders, projects, employees, processingType) {
		let header = null;
		let value = null;
		let feature = null;
		let validationExecuted = null;
		let validationInfo = "";

		//--------------------------------------------------
		// Validate project reference
		//--------------------------------------------------
		let validProjectId = null;
		header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.parentRef).csvHeadersFound[0];
		value = record[header.raw].toString();
		if(header.isProp) {
			feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
		} else {
			feature = header.attribute;
		}
		let projectRef = _findRefObject(projects, feature, value, header.matchingType, header.ignoreWhitespace);
		if(projectRef && projectRef.length == 1) {
			
			projectRef = projectRef[0];
			validProjectId = projectRef.id;
			validationInfo += "Project found (" + validProjectId + ") | ";
			
			//--------------------------------------------------
			// Validate employee reference
			//--------------------------------------------------			
			header = validatedHeaders.columns.find(x => x.name === "resource").csvHeadersFound[0];
			value = record[header.raw].toString();
			if(header.isProp) { // objectRef is property
				feature = feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
			} else {
				feature = header.attribute;
			}
			let employeeRef = _findRefObject(employees, feature, value, header.matchingType, header.ignoreWhitespace);
			
			if(employeeRef && employeeRef.length == 1) {
				employeeRef = employeeRef[0];
				let validEmployeeId = employeeRef.id;
				validationInfo += "Employee found (" + validEmployeeId + ") | ";

				//--------------------------------------------------
				// Validate work item reference (if given)
				//--------------------------------------------------
				let tempValidWorkItemId = null;
				// null means "import on project", undefined means "work item not found, don"t import"
				header = validatedHeaders.columns.find(x => x.name === "workItem").csvHeadersFound;
				if(header) {
					// Check if active scenario exists in referenced project
					let activeScenario = null;
					try {
						activeScenario = Pqf.pm.getProjectActiveScenario(validProjectId, false);
					} catch(err) {
						DEBUG ? console.log("No active scenario found in project " + validProjectId) : null;
					}
					if(activeScenario) {
						validationInfo += "Active scenario found. | ";

						// Validate referenced work item
    					header = header[0];
    					value = record[header.raw].toString();
						let objectRef = header.attribute;
						let {validWorkItemId, validationExecutedWorkItem, validationInfoWorkItem} = _validateWorkItemReference(activeScenario.id, value, objectRef, header.matchingType, processingType);
						if(validWorkItemId == null && !header.ignoreIfMissing) { // work item not found and not allowed to be imported on project only
							validationInfo += "Work item not found. ";
							tempValidWorkItemId = undefined;
						} else {
							validationInfo += validationInfoWorkItem + " | ";								
							tempValidWorkItemId = validWorkItemId;
						}
					} else {
						validationInfo += "No active scenario found. ";
						validationExecuted = "INVALID";													
					}
				} else { // no work item reference present, hence import on project only
					tempValidWorkItemId = null;
				}
				

				//----------------------------------------------
				// Process record
				//----------------------------------------------
				if(typeof tempValidWorkItemId != "undefined") { // can import
					let {validEffortId, validationExecutedEffort, validationInfoEffort} = _processEffortRecord(record, validProjectId, validEmployeeId, tempValidWorkItemId, validatedHeaders, processingType);
					validationExecuted = validationExecutedEffort;
					validationInfo += validationInfoEffort;
					if(validEffortId) {
						// Update record id
						header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
						record[header.raw] = validEffortId;
					}
				} else {
					DEBUG ? console.warn("   Skipping record: Referenced work item not found.") : null;
					validationExecuted = "INVALID";
				}
				
			} else if(employeeRef && employeeRef.length > 1) {
				DEBUG ? console.warn("   Skipping record: Referenced employee multiple times found.") : null;
				validationExecuted = "INVALID";
				validationInfo += "Referenced employee multiple times found. ";			
			} else {
				DEBUG ? console.warn("   Skipping record: Referenced employee not found.") : null;
				validationExecuted = "INVALID";
				validationInfo += "Referenced employee not found. ";			
			}
		} else if(projectRef && projectRef.length > 1) {
			DEBUG ? console.warn("   Skipping record: Referenced project multiple times found.") : null;
			validationExecuted = "INVALID";
			validationInfo += "Referenced project multiple times found. ";			
		} else {
			DEBUG ? console.warn("   Skipping record: Referenced project not found.") : null;
			validationExecuted = "INVALID";
			validationInfo += "Referenced project not found. ";			
		}
		// --------------------------------------------------
		// Write back validation results
		// --------------------------------------------------
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _processActualRecord(record, validProjectId, validCostPosId, validatedHeaders, processingType) {
		let header = null;
		let value = null;
		let validActualId = null;
		let validationExecutedActual = null;
		let validationInfoActual = "";

		// Validate cost actual to be imported
		header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef).csvHeadersFound[0];
		value = record[header.raw].toString();
		let {validCostsActualId, validationExecutedCostsActual, validationInfoCostsActual} = _validateCostsActualReference(validProjectId, validCostPosId, value, header.attribute, header.matchingType);
		validationExecutedActual = validationExecutedCostsActual;
		validationInfoActual = validationInfoCostsActual;
		
		if(processingType == "IMPORT-PROCESSING-TYPE-DEL") {
			if(validCostsActualId) {
				try {
					Pqf.fco.delProjectCostsPositionActual(validProjectId, validCostPosId, validCostsActualId);
					validActualId = null;
					validationExecutedActual = "DELETED";
					validationInfoActual += "Successfully deleted.";
					record[header.raw] = null;
				} catch(err) {
					DEBUG ? console.error(err) : null;
					validationExecutedActual = "FAILED";
					validationInfoActual += "Deleting failed.";
				}
			} else {
				validationExecutedActual = "INVALID";
			}
		} else {
			header = validatedHeaders.columns.find(x => x.name === "amount").csvHeadersFound[0];
			let curAmount = Number.isNaN(record[header.raw]) ? null : parseFloat(record[header.raw]);
			if(curAmount) {

				header = validatedHeaders.columns.find(x => x.name === "timeOfPayment").csvHeadersFound[0];
				let curTimeOfPayment = _getValidDate(record[header.raw].toString());
				if(curTimeOfPayment) {
					
					// Validate currency
					let curCurrencyId = DEFAULT_CURRENCY_ID;
					header = validatedHeaders.columns.find(x => x.name === "currencyCode").csvHeadersFound;
					if(header) {
						header = header[0];
						curCurrencyId = _getCurrencyId(record[header.raw].toString(), "code") || DEFAULT_CURRENCY_ID;
					}
					let curActualObj = null;
					header = validatedHeaders.columns.find(x => x.name === "name").csvHeadersFound[0];
					let curActualName = record[header.raw].toString();
					if(validCostsActualId) { // record already imported, try updating
						try {
							curActualObj = Pqf.fco.getProjectCostsPositionActual(validProjectId, validCostPosId, validCostsActualId);
						} catch(err) {
							DEBUG ? console.error(err) : null;
							validationExecutedActual = "FAILED";
							validationInfoActual += "Fetching failed. ";
						}
						if(curActualObj) {
							// Set attributes of costs actual
							curActualObj.name = curActualName;
							curActualObj.description = "Aktualisiert " + NOW;
							curActualObj.timeOfPayment = curTimeOfPayment;
							curActualObj.plannedAmount = {
								"original": {
									"amount": curAmount,
									"currency": curCurrencyId
								}
							};
							// Set properties of costs actual
							let headers = validatedHeaders.columns.find(x => x.name === "property").csvHeadersFound;
							headers.forEach(function(header) {
								if(header.isDate) {
									let date = _getValidDate(record[header.raw].toString());
									if(!date) {
										validationInfoActual += "Property " + header.raw + " is not a valid date. ";
									}
									curActualObj.properties.find(x => x.key == header.attribute).value = date;
								} else {
									curActualObj.properties.find(x => x.key == header.attribute).value = record[header.raw].toString();
								}
							});
							
							if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
								try {
									Pqf.fco.putProjectCostsPositionActual(validProjectId, validCostPosId, curActualObj.id, curActualObj);
									validActualId = curActualObj.id;
									validationExecutedActual = "UPDATED";
									validationInfoActual += "Successfully updated. ";
								} catch(err) {
									DEBUG ? console.error(err) : null;
									validationExecutedActual = "FAILED";
									validationInfoActual += "Updating failed.";
								}
							} else if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
								validActualId = curActualObj.id;
								validationExecutedActual = "VALIDATED";
								validationInfoActual += "Costs actual can be updated. ";								
							}
						}
					} else { // new record, try creating
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							try {
								curActualObj = Pqf.fco.addProjectCostsPositionActual(validProjectId, validCostPosId, curCurrencyId, curAmount, curTimeOfPayment);
								validationExecutedActual = "CREATED";
								validationInfoActual += "Successfully created. ";
							} catch(err) {
								DEBUG ? console.error(err) : null;
								validationExecutedActual = "FAILED";
								validationInfoActual += "Creating failed. ";
							}
							if(curActualObj) {
								// Set attributes of costs actual
								curActualObj = Pqf.fco.getProjectCostsPositionActual(validProjectId, validCostPosId, curActualObj.id);
								curActualObj.name = curActualName;
								curActualObj.description = "Importiert " + NOW;
								// Set properties of costs actual
								let headers = validatedHeaders.columns.find(x => x.name === "property").csvHeadersFound;
								headers.forEach(function(header) {
									if(header.isDate) {
										let date = _getValidDate(record[header.raw].toString());
										if(!date) {
											validationInfoActual += "Property " + header.raw + " is not a valid date. ";
										}
										curActualObj.properties.find(x => x.key == header.attribute).value = date;
									} else {
										curActualObj.properties.find(x => x.key == header.attribute).value = record[header.raw].toString();
									}
								});
								try {
									Pqf.fco.putProjectCostsPositionActual(validProjectId, validCostPosId, curActualObj.id, curActualObj);
								} catch(err) {
									DEBUG ? console.error(err) : null;
									validationExecutedActual = "FAILED";
									validationInfoActual += "Updating failed.";
								}
								validActualId = curActualObj.id;
							}
						} else if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							validationExecutedActual = "VALIDATED";
							validationInfoActual += "Costs actual can be created. ";								
						}
					}
					if(curActualObj) {
						DEBUG ? console.log("Successfully added/updated actual id = " + curActualObj.id) : null;
					} else {
						DEBUG ? console.warn("Creating/updating actual position failed") : null;
					}
				} else {
					validationExecutedActual = "INVALID";
					validationInfoActual += "Time of payment is invalid.";
				}
			} else {
				validationExecutedActual = "INVALID";
				validationInfoActual += "Amount is invalid.";
			}
		}
		return {
			"validActualId": validActualId,
			"validationExecutedActual": validationExecutedActual,
			"validationInfoActual": validationInfoActual
		};
	}

	function _processEffortRecord(record, validProjectId, validEmployeeId, validWorkItemId, validatedHeaders, processingType) {
		let header = null;
		let value = null;
		let validEffortId = null;
		let validationExecutedEffort = null;
		let validationInfoEffort = "";

		// Validate effort actual to be imported
		header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef).csvHeadersFound[0];
		value = record[header.raw].toString();
		let {validEffortActualId, validationExecutedEffortActual, validationInfoEffortActual} = _validateEffortActualReference(validEmployeeId, value);
		validationExecutedEffort = validationExecutedEffortActual;
		validationInfoEffort = validationInfoEffortActual;
		
		if(processingType == "IMPORT-PROCESSING-TYPE-DEL") {
			if(validEffortActualId) {
				try {
					Pqf.act.delResourceProjectTimeActual(validEmployeeId, validEffortActualId);
					validEffortActualId = null;
					validationExecutedEffort = "DELETED";
					validationInfoEffort += "Successfully deleted.";
					record[header.raw] = null;
				} catch(err) {
					DEBUG ? console.error(err) : null;
					validationExecutedEffort = "FAILED";
					validationInfoEffort += "Deleting failed.";
				}
			} else {
				validationExecutedEffort = "INVALID";
			}
		} else {
			header = validatedHeaders.columns.find(x => x.name === "duration").csvHeadersFound[0];
			let curDuration = _getValidDuration(record[header.raw].toString());
			if(curDuration) {

				header = validatedHeaders.columns.find(x => x.name === "day").csvHeadersFound[0];
				let curDay = _getValidDate(record[header.raw].toString());
				if(curDay) {
					
					header = validatedHeaders.columns.find(x => x.name === "comment").csvHeadersFound[0];
					let curComment = record[header.raw].toString();

					let curEffortObj = {
						"id": null,
						"day": curDay,
						"projectId": validProjectId,
						"workItemId": validWorkItemId,
						"duration": curDuration,
						"comment": curComment
					};

					let curEffortId = null;
					if(validEffortActualId) { // record already imported, try updating
						curEffortObj.id = validEffortActualId;
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							try {
								Pqf.act.putResourceProjectTimeActual(validEmployeeId, validEffortActualId, curEffortObj);
								validEffortId = validEffortActualId;
								validationExecutedEffort = "UPDATED";
								validationInfoEffort += "Successfully updated. ";
							} catch(err) {
								DEBUG ? console.error(err) : null;
								validationExecutedEffort = "FAILED";
								validationInfoEffort += "Updating failed. ";
							}
						} else if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							validEffortId = validEffortActualId;
							validationExecutedEffort = "VALIDATED";
							if(validWorkItemId) {
								validationInfoEffort += "Effort can be updated on work item. ";
							} else {
								validationInfoEffort += "Effort can be updated on project. ";
							}
						}
					} else { // new record, try creating
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							curEffortId = Pqf.clf.newUuids(1).newUuids[0];
							curEffortObj.id = curEffortId;
							try {
								Pqf.act.putResourceProjectTimeActual(validEmployeeId, curEffortId, curEffortObj);
								validEffortId = curEffortId;
								validationExecutedEffort = "CREATED";
								validationInfoEffort += "Successfully created. ";
							} catch(err) {
								DEBUG ? console.error(err) : null;
								validationExecutedEffort = "FAILED";
								validationInfoEffort += "Creating failed. ";
							}
						} else if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							validationExecutedEffort = "VALIDATED";
							if(validWorkItemId) {
								validationInfoEffort += "Effort can be created on work item. ";								
							} else {
								validationInfoEffort += "Effort can be created on project. ";								
							}
						}
					}
				} else {
					validationExecutedEffort = "INVALID";
					validationInfoEffort += "Day is invalid.";
				}
			} else {
				validationExecutedEffort = "INVALID";
				validationInfoEffort += "Duration is invalid.";
			}
		}
		return {
			"validEffortId": validEffortId,
			"validationExecutedEffort": validationExecutedEffort,
			"validationInfoEffort": validationInfoEffort
		};
	}

	function _processResourceRecord(record, validatedHeaders, atomicResourceRefs, unitResourceRefs, userRefs, processingType) {
		let header = null;
		let value = null;
		let validationExecuted = null;
		let validationInfo = "";
		
		switch(processingType) {
			case "IMPORT-PROCESSING-TYPE-DEL":
				// Check if id of record exists
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				value = record[header.raw].toString();
				if(value != null) {
					try {
						Pqf.res.delResource(value);
						validationInfo += "Resource deleted. ";
						validationExecuted = "DELETED";
						record[header.raw] = null;
					} catch(err) {
						DEBUG ? console.error(err) : null;
						validationInfo += "Could not delete resource - check id and if empty. ";
						validationExecuted = "FAILED";
					}
				} else {
					validationInfo += "Cannot delete record because of missing id. ";
				}
				break;
			case "IMPORT-PROCESSING-TYPE-VAL":
			case "IMPORT-PROCESSING-TYPE-IMP":
				// Check if reference value of record exists
				let column = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef);
				if (column.name === "property") {
					header = column.csvHeadersFound.find(x => x.objectRef);
				} else {
					header = column.csvHeadersFound[0];
				}
				value = record[header.raw].toString();
				let resourceType = header.subType;
			
				if(value != null) { // Reference value exists, check if resource with this reference already exists
				
					let resource = null;
					let resourceRef = null;
					let resourceId = null;

					let feature = null;
					if(["id","name"].includes(validatedHeaders.refs.objectRef)) {
						feature = validatedHeaders.refs.objectRef;
					} else { // objectRef is property
						feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
					}
					switch(resourceType) {
						case "HRM-RES-TYP-EMP":
							resourceRef = _findRefObject(atomicResourceRefs, feature, value, header.matchingType, header.ignoreWhitespace);
							break;
						case "HRM-RES-TYP-OU":
							resourceRef = _findRefObject(unitResourceRefs, feature, value, header.matchingType, header.ignoreWhitespace);
							break;
					}
					
					if(resourceRef && resourceRef.length == 1) { // Resource with this reference value indeed already exists
						resourceRef = resourceRef[0];
						resourceId = resourceRef.id;
						if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							validationInfo += "Resource can be updated. ";
							validationExecuted = "VALIDATED";
						}
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							validationInfo += "Resource updated. ";
							validationExecuted = "UPDATED";
						}
					} else if(resourceRef && resourceRef.length == 0) { // Create a new resource
						// Get parent org unit id and create the new resource in this org unit
						header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.parentRef).csvHeadersFound[0];
						value = record[header.raw].toString();
						feature = null;						
						
						if(header.isProp) { // parentRef is property
							feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
						} else {
							feature = header.attribute;
						}
						let parentRef = _findRefObject(unitResourceRefs, feature, value, header.matchingType, header.ignoreWhitespace);
						if(parentRef && parentRef.length == 1) { // Parent found
							parentRef = parentRef[0];
							switch(resourceType) {
								case "HRM-RES-TYP-EMP":
									header = validatedHeaders.columns.find(x => x.name === "linkType").csvHeadersFound[0];
									let linkType = record[header.raw].toString();
									if(RES_LINK_TYPES.map(x => x.id).includes(linkType)) { // Link type exists
										if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
											resource = Pqf.res.addResourceChild(parentRef.id, linkType);
											resourceId = resource.id;
											validationInfo += "Resource created. ";
											validationExecuted = "CREATED";
										} else {
											validationInfo += "Resource can be created. ";
											validationExecuted = "VALIDATED";
										}
									} else {
										validationExecuted = "FAILED";
										validationInfo += "Cannot create resource - link type does not exist. ";											
									}
									break;
								case "HRM-RES-TYP-OU":
									if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
										resource = Pqf.res.addResourceChild(parentRef.id, "HRM-RES-TYP-LNK-OU-OU");
										resourceId = resource.id;
										validationInfo += "Resource created. ";
										validationExecuted = "CREATED";
									} else {
										validationInfo += "Resource can be created. ";
										validationExecuted = "VALIDATED";
									}
									break;
							}
						} else if(parentRef && parentRef.length > 1) {
							validationExecuted = "FAILED";
							validationInfo += "Cannot create resource - multiple parents found. ";
						} else {
							validationExecuted = "FAILED";
							validationInfo += "Cannot create resource - no parent found. ";
						}
					} else { // Resource multiple times found
						if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
							validationInfo += "Resource cannot be updated - multiple times found. ";
							validationExecuted = "INVALID";
						}
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							validationInfo += "Resource cannot be updated - multiple times found. ";
							validationExecuted = "INVALID";
						}						
					}
					
					if(resourceId) {
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							// Update the properties of the resource
							resource = Pqf.res.getResource(resourceId);
							_setResourceDetails(resource, validatedHeaders, resourceType, record);
							Pqf.res.putResource(resourceId, resource);	
						}
						// Update the worktime model (availability) of the resource
						header = (validatedHeaders.columns.find(x => x.name === "validAfter").csvHeadersFound ? validatedHeaders.columns.find(x => x.name === "validAfter").csvHeadersFound[0] : null);
						if(header) { // "validAfter" column exists
							let availabilityValidAfter = _getValidDate(record[header.raw].toString());
							if(availabilityValidAfter) {
								let availabilities = Pqf.res.getAvailabilities(resourceId);
								if(availabilities && availabilities.length > 0) {
									availabilities.sort(function(a, b) { // sort availabilities according to "validAfter" date but in reverse order (latest date first)
										if(moment(a.validAfter).isBefore(moment(b.validAfter))) {
											return 1;
										} else if(moment(a.validAfter).isSame(moment(b.validAfter))) {
											return 0;
										} else {
											return -1;
										}
									});
									// Now that the availabilities are sorted, find the latest that is *not* after the given date
									let availability = availabilities.find(x => moment(x.validAfter).isSameOrBefore(moment(availabilityValidAfter), "day"));
									if(!availability) { // No such availability found, all must be in the future. Take the earliest one, i.e., last in the array.
										availability = availabilities[availabilities.length - 1];
									}
									
									// Update workload?
									let hoursPerShift = _standardHoursPerShift; // Corresponds to 100% workload
									header = (validatedHeaders.columns.find(x => x.name === "workload").csvHeadersFound ? validatedHeaders.columns.find(x => x.name === "workload").csvHeadersFound[0] : null);
									if(header) { // workload present
										let workload = Number(record[header.raw].toString());
										if(isNaN(workload) || workload < 0.0 || workload > 100.0) {
											validationInfo += " Cannot interpret workload - must be a number between 0 and 100 - assuming 100%.";
										} else {
											hoursPerShift = _standardHoursPerShift / 100 * workload;
										}
									}
									
									// Update baseload?
									header = (validatedHeaders.columns.find(x => x.name === "baseload").csvHeadersFound ? validatedHeaders.columns.find(x => x.name === "baseload").csvHeadersFound[0] : null);
									if(header) { // baseload present
										let baseload = Number(record[header.raw].toString());
										if(isNaN(baseload)) {
											availability.basicLoadPercent = 0;
											validationInfo += " Cannot interpret baseload - assuming 0%.";
										} else {
											availability.basicLoadPercent = baseload;
										}
									}
									
									// Update costPerHour?
									header = (validatedHeaders.columns.find(x => x.name === "costPerHour").csvHeadersFound ? validatedHeaders.columns.find(x => x.name === "costPerHour").csvHeadersFound[0] : null);
									if(header) { // costPerHour present
										let costPerHour = Number(record[header.raw].toString());
										if(isNaN(costPerHour)) {
											availability.costPerHour = 0;
											validationInfo += " Cannot interpret costPerHour - assuming 0.";
										} else {
											availability.costPerHour = costPerHour;
										}
									}
									
									// Update costCurrency?
									header = (validatedHeaders.columns.find(x => x.name === "currencyCode").csvHeadersFound ? validatedHeaders.columns.find(x => x.name === "currencyCode").csvHeadersFound[0] : null);
									if(header) { // currencyCode present
										let costCurrencyId = _getCurrencyId(record[header.raw].toString(), "code");
										if(!costCurrencyId) {
											costCurrencyId = DEFAULT_CURRENCY_ID;
											validationInfo += " Currency code not recognized - using default currency.";
										}
										availability.costCurrency = costCurrencyId;
									}
									
									// Update holidayLocaleId?
									header = (validatedHeaders.columns.find(x => x.name === "location").csvHeadersFound ? validatedHeaders.columns.find(x => x.name === "location").csvHeadersFound[0] : null);
									if(header) { // location present
										let locationResult = _getLocationId(record[header.raw].toString(), "name", header.matchingType);
										if(locationResult.id == null) {
											validationInfo += " " + locationResult.validationInfo;
										}
										availability.holidayLocaleId = locationResult.id;
									}
									
									if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
										// Update the availability
										availability.description = "Importiert " + NOW;
										availability.inheritFromParent = false;
										let durationShiftString = "PT" + Math.floor(hoursPerShift) + "H" + Math.round(60*(hoursPerShift - Math.floor(hoursPerShift))) + "M";
										let durationWorkdayString = "PT" + Math.floor(_numShifts * hoursPerShift) + "H" + Math.round(60*(_numShifts * hoursPerShift - Math.floor(_numShifts * hoursPerShift))) + "M";
										availability.models.forEach(function(model) {
											model.presencePerDay = [
												{
													"presence": true,
													"duration": durationShiftString
												},
												{
													"presence": true,
													"duration": durationShiftString
												},
												{
													"presence": true,
													"duration": durationShiftString
												},
												{
													"presence": true,
													"duration": durationShiftString
												},
												{
													"presence": true,
													"duration": durationShiftString
												},
												{
													"presence": false,
													"duration": durationShiftString
												},
												{
													"presence": false,
													"duration": durationShiftString
												}
											];
										});
										availability.standardAvails = [
											durationWorkdayString,
											durationWorkdayString,
											durationWorkdayString,
											durationWorkdayString,
											durationWorkdayString,
											"PT0S",
											"PT0S"
										];
										availability.validAfter = availabilityValidAfter;
										Pqf.res.putAvailability(resourceId, availability.id, availability);
									}
										
								} else {
									validationInfo += " Updating worktime model failed - no availabilities found.";
								}
							} else {
								validationInfo += " Updating worktime model failed - validAfter date not valid.";
							}
						} else {
							validationInfo += " No worktime model defined.";							
						}
						// Link user
						header = (validatedHeaders.columns.find(x => ["username", "userid"].includes(x.name) && x.csvHeadersFound) || { csvHeadersFound: [null] }).csvHeadersFound[0];
						if (header) {	// username/userid column exists
							feature = validatedHeaders.refs.targetRef;
							value = record[header.raw].toString();
							let targetRef = _findRefObject(userRefs, feature, value, header.matchingType, header.ignoreWhitespace);
							if (!targetRef) {
								validationInfo += " User not found to link. ";
							} else if (targetRef.length > 1) {
								validationInfo += " Multiple users found to link. ";
							} else {
								targetRef = targetRef[0];
								if (processingType == "IMPORT-PROCESSING-TYPE-IMP") {
									let resourceIdentification = Pqf.res.getResourceIdentification(resourceId);
									const ATTRIBUTES_TO_KEEP = ["type", "id", "name", "code", "description", "iconRef", "color"];
									targetRef.resource = Object.keys(resourceIdentification).reduce((obj, key) => {
										if (ATTRIBUTES_TO_KEEP.includes(key)) {
											obj[key] = resourceIdentification[key];
										}
										return obj;
									}, {});
									Pqf.acm.putUser(targetRef.id, targetRef);
									validationInfo += " User linked. ";
								} else {
									validationInfo += " User can be linked. ";
								}
							}
						}
						// Update id column in CSV file
						header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
						record[header.raw] = resourceId;
					}
				} else { // reference value missing
					validationExecuted = "FAILED";
					validationInfo += "Missing reference value";
				}
				break;
		}
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _processEmployeeRelation(record, validatedHeaders, sourceObjectType, sourceRefs, employeeRefs, processingType) {
		let header = null;
		let value = null;
		let relationId = null;
		let relationType = null;
		let validationExecuted = null;
		let validationInfo = "";
		
		switch(processingType) {
			case "IMPORT-PROCESSING-TYPE-DEL":
				// Check if id of record exists
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				relationId = record[header.raw].toString();
				header = validatedHeaders.columns.find(x => x.name === "type").csvHeadersFound[0];
				relationType = record[header.raw].toString();
				if(relationId && relationType) {
					try{
						Pqf.pf.delExplicitRelation(relationType, relationId);
						validationInfo += "Relation deleted";
						validationExecuted = "DELETED";
						header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
						record[header.raw] = null;
					} catch(err) {
						DEBUG ? console.error(err) : null;
						validationInfo += "Could not delete relation - check id and type";
						validationExecuted = "FAILED";
					}
				} else {
					validationInfo += "Cannot delete relation because of missing id";
				}
				break;
				
			case "IMPORT-PROCESSING-TYPE-VAL":
			case "IMPORT-PROCESSING-TYPE-IMP":
				
				// Get reference relation
				header = validatedHeaders.columns.find(x => x.name === "type").csvHeadersFound[0];
				relationType = record[header.raw].toString();
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				relationId = record[header.raw].toString();
				
				if(relationId) {
					validationExecuted = "VALIDATED";
					validationInfo += "Relation already exists";
				} else {
					// Get source object
					header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.sourceRef).csvHeadersFound[0];
					value = record[header.raw].toString();
					let feature = null;
					if(header.isProp) {
						feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
					} else {
						feature = header.attribute;
					}
					let sourceRef = _findRefObject(sourceRefs, feature, value, header.matchingType, header.ignoreWhitespace);
					
					// Get reference resource (target object)
					header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.targetRef).csvHeadersFound[0];
					value = record[header.raw].toString();					
					if(header.isProp) {
						feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
					} else {
						feature = header.attribute;
					}
					let resourceRef = _findRefObject(employeeRefs, feature, value, header.matchingType, header.ignoreWhitespace);
		
					if(sourceRef && sourceRef.length == 1 && resourceRef && resourceRef.length == 1) {
						sourceRef = sourceRef[0];
						resourceRef = resourceRef[0];
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							let relation = null;
							try {
								// TODO: Implement this in a more general way - currently this is hard-coded for HRM-RES-TYP-EMP!
								relation = Pqf.pf.addExplicitRelation(relationType, sourceObjectType, sourceRef.id, "HRM-RES-TYP-EMP", resourceRef.id);
								header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
								record[header.raw] = relation.id;
							} catch(err) {
								console.error("Pqf.pf.addExplicitRelation failed:");
								DEBUG ? console.error(err) : null;
								validationExecuted = "FAILED";
								validationInfo += "Creating the relation failed.";
							}
							validationExecuted = "CREATED";
							validationInfo += "Relation created";
						} else {
							validationExecuted = "VALIDATED";
							validationInfo += "Relation can be created";							
						}
					} else if(sourceRef && sourceRef.length > 1) {
						validationExecuted = "INVALID";
						validationInfo += "Cannot create relation - " + sourceRef + " multiple times found";
					} else if(sourceRef && sourceRef.length == 0) {
						validationExecuted = "INVALID";
						validationInfo += "Cannot create relation - source object not found";						
					} else if(resourceRef && resourceRef.length > 1) {
						validationExecuted = "INVALID";
						validationInfo += "Cannot create relation - target object (resource) multiple times found";						
					} else if(resourceRef && resourceRef.length == 0) {
						validationExecuted = "INVALID";
						validationInfo += "Cannot create relation - target object (resource) not found";						
					}
				}
				break;

		}
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _processAllocationRecord(record, validatedHeaders, projectRefs, resourceRefs, processingType) {
		let header = null;
		let value = null;
		let validationExecutedAlloc = null;
		let validationInfoAlloc = "";
		
		switch (processingType) {
			case "IMPORT-PROCESSING-TYPE-DEL":
				// Check if MacroAllocation with specified ID exists on the given work item
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				value = record[header.raw].toString();
				if(value != null) {
					try {
						Pqf.pm.delMacroAllocation(value);
						validationInfoAlloc += "Allocation deleted.";
						validationExecutedAlloc = "DELETED";
						record[header.raw] = null;
					} catch(err) {
						DEBUG ? console.error(err) : null;
						validationExecutedAlloc = "FAILED";
						validationInfoAlloc += "Deleting failed.";
					}
				} else {
					validationInfoAlloc += "Did not find allocation with specified id on the given work item.";
					validationExecutedAlloc = "FAILED";
				}
				break;
			case "IMPORT-PROCESSING-TYPE-VAL":
			case "IMPORT-PROCESSING-TYPE-IMP":
				// Check if reference value of record exists
				header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef).csvHeadersFound[0];
				value = record[header.raw].toString();
				if (!value) value = Pqf.clf.newUuids(1).newUuids[0]; // Generate a new UUID if no reference value is provided
				let macroAlloc = null;
				let isNew = false;
				try {
					macroAlloc = Pqf.pm.getMacroAllocation(value);
					DEBUG ? console.log("Found existing MacroAllocation with id " + value + " - updating") : null;
				} catch (err) {
					isNew = true;
					macroAlloc = {
						"type": "MacroAllocation",
						"id": value
					};
					DEBUG ? console.log("No existing MacroAllocation with id " + value + " - creating new one") : null;
				}
				// Get referenced objects
				let prjObjs = null;
				let workItemObjs = null;
				let resourceObjs = null;
				const REFS_MAP = [
					{
						"name": "superparentRef",
						"pool": projectRefs,
						"writeTargetObj": function(obj) { prjObjs = obj; }
					},
					{
						"name": "targetRef",
						"pool": resourceRefs,
						"writeTargetObj": function(obj) { resourceObjs = obj; }
					}
				]
				REFS_MAP.forEach(obj => {
					header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs[obj.name]).csvHeadersFound[0];
					value = record[header.raw].toString();
					let feature = null;
					if(header.isProp) {
						feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
					} else {
						feature = header.attribute;
					}
					obj.writeTargetObj(_findRefObject(obj.pool, feature, value, header.matchingType, header.ignoreWhitespace));
				});
				if (!prjObjs || prjObjs.length === 0) {
					validationExecutedAlloc = "INVALID";
					validationInfoAlloc += "Project reference not found.";
				} 
				if (!resourceObjs || resourceObjs.length === 0) {
					validationExecutedAlloc = "INVALID";
					validationInfoAlloc += "Resource reference not found.";
				}
				if (prjObjs && prjObjs.length > 1) {
					validationExecutedAlloc = "INVALID";
					validationInfoAlloc += "Multiple project references found.";
				}
				if (resourceObjs && resourceObjs.length > 1) {
					validationExecutedAlloc = "INVALID";
					validationInfoAlloc += "Multiple resource references found.";
				}
				if (validationExecutedAlloc !== "INVALID") {
					// Check if active scenario exists
					let activeScenario = null;
					try {
						activeScenario = Pqf.pm.getProjectActiveScenario(prjObjs[0].id, false);
					} catch(err) {
						DEBUG ? console.log("No active scenario found for project " + prjObjs[0].id) : null;
					}
					if (activeScenario) {// Validate referenced work item
						header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.parentRef).csvHeadersFound[0];
						value = record[header.raw].toString();
						let {validWorkItemId, validationExecutedWorkItem, validationInfoWorkItem} = _validateWorkItemReference(activeScenario.id, value, header.attribute, header.matchingType, processingType);
						validationExecutedAlloc = validationExecutedWorkItem || validationExecutedAlloc;
						validationInfoAlloc += validationInfoWorkItem || "";
						if (validationExecutedWorkItem !== "INVALID") {
							if (macroAlloc.projectId && macroAlloc.projectId !== prjObjs[0].id) {
								validationExecutedAlloc = "INVALID";
								validationInfoAlloc += "Referenced project does not match with project in existing allocation.";
							}
							if (macroAlloc.workItemId && macroAlloc.workItemId !== validWorkItemId) {
								validationExecutedAlloc = "INVALID";
								validationInfoAlloc += "Referenced work item does not match with work item in existing allocation.";
							} 
							if (macroAlloc.resourceId && macroAlloc.resourceId !== resourceObjs[0].id) {
								validationExecutedAlloc = "INVALID";
								validationInfoAlloc += "Referenced resource does not match with resource in existing allocation.";
							}
							if (validationExecutedAlloc !== "INVALID") {
								if (processingType === "IMPORT-PROCESSING-TYPE-VAL") {
									validationExecutedAlloc = "VALIDATED";
									validationInfoAlloc += isNew ? "Allocation can be created." : "Allocation can be updated.";
									if (!isNew) {
										header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
										record[header.raw] = macroAlloc.id;
									}
								} else if (processingType === "IMPORT-PROCESSING-TYPE-IMP") {
									// Read and validate amount and amount unit
									let {amount, amountUnit, amountType, effectiveDuration, validationExecutedAmount, validationInfoAmount} = _validateAmount(record, validatedHeaders);
									validationExecutedAlloc = validationExecutedAmount || validationExecutedAlloc;
									validationInfoAlloc += validationInfoAmount || "";
									if (validationExecutedAmount !== "INVALID") {
										macroAlloc.projectId = prjObjs[0].id;
										macroAlloc.scenarioId = activeScenario.id;
										macroAlloc.workItemId = validWorkItemId;
										macroAlloc.resourceType = resourceObjs[0].type;
										macroAlloc.resourceId = resourceObjs[0].id;
										macroAlloc.amount = amount;
										macroAlloc.amountUnit = amountUnit;
										macroAlloc.amountType = amountType;
										macroAlloc.remark = "Importiert um " + NOW;
										macroAlloc.effectiveDuration = effectiveDuration;
										try {
											Pqf.pm.putMacroAllocation(macroAlloc.id, macroAlloc);
											validationExecutedAlloc = isNew ? "CREATED" : "UPDATED";
											console.log("validationInfoAlloc: " + validationInfoAlloc);
											validationInfoAlloc += isNew ? " Allocation created." : " Allocation updated.";
											// Update id column in CSV file
											header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
											record[header.raw] = macroAlloc.id;
										} catch(err) {
											DEBUG ? console.error(err) : null;
											validationExecutedAlloc = "FAILED";
											validationInfoAlloc += " Failed to create/update allocation.";
										}
									}
								}
							}
						}
					} else {
						validationExecutedAlloc = "INVALID";
						validationInfoAlloc += "No active scenario found for project.";
					}
				}
		}
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecutedAlloc;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfoAlloc;
		return record;
	}

	function _validateAmount(record, validatedHeaders) {
		let amountHeader = validatedHeaders.columns.find(x => x.name === "allocationAmount").csvHeadersFound[0];
		let amountUnitHeader = validatedHeaders.columns.find(x => x.name === "allocationUnit").csvHeadersFound[0];
		let amount_raw = record[amountHeader.raw].toString();
		let amountUnit_raw = record[amountUnitHeader.raw].toString();

		const MAP_AMOUNT_UNITS = {
			"h": {
				"acceptedNames": ["h", "hours", "Stunden"],
				"amountType": "ABSOLUTE",
				"calculateEffectiveDuration": function(amount) { return moment.duration(amount, "hours").toISOString(); }
			}
		};

		let amount = null;
		let amountUnit = null;
		let amountType = null;
		let effectiveDuration = null;
		let validationExecuted = null;
		let validationInfo = "";
		if (amount_raw && amountUnit_raw) {
			amountUnit = Object.keys(MAP_AMOUNT_UNITS).find(key => MAP_AMOUNT_UNITS[key].acceptedNames.includes(amountUnit_raw));
			if (amountUnit) {
				amountType = MAP_AMOUNT_UNITS[amountUnit].amountType;
				amount = Number(amount_raw);
				if (isNaN(amount) || amount < 0) {
					validationExecuted = "INVALID";
					validationInfo += "Amount must be a non-negative number.";
				} else {
					validationInfo += "Amount is valid.";
					effectiveDuration = MAP_AMOUNT_UNITS[amountUnit].calculateEffectiveDuration(amount);
				}
			} else {
				validationExecuted = "INVALID";
				validationInfo += "Amount unit not recognized.";
			}
		} else {
			validationExecuted = "INVALID";
			validationInfo += "Amount and amount unit must both be provided.";
		}
		return {
			"amount": amount,
			"amountUnit": amountUnit,
			"amountType": amountType,
			"effectiveDuration": effectiveDuration,
			"validationExecuted": validationExecuted,
			"validationInfo": validationInfo
		};
	}

	function _processProjectScenario(record, validatedHeaders, projectRefs, processingType) {
		let header = null;
		let value = null;
		let validationExecuted = null;
		let validationInfo = "";
		
		switch(processingType) {
			case "IMPORT-PROCESSING-TYPE-DEL":
				// Check if id of record exists
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				value = record[header.raw].toString();
				if(value != null) {
					try{
						Pqf.pm.delProjectScenario(value);
						validationInfo += "Scenario deleted";
						validationExecuted = "DELETED";
						record[header.raw] = null;
					} catch(err) {
						DEBUG ? console.error(err) : null;
						validationInfo += "Could not delete scenario - check id";
						validationExecuted = "FAILED";
					}
				} else {
					validationInfo += "Cannot delete scenario because of missing id";
				}
				break;
			case "IMPORT-PROCESSING-TYPE-VAL":
			case "IMPORT-PROCESSING-TYPE-IMP":
				// Check if reference value of record exists
				header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef).csvHeadersFound[0];
				let valueScenario = record[header.raw].toString();
				let ignoreWhitespaceScenario = header.ignoreWhitespace;
				header = validatedHeaders.columns.find(x => x.name === "project").csvHeadersFound[0];
				let valueProject = record[header.raw].toString();
				let ignoreWhitespaceProject = header.ignoreWhitespace;
				
				if(valueScenario && valueProject) { // Reference values exist
				
					// Validate start/end dates of main task
					header = validatedHeaders.columns.find(x => x.name === "beg").csvHeadersFound[0];
					let begDate = _validateDate(record[header.raw]);
					header = validatedHeaders.columns.find(x => x.name === "end").csvHeadersFound[0];
					let endDate = _validateDate(record[header.raw]);
					
					if(begDate && endDate) {

						// Check if project and scenario with these references already exist
						let scenario = null;
						header = validatedHeaders.columns.find(x => x.name === "project").csvHeadersFound[0];
						let featureProject = null;
						if(header.isProp) {
							featureProject = { "objectType": header.objectType, "subobjectType": header.subobjectType, "propertyId": header.attribute };
						} else {
							featureProject = header.attribute;
						}
						let featureScenario = validatedHeaders.refs.objectRef;
						let {scenarioRef, projectRef} = _findRefScenario(projectRefs, featureProject, valueProject, featureScenario, valueScenario, ignoreWhitespaceScenario, ignoreWhitespaceProject);
						let scenarioId = null;
		
						if(scenarioRef) { // Scenario with this reference value indeed already exists in the project with given reference
							scenarioId = scenarioRef.id;
							if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
								validationInfo += "Scenario can be updated";
								validationExecuted = "VALIDATED";
							}
							if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
								validationInfo += "Scenario updated";
								validationExecuted = "UPDATED";
							}
						} else if(projectRef) { // Create a new scenario
							if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
								validationInfo += "Scenario can be created";
								validationExecuted = "VALIDATED";
							}
							if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
								scenarioId = Pqf.pm.addProjectScenario(projectRef.id).id;
								validationInfo += "Scenario created";
								validationExecuted = "CREATED";
							}
						} else {
							validationInfo += "No project reference found";
							validationExecuted = "INVALID";
						}
						
						if(processingType == "IMPORT-PROCESSING-TYPE-IMP") {
							scenario = Pqf.pm.getProjectScenario(scenarioId);
							
							// Update the scenario
							header = validatedHeaders.columns.find(x => x.name === "name").csvHeadersFound[0];
							scenario.name = record[header.raw].toString();
							header = validatedHeaders.columns.find(x => x.name === "description");
							if(header) {
								scenario.description = record[header.csvHeadersFound[0].raw];
							}
							Pqf.pm.putProjectScenario(scenarioId, scenario);
		
							// Update the main task of the scenario
							let mainTask = Pqf.pm.getScenarioWorkItems(scenarioId)[0];
							header = validatedHeaders.columns.find(x => x.name === "maintask").csvHeadersFound[0];
							mainTask.name = record[header.raw].toString();
							mainTask.beg = begDate.toISOString();
							mainTask.end = endDate.add(1, "days").toISOString();
							Pqf.pm.putWorkItem(mainTask.id, null, mainTask);
							
							// Update scenario lifecycle?
							header = validatedHeaders.columns.find(x => x.name === "lifecycle");
							if(header) {
								header = header.csvHeadersFound[0];
								value = record[header.raw].toString();
								let lifecycleStateIds = value.split(_lifecycleStateSeparator);
								let result =_updateLifecycle("Scenario", scenario, lifecycleStateIds);
								if(result) {
									validationInfo += result;
									validationExecuted = "FAILED";
								}
							}
		
							// Update id column in CSV file
							header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
							record[header.raw] = scenarioId;
						}
					} else {
						validationInfo += "Begin and/or end date of main task not valid";
						validationExecuted = "INVALID";
					}
				} else { // reference value missing
					validationInfo += "Missing reference value";
				}
				break;
		}
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _processProjectWorkItem(record, validatedHeaders, projectRefs, processingType) {
		let header = null;
		let value = null;
		let validationExecuted = null;
		let validationInfo = "";
		
		switch(processingType) {
			case "IMPORT-PROCESSING-TYPE-DEL":
				// Check if id of record exists
				header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
				value = record[header.raw].toString();
				if(value != null) {
					try{
						Pqf.pm.delWorkItem(value);
						validationInfo += "Work item deleted";
						validationExecuted = "DELETED";
						record[header.raw] = null;
					} catch(err) {
						DEBUG ? console.error(err) : null;
						validationInfo += "Could not delete scenario - check id";
						validationExecuted = "DELETED";
					}
				} else {
					validationInfo += "Cannot delete scenario because of missing id";
				}
				break;
			case "IMPORT-PROCESSING-TYPE-VAL":
			case "IMPORT-PROCESSING-TYPE-IMP":			
			
				// Get referenced project (mandatory column)
				header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.superparentRef).csvHeadersFound[0];
				value = record[header.raw].toString();
				if(value) { // Reference value exist
				
					let feature = null;
					header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.superparentRef).csvHeadersFound[0];
					if(["id","code","name"].includes(header.attribute)) {
						feature = header.attribute;
					} else { // objectRef is property
						feature = { "objectType": header.objectType, "subobjectType": header.subType, "propertyId": header.attribute };
					}
					let projectRef = _findRefObject(projectRefs, feature, value, header.matchingType, header.ignoreWhitespace);
					if(projectRef && projectRef.length == 1) { // One project found
						projectRef = projectRef[0];
						validationInfo += "Referenced project found (" + projectRef.id + "). ";

						// Check if active scenario exists
						let activeScenario = null;
						try {
							activeScenario = Pqf.pm.getProjectActiveScenario(projectRef.id, false);
						} catch(err) {
							DEBUG ? console.error(err) : null;
						}
						if(activeScenario) {
							validationInfo += "Active scenario found. ";
							
							let mainTask = Pqf.pm.getScenarioWorkItems(activeScenario.id)[0];

							// Validate referenced work item
							header = validatedHeaders.columns.find(x => x.name === validatedHeaders.refs.objectRef).csvHeadersFound[0];
							value = record[header.raw].toString();
							
							let {validWorkItemId, validationExecutedWorkItem, validationInfoWorkItem} = _validateWorkItemReference(activeScenario.id, value, validatedHeaders.refs.objectRef, header.matchingType, processingType);
							if(validWorkItemId) {
								if(processingType === "IMPORT-PROCESSING-TYPE-VAL") {
									validationInfo += "Work item can be updated";
									validationExecuted = "VALIDATED";									
								} else {
									validationInfo += "Work item updated";
									validationExecuted = "UPDATED";									
								}
							} else {
								if(processingType === "IMPORT-PROCESSING-TYPE-VAL") {
									validationInfo += "Work item can be created";
									validationExecuted = "VALIDATED";
								} else {
									validationInfo += "Work item created";
									validationExecuted = "CREATED";
								}
							}
							if(processingType === "IMPORT-PROCESSING-TYPE-IMP") {
								header = validatedHeaders.columns.find(x => x.name === "name").csvHeadersFound[0];
								let workItemName = record[header.raw].toString();
								
								header = validatedHeaders.columns.find(x => x.name === "code").csvHeadersFound;
								let workItemCode = null;
								if(header) {
									workItemCode = record[header[0].raw].toString();
								}

								header = validatedHeaders.columns.find(x => x.name === "description").csvHeadersFound;
								let workItemDescription = null;
								if(header) {
									workItemDescription = record[header[0].raw].toString();
								}

								header = validatedHeaders.columns.find(x => x.name === "startDate").csvHeadersFound[0];
								value = record[header.raw].toString();
								let workItemStartDate = _getValidDate(value);
								
								header = validatedHeaders.columns.find(x => x.name === "endDate").csvHeadersFound[0];
								value = record[header.raw].toString();
								let workItemEndDate = _getValidDate(value);
								
								let workItemObj = null;
								if(!validWorkItemId) {
									// Create a new work item
									let workItemObj = {
										"type": "Phase",
										"name": workItemName,
										"beg": moment(workItemStartDate).toISOString(),
										"end": moment(workItemEndDate).add(1, 'day').toISOString(),
										"parentPhaseId": mainTask.id
									};
									workItemObj = Pqf.pm.addWorkItemSubWorkItem(mainTask.id, workItemObj);
									validWorkItemId = workItemObj.id;
								}
								// Update
								workItemObj = Pqf.pm.getWorkItem(validWorkItemId, null);
								workItemObj.name = workItemName;
								workItemObj.code = workItemCode;
								workItemObj.description = workItemDescription;
								workItemObj.beg = moment(workItemStartDate).toISOString();
								workItemObj.end = moment(workItemEndDate).add(1, 'day').toISOString();
								Pqf.pm.putWorkItem(workItemObj.id, false, workItemObj);

								// Update id column in CSV file
								header = validatedHeaders.columns.find(x => x.name === "id").csvHeadersFound[0];
								record[header.raw] = validWorkItemId;
							}
														
						} else {
							validationInfo += "No active scenario found";
							validationExecuted = "INVALID";													
						}
					} else {
						validationInfo += "Referenced project not found";
						validationExecuted = "INVALID";						
					}		
				} else { // reference value missing
					validationInfo += "Missing project reference value";
				}
				break;
		}
		header = validatedHeaders.columns.find(x => x.name === "validationExecuted").csvHeadersFound[0];
		record[header.raw] = validationExecuted;
		header = validatedHeaders.columns.find(x => x.name === "validationInfo").csvHeadersFound[0];
		record[header.raw] = validationInfo;
		return record;
	}

	function _validateWorkItemReference(validScenarioId, value, objectRef, matchingType, processingType) {
		// Arguments:
		//  - validScenarioId (string): ID of an existing scenario
		//  - value (string): to be found
		//  - objectRef (string): "id", "code", "name", or a property ID
		//  - matchingType (string): ":exact", ":includes", or ":isIncluded"
		//  - processingType (string)

		let validWorkItemId = null;
		let validationExecuted = null;
		let validationInfo = "";
		
		if(value != null) {
			let workItems = null;
			switch(objectRef) {
				case "id":
					try {
						let workItemObj = Pqf.pm.getWorkItem(value, null);
						workItems = [{"id": workItemObj.id}];
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
					break;
				default:
					try {
						workItems = Pqf.pm.getScenarioWorkItems(validScenarioId, true, null);
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
			}
			if(workItems) {
				workItems = workItems.filter(function(workItem) {
					let workItemAttribute = null;
					switch(objectRef) {
						case "id":
						case "name":
						case "code":
							workItemAttribute = workItem[objectRef];
							break;
						default: // Look for a property with the given key
							let prop = workItem.properties.find(x => x.key === objectRef);
							if(prop) {
								workItemAttribute = prop.value;
							}
					}
					switch(matchingType) {
						case ":includes":
							if(value.includes(workItemAttribute)) {
								return true;
							} else {
								return false;
							}
							break;
						case ":isIncluded":
							if(workItemAttribute.includes(value)) {
								return true;
							} else {
								return false;
							}
							break;
						default: // ":exact"
							if(workItemAttribute == value) {
								return true;
							} else {
								return false;
							}
					}
				});
				if(workItems.length === 1) {
					validWorkItemId = workItems[0].id;
				} else if(workItems.length > 1) {
					validationExecuted = "INVALID";
					validationInfo += "Referenced work item multiple times found. ";					
				} else {
					validationExecuted = "INVALID";
					validationInfo += "Referenced work item not found. ";							
				}
			}
		} else {
			validationExecuted = "INVALID";
		}
		return {
			"validWorkItemId": validWorkItemId,
			"validationExecutedWorkItem": validationExecuted,
			"validationInfoWorkItem": validationInfo
		};
	}

	function _validateCostsPositionReference(validProjectId, value, objectRef, matchingType, defaultCostsPosId, createIfMissing, processingType) {
		// Arguments:
		//  - validProjectId (string): ID of an existing project
		//  - value (string): to be found
		//  - objectRef (string): "id", "name", "costType", or a property ID
		//  - matchingType (string): ":exact", ":includes", or ":isIncluded"
		//  - defaultCostsPosId: ID of an existing costs position in the project
		//  - createIfMissing (boolean): if true then a new cost position will be created if none is found
		//  - processingType (string)
		
		let curCostsPosId = null;
		let validCostsPosId = null;
		let validationExecutedCostsPos = null;
		let validationInfo = "";
		
		if(value != null) {
			let allCostsPos = null;
			let curCostsPosObjs = null;
			switch(objectRef) {
				case "id":
					curCostsPosObjs = [];
					curCostsPosId = value;
					try {
						let curCostsPosObj = Pqf.fco.getProjectCostsPosition(validProjectId, curCostsPosId);
						curCostsPosObjs.push(curCostsPosObj);
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
					break;
				case "name":
					try {
						allCostsPos = Pqf.fco.getProjectCostsPositions(validProjectId);
						curCostsPosObjs = allCostsPos.filter(function(costsPos) {
							switch(matchingType) {
								case ":includes":
									if(costsPos.name && value.includes(costsPos.name)) {
										return true;
									} else {
										return false;
									}
									break;
								case ":isIncluded":
									if(costsPos.name && costsPos.name.includes(value)) {
										return true;
									} else {
										return false;
									}
									break;
								default: // ":exact"
									if(costsPos.name == value) {
										return true;
									} else {
										return false;
									}
							}
						});
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
					break;
				case "costsType":
					try {
						allCostsPos = Pqf.fco.getProjectCostsPositions(validProjectId);
						curCostsPosObjs = allCostsPos.filter(function(costsPos) {
							switch(matchingType) {
								case ":includes":
									if(costsPos.costsType && costsPos.costsType.name && value.includes(costsPos.costsType.name)) {
										return true;
									} else {
										return false;
									}
									break;
								case ":isIncluded":
									if(costsPos.costsType && costsPos.costsType.name && costsPos.costsType.name.includes(value)) {
										return true;
									} else {
										return false;
									}
									break;
								default: // ":exact"
									if(costsPos.costsType && costsPos.costsType.name && costsPos.costsType.name == value) {
										return true;
									} else {
										return false;
									}
							}
						});
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
					break;
				default: // Look for a property with the given id
					try {
						allCostsPos = Pqf.fco.getProjectCostsPositions(validProjectId);
						curCostsPosObjs = allCostsPos.filter(function(costsPos) {
							let prop = costsPos.properties.find(x => x.key === objectRef);
							if(prop) {
								switch(matchingType) {
									case ":includes":
										if(prop.value && value.includes(prop.value)) {
											return true;
										} else {
											return false;
										}
										break;
									case ":isIncluded":
										if(prop.value && prop.value.includes(value)) {
											return true;
										} else {
											return false;
										}
										break;
									default: // ":exact"
										if(prop.value && prop.value == value) {
											return true;
										} else {
											return false;
										}
								}
							} else {
								return false;
							}
						});
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
			}
			if(curCostsPosObjs.length == 1) {
				validCostsPosId = curCostsPosObjs[0].id;
			} else if(curCostsPosObjs.length > 1) {
				DEBUG ? console.log("Referenced costs position is not unique.") : null;
				validationExecutedCostsPos = "INVALID";
				validationInfo += "Referenced costs position is not unique. ";
			} else if(createIfMissing) {
				if(processingType == "IMPORT-PROCESSING-TYPE-VAL") {
					validationExecutedCostsPos = "VALIDATED";
					validationInfo += "Costs position will be created. ";
				} else {
					try {
						// Identify costs type
						let costsTypes = Pqf.fco.getCostsTypes().filter(function(costsType) {
							switch(matchingType) {
								case ":includes":
									if(costsType && costsType.name && value.includes(costsType.name)) {
										return true;
									} else {
										return false;
									}
									break;
								case ":isIncluded":
									if(costsType && costsType.name && costsType.name.includes(value)) {
										return true;
									} else {
										return false;
									}
									break;
								default: // ":exact"
									if(costsType && costsType.name && costsType.name == value) {
										return true;
									} else {
										return false;
									}
							}
						});
						if(costsTypes && costsTypes.length == 1) {
							// Create costs position of that type
							let newCostsPosition = Pqf.fco.addProjectCostsPosition(validProjectId, null, DEFAULT_CURRENCY_ID, 0.0, null);
							newCostsPosition = Pqf.fco.getProjectCostsPosition(validProjectId, newCostsPosition.id, null);
							newCostsPosition.name = DEFAULT_COST_POS_NAME_CREATED + " (" + NOW + ")";
							newCostsPosition.costsType = {
								"id": costsTypes[0].id,
								"objectType": costsTypes[0].objectType
							};
							Pqf.fco.putProjectCostsPosition(validProjectId, newCostsPosition.id, newCostsPosition);
							validationExecutedCostsPos = "CREATED";
							validationInfo += "Costs position created. ";
							validCostsPosId = newCostsPosition.id;
						} else if(costsTypes && costsTypes.length > 1) {
							validationExecutedCostsPos = "INVALID";
							validationInfo += "Referenced costs type is not unique. ";
						} else {
							validationExecutedCostsPos = "INVALID";
							validationInfo += "Referenced costs type not found. ";
						}
					} catch(err) {
						DEBUG ? console.error(err) : null;
					}
				}
			} else {
				DEBUG ? console.log("Referenced costs position not found.") : null;
				validationExecutedCostsPos = "INVALID";
				validationInfo += "Referenced costs position not found. ";
			}					
		} else { // no cost position defined in record, take default cost position
			validCostsPosId = defaultCostsPosId;
			validationInfo += "No costs position referenced - using default costs position. ";
		}
		return {
			"validCostsPosId": validCostsPosId,
			"validationExecutedCostsPos": validationExecutedCostsPos,
			"validationInfoCostsPos": validationInfo
		};
	}

	function _validateCostsActualReference(validProjectId, validCostsPositionId, value, objectRef, matchingType) {
		let curCostsActualId = null;
		let validCostsActualId = null;
		let validationExecutedCostsActual = null;
		let validationInfo = "";
		
		if(value != null) {
			let allCostsActuals = null;
			let curCostsActualObjs = null;
			switch(objectRef) {
				case "id":
					let curCostsActualObj = null;
					curCostsActualId = value;
					try {
						curCostsActualObj = Pqf.fco.getProjectCostsPositionActuals(validProjectId, validCostsPositionId);
					} catch(err) {
						DEBUG ? console.error(err) : null;
						DEBUG ? console.log("Referenced costs position not valid.") : null;
						validationExecutedCostsActual = "INVALID";
						validationInfo += "Referenced costs position not valid. ";
					}
					if(curCostsActualObj) {
						validCostsActualId = curCostsActualObj.id;
					}
					break;
				case "name":
					allCostsActuals = Pqf.fco.getProjectCostsPositionActuals(validProjectId, validCostsPositionId);
					curCostsActualObjs = allCostsActuals.filter(function(costsActual) {
						switch(matchingType) {
							case ":includes":
								if(costsActual.name && value.includes(costsActual.name)) {
									return true;
								} else {
									return false;
								}
								break;
							case ":isIncluded":
								if(costsActual.name.includes(value)) {
									return true;
								} else {
									return false;
								}
								break;
							default: // ":exact"
								if(costsActual.name == value) {
									return true;
								} else {
									return false;
								}
						}
					});
					if(curCostsActualObjs.length == 1) {
						validCostsActualId = curCostsActualObjs[0].id;
					} else if(curCostsActualObjs.length > 1) {
						DEBUG ? console.log("Referenced costs actual is not unique.") : null;
						validationExecutedCostsActual = "INVALID";
						validationInfo += "Referenced costs actual is not unique. ";
					} else {
						DEBUG ? console.log("Referenced costs actual not found by name.") : null;
						validationExecutedCostsActual = "INVALID";
						validationInfo += "Referenced costs actual not found by name. ";
					}					
					break;
				default: // Look for a property with the given id
					allCostsActuals = Pqf.fco.getProjectCostsPositionActuals(validProjectId, validCostsPositionId);
					curCostsActualObjs = allCostsActuals.filter(function(costsActual) {
						let prop = (costsActual.properties ? costsActual.properties.find(x => x.key == objectRef) : null);
						if(prop) {
							switch(matchingType) {
								case ":includes":
									if(prop.value && value.includes(prop.value)) {
										return true;
									} else {
										return false;
									}
									break;
								case ":isIncluded":
									if(prop.value.includes(value)) {
										return true;
									} else {
										return false;
									}
									break;
								default: // ":exact"
									if(prop.value == value) {
										return true;
									} else {
										return false;
									}
							}
						} else {
							return false;
						}
					});
					if(curCostsActualObjs.length == 1) {
						validCostsActualId = curCostsActualObjs[0].id;
					} else if(curCostsActualObjs.length > 1) {
						DEBUG ? console.log("Referenced costs actual is not unique.") : null;
						validationExecutedCostsActual = "INVALID";
						validationInfo += "Referenced costs actual is not unique. ";
					} else {
						DEBUG ? console.log("Referenced costs actual not found by property. ") : null;
						validationExecutedCostsActual = "INVALID";
						validationInfo += "Referenced costs actual not found by property. ";
					}
			}
		} else { // no cost actual defined in record
			validCostsActualId = null;
			validationExecutedCostsActual = "INVALID";
			validationInfo += "No costs actual referenced. ";
		}
		if(validCostsActualId) {
			validationInfo += "Costs actual found (" + validCostsActualId + ") | ";
		}
		return {
			"validCostsActualId": validCostsActualId,
			"validationExecutedCostsActual": validationExecutedCostsActual,
			"validationInfoCostsActual": validationInfo
		};
	}

	function _validateEffortActualReference(validResourceId, effortId) {
		let curEffortActualId = null;
		let validEffortActualId = null;
		let validationExecutedEffortActual = null;
		let validationInfo = "";
		
		if(effortId) {
			let curEffortActualObj = null;
			curEffortActualId = effortId;
			try {
				curEffortActualObj = Pqf.act.getResourceProjectTimeActual(validResourceId, effortId);
			} catch(err) {
				DEBUG ? console.error(err) : null;
				DEBUG ? console.log("Referenced actual effort not valid.") : null;
				validationExecutedEffortActual = "INVALID";
				validationInfo += "Referenced effort actual not valid. ";
			}
			if(curEffortActualObj) {
				validEffortActualId = curEffortActualObj.id;
			}
		} else { // no effort actual defined in record
			validEffortActualId = null;
			validationExecutedEffortActual = "VALID";
		}
		if(validEffortActualId) {
			validationInfo += "Effort actual found (" + validEffortActualId + ") | ";
		}
		return {
			"validEffortActualId": validEffortActualId,
			"validationExecutedEffortActual": validationExecutedEffortActual,
			"validationInfoEffortActual": validationInfo
		};
	}

	function _findRefScenario(projectRefs, featureProject, valueProject, featureScenario, valueScenario, ignoreWhitespaceProject, ignoreWhitespaceScenario) {
		// Returns a scenario from that project which exactly matches valueProject of featureProject.
		// The scneario needs to match valueScenario from featureScenario.
		// If none or more than one scenarios match, null will be returned.
		//
		// Arguments:
		// - projectRefs: array of project objects
		// - featureProject: either a string ("id", "code", "name") or an object like {"subobjectType": null/string, "propertyId": string}
		// - valueProject: string
		// - featureScenario: string ("id", "code", "name")
		// - valueScenario: string
		// - ignoreWhitespaceProject (optional): boolean, removes all type of whitespace characters before comparing project match, default: false
		// - ignoreWhitespaceScenario (optional): boolean, removes all type of whitespace characters before comparing scenario match, default: false
		ignoreWhitespaceProject = (typeof ignoreWhitespaceProject !== "undefined" ? ignoreWhitespaceProject : false); // optional argument, default: false
		ignoreWhitespaceScenario = (typeof ignoreWhitespaceScenario !== "undefined" ? ignoreWhitespaceScenario : false); // optional argument, default: false
		let projectRefs = _findRefObject(projectRefs, featureProject, valueProject, ignoreWhitespaceProject);
		let projectRef = null;
		if (projectRefs && projectRefs.length == 1) {
			projectRef = projectRefs[0];
		} 
		let scenarioRef = null;
		if(ignoreWhitespaceScenario) {
			valueScenario = valueScenario.replace(_whitespaceRegex, _whitespaceReplaceWith);
		}
		if(projectRef) { // project found, now look for scenario
			scenarioRef = Pqf.pm.getProjectScenarios(projectRef.id).filter(x => (ignoreWhitespaceScenario ? x[featureScenario].replace(_whitespaceRegex, _whitespaceReplaceWith) : x[featureScenario]) === valueScenario);
		}
		if(scenarioRef && scenarioRef.length == 1) { // exactly one scenario found
			scenarioRef = scenarioRef[0];
		} else {
			scenarioRef = null;
		}
		return {scenarioRef, projectRef};
	}

	function _findRefObject(objectRefs, feature, value, matchingType, ignoreWhitespace) {
		// Returns an array of all objects from objectRefs which match value of the given feature.
		//
		// Arguments:
		// - objectRefs: array of objects
		// - feature: either a string ("id"/"userid", "code", "name"/"username") or an object like {"objectType": string, "subobjectType": string, propertyId": string}
		// - value: string
		// - matchingType (optional): string (":exact", ":includes", ":isIncluded": ":isIncludedInNonNumbers"), default: matchingType = ":exact"
		// - ignoreWhitespace (optional): boolean, removes all type of whitespace characters before comparing, default: false
		matchingType = (typeof matchingType !== "undefined" && matchingType !== null && [":exact", ":includes", ":isIncluded", ":isIncludedInNonNumbers"].includes(matchingType) ? matchingType : ":exact"); // optional argument, default: matchingType = ":exact"
		ignoreWhitespace = (typeof ignoreWhitespace !== "undefined" ? ignoreWhitespace : false); // optional argument, default: false
		if(ignoreWhitespace) {
			value = value.replace(_whitespaceRegex, _whitespaceReplaceWith);
		}
		let regex = new RegExp("(^|[\\D]+)" + value + "($|[\\D]+)", "g");
		let objectsFound = null;
		// Map user name and id
		if (feature === "username") feature = "name";
		if (feature === "userid") feature = "id";
		if(typeof feature === "string") {
			if(["id", "code"].includes(feature)) { // only allow exact match
				objectsFound = objectRefs.filter(x => x[feature] === value);
			} else if(["name"].includes(feature)) { // allow non-exact match
				switch(matchingType) {
					case ":includes":
						objectsFound = value ? objectRefs.filter(x => (ignoreWhitespace ? x[feature].replace(_whitespaceRegex, _whitespaceReplaceWith).includes(value) : x[feature].includes(value))) : null;
						break;
					case ":isIncluded":
						objectsFound = objectRefs.filter(x => value.includes(ignoreWhitespace ? x[feature].replace(_whitespaceRegex, _whitespaceReplaceWith) : x[feature]));
						break;
					case ":isIncludedInNonNumbers":
						objectsFound = objectRefs.filter(x => x.match(regex));
						break;
					default:
						objectsFound = objectRefs.filter(x => (ignoreWhitespace ? x[feature].replace(_whitespaceRegex, _whitespaceReplaceWith) : x[feature]) === value);
				}
			}
		} else { // find in a property
			objectsFound = objectRefs.filter(function(curObject) {
				let obj = null;
				if(OBJECT_TYPES_WITH_SUBOBJECTS.includes(feature.objectType) && feature.subobjectType) { // look for property in subobject
					obj = (curObject.subObjects ? curObject.subObjects.find(s => s.type === feature.subobjectType) : null);
				} else {
					obj = curObject;
				}
				let prop = (obj && obj.properties ? obj.properties.find(p => p.key === feature.propertyId) : null);
				if(prop && prop.value) {
					let propValue = prop.value;
					if(ignoreWhitespace) {
						propValue = propValue.replace(_whitespaceRegex, _whitespaceReplaceWith);
					}
					switch(matchingType) {
						case ":includes":
							return propValue ? value.includes(propValue) : false;
						case ":isIncluded":
							return propValue.includes(value);
						case ":isIncludedInNonNumbers":
							return regex.test(propValue);
						default:
							return propValue === value;
					}
				}
				return false;
			});
		}
		return objectsFound;
	}

	function _setProjectDetails(project, projectSubobjects, validatedHeaders, record) {
		let header = null;
		let value = null;
		// Update project code (non-mandatory column)
		header = validatedHeaders.columns.find(x => x.name === "code").csvHeadersFound;
		if(header) {
			header = header[0];
			value = record[header.raw].toString();
			project.code = value;
		}

		// Update project name (mandatory column)
		header = validatedHeaders.columns.find(x => x.name === "name").csvHeadersFound[0];
		value = record[header.raw].toString();
		project.name = value;

		// Update project description (non-mandatory column)
		header = validatedHeaders.columns.find(x => x.name === "description").csvHeadersFound;
		if(header) {
			header = header[0];
			value = record[header.raw].toString();
			project.description = value;
		}

		// Set properties (non-mandatory columns)
		header = validatedHeaders.columns.find(x => x.name === "property").csvHeadersFound;
		if(header) {
			header.forEach(function(h) {
				if(h.isDate) {
					let date = _getValidDate(record[h.raw].toString());
					value = date;
				} else if (h.isEnumName) {
					value = _getEnumIdByName(h, record[h.raw].toString());
				} else if (h.isMoney) {
					value = _constructMoneyPropValue((record[h.raw] || "").toString());
				} else {
					value = record[h.raw].toString();
				}
				if(h.subType) { // property of subobject
					let subobj = projectSubobjects.find(s => s.type === h.subType);
					if(subobj) {
						subobj.properties.find(p => p.key === h.attribute).value = value;
					} else {
						subobj = {
							"type": h.subType,
							"properties": [
								{
									"key": h.attribute,
									"value": value
								}
							]
						};
					}
				} else { // project property
					if(project.properties) {
						project.properties.find(p => p.key === h.attribute).value = value;
					} else {
						project.properties = [
							{
								"key": h.attribute,
								"value": value
							}
						];
					}
				}
			});
		}
	}

	function _setResourceDetails(resource, validatedHeaders, resType, record) {
		let header = null;
		let value = null;

		// Update resource name
		header = validatedHeaders.columns.find(x => x.name === "name").csvHeadersFound[0];
		value = record[header.raw].toString();
		resource.name = value;

		// Update resource description (non-mandatory column)
		header = validatedHeaders.columns.find(x => x.name === "description").csvHeadersFound;
		if(header) {
			header = header[0];
			value = record[header.raw].toString();
			resource.description = value;
		}

		if(resType == "HRM-RES-TYP-EMP") {
			// Update resource email
			header = validatedHeaders.columns.find(x => x.name === "email").csvHeadersFound[0];
			value = record[header.raw].toString();
			resource.eMail = value;
		}

		// Set properties (non-mandatory columns)
		header = validatedHeaders.columns.find(x => x.name === "property").csvHeadersFound;
		if(header) {
			header.forEach(function(h) {
				if(h.isDate) {
					let date = _getValidDate(record[h.raw].toString());
					value = date;
				} else {
					value = record[h.raw].toString();
				}
				if(resource.properties) {
					resource.properties.find(p => p.key === h.attribute).value = value;
				} else {
					resource.properties = [{"key": h.attribute, "value": value}];
				}
			});
		}
	}

	//-------------------------------------------
	// Utility functions
	//-------------------------------------------

	function _json2csv(objArray, separator) {
		let header = Object.keys(objArray[0]);
		let headerString = header.join(separator);
		let rows = objArray.map(row => header.map(
			function(fieldName) {
				let text = "";
				if(typeof row[fieldName] === "string" || row[fieldName] instanceof String) {
					text = row[fieldName];
					text = "\"" + pqfLib.utils.format.replaceAll(text, "\"", "\"\"") + "\""; // replace double quotes by double double quotes (escaping in CSV file) and surround text by double quotes
				} else {
					let replacer = (key, value) => value === null ? "" : value; // specify how you want to handle null values here
					text = JSON.stringify(row[fieldName], replacer);
					text = pqfLib.utils.format.replaceAll(text, "\\\"", "\"\""); // replace double quotes by double double quotes (escaping in CSV file)
				}
				return text;
			}).join(separator));
		rows.unshift(headerString);
		return rows.join("\r\n")+"\r\n";
	}

	function _updateDoc(doc, records) {
		let csvResults = _json2csv(records, _csvSeparator);
		let attachment = Pqf.pf.addAttachmentText("text/csv", null, csvResults);
		doc.url = "../PF/V1/Attachment/" + attachment.id + "?name=" + doc.name;
		doc.description = "Datei verarbeitet";
	}

	function _validateDate(checkString) {
		let validatedDate = null;
		let dateValid = moment(checkString, "YYYY-MM-DD", true).isValid();
		if(dateValid) {
			validatedDate = moment(checkString, "YYYY-MM-DD", true);
		} else {
			dateValid = moment(checkString, "DD.MM.YYYY", true).isValid();
			if(dateValid) {
				validatedDate = moment(checkString, "DD.MM.YYYY", true);
			}
		}
		return validatedDate;
	}

	function _getValidDate(value) {
		// Validates value against "DD.MM.YYYY" or "YYYY-MM-DD", returns null otherwise
		let validDate = null;
		if(moment(value, "YYYY-MM-DD", true).isValid()) {
			validDate = moment(value).format("YYYY-MM-DD");
		} else if (moment(value, "DD.MM.YYYY", true).isValid()) {
			validDate = moment(value, "DD.MM.YYYY").format("YYYY-MM-DD");
		} else if (moment(value, "DD.MM.YY", true).isValid()) {
			validDate = moment(value, "DD.MM.YY").format("YYYY-MM-DD");
		} else if (moment(value, "DD/MM/YYYY", true).isValid()) {
			validDate = moment(value, "DD/MM/YYYY").format("YYYY-MM-DD");
		}
		return validDate;
	}

	function _getValidDuration(value) {
		// Validates value against "hh:mm", "hh.mm" or "PThhHmmM" (ISO 8601 in general), returns null otherwise
		let validDuration = pqfLib.utils.format.durationInHoursToMoment(value).toISOString();
		return validDuration;
	}

	function _getEnumIdByName(header, name) {
		let enumDef = Pqf.pf.getPropertyDefinition(header.attribute);
		if (enumDef) {
			let enumValues = pqfLib.properties.getEnumValues(enumDef);
			if (enumValues) return (enumValues.find(x => x.name === name) || {}).id;
		}
	}

	function _constructMoneyPropValue(value) {
		if (value === "") return null;
		let match = value.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
		if (match) {
			let amount = parseFloat(match[1]);
			let currency = match[2];
			let currencyId = _getCurrencyId(currency, "code");
			if (!currencyId) {
				DEBUG ? console.log("Currency not found for code: " + currency) : null;
				return null;
			}
			return '"' + amount + '","' + currencyId + '"';
		}
		return null;
	}

	function _getCurrencyId(value, attribute) {
		let curCurrencyId = null;
		let tmpCurrency = CURRENCIES.find(x => x[attribute] === value);
		return tmpCurrency ? tmpCurrency.id : null;
	}
	
	function _getLocationId(value, attribute, matchingType) {
		if(typeof matchingType === "undefined") matchingType = ":exact";
		let result = {
			"id": null,
			"validationInfo": ""
		};
		switch(matchingType) {
			case ":isIncluded":
				let locationsFound = LOCATIONS.filter(x => x[attribute].includes(value));
				if(locationsFound) {
					if(locationsFound.length == 1) {
						result.id = locationsFound[0].id;
					} else {
						result.validationInfo = "Several possible locations found.";
					}
				} else {
					result.validationInfo = "No location found.";
				}
				break;
			default: // exact match
				let locationFound = LOCATIONS.find(x => x[attribute] === value);
				if(locationFound) {
					result.id = locationFound.id;
				} else {
					result.validationInfo = "No location found.";
				}
		}
		return result;
	}
	
	// Publish functions
    return {
		"utils": {
			"json2csv": _json2csv
		},
        "import": {
			"markLibraryDocAsImportable": _markLibraryDocAsImportable,
			"setCsvSeparator": _setCsvSeparator,
			"setMaxNumRecordsPerRun": _setMaxNumRecordsPerRun,
			"setMinNumSecondsPerRun": _setMinNumSecondsPerRun,
			"processCsvDocument": _processCsvDocument,
			"emptyLibraryFolder": _emptyLibraryFolder
        }
    };
})();