/**
 * Automation ID: FBB6CCCC17A94E5C9A20538A5297151F
 *
 * Requires pqfNotificationLib
 * 
 */
 
//------------------------------------------------------------------------------
// This notifier is used for ***lifecycle-based*** ad hoc notifications
// in the context of resource allocations.
// Resource managers can be notified about requests.
// Project managers can be notified about rejections or changed allocations.
//
// Use pqfTimedResourceRequestNotifier.js for ***timed*** notifications.
//------------------------------------------------------------------------------

'use strict';

const MOCKING_MODE = true;
const DEBUG = true;

// Static email adresses
const NOTIFY_EMAIL_ADRESSES = [];

// If MOCKING_MODE == true, then all emails are being sent to these addresses
// (array of email addresses)
const TEST_EMAIL_ADDRESSES = ["dh@pqforce.com"];

// Project relations
const PROJEKT_MANAGER = '06FCCCAAA5BD45FAAE0297E081D91FDE';

// OU relations
const RESOURCE_MANAGER = 'AA218835B6CA49A78D65A4A634FA3881';

const NOTIFY_RULES = [
    { // Rule 1: Send request to resource manager
        'notificationDefinition': {
			'stateNow': 'ALLOC_STATE_REQUESTED',
			'stateBefore': ['ALLOC_STATE_NEW', 'ALLOC_STATE_CHANGED'],
			'orgUnitRelationTypes': [RESOURCE_MANAGER]
		},
        'sendingOptions': { // Optional
			'notifyStaticEmails': NOTIFY_EMAIL_ADRESSES
		},
        'useEmailTemplate': createAllocationRequestedSummary,
		'actions': [ // Optional: Array of actions
			// Available are:
			// - type = 'store': Stores a JSON of the following kind
			//                   in the object store under the given key
			//         {
			//			 'userId': string,
			//           'createdAt': string,
			//           'effort': {
			//				'amountInHours': number,
			//              'amount': number,
			//				'unit': string
			//            }
			//         }
			// - type = 'unstore': Removes a JSON with the given key
			//					   from the object store
			// - type = 'comment': Adds a comment on the allocation lifecycle
			//         containing the amount and the unit requested
			{
				'type': 'store', // Type required
				'key': 'requested', // Required for type 'store'
			},
			{
				'type': 'comment', // Type required
				'prefixText': 'Requested: ', // Optional
			}
		]
    },
    { // Rule 2: Send approval to project manager
        'notificationDefinition': {
			'stateNow': 'ALLOC_STATE_APPROVED',
			'stateBefore': ['ALLOC_STATE_REQUESTED', 'ALLOC_STATE_REJECTED'],
			'projectRelationTypes': [ PROJEKT_MANAGER ]
		},
        'sendingOptions': { // Optional
			'notifyStaticEmails': NOTIFY_EMAIL_ADRESSES
		},
        'useEmailTemplate': createAllocationApprovedSummary,
		'actions': [ // Optional: Array of actions, see Rule 1 
			{
				'type': 'store', // Type required
				'key': 'approved', // Required for type 'store'
			},
			{
				'type': 'comment', // Type required
				'prefixText': 'Approved: ', // Optional
			}
		]
    },
    { // Rule 3: Send rejection to project manager
        'notificationDefinition': { // Required
			'stateNow': 'ALLOC_STATE_REJECTED', // Required
			'stateBefore': ['ALLOC_STATE_REQUESTED', 'ALLOC_STATE_APPROVED'], // Required
			'projectRelationTypes': [ PROJEKT_MANAGER ] // Required. Array of project relation types
		},
        'sendingOptions': { // Optional
			'notifyStaticEmails': NOTIFY_EMAIL_ADRESSES // Optional. Array of strings. Each email notification will ALSO be sent to these static addresses
		},
        'useEmailTemplate': createAllocationRejectedSummary, // Must be a name of a function
		'actions': [ // Optional: Array of actions
			{
				'type': 'unstore', // Type required
				'key': 'approved', // Required for type 'unstore'
			},
		]
    },
    { // Rule 4: Send allocation changes to project manager
        'notificationDefinition': {
			'stateNow': 'ALLOC_STATE_CHANGED',
			'stateBefore': ['ALLOC_STATE_REQUESTED', 'ALLOC_STATE_APPROVED'],
			'projectRelationTypes': [ PROJEKT_MANAGER ]
		},
        'sendingOptions': { // Optional
			'notifyStaticEmails': NOTIFY_EMAIL_ADRESSES
		},
        'useEmailTemplate': createAllocationChangedSummary,
		'actions': [ // Optional: Array of actions
			{
				'type': 'unstore', // Type required
				'key': 'approved', // Required for type 'unstore'
			},
			{
				'type': 'unstore', // Type required
				'key': 'requested', // Required for type 'unstore'
			},
		]
    },
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
pqfNotificationLib.sendAllocationNotifications(trigger.objectId);


// ----------------------------------------------------------------------
// Mail template functions
// ----------------------------------------------------------------------

function createAllocationRequestedSummary(receiverInfos, allocation, actorInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - allocation: { 'resource': { 'id': string, 'name': string }, 'project': { 'id': string, 'name': string, 'url': string, 'task': { 'id': string, 'name': string, 'startDate': YYYY-MM-DD, 'endDate': YYYY-MM-DD', 'url': string } }, 'demandedEffort': { 'amount': number, 'unit': string, 'amountInHours': number }, 'remark': html }
	//  - actorInfos: { 'name': string, 'resourceName': string,	'email': string, 'doNotify': boolean, 'previousActor': { 'name': string, 'resourceName': string, 'email': string, 'doNotify': boolean } }
	let subject = 'PQForce: Ressource angefragt';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
    body += '<p>Ich habe die Ressource ' + allocation.resource.name + ' bei dir angefragt. ';
    
	body += '<p><b>Projekt</b>: <a href="' + allocation.project.url + '">' + allocation.project.name + '</a><br>';
	body += '<b>Task</b>: <a href="' + allocation.project.task.url + '">' + allocation.project.task.name + '</a><br>';
	body += '<b>Zeitraum</b>: ' + moment(allocation.project.task.startDate).format('DD.MM.YYYY') + ' bis ' + moment(allocation.project.task.endDate).format('DD.MM.YYYY') + ' (Dauer: ca. ' + pqfLib.utils.format.round(moment.duration(moment(allocation.project.task.endDate).diff(moment(allocation.project.task.startDate))).asWeeks(), 1) + ' Wochen)<br>';
	body += '<b>Ressource</b>: ' + allocation.resource.name + '<br>';
	body += '<b>Angefragter Aufwand</b>: ' + allocation.demandedEffort.amount + ' ' + allocation.demandedEffort.unit + '<br>';
	body += '<b>Kommentar</b>: ' + allocation.remark + '</p>';
	
    body += '<p>Beste Grüsse<br>';
    body += (actorInfos && actorInfos.resourceName ? actorInfos.resourceName + (actorInfos.name ? ' (' + actorInfos.name + ')' : '') : 'PQFORCE Notification System</p>');
    return {
        'subject': subject,
        'body': body
    };
}

function createAllocationApprovedSummary(receiverInfos, allocation, actorInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - allocation: { 'resource': { 'id': string, 'name': string }, 'project': { 'id': string, 'name': string, 'url': string, 'task': { 'id': string, 'name': string, 'startDate': YYYY-MM-DD, 'endDate': YYYY-MM-DD', 'url': string } }, 'demandedEffort': { 'amount': number, 'unit': string, 'amountInHours': number }, 'remark': html }
	//  - actorInfos: { 'name': string, 'resourceName': string,	'email': string, 'doNotify': boolean, 'previousActor': { 'name': string, 'resourceName': string, 'email': string, 'doNotify': boolean } }
	let subject = 'PQFORCE: Genehmigung Ressourcenanfrage';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
    body += '<p>Deine Ressourcenanfrage im gewünschten Zeitraum habe ich gerne wie folgt genehmigt:</p>';
    
	body += '<p><b>Projekt</b>: <a href="' + allocation.project.url + '">' + allocation.project.name + '</a><br>';
	body += '<b>Task</b>: <a href="' + allocation.project.task.url + '">' + allocation.project.task.name + '</a><br>';
	body += '<b>Zeitraum</b>: ' + moment(allocation.project.task.startDate).format('DD.MM.YYYY') + ' bis ' + moment(allocation.project.task.endDate).format('DD.MM.YYYY') + ' (Dauer: ca. ' + pqfLib.utils.format.round(moment.duration(moment(allocation.project.task.endDate).diff(moment(allocation.project.task.startDate))).asWeeks(), 1) + ' Wochen)<br>';
	body += '<b>Ressource</b>: <a href="' + allocation.resource.url + '">' + allocation.resource.name + '</a><br>';
	body += '<b>Angefragter Aufwand</b>: ' + allocation.demandedEffort.amount + ' ' + allocation.demandedEffort.unit + '<br>';
	body += '<b>Kommentar</b>: ' + allocation.remark + '</p>';
	
    body += '<p>Beste Grüsse<br>';
    body += (actorInfos && actorInfos.resourceName ? actorInfos.resourceName + (actorInfos.name ? ' (' + actorInfos.name + ')' : '') : 'PQFORCE Notification System</p>');
    return {
        'subject': subject,
        'body': body
    };
}

function createAllocationRejectedSummary(receiverInfos, allocation, actorInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - allocation: { 'resource': { 'id': string, 'name': string }, 'project': { 'id': string, 'name': string, 'url': string, 'task': { 'id': string, 'name': string, 'startDate': YYYY-MM-DD, 'endDate': YYYY-MM-DD', 'url': string } }, 'demandedEffort': { 'amount': number, 'unit': string, 'amountInHours': number }, 'remark': html }
	//  - actorInfos: { 'name': string, 'resourceName': string,	'email': string, 'doNotify': boolean, 'previousActor': { 'name': string, 'resourceName': string, 'email': string, 'doNotify': boolean } }
	let subject = 'PQFORCE: Ablehnung Ressourcenanfrage';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
    body += '<p>Für deine Ressourcenanfrage kann ich im gewünschten Zeitraum keine Genehmigung erteilen:</p>';
    
	body += '<p><b>Projekt</b>: <a href="' + allocation.project.url + '">' + allocation.project.name + '</a><br>';
	body += '<b>Task</b>: <a href="' + allocation.project.task.url + '">' + allocation.project.task.name + '</a><br>';
	body += '<b>Zeitraum</b>: ' + moment(allocation.project.task.startDate).format('DD.MM.YYYY') + ' bis ' + moment(allocation.project.task.endDate).format('DD.MM.YYYY') + ' (Dauer: ca. ' + pqfLib.utils.format.round(moment.duration(moment(allocation.project.task.endDate).diff(moment(allocation.project.task.startDate))).asWeeks(), 1) + ' Wochen)<br>';
	body += '<b>Ressource</b>: <a href="' + allocation.resource.url + '">' + allocation.resource.name + '</a><br>';
	body += '<b>Angefragter Aufwand</b>: ' + allocation.demandedEffort.amount + ' ' + allocation.demandedEffort.unit + '<br>';
	body += '<b>Kommentar</b>: ' + allocation.remark + '</p>';
	
    body += '<p>Beste Grüsse<br>';
    body += (actorInfos && actorInfos.resourceName ? actorInfos.resourceName + (actorInfos.name ? ' (' + actorInfos.name + ')' : '') : 'PQFORCE Notification System</p>');
    return {
        'subject': subject,
        'body': body
    };
}

function createAllocationChangedSummary(receiverInfos, allocation, actorInfos) {
	// Arguments:
	//  - receiverInfos: { 'name': string, 'resourceName': string, 'email': string }
	//  - allocation: { 'resource': { 'id': string, 'name': string }, 'project': { 'id': string, 'name': string, 'url': string, 'task': { 'id': string, 'name': string, 'startDate': YYYY-MM-DD, 'endDate': YYYY-MM-DD', 'url': string } }, 'demandedEffort': { 'amount': number, 'unit': string, 'amountInHours': number }, 'remark': html }
	//  - actorInfos: { 'name': string, 'resourceName': string,	'email': string, 'doNotify': boolean, 'previousActor': { 'name': string, 'resourceName': string, 'email': string, 'doNotify': boolean } }
	let subject = 'PQFORCE: Ressourcenanfrage zurückgesetzt';
    let body = '<p>Hallo ' + (receiverInfos.resourceName ? receiverInfos.resourceName : (receiverInfos.name ? receiverInfos.name : 'PQFORCE User')) + '!</p>';
    body += '<p>Ich habe das Start-/Enddatum eines Tasks oder den angefragte Aufwand einer Ressource über den Toleranzbereich hinaus verändert. ';
	body += 'Dadurch wurde deine Ressourcenanfrage automatisch zurückgesetzt und muss nun nochmals beantragt werden.</p>';
    
	body += '<p><b>Projekt</b>: <a href="' + allocation.project.url + '">' + allocation.project.name + '</a><br>';
	body += '<b>Task</b>: <a href="' + allocation.project.task.url + '">' + allocation.project.task.name + '</a><br>';
	body += '<b>Zeitraum</b>: ' + moment(allocation.project.task.startDate).format('DD.MM.YYYY') + ' bis ' + moment(allocation.project.task.endDate).format('DD.MM.YYYY') + ' (Dauer: ca. ' + pqfLib.utils.format.round(moment.duration(moment(allocation.project.task.endDate).diff(moment(allocation.project.task.startDate))).asWeeks(), 1) + ' Wochen)<br>';
	body += '<b>Ressource</b>: <a href="' + allocation.resource.url + '">' + allocation.resource.name + '</a><br>';
	body += '<b>Angefragter Aufwand</b>: ' + allocation.demandedEffort.amount + ' ' + allocation.demandedEffort.unit + '<br>';
	body += '<b>Kommentar</b>: ' + allocation.remark + '</p>';
	
    body += '<p>Beste Grüsse<br>';
    body += (actorInfos && actorInfos.resourceName ? actorInfos.resourceName + (actorInfos.name ? ' (' + actorInfos.name + ')' : '') : 'PQFORCE Notification System</p>');
    return {
        'subject': subject,
        'body': body
    };
}

