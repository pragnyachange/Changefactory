'use strict';

const MOCKING_MODE = true;
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
    'testing': true
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
	//  - ownerInfos: Array of { 'name': string, 'resourceName': string, 'email': string }
	//  - actorInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - todoInfos: { 'name': string, 'description': string, 'deadline': moment, 'daysOverdue': integer, 'url': string }
	//  - language: "de" | "fr" | "it" | "en-ch" | null
	let subject = 'PQFORCE: Neues TODO zugewiesen';
	let addressee = (assigneeInfos.resourceName ? assigneeInfos.resourceName : (assigneeInfos.name ? assigneeInfos.name : 'PQFORCE User'));
    let body = '<p>Hallo ' + addressee + '!</p>';
	
	let ownerString = '';
	if(!ownerInfos || ownerInfos.length == 0) {
		ownerString += 'niemandem';
	} else if(ownerInfos.length == 1) {
		ownerString += (ownerInfos[0].resourceName ? ownerInfos[0].resourceName : 'Unbekannt') + (ownerInfos[0].email ? ' (' + ownerInfos[0].email + ')' : '');
	} else {
		ownerString += 'folgenden Personen: ';
		ownerInfos.forEach(function(owner, index) {
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
	body += '<b>Deadline</b>: ' + (todoInfos.deadline ? todoInfos.deadline.format('DD.MM.YYYY') : '') + '<p>';
	if (todoInfos.deadline) {
		if(todoInfos.daysOverdue < 0) {
			body += '<p>Du hast also <b>noch ' + (-todoInfos.daysOverdue) + ' Tage</b> Zeit, um das Todo zu erledigen.<p>';
		} else if(todoInfos.daysOverdue > 0) {
			body += '<p>Du hättest das Todo <b>seit ' + todoInfos.daysOverdue + ' Tagen</b> erledigen sollen.<p>';
		} else {
			body += '<p>Das Todo ist <b>heute</b> zur Erledigung fällig.<p>';		
		}
	}

	body += '<p>Melde dich <a href="' + todoInfos.url + '">hier</a> an, das Todo zu sehen und wo nötig zu aktualisieren.</p>';
    
    body += '<p>Beste Grüsse<br>';
    body += 'PQFORCE Notification System</p>';
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
	
	let ownerString = '';
	if(!ownerInfos || ownerInfos.length == 0) {
		ownerString += 'niemandem';
	} else if(ownerInfos.length == 1) {
		ownerString += (ownerInfos[0].resourceName ? ownerInfos[0].resourceName : 'Unbekannt') + (ownerInfos[0].email ? ' (' + ownerInfos[0].email + ')' : '');
	} else {
		ownerString += 'folgenden Personen: ';
		ownerInfos.forEach(function(owner, index) {
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
   
    body += '<p>Beste Grüsse<br>';
    body += 'PQFORCE Notification System</p>';
    return {
        'subject': subject,
        'body': body
    };
}