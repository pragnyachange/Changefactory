/**
 * Automation ID: 9537072042C74445A3D3A635140C8293
 *
 * Requires pqfNotificationLib
 * 
 */
 
"use strict";

//------------------------------------------------------------------------------
// This notifier is used for ***timed*** (not ad hoc) notifications
// in the context of resource allocations.
// Resource managers can be notified on a regular basis about pending requests.
// Project managers can be notified about rejections or changed allocations.
//
// Use pqfResourceAllocationNotifier.js for ***ad hoc*** notifications.
//------------------------------------------------------------------------------

// If true, a noticeable header is prepended to each email sent out
const SET_TESTING_HEADER = true;

// If true, no emails are being sent out (only logs written to the console),
// or emails are sent to TEST_EMAIL_ADDRESSES (see below)
const MOCKING_MODE = true;

// If true, more verbose output is written to the console
const DEBUG = true;

// If MOCKING_MODE == true, then all emails are being sent to these addresses
// (array of email addresses)
const TEST_EMAIL_ADDRESSES = ["dh@pqforce.com"];

// ***Static*** email adresses
// All emails are also sent to these addresses (apart from sending them to the
// desired relations)
const NOTIFY_EMAIL_ADRESSES = [];

// Resource types that should be notified
const RESOURCE_TYPES = ["HRM-RES-TYP-EMP", "HRM-RES-TYP-OU"];

// Project relations (are being used in the notification rules below)
const PROJEKT_MANAGER = "06FCCCAAA5BD45FAAE0297E081D91FDE";
const RESSOURCE_MANAGER = "AA218835B6CA49A78D65A4A634FA3881";

// The following allocations states are considered as 'requesting'
// and thus to be taken care of by the resource manager
const ALLOCATION_STATES_REQUESTED = [
		//"ALLOC_STATE_NEW"
		//"ALLOC_STATE_CHANGED"
		"ALLOC_STATE_REQUESTED"
		//"ALLOC_STATE_APPROVED"
		//"ALLOC_STATE_REJECTED"
];

// The following allocations states are considered as 'pending'
// and thus to be taken care of by the requester, i.e., project manager
const ALLOCATION_STATES_PENDING = [ 
    "ALLOC_STATE_NEW",
    //"ALLOC_STATE_REQUESTED",
    "ALLOC_STATE_CHANGED",
    //"ALLOC_STATE_APPROVED",
    "ALLOC_STATE_REJECTED"
];

const NOTIFY_RULES = [
    { // Example rule 1: For resource requests
		// Required. Quarterly, monthly and weekly can be used in combination,
		// each of them can be an empty array or null or even omitted completely
        "schedule": {
			// Optional. Array with days of quarter, e.g., [1, 50] means every
			// first and fiftieth day of a quarter
            "quarterly": [],
			// Optional. Array with days of month, e.g., [1, 5] means every
			// first and fifth day of a month
            "monthly": [],
			// Optional. Array with days of week, where Monday = 1, e.g.,
			// [2, 4] means every Tuesday and Thursday,
			// [1,2,3,4,5] means every working day
            "weekly": [1, 2, 3, 4, 5]
        },
		// Required. Consider only allocations (tasks) that overlap with
		// this timeframe
		"timeframe": {
			"weeksBeforeToday": 2,
			"weeksAfterToday": 50
		},
		// Required
        "notificationDefinition": {
			// Required. Can be "resourceRequest" or "resourcePending".
			// Other values will be ignored. The type defines the potential
			// receivers and the kind of notification they receive.
			"type": "resourceRequest",
			// Optional. Restricts the notifications to the given resource
			// types. If not set or null, all resource types are considered.
			"resourceTypes": RESOURCE_TYPES,
			// Required.
			// If "notificationType" = "resourceRequest", then they
			// must be relations to projects.
			// If "notificationType" = "resourcePending",
			// then they must be relations to org units.
			"actorRelationTypes": [ PROJEKT_MANAGER ],
			// Required.
			// If "notificationType" = "resourcePending", then they
			// must be relations to projects.
			// If "notificationType" = "resourceRequest",
			// then they must be relations to org units.
			"receiverRelationTypes": [ RESSOURCE_MANAGER ]
		},
        "sendingOptions": {
			// Optional. Can be one of the following strings.
			// "bulk" (default for "resourceRequested",
			// not applicable to "resourcePending"): All information items are
			// bundled in 1 mail per sendout.
			// "perResource" / "perProject": 1 email per resource/project
			// (depending on the context), i.e., all information items
			// concerning the same resource/project are summarized in
			// 1 email (default for "resourcePending").
			// "separate": Each request is sent in a separate mail.
			"lots": "perResource",
			// Optional. Array of strings. Each email notification will
			// ALSO be sent to these static addresses
			"notifyStaticEmails": NOTIFY_EMAIL_ADRESSES,
			// Optional. Array of objects containing at least the property
			// "id" of the resource.
            "notifyStaticResources": []
		},
        "useEmailTemplate": createResourceRequestSummary
    },
	{ // Example rule 2: For resources pending
        "schedule": {
            "quarterly": [],
            "monthly": [],
            "weekly": [1, 2, 3, 4, 5]
        },
		"timeframe": {
			"weeksBeforeToday": 2,
			"weeksAfterToday": 50
		},
        "notificationDefinition": {
			"type": "resourcePending",
			"resourceTypes": RESOURCE_TYPES,
			"actorRelationTypes": [ RESSOURCE_MANAGER ],
			"receiverRelationTypes": [ PROJEKT_MANAGER ]
		},
        "sendingOptions": {
			"lots": "perResource",
		},
        "useEmailTemplate": createResourcePendingSummary
    }
];

