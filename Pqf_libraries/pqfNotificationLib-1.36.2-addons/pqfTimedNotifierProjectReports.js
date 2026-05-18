"use strict";
moment.locale("de");

const JS_GUI =
{
    "title": "Statusbericht-Notifikationen",
    "type": "object",
    "properties": {
        "automaticExecution": {
            "title": "Automatische Code-Ausführung",
            "type": "object",
            "properties": {
				"monthlyExecutionDays": {
					"title": "Monatliche Erinnerungstage (kommagetrennt)",
					"type": "string",
					"default": "1"
				},
				"emailReceiverSummary": {
					"title": "Zusammenfassung an E-Mail (auch im Mock-Modus)",
					"type": "string",
					"default": ""
				}
			}
		},
        "manualExecution": {
            "title": "Manuelle Code-Ausführung",
            "type": "object",
            "properties": {
				"mockMode": {
					"title": "Mock-Modus?",
					"type": "boolean",
					"default": true
				},
				"mockDate": {
					"title": "Simulationsdatum (YYYY-MM-DD, leer = heute)",
					"type": "string",
					"default": ""
				},
				"emailReceiverTest": {
					"title": "Test-E-Mail-Empfänger im Mock-Modus",
					"type": "string",
					"default": ""
				}
			}
		}
    }
};

const JS_PARAMS = null;

//--------------------------------------------
// Configuration section

const DEBUGGING_MODE 			        = true;
const MOCKING_MODE 				        = JS_PARAMS.manualExecution.mockMode;
const MOCKING_DATE 				        = JS_PARAMS.manualExecution.mockDate && moment(JS_PARAMS.manualExecution.mockDate).isValid() ? moment(JS_PARAMS.manualExecution.mockDate).format('YYYY-MM-DD') : null;
const TEST_RECEIVING_EMAIL_ADDRESSES    = JS_PARAMS.manualExecution.emailReceiverTest ? [JS_PARAMS.manualExecution.emailReceiverTest] : [];

// These email addresses receive email summary after notifications have been
// sent out.
// NOTE: Summary mails are sent independently of MOCKING_MODE and
// TEST_RECEIVING_EMAIL_ADDRESSES!
const CONTACT_EMAILS 					= JS_PARAMS.automaticExecution.emailReceiverSummary ? [JS_PARAMS.automaticExecution.emailReceiverSummary] : [];

// Number of days after a period has ended (-x means x days before current
// period ends, x means x days after last period has ended)
const REMINDER_TIME_LAGS = JS_PARAMS.automaticExecution.monthlyExecutionDays.split(',').map(d => parseInt(d));

// Object types for which notifications are generated
// (needed for outbox maintenance, which is not triggered by an object)
const OBJECT_TYPES = ["ProjectReport"];

// Relation type ID for project leader
const PL_RELATION_TYPE_ID = "06FCCCAAA5BD45FAAE0297E081D91FDE";

// If true, users will be notified even when their notify flag is off
const NOTIFY_UNCONDITIONALLY = false;

