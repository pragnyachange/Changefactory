'use strict';

const MOCKING_MODE = false;
const DEBUG = true;
const TEST_EMAIL_ADDRESSES = [];

// Static email adresses
const NOTIFY_EMAIL_ADRESSES = [];

// Todo relations
const TODO_ASSIGNEE = 'C19BA2CBCC0842D38294529B0F8388DE';
const TODO_OWNER = '008478F55BCE436DA934B5D3AAEA81E0';
const RESOURCE_TYPES = ['HRM-RES-TYP-EMP', 'HRM-RES-TYP-EXT'];

const NOTIFY_RULES = [
    { // Rule 1:
		'objectType': 'Todo',
		'action': 'CREATED',
        'useEmailTemplate': createTodoAssignmentSummary,
		'relationTypeAssignee': TODO_ASSIGNEE,
		'relationTypeOwner': TODO_OWNER
    },
    { // Rule 2:
		'objectType': 'Todo',
		'action': 'DELETED',
        'useEmailTemplate': deleteTodoAssignmentSummary,
		'relationTypeAssignee': TODO_ASSIGNEE,
		'relationTypeOwner': TODO_OWNER
    }
];

const MAIL_SKIN = {
    'darkFontColor': '#07074E',
    // PQFORCE dark blue
    'lightFontColor': '#FFFFFF',
    // white
    'darkBackgroundColor': '#DB5656',
    // PQF red
    'lightBackgroundColor': '#F7F7F7',
    // light gray
    'testingAlertFontColor': '#FFFFFF',
    // white
    'testingAlertBackgroundColor': '#FF0000',
    // red
    'logoSrc': 'https://www.pqforce.com/logo-colour-a.png',
    'logoLink': 'https://www.pqforce.com',
    'logoAlt': 'PQFORCE Logo',
    'bodyMessageMode': 'plain',
    'textAlign': 'left',
    'testing': MOCKING_MODE
};

pqfNotificationLib.setMockingMode(MOCKING_MODE);
pqfNotificationLib.setDebuggingMode(DEBUG, TEST_EMAIL_ADDRESSES);
pqfNotificationLib.setEmailSkin(MAIL_SKIN);
pqfNotificationLib.setRules(NOTIFY_RULES);
pqfNotificationLib.sendAssigmentNotifications(trigger.objectType, trigger.objectId, trigger.action);


// ----------------------------------------------------------------------
// Mail template functions
// ----------------------------------------------------------------------

function createTodoAssignmentSummary(assigneeInfos, ownerInfos, actorInfos, todoInfos, language) {
	// Arguments:
	//  - assigneeInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - ownerInfos: Array of { 'name': string, 'resourceId': string, 'resourceName': string, 'email': string }
	//  - actorInfos: { 'name': string, 'resourceId': string, 'resourceName': string, 'email': string }
	//  - todoInfos: { 'name': string, 'description': string, 'deadline': moment, 'daysOverdue': integer, 'url': string }
	//  - language: "de" | "fr" | "it" | "en-ch" | null
	let subject = 'PQFORCE: Neues TODO zugewiesen';
	let addressee = (assigneeInfos.resourceName ? assigneeInfos.resourceName : (assigneeInfos.name ? assigneeInfos.name : 'PQFORCE User'));
    let body = '<p>Hallo ' + addressee + '!</p>';
	
	// Reduce the owners to keep only the last occurrence of each resourceId
	// (some resources might have multiple user accounts)
	const ownerResources = Array.from(
		new Map(ownerInfos.map(obj => [obj.resourceId, obj])).values()
	);
	let ownerString = '';
	if(!ownerResources || ownerResources.length == 0) {
		ownerString += 'niemandem';
	} else if(ownerResources.length == 1) {
		ownerString += (ownerResources[0].resourceName ? ownerResources[0].resourceName : 'Unbekannt') + (ownerResources[0].email ? ' (' + ownerResources[0].email + ')' : '');
	} else {
		ownerString += 'folgenden Personen: ';
		ownerResources.forEach(function(owner, index) {
			ownerString += (index == 0 ? '' : ', ')
				+ (owner.resourceName ? owner.resourceName : 'Unbekannt')
				+ (owner.email ? ' (' + owner.email + '), ' : '');
		});
	}
	
	let actorString = '';
	if(!actorInfos) {
		actorString += 'Unbekannt';
	} else {
		actorString += (actorInfos.resourceName ? actorInfos.resourceName : 'Unbekannt') + (actorInfos.email ? ' (' + actorInfos.email + ')' : '');
	}
	
    body += '<p>Das nachfolgende Todo gehört ' + ownerString + '. Es ist dir von ' + actorString + ' <b>zugewiesen</b> worden:</p>';    
	body += '<p><b>TODO</b>: <a href="' + todoInfos.url + '">' + todoInfos.name + '</a><br>';
	body += '<b>Beschreibung</b>: ' + todoInfos.description + '<br>';
	if (todoInfos.deadline) {
		body += '<b>Deadline</b>: ' + todoInfos.deadline.format('DD.MM.YYYY') + '<p>';
		if(todoInfos.daysOverdue < 0) {
			body += '<p>Du hast also <b>noch ' + (-todoInfos.daysOverdue) + ' Tage</b> Zeit, um das Todo zu erledigen.<p>';
		} else if(todoInfos.daysOverdue > 0) {
			body += '<p>Du hättest das Todo <b>seit ' + todoInfos.daysOverdue + ' Tagen</b> erledigen sollen.<p>';
		} else {
			body += '<p>Das Todo ist <b>heute</b> zur Erledigung fällig.<p>';		
		}
	}

    body += '<p>Dein PQFORCE-Notifikationssystem 👋🏻</p>';
    return {
        'subject': subject,
        'body': body
    };
}