const MAIL_SKIN = {
    "darkFontColor": "#07074E",
    // PQFORCE dark blue
    "lightFontColor": "#FFFFFF",
    // white
    "darkBackgroundColor": "#DB5656",
    // PQF red
    "lightBackgroundColor": "#F7F7F7",
    // light gray
    "testingAlertFontColor": "#FFFFFF",
    // white
    "testingAlertBackgroundColor": "#FF0000",
    // red
    "logoSrc": "https://www.pqforce.com/logo-colour-a.png",
    "logoLink": "https://www.pqforce.com",
    "logoAlt": "PQFORCE Logo",
    "bodyMessageMode": "plain",
    "textAlign": "left",
    "testing": SET_TESTING_HEADER
};

pqfNotificationLib.setMockingMode(MOCKING_MODE);
pqfNotificationLib.setDebuggingMode(DEBUG, TEST_EMAIL_ADDRESSES);
pqfNotificationLib.setEmailSkin(MAIL_SKIN);
pqfNotificationLib.setAllocationStatesRequested(ALLOCATION_STATES_REQUESTED);
pqfNotificationLib.setAllocationStatesPending(ALLOCATION_STATES_PENDING);
pqfNotificationLib.setRules(NOTIFY_RULES);
pqfNotificationLib.sendTimedNotifications("resourceRequests");


// ----------------------------------------------------------------------
// Mail template functions
// ----------------------------------------------------------------------