// Reminders will ony be sent if the project is on one of the following
// lifecycle states
const ACTIVE_PROJECT_STATE_IDS = [
    //"8FFAAADFDCEE482D9B94ABBE62046A33",	// Vorhaben erfasst
    //"6611BF19FFC44F19A7CE93D33740EC15",	// Planung
    //"AE5297283ECE46A087A6E6C7C4490E97",	// Aktiv
    //"E291F281E64A437CAF1C24823C8F5501",	// Abgeschlossen
    //"FCF00B013393462690C8569083DDF1C6",	// Suspended
    //"544B1C58A8754F209F9198BE7DECDA47",	// Abgebrochen
    //"7FE6FE4B19A74F78B1918AF5E7B34C8D",	// Antrag auf Initialisierung (PIA)
    //"19BC14975D42458C8C5B42851284C335",	// Initialisierung
    //"9655BEC94ED94F9CACA9FE95BA2F6AB0",	// Antrag auf Konzept (PA)
    "89FA7B327AD94E3898674F625B637CCD",	// Konzept
    "1D5B3239C3AF467F887A46B1819428A6",	// Antrag auf Realisierung
    "6A41BCB0CEA44634B953E3831830B449",	// Realisierung
    "6C659BD3296A4733A67C902EB6DB1CF1",	// Antrag auf Einführung
    "2A5F137D06C44C9BA804F91CD053753B",	// Einführung
    "CEE042AA123447D0AE2F8EEB85BC6CA5",	// Antrag auf Umsetzung (PA)
    "2BAB9607306C46DDAB737D3689A4C2C9",	// Umsetzung
    //"11321A4FB3D14056A68DB8AAD9957356",	// Vorhaben verworfen
    //"0578A5ED3A604999827D4C02159A8462",	// Projekt abgeschlossen
    //"54B6660D99B14D67B03484A15E8E8EB9",	// Sistiert
    //"588814EBFD134759B0E8AE36BBA3B435"	// Abgebrochen
];
const ACTIVE_PROJECT_TYPE_IDS = [
    "PM-PRJ-TYPE-01", // IT-Standardvorhaben Staatsverwaltung
    "PM-PRJ-TYPE-02", // IT-Projekt Staatsverwaltung
    "PM-PRJ-TYPE-03", // IT-Querschnittsprojekt Staatsverwaltung
    "PM-PRJ-TYPE-04", // IT-Sonderkreditvorhaben Staatsverwaltung
    "PM-PRJ-TYPE-05", // spezielles IT-Vorhaben Staatsverwaltung
    "PM-PRJ-TYPE-06" // IT-Regierungsprojekt Staatsverwaltung
    //"PM-PRJ-TYPE-07", // Trägerbeitragsprojekt eGovSG (Fach und Querschnitt)
    //"PM-PRJ-TYPE-08", // Projekt Sonderfinanzierung eGovSG
    //"PM-PRJ-TYPE-09", // Strategischer eGov Service
    //"PM-PRJ-TYPE-10" // IT-Projekt KOM SG
];

const PROJECT_CLASSIFICATION_SCHEMA_ID = "Project-Klasse";

const ACTIVE_PROJECT_REPORT_STATE_IDS = [ // Notifications will NOT be sent if there is a status report in one of these lifecycle states
	"50B8FFA3E78048EE809F73FD298DD054", // zu genehmigen
	"572718A12D5047978E5D358AB8A18FFF"  // genehmigt
];

const MAIL_SKIN = {
	"darkFontColor": "#07074E", // PQFORCE dark blue
	"lightFontColor": "#FFFFFF", // white
	"darkBackgroundColor": "#DB5656", // PQF red
	"lightBackgroundColor": "#F7F7F7", // light gray
	"testingAlertFontColor": "#FFFFFF", // white
	"testingAlertBackgroundColor": "#FF0000", // red
	"logoSrc": "https://www.pqforce.com/logo-colour-a.png",
	"logoLink": "https://www.pqforce.com",
	"logoAlt": "PQFORCE Logo",
	"bodyMessageMode": "plain",
	"textAlign": "left",
	"testing": MOCKING_MODE
};