function deleteTodoAssignmentSummary(assigneeInfos, ownerInfos, actorInfos, todoInfos, language) {
	// Arguments:
	//  - assigneeInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - ownerInfos: Array of { 'name': string, 'resourceName': string, 'email': string }
	//  - actorInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - todoInfos: { 'name': string, 'description': string, 'deadline': moment, 'daysOverdue': integer, 'url': string }
	//  - language: "de" | "fr" | "it" | "en-ch" | null
	let subject = 'PQFORCE: TODO entzogen';
	let addressee = (assigneeInfos.resourceName ? assigneeInfos.resourceName : (assigneeInfos.name ? assigneeInfos.name : 'PQFORCE User'));
    let body = '<p>Hallo ' + addressee + '!</p>';
	
	// Reduce the owners to keep only the last occurrence of each resourceId
	// (some resources might have multiple user accounts)
	const ownerResources = Array.from(
		new Map(ownerInfos.map(obj => [obj.resourceId, obj])).values()
	);
	let ownerString = '';
	if(!ownerResources || ownerResources.length == 0) {
		ownerString += 'niemandem';
	} else if(ownerResources.length == 1) {
		ownerString += (ownerResources[0].resourceName ? ownerResources[0].resourceName : 'Unbekannt') + (ownerResources[0].email ? ' (' + ownerResources[0].email + ')' : '');
	} else {
		ownerString += 'folgenden Personen: ';
		ownerResources.forEach(function(owner, index) {
			ownerString += (index == 0 ? '' : ', ')
				+ (owner.resourceName ? owner.resourceName : 'Unbekannt')
				+ (owner.email ? ' (' + owner.email + '), ' : '');
		});
	}
	
	let actorString = '';
	if(!actorInfos) {
		actorString += 'Unbekannt';
	} else {
		actorString += (actorInfos.resourceName ? actorInfos.resourceName : 'Unbekannt') + (actorInfos.email ? ' (' + actorInfos.email + ')' : '');
	}
	
    body += '<p>Das nachfolgende Todo gehört ' + ownerString + '. Es ist dir von ' + actorString + ' <b>entzogen</b> worden:</p>';    
	body += '<p><b>TODO</b>: <a href="' + todoInfos.url + '">' + todoInfos.name + '</a><br>';
	body += '<b>Beschreibung</b>: ' + todoInfos.description + '</p>'; 
    body += '<p>Dein PQFORCE-Notifikationssystem 👋🏻</p>';
    return {
        'subject': subject,
        'body': body
    };
}