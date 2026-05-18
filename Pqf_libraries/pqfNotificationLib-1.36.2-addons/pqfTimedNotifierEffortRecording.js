"use strict";
moment.locale("de");

//---------------------------------------------
// Configuration section

const MOCKING_MODE = true;
const DEBUG_MODE = true;
const TEST_RECEIVING_EMAIL_ADDRESSES = ["dh@pqforce.com"];

const REMINDER_TIME_LAGS = [28];
// Number of days after a period has ended (-x means x days before current period ends, x means x days after last period has ended)

const CONTACT_EMAILS = ["dh@pqforce.com"];
// These email addresses receive email summary after notifications have been sent out.
// NOTE: Summary mails are sent independently of MOCKING_MODE and TEST_RECEIVING_EMAIL_ADDRESSES!

const NOTIFY_UNCONDITIONALLY = false; // if true, users will be notified even when their notify flag is off
const ACTIVE_PROJECT_STATE_IDS = [ // reminders will ony be sent if the project is on one of these lifecycle states
    //"0B0218E7963D4856A0471FF6849FE5F0",	// Neu
    //"3F0A25FE3D8E463F879DF18F779F7554",	// Idee in Arbeit
    //"58402BE598374E19AB2C8DEA52F4C4AF",	// Skizze in Arbeit
    //"547F0D146BA6427CB305118FFAF4E309",	// Auftrag in Arbeit
    //"262B84F69E304A86BD9F4DDC1A2021C4",	// Auftrag in Arbeit (Abnahme)
    "91BAA859B32742C7A8306A33D24F8B69",	// Projekt in Arbeit
    //"DC84D197B85941F68279E838C0B69448",	// Abgeschlossen
    //"AFEF4A22996E4F08897F07E64B02F867",	// Abgebrochen / abgelehnt
    //"967AA1962BA246EB98BF2AA23639834E",	// Sistiert
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

const RELATION_TYPE_PL = "06FCCCAAA5BD45FAAE0297E081D91FDE";

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

const NOTIFICATION_RULES =
[
    {
        "objectType": "Project",
		"schedule": {
			"monthly": REMINDER_TIME_LAGS
		},
		"projectFilter": {
			"lifecycleStates": ACTIVE_PROJECT_STATE_IDS
			"properties": [
				{
					"subobjectId": "ProjectMeta",
					"propertyId": "prj-type",
					"values": ACTIVE_PROJECT_TYPE_IDS
				}
			],
		},
		"notifyAllocations": {
		    "task": {
		        "beginWindow": -5, // Task must overlap with window 5 days before and 10 days after today
		        "endWindow": 10
		    },
		    "allocation": {
		        "minEffort": 10, // Allocation on the task must have at least 10 hours of effort
		    }
		},
		"notifyOptions": {
			"forceNotify": NOTIFY_UNCONDITIONALLY,
			"defaultLanguage": "de"
		},
		"useEmailTemplate": createEffortRecordingReminder,
		"contacts": CONTACT_EMAILS.map(function(email) {
			return {
				"name": null,
				"email": email,
				"useEmailTemplate": createEffortRecordingReminderSummary
			};
		})
    }
];

// end of configration section
//--------------------------------------------


// Set parameters
pqfNotificationLib.setRules(NOTIFICATION_RULES);
pqfNotificationLib.setMockingMode(MOCKING_MODE);
pqfNotificationLib.setDebuggingMode(DEBUG_MODE, TEST_RECEIVING_EMAIL_ADDRESSES);
pqfNotificationLib.setEmailSkin(MAIL_SKIN);

// Processing
if(typeof trigger === "undefined") {
	pqfNotificationLib.sendTimedNotifications("effortRecording", "now");
	
} else if(trigger.objectType === "Day") {
	pqfNotificationLib.sendTimedNotifications("effortRecording");
	
} else {
	pqfLib.utils.misc.log(DEBUG_MODE ? 1 : 0, "warn", null, "Timed notifications cannot be triggered by trigger " + trigger.objectType + " and action " + trigger.action);
}

function createEffortRecordingReminder(receiverInfos, objectInfos, period, language, contact) {
	let subject = "";	
	switch(language) {
		case "en":
			subject = "Reminder to record your efforts spent on the project " + objectInfos?.name;
			break;
		case "fr":
			subject = "Rappel pour enregistrer vos efforts consacrés au projet " + objectInfos?.name;
			break;
		default:
			subject = "Erinnerung zur Erfassung deiner Leistungen im Projekt " + objectInfos?.name;
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
	body += " Wir bitten dich, für das Projekt <b><a href=\"" + objectInfos?.url + "\">" + objectInfos?.name + "</a></b> deine Leistungen zu erfassen.";
	body += " Deine letzte Leistungserfassung war für den " + moment(receiverInfos.latestReportingDate).format("DD.MM.YYYY") + ".</p>";
	body += "<p>Du erhältst diese Nachricht, weil du auf folgenden Tasks im genannten Projekt alloziert bist:</p>";
	body += "<ul>";
	objectInfos.children.forEach(function(task) {
		let allocated = pqfLib.utils.format.round(moment.duration(task.efforts.planned).asHours(), 2);
		let actual = pqfLib.utils.format.round(moment.duration(task.efforts.actual).asHours(), 2);
		let remaining = allocated - actual;
		body += "<li><b>" + task.name + "</b>";
		body += "<ul>";
		body += "<li>Zeitperiode: " + moment(task.beg).format("DD.MM.YYYY") + " bis " + moment(task.end).subtract(1, "day").format("DD.MM.YYYY") + "</li>";
		body += "<li>Alloziert: " + allocated + "h</li>";
		body += "<li>Bisher erfasste Zeit: " + actual + "h</li>";
		body += "<li>Restaufwand: " + remaining + "h</li>";
		body += "</ul>";
	});
	body += "</ul>";
	body += "<p>Hier gehts zur <a href=\"" + receiverInfos.url + "\">Leistungserfassung</a>. Für die Erledigung bis zum <b>" + period.deadline.format("DD.MM.YYYY") + "</b> danken wir bestens.</p>";
	body += "<p>Bitte antworte nicht auf diese E-Mail. Sie wurde vom System automatisch erstellt.</p>";
	if(contact && contact.email) {
		body += "<p>Bei Fragen wendest du dich bitte an <a href=\"mailto:" + contact.email + "\">" + (contact.name ? contact.name : contact.email) + "</a>.</p>";
	}
	let pl = objectInfos.relatedResources.find(res => res.relationType = RELATION_TYPE_PL);
	let senderName = pl && pl.relationName && pl.name ? pl.relationName + " " + pl.name : "PQFORCE-Notifikationssystem";
	body += "<p>Dein " + pl + "</p>";
	return {
		"subject": subject,
		"body": body
	};
}


function createEffortRecordingReminderSummary(contact, period, statistics) {
	let recipientListFormatted = "";
	statistics.recipients.forEach(function(recipient) {
		recipientListFormatted += "<li>" + (recipient.hasUser ? "✔ " + recipient.userName + " " : "⚠ ") + " | "
		+ (recipient.resourceName ? recipient.resourceName : "[keine Ressource]") + " (" + (recipient.email ? recipient.email : "keine E-Mail-Adresse") + "): "
		+ "<a href=\"" + recipient.objectLink + "\">" + recipient.objectName + "</a></li>";
	});
	let subject = "Erinnerungs-Mails für " + period.name + " verschickt - Zusammenfassung";
	let body =
		"<p>Hallo" + (contact.name ? " " + contact.name : "") + "!</p>" +
		"<p>Dies ist ein Hinweis des PQFORCE-Notifikationssystems, dass die Automation für den Versand der E-Mail-Erinnerung für die Leistungserfassung für " + period.name + " soeben durchgeführt wurde.</p>" +
		"<p><b>Hier die Zusammenfassung:</b></p>" +
		"<ul>" +
		"<li>Total sind " + statistics.numProjectsTotal + " Projekte vorhanden</li>" +
		"<li>davon " + statistics.numProjectsNotified + " Projekte, die eine Leistungserfassung von mind. 1 Ressource verlangen</li>" +
		"<li>Insgesamt wurden " + statistics.numMessagesTotal + " E-Mails verschickt (⚠ = Empfänger hat kein verknüpftes Benutzerkonto):" +
		"<ul>" + recipientListFormatted + "</ul>" +
		"</li>" +
		"</ul>";
	return {
		"subject": subject,
		"body": body
	};
}