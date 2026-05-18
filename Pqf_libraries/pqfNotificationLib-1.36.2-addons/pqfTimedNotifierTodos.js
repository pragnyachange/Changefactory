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

const TODO_STATES_WORKING = [
		//'8C7639D49D3341DFBF7614965A04214E' // New/open
		'BA8B9C0517644423BD1F77C037243858' // Working
		//'086EB1C772C941F4B18A1BAC6264F48B' // Review
		//'039A74D1080C4D25873C2C31053D524A' // Done
		//'7D508E818D4C4EBE93DE661C7B3341FF' // Blocked
	];

const TODO_STATES_REVIEWING = [
		//'8C7639D49D3341DFBF7614965A04214E' // New/open
		//'BA8B9C0517644423BD1F77C037243858' // Working
		'086EB1C772C941F4B18A1BAC6264F48B' // Review
		//'039A74D1080C4D25873C2C31053D524A' // Done
		//'7D508E818D4C4EBE93DE661C7B3341FF' // Blocked
	];

const NOTIFY_RULES = [
    { // Rule 1:
        'notificationDefinition': { // Required
			'type': 'todoWorking', // Required. Can be 'todoWorking' or 'todoReviewing'. Other values will be ignored. If 'todoWorking', then 'differenceToDeadline' needs to be set. If 'todoReviewing', then reminders will be sent every time the rule is triggered.
			'relevantStates': TODO_STATES_WORKING, // Required. Array of todo lifecycle states
			'relevantAssigneeRelationTypes': [ TODO_ASSIGNEE ], // Required. Array of todo relation types
			'relevantOwnerRelationTypes': [ TODO_OWNER ], // Required. Array of todo relation types
			'relevantResourceTypes': RESOURCE_TYPES, // Required. Array of resource types
			'differenceToDeadline': [-2, 0, 2, 7] // Required. Send notification this many days before (negative integers), on (0), or after (positive integers) the todo's deadline. Note: After the largest positive integer, a reminder will be sent every time the rule is triggered.
		},
        'sendingOptions': { // Not yet implemented
			//'lots': 'separate', // Optional. 'bulk' (default): Each receiver gets 1 email about all relevant todos. 'separate': Each receiver gets 1 email per todo.
			//'notifyStaticEmails': NOTIFY_EMAIL_ADRESSES // Optional. Array of strings. Each email notification will ALSO be sent to these static addresses
		},
        'useEmailTemplate': createTodoWorkingSummary // Must be a name of a function with the following arguments: ...
    },
    { // Rule 2:
        'notificationDefinition': {
			'type': 'todoReviewing',
			'relevantStates': TODO_STATES_REVIEWING,
			'relevantAssigneeRelationTypes': [ TODO_ASSIGNEE ],
			'relevantOwnerRelationTypes': [ TODO_OWNER ],
			'relevantResourceTypes': RESOURCE_TYPES,
			'differenceToCompletion': [0, 1, 3, 7] // Required. Send notification this many days after the todo has been completed. Note: After the largest positive integer, a reminder will be sent every time the rule is triggered.
		},
        'sendingOptions': { // Not yet implemented
			//'lots': 'separate',
			//'notifyStaticEmails': NOTIFY_EMAIL_ADRESSES
		},
        'useEmailTemplate': createTodoReviewingSummary
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
pqfNotificationLib.setTodoStatesWorking(TODO_STATES_WORKING);
pqfNotificationLib.setTodoStatesReviewing(TODO_STATES_REVIEWING);
pqfNotificationLib.setRules(NOTIFY_RULES);
pqfNotificationLib.sendTimedNotifications('todoReminders');


// ----------------------------------------------------------------------
// Mail template functions
// ----------------------------------------------------------------------

function createTodoWorkingSummary(receiverInfos, ownerInfos, todoInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - ownerInfos: Array of { 'resourceName': string, 'email': string }
	//  - todoInfos: { 'name': string, 'description': string, 'deadline': moment, 'daysOverdue': integer, 'url': string }
	let subject = 'PQFORCE: Pendentes TODO';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
	
	let ownerString = '';
	if(!ownerInfos) {
		ownerString += 'niemandem';
	} else if(ownerInfos.length == 1) {
		ownerString += (ownerInfos[0].resourceName ? ownerInfos[0].resourceName : 'Unbekannt') + (ownerInfos[0].email ? ' (' + ownerInfos[0].email + ')' : '');
	} else {
		ownerString += 'folgenden Personen: ';
		ownerInfos.forEach(function(owner) {
			ownerString += (owner.resourceName ? owner.resourceName : 'Unbekannt') + (owner.email ? ' (' + owner.email + '), ' : '');
		});
	}
	
    body += '<p>Das nachfolgende Todo gehört ' + ownerString + ' und ist dir zugewiesen:</p>';    
	body += '<p><b>TODO</b>: <a href="' + todoInfos.url + '">' + todoInfos.name + '</a><br>';
	body += '<b>Beschreibung</b>: ' + todoInfos.description + '<br>';
	body += '<b>Deadline</b>: ' + todoInfos.deadline.format('DD.MM.YYYY') + '<p>';
	if(todoInfos.daysOverdue < 0) {
		body += '<p>Du hast also <b>noch ' + todoInfos.daysOverdue + ' Tage</b> Zeit, um das Todo zu erledigen.<p>';
	} else if(todoInfos.daysOverdue > 0) {
		body += '<p>Du hättest das Todo <b>seit ' + todoInfos.daysOverdue + ' Tagen</b> erledigen sollen.<p>';
	} else {
		body += '<p>Das Todo ist <b>heute</b> zur Erledigung fällig.<p>';		
	}

	body += '<p>Melde dich <a href="' + todoInfos.url + '">hier</a> an, um den Bearbeitungsstand des Todo zu aktualisieren.</p>';
    
    body += '<p>Beste Grüsse<br>';
    body += 'PQFORCE Notification System</p>';
    return {
        'subject': subject,
        'body': body
    };
}

function createTodoReviewingSummary(receiverInfos, actorInfos, todoInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - actorInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - todoInfos: { 'name': string, 'description': string, 'deadline': moment, 'daysOverdue': integer, 'url': string }
	let subject = 'PQFORCE: TODO zur Prüfung';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
	
    body += '<p>Das nachfolgende Todo wurde von ' + (actorInfos.resourceName ? actorInfos.resourceName : (actorInfos.name ? actorInfos.name : 'einem anderen PQFORCE User')) + ' erledigt und steht zur Prüfung an:</p>';    
	body += '<p><b>TODO</b>: <a href="' + todoInfos.url + '">' + todoInfos.name + '</a><br>';
	body += '<b>Beschreibung</b>: ' + todoInfos.description + '<br>';
	body += '<b>Deadline</b>: ' + todoInfos.deadline.format('DD.MM.YYYY') + '<p>';
	if(todoInfos.daysOverdue < 0) {
		body += '<p>Das Todo wurde <b>' + todoInfos.daysOverdue + ' Tage früher</b> erledigt.<p>';
	} else if(todoInfos.daysOverdue > 0) {
		body += '<p>Das Todo wurde <b>' + todoInfos.daysOverdue + ' Tage zu spät</b> erledigt.<p>';
	} else {
		body += '<p>Das Todo wurde <b>genau zur Deadline</b> erledigt.<p>';		
	}

	body += '<p>Melde dich <a href="' + todoInfos.url + '">hier</a> an, um das Todo auf <i>erledigt</i> zu setzen.</p>';
    
    body += '<p>Beste Grüsse<br>';
    body += 'PQFORCE Notification System</p>';
    return {
        'subject': subject,
        'body': body
    };
}

function createTodoCommentSummary(receiverInfos, actorInfos, todoInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - actorInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - todoInfos: { 'name': string, 'description': string, 'deadline': moment, 'daysOverdue': integer, 'url': string }
	let subject = 'PQFORCE: Neuer Kommentar zu einem TODO';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
	
    body += '<p>Das nachfolgende Todo wurde von ' + (actorInfos.resourceName ? actorInfos.resourceName : (actorInfos.name ? actorInfos.name : 'einem anderen PQFORCE User')) + ' kommentiert:</p>';    
	body += '<p><b>TODO</b>: <a href="' + todoInfos.url + '">' + todoInfos.name + '</a><br>';
	body += '<b>Beschreibung</b>: ' + todoInfos.description + '<br>';
	body += '<b>Deadline</b>: ' + todoInfos.deadline.format('DD.MM.YYYY') + '<br>';
	body += '<b>Kommentar</b>: ' + todoInfos.comment + '</p>';
	body += '<p>Melde dich <a href="' + todoInfos.url + '">hier</a> an, um das Todo auf <i>erledigt</i> zu setzen.</p>';
    
    body += '<p>Beste Grüsse<br>';
    body += 'PQFORCE Notification System</p>';
    return {
        'subject': subject,
        'body': body
    };
}