// ----------------------------------------------------------------------
// Rules for time-triggered notifications
// ----------------------------------------------------------------------
//
// Notification rules are specified as an array of JSON objects, each of which defines one rule.
//
// Each rule has the following components. Note that you can specify several rules for the same object type.
//
// objectType: string. The ID of the object type in consideration.
// schedule: {
//		quarterly: Array of integers | null. Optional. Days of the quarter RELATIVE TO ITS END, e.g., [-5, 0, 10] means 5 days before the end of the quarter, at the last day of the quarter, and 10th day of the next quarter
//		monthly: Array of integers | null. Optional. Days of the month RELATIVE TO ITS END, e.g., [-5, 10] means 5 days before the end of the monght and 10 days after start of the next month
//		weekly: Array of integers | null. Optional. Days of the week, where Sunday = 0, Monday = 1, e.g., [2, 4] means every Tuesday and Thursday, [1,2,3,4,5] means every working day
// }
// projectFilter: { // Only for objectType=[ProjectReportType]. Only projects that fullfil ALL these criteria will be considered (logical AND)
//		lifecycleStates: Array of strings | null. Optional. IDs of project lifecycle states that the project must be in.
//		properties: Array of { // ALL these conditions must be met (logical AND)
//			subobjectId: string | null. The ID of the subobject type (null = property of the project)
//			propertyId: string. The ID of the property
//			values: Array of strings. The values that the property must have
//		}
//		classifications: Array of { // ALL these conditions must be met (logical AND)
//			schemaId: string. The ID of the classification schema
//			classificationIds: Array of strings. The project classification of this schema must be one of these values.
//		}
//		stopConditions: Array of { // Rule stops if ANY of these conditions is met (logical OR of all objects in the array, but logical AND of all the conditions within the object)
//			endDate: "endOfPeriod" | null. Check if the end date of the report meets a condition, e.g., equals the end date of the period
//			lifecycleStates: Array of strings. Check if a report is in a given lifecycle state
//		}
//		createNew: { // Automatically create a new report if there is none yet?
//			name: string
//			description: string
//		}
//		deadline: positive integer | null. Number of days after reception of notification. Can be used in email to give the receiver a deadline.
//		notifyRelationTypes: Array of string (IDs of relation types) | null 
//		notifyUserRoles: Array of strings (IDs of user roles) | null
//		notifyOptions: {
//			forceNotify: boolean. Send notification independently of whether 'Send email notification' flag of the user is set
//			defaultLanguage: "en" | "de" | "fr". Use if for a receiver no language can be inferred, e.g., when there is no user and the email has to be taken from the resource.
//		}
//		useEmailTemplate: function which returns {"subject": string, "body": string}, see section 'Mail template functions' below for examples
//		contacts: Array of {
//			name: string | null
//			email: string. Email address that receives a summary mail
//			useEmailTemplate: function which returns {"subject": string, "body": string}, see mail template functions below for examples
//		}
// }
//
//

const NOTIFICATION_RULES =
[

	// An exemplary rule for PROJECT REPORT notifications
	// --------------------------------------------------
    {
        "objectType": "ProjectReport",
		"schedule": {
			"monthly": REMINDER_TIME_LAGS
		},
		"projectFilter": {
			"lifecycleStates": ACTIVE_PROJECT_STATE_IDS,
			"properties": [
				{
					"subobjectId": "ProjectMeta",
					"propertyId": "prj-type",
					"values": ACTIVE_PROJECT_TYPE_IDS
				}
			],
			"classifications": [
				{
					"schemaId": PROJECT_CLASSIFICATION_SCHEMA_ID,
					"classificationIds": [
						"3679876DDBAB42588701AF10AF7B4E3C", // A
						"323322A95C9B4E4DB5D92BE058881ECC", // B
						"FDDE2F4709B347AB9F51B8BB67EBFD78", // B
						"F9CACE68BF8B44E4A92CFD6731913983", // C
						"7755D9510DC8481DB291C31F19E07394", // C
						"3DC640A0273A4564B59AEE506D451C82"  // C
					]
				}
			]
		},
		"stopConditions": [
			{
				"endDate": "endOfPeriod",
				"lifecycleStates": ACTIVE_PROJECT_REPORT_STATE_IDS
			}
		],
		"createNew": {
			"name": "Neuer Statusbericht",
			"description": "Automatisch angelegt"
		},
		"deadline": 7,
		"notifyRelationTypes": [PL_RELATION_TYPE_ID],
		"notifyUserRoles": null,
		"notifyOptions": {
			"forceNotify": NOTIFY_UNCONDITIONALLY,
			"defaultLanguage": "de"
		},
		"useEmailTemplate": createProjectReportReminder,
		"contacts": CONTACT_EMAILS.map(function(email) {
			return {
				"name": null,
				"email": email,
				"useEmailTemplate": createProjectReportReminderSummary
			};
		})
    }
];

// end of configration section
//--------------------------------------------


// Set parameters
pqfNotificationLib.setObjectTypes(OBJECT_TYPES);
pqfNotificationLib.setRules(NOTIFICATION_RULES);
pqfNotificationLib.setMockingMode(MOCKING_MODE);
pqfNotificationLib.setDebuggingMode(DEBUG_MODE, TEST_RECEIVING_EMAIL_ADDRESSES);
pqfNotificationLib.setEmailSkin(MAIL_SKIN);

