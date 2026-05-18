/**
 * Automation ID: 68E3E9C300984246A1430F2BD7AA986F
 *
 * Requires pqfNotificationLib
 * 
 */
 
"use strict";

//------------------------------------------------------------------------------
// This notifier is used for ***timed*** (not ad hoc) notifications
// based on date computed for the resource checkpoint widget.
//------------------------------------------------------------------------------

// If true, no emails are being sent out (only logs written to the console),
// or emails are sent to TEST_EMAIL_ADDRESSES (see below)
const MOCKING_MODE = false;

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
const RESOURCE_TYPES = ["HRM-RES-TYP-EMP", "EXT-RES-TYP-EMP"];

const ORG_UNIT_TYPES = [ "HRM-RES-TYP-OU", "EXT-RES-TYP-OU" ];

// OU relations (are being used in the notification rules below)
const RESOURCE_MANAGERS = [
	'FCD5454930A75E22B9ADFBEF2B9898DE'
];

const NOTIFY_RULES = [
    { // Example rule 1:
		// Required. When to send this notification
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
		// Required. Consider only this timeframe
		"timeframe": {
			"weeksBeforeToday": 0,
			"weeksAfterToday": 10
		},
		// Required
        "notificationDefinition": {
			// Required. Can be "resourceRequest", "resourcePending" or "resourceAttention".
			// Other values will be ignored. The type defines the potential
			// receivers and the kind of notification they receive.
			"type": "resourceAttention",
			// Optional. Restricts the notifications to the given resource
			// types. If not set or null, all resource types are considered.
			"resourceTypes": RESOURCE_TYPES,
			// Required.
			// If "type" = "resourceAttention",
			// then they must be relations to org units.
			"orgUnitResourceTypes": ORG_UNIT_TYPES,
			"receiverRelationTypes": RESOURCE_MANAGERS
		},
        "useEmailTemplate": createResourceAttentionSummary
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
    "testing": MOCKING_MODE
};

pqfNotificationLib.setMockingMode(MOCKING_MODE);
pqfNotificationLib.setDebuggingMode(DEBUG, TEST_EMAIL_ADDRESSES);
pqfNotificationLib.setEmailSkin(MAIL_SKIN);
pqfNotificationLib.setRules(NOTIFY_RULES);
pqfNotificationLib.sendTimedNotifications("resourceAttention");


// ----------------------------------------------------------------------
// Mail template functions
// ----------------------------------------------------------------------

function createResourceAttentionSummary(receiverInfos, attentionSettings, attentionItems, userLanguage) {
	// Arguments:
	//  - receiverInfos: {
	//        name: string,
	//        resourceName: string,
	//        email: string
	//    }
	//  - attentionSettings: {
	//        timeframe: {
	//            beg: 'YYYY-MM-DD',
	//            end: 'YYYY-MM-DD'
	//        }
	//    }
	//  - attentionItems[]: {
	//	      resource: {
	//            name: string
	//        },
	//		  issue: {
	//            name: string,
	//            details[]: string                
    //            }
	//        }
	//    }
	//  - userLanguage: "de" | "en" | "fr" | "it"
	//
	let subject = "PQFORCE: Ressourcen-Probleme";
    let body = "<p>Hallo " + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : "PQFORCE User")) + "!</p>";
    body += "<p>Bei folgenden Ressourcen aus deiner Einheit gibt es aktuell Probleme im Zeitraum bis "
		+ moment(attentionSettings.timeframe.end).format("DD. MMM YYYY")
		+ ":</p>";
	body += "<p>";
    
    attentionItems.forEach(function(item) {
        body += "<b>Ressource</b>: <a href='" + item.resource.url + "'>" + item.resource.name + "</a><br>";
        body += "<b>Problem</b>: " + item.issue.name + "<br>";
		body += "<ul>";
		item.issue.details.forEach(detail => {
			body += "<li>" + detail + "</li>";
		});
		body += "</ul>";
    });
	body += "</p>";
	
	body += "<p>Melde dich <a href=" + receiverInfos.url + ">hier</a> an, um Details einzusehen und ggf. zu reagieren.</p>";
    
    body += "<p>Beste Grüsse<br>";
    body += "Dein PQFORCE-Notifikationsystem</p>";
    body += "<p>(Bitte antworte nicht auf diese E-Mail.)</p>";
    return {
        "subject": subject,
        "body": body
    };
}