function createResourceRequestSummary(receiverInfos, actorInfos, requests, userLanguage) {
	// Arguments:
	//  - receiverInfos: {
	//        name: string,
	//        resourceName: string,
	//        email: string
	//    }
	//  - actorInfos?: { // null if timed notification
	//        name: string,
	//        resourceName: string,
	//        email: string
	//    }
	//  - requests[]: {
    //        parent?: {
	//             id: string,
	//             name: string
	//        },
    //        resource: {
	//             id: string,
	//             name: string,
	//             availabilityInHours: number,
	//			   workloadInHours: {
	//	               active: number,
	//                 planning: number
	//	           }
	//        },
	//        project: {
	//             id: string,
	//             name: string,
	//             lifecycleCategory: "NEW" | "PLANNING" | "ACTIVE" | "CLOSED",
	//             url: string,
	//             requesterInfos[]: {
	//                  name: string,
	//                  resourceName: string,
	//                  email: string
	//             },
	//             task: {
	//                  id: string,
	//                  name: string,
	//                  startDate: YYYY-MM-DD,
	//                  endDate: YYYY-MM-DD,
	//                  url: string,
	//                  urlDispo: string
	//            }
	//        },
	//        demandedEffort: {
	//             amount: number,
	//             unit: string,
	//             amountInHours: number
	//        }
	//    }
	//  - userLanguage: "de" | "en" | "fr" | "it"
	//
	let subject = "PQForce: Pendente Ressourceanfrage";
    let body = "<p>Hallo " + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : "PQFORCE User")) + "!</p>";
    body += "<p>Das folgende Projekt benötigt Ressourcen aus deiner Einheit " + requests[0].parent.name + ".</p>";
    
    requests.forEach(function(request) {
        body += "<p><b>Projekt</b>: <a href=" + request.project.url + ">"
			+ request.project.name + "</a><br>";
        body += "<b>Task</b>: <a href=" + request.project.task.url + ">"
			+ request.project.task.name + "</a><br>";
        body += "<b>Zeitraum</b>: "
			+ moment(request.project.task.startDate).format("DD.MM.YYYY")
			+ " bis "
			+ moment(request.project.task.endDate).format("DD.MM.YYYY")
			+ " (Dauer: ca. "
			+ pqfLib.utils.format.round(
				moment.duration(moment(request.project.task.endDate)
					.diff(moment(request.project.task.startDate))).asWeeks(), 1)
			+ " Wochen)<br>";
        body += "<b>Ressource</b>: " + request.resource.name
			+ " (aktuelle Auslastung im Zeitraum ca. "
			+ pqfLib.utils.format.round(
				100 * (request.resource.workloadInHours.active
					- (request.project.lifecycleCategory == "ACTIVE"
						? request.resource.workloadInHours.selected
						: 0.0))
				/ request.resource.availabilityInHours, 1)
			+ "%)<br>";
        body += "<b>Benötigter Aufwand</b>: " + request.demandedEffort.amount
			+ " " + request.demandedEffort.unit
			+ " (resultierende Auslastung ca. "
			+ pqfLib.utils.format.round(
				100 * (request.resource.workloadInHours.active
					+ (request.project.lifecycleCategory == "ACTIVE"
						? 0.0
						: request.resource.workloadInHours.selected))
				/ request.resource.availabilityInHours, 1)
			+ "%)</p>";
    });
	
	body += "<p>Melde dich <a href=" + receiverInfos.url + ">hier</a> an und gehe gemäss Anleitung vor, um die Anfrage zu beantworten.</p>";
    
    body += "<p>Beste Grüsse<br>";
    body += "Dein PQFORCE-Notifikationsystem</p>";
    body += "<p>(Bitte antworte nicht auf diese E-Mail.)</p>";
    return {
        "subject": subject,
        "body": body
    };
}

function createResourcePendingSummary(receiverInfos, actorInfos, requests, userLanguage) {
    let subject = "PQForce: Pendente Ressourcenallokation";
    let body = "<p>" + (receiverInfos.name ? "Lieber " + receiverInfos.name
		+ "!" : "Lieber PQForce User!") + "</p>";
    body += "<p>Folgende Ressourcenanfrage solltest du anschauen, "
		+ "weil sie noch gar nicht beantragt oder aber abgelehnt "
		+ "oder verändert wurde und deshalb neu beantragt werden muss:</p>";
    
    requests.forEach(function(request) {
        body += "<p><b>Projekt</b>: <a href=" + request.project.url + ">"
			+ request.project.name + "</a><br>";
        body += "<b>Task</b>: <a href=" + request.project.task.url + ">"
			+ request.project.task.name + "</a><br>";
        body += "<b>Zeitraum</b>: "
			+ moment(request.project.task.startDate).format("DD.MM.YYYY")
			+ " bis "
			+ moment(request.project.task.endDate).format("DD.MM.YYYY")
			+ " (Dauer: ca. "
			+ pqfLib.utils.format.round(
				moment.duration(moment(request.project.task.endDate)
					.diff(moment(request.project.task.startDate))).asWeeks(), 1)
			+ " Wochen)<br>";
        body += "<b>Ressource</b>: " + request.resource.name
			+ " (aktuelle Auslastung im Zeitraum ca. "
			+ pqfLib.utils.format.round(
				100 * (request.resource.workloadInHours.active
				- request.demandedEffort.amountInHours)
				/ request.resource.availabilityInHours, 1)
			+ "%)<br>";
        body += "<b>Benötigter Aufwand</b>: " + request.demandedEffort.amount
			+ " " + request.demandedEffort.unit
			+ " (resultierende Auslastung ca. "
			+ pqfLib.utils.format.round(
				100 * request.resource.workloadInHours.active
				/ request.resource.availabilityInHours, 1)
			+ "%)</p>";
    });
    
    body += "<p>Beste Grüsse</p>";
    body += "Dein PQFORCE-Notifikationsystem</p>";
    body += "<p>(Bitte antworte nicht auf diese E-Mail.)</p>";
    return {
        "subject": subject,
        "body": body
    };
}