// Processing
if(typeof trigger === "undefined") {
	//
	// Manual trigger
	// --------------
	//
	pqfNotificationLib.sendTimedNotifications(false, "now");
	
} else if(trigger.objectType === "Day") {
	//
	// Daily trigger
	// -----------------
	//
	pqfNotificationLib.sendTimedNotifications();
	
} else {
	pqfLib.utils.misc.log(DEBUG_MODE ? 1 : 0, "warn", null, "Timed notifications cannot be triggered by trigger " + trigger.objectType + " and action " + trigger.action);
}


// ----------------------------------------------------------------------
// Reminder mail template function
// ----------------------------------------------------------------------
//
// Such functions are used to generate notification emails. They receive specific arguments (see below)
// that can be used to populate the subject and body of the email.
// Below you find an example of such a function and how the arguments can be used.
//
// Expected return value: {"subject": string, "body": string}
//
// Arguments received (in this order):
//
// receiverInfos = {
//		userId: string
//		userName: string
//		userEmail: string
//		userNotify: boolean
//		resourceId: string
//		resourceName: string
//		resourceEmail: string
//		roleName: string | null (only present if notified by role)
//		relationName: string | null (only present if notified by relation)
// }
//
// objectInfos = {
//		type: string
//		id: string | null (only present if object exists already or has been newly created)
//		isNew: boolean. True if object has just been created
//		name: string
//		description: string
//		properties: array of JSON objects
//		state: {id: string, name: string}
//		url: string
//		parent = {
//			type: string
//			id: string
//			name: string
//			description: string
//			properties: array of JSON objects
//			url: string
//		}
// }
//
// period = {
//		endDate: moment
//		name: string
//		status: "current" | "past" | "future"
//		deadline: moment
// }
//
// language: "de" | "fr" | "it" | "en-ch" | null
//
// contact = {
//		email: string
//		name: string
// }
//


// Example: Reminder notification template function
// ------------------------------------------------

function createProjectReportReminder(receiverInfos, objectInfos, period, language, contact) {
	let subject = "";	
	switch(language) {
		case "en":
			subject = "Reminder to enter a status report in the project " + objectInfos.parent.name;
			break;
		case "fr":
			subject = "Rappel pour la saisie d'un rapport d'état dans le projet " + objectInfos.parent.name;
			break;
		default:
			subject = "Erinnerung zur Erfassung eines Statusberichts im Projekt " + objectInfos.parent.name;
	}
	let receiverName = (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.userName ? receiverInfos.userName : null));
	let body = "<p>Hallo" + (receiverName ? " " + receiverName : "") + "!</p>";
	switch(period.status) {
		case "current":
			body += "<p>Die Periode <b>" + period.name + "</b> läuft noch.";
			break;
		case "past":
			body += "<p>Die Periode <b>" + period.name + "</b> ist vorbei.";
			break;
		case "future":
			body += "<p>Die Periode <b>" + period.name + "</b> beginnt bald.";
			break;
		default:
	}
	body += " Wir bitten Sie, für das Projekt <a href=\"" + objectInfos.parent.url + "\">" + objectInfos.parent.name + "</a> einen Statusbericht zu erstellen.</p>";
	if(objectInfos.id) {
		if(objectInfos.isNew) {
			body += "<p><b>Ein neuer Statusbericht mit Stichtag " + period.endDate.format("DD.MM.YYYY") + " wurde bereits automatisch für Sie angelegt.</b>";
		} else {
			body += "<p><b>Ein entsprechender Statusbericht mit Stichtag " + period.endDate.format("DD.MM.YYYY") + " existiert bereits.</b>";
		}
		body += " Hier der <a href=\"" + objectInfos.url + "\">Link</a> darauf.</p>";
	} else {
		body += "<p><b>Bitte legen Sie im Projekt einen neuen Statusbericht per Stichtag " + period.endDate.format("DD.MM.YYYY") + " an.</b></p>";
	}
	let reason = "";
	if(receiverInfos.roleName) {
		reason = "<p>Sie erhalten diese Nachricht, weil Sie die <b>Rolle " + receiverInfos.roleName + "</b> haben.</p>";
	}
	if(receiverInfos.relationName) {
		reason = "<p>Sie erhalten diese Nachricht, weil Sie zum Projekt in der Beziehung <b>" + receiverInfos.relationName + "</b> erfasst sind.</p>";
	}
	body += reason;
	body += "<p>Für die Erledigung bis zum <b>" + period.deadline.format("DD.MM.YYYY") + "</b> danken wir bestens.</p>";
	body += "<p>Bitte antworten Sie nicht auf diese E-Mail. Sie wurde vom System automatisch erstellt.</p>";
	if(contact && contact.email) {
		body += "<p>Bei Fragen wenden Sie sich bitte an <a href=\"mailto:" + contact.email + "\">" + (contact.name ? contact.name : contact.email) + "</a>.</p>";
	}
	body += "<p>Ihr PQFORCE-Notifikationssystem</p>";
	return {
		"subject": subject,
		"body": body
	};
}

