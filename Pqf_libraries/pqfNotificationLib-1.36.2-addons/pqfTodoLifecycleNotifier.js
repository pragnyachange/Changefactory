"use strict";

const MOCKING_MODE = true;
const DEBUG_MODE = true;
const TEST_RECEIVING_EMAIL_ADDRESSES = ["dh@pqforce.com"];

// Set object types for which notifications are to be used
const OBJECT_TYPES = ["Todo"];

// Todo relations
const TODO_ASSIGNEE = 'C19BA2CBCC0842D38294529B0F8388DE';
const TODO_OWNER = '008478F55BCE436DA934B5D3AAEA81E0';
const RESOURCE_TYPES = ['HRM-RES-TYP-EMP', 'HRM-RES-TYP-EXT'];

const TODO_STATE_WORKING = 'BA8B9C0517644423BD1F77C037243858';
const TODO_STATE_REVIEWING = '086EB1C772C941F4B18A1BAC6264F48B';

const NOTIFICATION_RULES =
[
    {
        "stateId": true, // any state
        "whenCommented": {
            "useEmailTemplate": createTodoCommentMail,
            "notifyRelationTypes": [ TODO_ASSIGNEE ]
        }
    }
];

const MAIL_SKIN =
{
	"darkFontColor": "#07074E", // PQFORCE dark blue
	"lightFontColor": "#FFFFFF", // white
	"darkBackgroundColor": "#DB5656", // PQFORCE red
	"lightBackgroundColor": "#F7F7F7", // light gray
	"testingAlertFontColor": "#FFFFFF", // white
	"testingAlertBackgroundColor": "#FF0000", // red
	"logoSrc": "https://www.pqforce.com/logo-colour-a.png",
	"logoLink": "https://www.pqforce.com",
	"logoAlt": "PQFORCE Logo",
	"bodyMessageMode": "plain",
	"textAlign": "left",
	"testing": MOCKING_MODE // Creates a striking banner at the top of the notification email
};

// Set parameters
pqfNotificationLib.setObjectTypes(OBJECT_TYPES);
pqfNotificationLib.setRules(NOTIFICATION_RULES);
pqfNotificationLib.setMockingMode(MOCKING_MODE);
pqfNotificationLib.setDebuggingMode(DEBUG_MODE, TEST_RECEIVING_EMAIL_ADDRESSES);
pqfNotificationLib.setEmailSkin(MAIL_SKIN);

if(trigger.action === "LIFECYCLE") {
	pqfNotificationLib.sendLifecycleNotifications(trigger.objectType, trigger.objectId);
}
function createTodoCommentMail(receiverInfos, actorInfos, objectInfos, language) {
    let reason = "";
    let subject = "";	
    let body = "";
	switch(language) {
		case "en":
			subject = (objectInfos ? "New comment for Todo '" + objectInfos.name + "'" : "New comments");
			break;
		default:
			subject = (objectInfos ? "Neuer Kommentar für das Todo '" + objectInfos.name + "'": "Neue Kommentare");
	}
	body = greeting(receiverInfos, language);
	body += "<p><b>Todo</b>: " + objectInfos.name + "</p>";
	body += "<p><b>Kommentar von " + actorInfos.resourceName + "</b>: " + objectInfos.comment + "</p>";
	body += "<p>Dein PQFORCE Notifikationssystem 👋🏻</p>";
	return {
		"subject": subject,
		"body": body
	};
}

// Helper function

function greeting(receiverInfos, lang) {
    switch(lang) {
        case "en-ch":
            return "<p>" + (receiverInfos.resourceName ? "Hello " + receiverInfos.resourceName + "!" : (receiverInfos.name ? "Hello " + receiverInfos.name + "!" : "Hello!")) + "</p>";
        case "fr":
            return "<p>" + (receiverInfos.resourceName ? "Salut " + receiverInfos.resourceName + "!" : (receiverInfos.name ? "Salut " + receiverInfos.name + "!" : "Salut!")) + "</p>";
        default:
            return "<p>" + (receiverInfos.resourceName ? "Hallo " + receiverInfos.resourceName + "!" : (receiverInfos.name ? "Hallo " + receiverInfos.name + "!" : "Hallo!")) + "</p>";
    }
}