// ----------------------------------------------------------------------
// Summary mail template function
// ----------------------------------------------------------------------
//
// Such functions are used to generate summary emails for administrators. They receive specific arguments (see below)
// that can be used to populate the subject and body of the email.
// Below you find an example of such a function and how the arguments can be used.
//
// Expected return value: {"subject": string, "body": string}
//
// Arguments received (in this order):
//
// contact = {
//		name: string | null
//		email: string | null
//		language: string | null
// }
//
// period = {
//		endDate: moment
//		name: string
//		status: "current" | "past" | "future"
//		deadline: moment
// }
//
// statistics = {
//		numProjectsTotal: integer
//		numProjectsRelevant: integer
//		numProjectsNotified: integer
//		numMessagesTotal: integer
//		projectsWithoutRelations: Array of {
//			id: string
//			code: string
//			name: string
//		}
//		recipients: Array of {
//			name: string
//			email: string
//			projectName: string
//			projectLink: string
//			hasUser: boolean
//		}
//	}
//

// Summary mail template function
// ------------------------------

function createProjectReportReminderSummary(contact, period, statistics) {
	let recipientListFormatted = "";
	statistics.recipients.forEach(function(recipient) {
		recipientListFormatted += "<li>" + (recipient.hasUser ? "✔ " + recipient.userName + " " : "⚠ ") + " | " + (recipient.resourceName ? recipient.resourceName : "[keine Ressource]") + " (" + (recipient.email ? recipient.email : "keine E-Mail-Adresse") + "): " + "<a href=\"" + recipient.parentLink + "\">" + recipient.parentName + "</a></li>";
	});
	let subject = "Erinnerungs-Mails für " + period.name + " verschickt - Zusammenfassung";
	let body =
		"<p>Hallo" + (contact.name ? " " + contact.name : "") + "!</p>" +
		"<p>Dies ist ein Hinweis des PQFORCE-Notifikationssystems, dass die Automation für den Versand der E-Mail-Erinnerung für " + period.name + " soeben durchgeführt wurde.</p>" +
		"<p><b>Hier die Zusammenfassung:</b></p>" +
		"<ul>" +
		"<li>Total sind " + statistics.numProjectsTotal + " Projekte vorhanden</li>" +
		"<li>davon " + statistics.numProjectsRelevant + " relevante Projekte (d.h. die einen Statusbericht verlangen)</li>" +
		"<li>davon " + statistics.numProjectsNotified + " Projekte, die mindestens 1 PL eingetragen haben</li>" +
		"<li>Total " + statistics.numMessagesTotal + " E-Mails verschickt (⚠ = Empfänger hat kein verknüpftes Benutzerkonto):" +
		"<ul>" + recipientListFormatted + "</ul>" +
		"</li>" +
		"</ul>" +
		"<p><b>Relevante Projekte ohne erfasste Beziehungen</b></p>";
	if(statistics.projectsWithoutRelations && statistics.projectsWithoutRelations.length > 0) {
		body += "<ul>";
		statistics.projectsWithoutRelations.forEach(function(prj) {
			body += "<li>" + prj.name + " (" + prj.code + ")</li>";
		});
		body += "</ul>";
	} else {
		body += "<p>keine</p>";
	}
	return {
		"subject": subject,
		"body": body
	};
}