/**
/**
 * @name PQFORCE Notification Library
 * @version 1.36.2
 * @file pqfNotificationLib.js
 * @description This notification library offers various versatile functions 
 * for creating and sending **email notifications** to users.
 * There are different types of notifications.
 *
 * # LIFECYCLE NOTIFICATIONS
 *
 * Such notifications are triggered by lifecycle transitions of an object.
 * They are sent ad hoc, or can be put into an outbox and sent later at 
 * specific times.
 *
 * The library works based on the following concepts:
 *
 * - Rules can be defined which create the notification emails. Such rules
 *   consist of action triggers, intended receivers, and email templates used
 *   to create the messages with detailed information.
 * - Such notifications typically call the receiver for action, e.g., to decide
 *   on a next lifecycle transition. But they can also be created to inform
 *   the receiver about such actions being taken by other users.
 * - The email templates have to be defined as email generating functions.
 *   They are called with arguments containing information about the
 *   triggering object, the executing user and the receiver of the email.
 *   So emails can be composed with detailed information for the receiver.
 *   Varying emails can be created for different types of receivers.
 * - The action triggers are created by lifecycle transitions, which users can
 *   execute on different object types such as projects, project reports,
 *   allocations, todos etc.
 * - A rule may specify that a notification is not sent immediately but rather
 *   put into an outbox (as an info item in an envelope) and sent later.
 *   The outbox is processed periodically at defined times. Such delayed
 *   notifications may be sent repeatedly from the outbox, e.g., as reminders.
 * - Envelopes collect info items to be sent together to a receiver (summary).
 *   Notifications entering the outbox may thus "join" already existing
 *   envelopes. This can be used to deliberately collect notifications for a
 *   user and send them later in one email.
 * - Info items may also be removed based on action triggers so that they won't
 *   generate further notifications.
 * - The library can be used in a mocking mode which allows to test the
 *   specified rules before setting them to production. Similarly a debugging
 *   mode allows to see verbose output on the JS console, which helps debugging.
 *
 * # TIMED NOTIFICATIONS
 *
 * Such notifications are created by a timer. They are meant to be used to
 * remind users to check something (e.g. to keep risks up-to-date,
 * or to create a specific object, like e.g., a project status report, or to
 * record efforts spent on project tasks. They are sent according to a given
 * schedule.
 * @author DH (INTRASOFT)
 * @pqfId 52675DFCA17C4981A0FFB775CB8BB4BB
 * @created 2024-01-22
 * @modified 2026-03-31
 * @requires e430d37e331848788acbf975d600dd8e (pqfBasicLib.js), C1F33BFCC36E4926851ADF0FF493F402 (pqfTaskQueueLibrary.js), 47474A982C204EBBA5A0A86C51152072 (pqfWidgetLibrary.js)
 */

const pqfNotificationLib = (function () {
    "use strict";

    const NEWLY_CREATED_OBJECT_ID = "8DAA86435A58498F852623E52FC7FD00";
    const NOTIFICATION_OUTBOX_ID = "notificationOutbox";
	// Use for keeping the outbox in the store of the JS sandbox
    const ENVELOPE_PLACEHOLDER_TEXT_FOR_INFO_ITEMS
		= "<!-- [Placeholder for Info Items] -->";
    const UNKNOWN = "unbekannt";
	const TEST_MAIL_CURRENT_USER = "currentUser";

	const SAME_TIME_DELTA_MS = 500; // Time difference in lifecycle transitions that is considered simulateous. Used to detect automatic transitions, e.g., in allocation workflow

	// Initialize default statistics items
	let _statistics = [
		{
			"id": "numProjectsTotal",
			"name": "Total number of projects",
			"value": 0
		},
		{
			"id": "numProjectsRelevant",
			"name": "Number of relevant projects",
			"value": 0
		},
		{
			"id": "numProjectsNotified",
			"name": "Number of notified projects",
			"value": 0
		},
		{
			"id": "numMessagesTotal",
			"name": "Number of emails sent",
			"value": 0
		},
		{
			"id": "numMockMessagesTotal",
			"name": "Number of emails mocked",
			"value": 0
		},
		{
			"id": "recipients",
			"name": "Recipients",
			"value": []
		}
	];
	
	function _resetMailCounter() {
		_setStatistics("numMessagesTotal", 0);
		_setStatistics("numMockMessagesTotal", 0);
    }

    function _printMailCounter() {
		let numMessages = _getStatistics("numMessagesTotal");
		let numMockMessages = _getStatistics("numMockMessagesTotal");
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null,
			"Sent emails: " + numMessages + ", Mock emails: " + numMockMessages);
    }

    let _debuggingMode = true;
    let _mockingMode = false;
    let _testEmailAddresses = null;
    let _notificationRules = null;
    let _notificationObjectTypes = null;
    let _allocationStatesRequested = [
		// Default, can be change by the function setAllocationStatesRequested
        //"ALLOC_STATE_NEW",
        "ALLOC_STATE_REQUESTED",
        //"ALLOC_STATE_CHANGED",
        //"ALLOC_STATE_APPROVED",
        //"ALLOC_STATE_REJECTED"
    ];
    let _allocationStatesPending = [
		// Default, can be change by the function setAllocationStatesPending
        //"ALLOC_STATE_NEW",
        //"ALLOC_STATE_REQUESTED",
        "ALLOC_STATE_CHANGED",
        //"ALLOC_STATE_APPROVED",
        //"ALLOC_STATE_REJECTED"
    ];
    let _todoStatesWorking = [
		// Default, can be change by the function setTodoStatesWorking
        //"8C7639D49D3341DFBF7614965A04214E" // New/open
        "BA8B9C0517644423BD1F77C037243858" // Working
        //"086EB1C772C941F4B18A1BAC6264F48B" // Review
        //"039A74D1080C4D25873C2C31053D524A" // Done
        //"7D508E818D4C4EBE93DE661C7B3341FF" // Blocked
    ];
    let _todoStatesReviewing = [
		// Default, can be change by the function setTodoStatesReviewing
        //"8C7639D49D3341DFBF7614965A04214E" // New/open
        //"BA8B9C0517644423BD1F77C037243858" // Working
        "086EB1C772C941F4B18A1BAC6264F48B" // Review
        //"039A74D1080C4D25873C2C31053D524A" // Done
        //"7D508E818D4C4EBE93DE661C7B3341FF" // Blocked
    ];
    let _emailSkin = {
		// Default skin, can be changed by the function setEmailSkin
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
        "testing": false
    };

    let _outboxProcessingSchedule = {
        "weekly": [3]// Array with days of week, where Monday = 1,
		// e.g., [2, 4] means every Tuesday and Thursday,
		// [1,2,3,4,5] means every working day
    };
    let _outboxMaintenanceMode = "showStatistics";
	// Can be one of "showStatistics", "initialize", "empty"
	
	const STATISTICS_PARAMS = {
		"minNumCharsForItemNames": 40
	};

    // Get roles for later use
    let _roles = Pqf.acm.getUserRoles();

    // Set default email skin
    pqfLib.mail.setTemplateParams(_emailSkin);

	// Set debugging mode and optionally test email addresses
	// (see mocking mode)
    function _setDebuggingMode(debuggingMode, emails) {
        _testEmailAddresses = null;
		switch(typeof emails) {
			case "undefined":
				_testEmailAddresses= null;
				break;
			case "string":
				if (emails === TEST_MAIL_CURRENT_USER) {
					let user = Pqf.acm.getCurrentUser();
					_testEmailAddresses = [user.email];
				}
				break;
			default: // Assume array of email addresses
				_testEmailAddresses = emails;
		}
        _debuggingMode = debuggingMode;
        console.log("Debugging mode: " + _debuggingMode);
    }

	// No mails will be sent in mocking mode, expect to test email addresses
    function _setMockingMode(doMock) {
        _mockingMode = doMock;
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null,
			"Mocking mode: " + _mockingMode);
    }

    function _setEmailSkin(skin) {
        _emailSkin = skin;
    }

    function _setAllocationStatesRequested(states) {
        _allocationStatesRequested = states;
    }

    function _setAllocationStatesPending(states) {
        _allocationStatesPending = states;
    }

    function _setTodoStatesWorking(states) {
        _todoStatesWorking = states;
    }

    function _setTodoStatesReviewing(states) {
        _todoStatesReviewing = states;
    }

    function _setRules(rules) {
        _notificationRules = rules;
		// Register all email template functions found in this rule
		rules.forEach(rule => {
			let functionFound = rule.whenCommented?.useEmailTemplate;
			if (functionFound) {
				pqfTaskQueueLib.process.registerFunction(functionFound);
			}
			if (Array.isArray(rule.whenEnteringFromStateIds)) {
				rule.whenEnteringFromStateIds.forEach(state => { 
					functionFound = state?.useEmailTemplate;
					if (functionFound) {
						pqfTaskQueueLib.process.registerFunction(functionFound);
					}
				});
			}
			if (Array.isArray(rule.whenExitedToStateIds)) {
				rule.whenExitedToStateIds.forEach(state => { 
					functionFound = state?.useEmailTemplate;
					if (functionFound) {
						pqfTaskQueueLib.process.registerFunction(functionFound);
					}
					functionFound = state?.useEmailTemplateForRequester;
					if (functionFound) {
						pqfTaskQueueLib.process.registerFunction(functionFound);
					}
				});
			}
		});
    }

    function _setObjectTypes(objectTypes) {
        _notificationObjectTypes = objectTypes;
    }

    function _setOutboxProcessingParameters(schedule, maintenanceMode) {
        _outboxProcessingSchedule = schedule;
        _outboxMaintenanceMode = maintenanceMode;
    }

    function _sendNotifications(objectType, objectId) { // deprecated, for backward compatibility only
        _sendLifecycleNotifications(objectType, objectId);
    }
		
    function _sendTimedNotifications(type, timing) {
        type = (typeof type === "undefined" || type === null ? false : type);
        timing = (typeof timing === "undefined" ? null : timing);
		_processTimedNotifications(type, timing);
	}
	
	function _processTimedNotifications(type, timing) {
        if (_notificationRules && _notificationRules.length > 0) {
            let ruleCounter = 0;
            _notificationRules.forEach(function (rule) {
                ruleCounter++;
                pqfLib.utils.misc.log(1, "log", null, "");
                pqfLib.utils.misc.log(1, "log", null, "Processing rule #" + ruleCounter + "...");
                pqfLib.utils.misc.log(1, "log", null, "----------------------");
                switch (type) {
                case false: // type not set, go according to rule's object type
                    let projectReportTypes = Pqf.pm.getProjectReportTypes().map(x => x.id);
                    let projectPortfolioReportTypes = Pqf.pm.getProjectPortfolioReportTypes().map(x => x.id);
                    switch (true) {
                    case projectReportTypes.includes(rule.objectType):
                        _sendTimedProjectNotifications("ProjectReport", rule, timing);
                        break;
                    case projectPortfolioReportTypes.includes(rule.objectType):
                        // TODO: This case is not yet implemented
                        _sendTimedProjectNotifications("ProjectPortfolioReport", rule, timing);
                        break;
					case rule.objectType === "Project":
                        _sendTimedProjectNotifications("Project", rule, timing);					
						break;
                    default:
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Type of processing rule undefined");
                    }
                    break;
                case "todoReminders":
                    // No schedule to be considered
                    switch (rule.notificationDefinition.type) {
                    case "todoWorking":
                        _sendTodoWorkingNotifications(rule);
                        break;
                    case "todoReviewing":
                        _sendTodoReviewingNotifications(rule);
                        break;
                    default:
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Type " + rule.notificationDefinition.type + " of notification definition undefined");
                    }
                    break;
                case "effortRecording":
                    _sendTimedProjectNotifications("ProjectEfforts", rule, timing);
                    break;
                case "resourceRequests":
                case "resourcePending":
				case "resourceDecision":
				case "resourceAttention":
                    // Check schedule: Time to send?
                    let doSend = false;
                    if (rule.schedule && rule.schedule.quarterly && rule.schedule.quarterly.includes(moment().diff(moment().quarter(moment().quarter())), "days")) {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Quarterly schedule triggering.");
                        doSend = true;
                    }
                    if (rule.schedule && rule.schedule.monthly && rule.schedule.monthly.includes(moment().date())) {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Monthly schedule triggering.");
                        doSend = true;
                    }
                    if (rule.schedule && rule.schedule.weekly && rule.schedule.weekly.includes(moment().day())) {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Weekly schedule triggering.");
                        doSend = true;
                    }
                    if (doSend) {
                        switch (rule.notificationDefinition.type) {
                        case "resourceRequest":
                            _sendResourceRequestNotification(rule);
                            break;
                        case "resourcePending":
                            _sendResourcePendingNotification(rule);
                            break;
                        case "resourceDecision":
                            _sendResourceDecisionNotification(rule);
                            break;
                        case "resourceAttention":
                            _sendResourceAttentionNotification(rule);
                            break;
                        default:
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Type " + rule.notificationDefinition.type + " of notification definition undefined");
                        }
                    }
					break;
                default:
                }
            });
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "No notifications rules defined");
        }
    }

    function _getRelevantTimeLags(timeLags, periodType, endOfCurrentPeriod, endOfPreviousPeriod, mockDate) {
        let lagsForEarlyReminder = timeLags?.filter(x => x <= 0) || [];
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "lagsForEarlyReminder = " + JSON.stringify(lagsForEarlyReminder));
        let lagsForLateReminder = timeLags?.filter(x => x > 0) || [];
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "lagsForLateReminder = " + JSON.stringify(lagsForLateReminder));
        let today = moment(mockDate).startOf("day");
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "today = " + today.format("YYYY-MM-DD"));
		
        let relevantTimeLags = lagsForEarlyReminder?.filter(x => x == today.diff(endOfCurrentPeriod, "days")) || [];
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "today.diff(endOfCurrentPeriod, 'days') = " + today.diff(endOfCurrentPeriod, "days"));
		
        relevantTimeLags = relevantTimeLags?.concat(lagsForLateReminder?.filter(x => x == today.diff(endOfPreviousPeriod, "days") + 1) || []) || [];
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "today.diff(endOfPreviousPeriod, 'days') = " + today.diff(endOfPreviousPeriod, "days"));

        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "relevantTimeLags = " + JSON.stringify(relevantTimeLags));
        return relevantTimeLags;
    }

	function checkProjectValid(project, rule, mockDate) {
		let projectValid = true;
		
		// --------------------------------
		// Check lifecycle state
		// --------------------------------
		
		let projectCurrentState = null;
		try {
			projectCurrentState = Pqf.lcy.getObjectState("Project", project.id);
		} catch(err) {
			pqfLib.utils.misc.log(1, "error", "7D0FD6C631344AB3B968DD2AFCE770A6", "No lifecycle state found for project");
		}
		if (projectCurrentState !== null) {
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project lifecycle state is " + projectCurrentState.name + " (" + projectCurrentState.id + ")");
			if (!rule.projectFilter.lifecycleStates.includes(projectCurrentState.id)) {
				projectValid = false;
			}
			
			if (projectValid) {

				// --------------------------------
				// Check property values
				// --------------------------------
				
				let object = null;
				if (rule.projectFilter.properties && Array.isArray(rule.projectFilter.properties)) {
					rule.projectFilter.properties.forEach(function (propOptions) {
						if (propOptions.subobjectId) {
							object = Pqf.pm.getProjectSubObj(project.id, propOptions.subobjectId);
							// Attach subobject to project (it might be of use in the email template)
							project.subobjects = [object];
						} else {
							object = project;
						}
						if (Array.isArray(propOptions.values)) {
							// Filter project out if the property has not one of the desired values
							let prop = object.properties.find(x => x.key == propOptions.propertyId);
							if (!prop || !propOptions.values.includes(prop.value)) {
								projectValid = false;
							}
						}
					});
				}

				if (projectValid) {
					
					// --------------------------------
					// Check project classification
					// --------------------------------
					if (rule.projectFilter.classifications && Array.isArray(rule.projectFilter.classifications)) {
						rule.projectFilter.classifications.forEach(function (classificationOptions) {
							if (classificationOptions.schemaId && Array.isArray(classificationOptions.classificationIds)) {
								let projectClass = project.classification.find(x => x.classificationSchemaId == classificationOptions.schemaId);
								if (!projectClass || !projectClass.classificationId || !classificationOptions.classificationIds.includes(projectClass.classificationId)) {
									projectValid = false;
								}
							}
						});
					}
					
					if (projectValid) {

						// --------------------------------
						// Check project indicator targets
						// --------------------------------

						if (rule.projectFilter.indicatorTargets && Array.isArray(rule.projectFilter.indicatorTargets)) {
							rule.projectFilter.indicatorTargets.forEach(function (indicatorTarget) {
								let indicator = null;
								try {
									indicator = Pqf.pm.getIndicatorSelectionDetail(project.id, indicatorTarget.reportType, indicatorTarget.indicatorDetailDefinitionId);
								} catch(err) {
									pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Indicator " + indicatorTarget.indicatorDetailDefinitionId + " missing in project " + project.id);
									projectValid = false;
								}
								if (indicator && indicatorTarget.checks && Array.isArray(indicatorTarget.checks)) {
									let indicatorIsDate = moment(indicator.targetValue).isValid();
									indicatorTarget.checks.forEach(check => {
										if (indicatorIsDate) {
											let targetMoment = moment(indicator.targetValue);
											let today = moment(mockDate).startOf("day");
											if (check.equalTo) {
												switch (check.comparison) {
													case "absolute":
														if (!today.isSame(targetMoment.add(check.equalTo, 'days'))) {
															projectValid = false;
														}
														break;
													default:
														projectValid = false;														
												}
											} else if (check.smallerThan) {
												switch (check.comparison) {
													case "absolute":
														if (!today.isBefore(targetMoment.add(check.smallerThan, 'days'))) {
															projectValid = false;
														}
														break;
													default:
														projectValid = false;
												}
											} else if (check.smallerThanOrEqualTo) {
												switch (check.comparison) {
													case "absolute":
														if (!today.isSameOrBefore(targetMoment.add(check.smallerThanOrEqualTo, 'days'))) {
															projectValid = false;
														}
														break;
													default:
														projectValid = false;
												}												
											} else if (check.greaterThan) {
												switch (check.comparison) {
													case "absolute":
														if (!today.isAfter(targetMoment.add(check.greaterThan, 'days'))) {
															projectValid = false;
														}
														break;
													default:
														projectValid = false;
												}
											} else if (check.greaterThanOrEqualTo) {
												switch (check.comparison) {
													case "absolute":
														if (!today.isSameOrAfter(targetMoment.add(check.greaterThanOrEqualTo, 'days'))) {
															projectValid = false;
														}
														break;
													default:
														projectValid = false;
												}
											}
										} else { // Indicator is not for time
											// Not yet implemented
											projectValid = false;
										}
									});
								}
							});
						}
						
						if (!projectValid) {
							pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project does not meet the indicator target conditions.");
						}						
					} else {
						pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project does not have a class which asks for status reports.");
					}
				} else {
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project does not meet the property value conditions.");
				}
			} else {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project is not in a relevant lifecycle state.");
			}
		} else {
			pqfLib.utils.misc.log(1, "warn", "AF6E2EC7C4F747FA91BF5076D575D229", "No lifecycle state found for project");
		}
		return projectValid;
	}
	
	function _getRelatedResources(project) {
		// Get project relations of employee-type resources
		let relationTypes = Pqf.pf.getForwardRelationTypesForType("Project");
		relationTypes = relationTypes.filter(x => x.explicit && x.targetTypes.includes("HRM-RES-TYP-EMP"));
		// Get project resources that have one of those relation types
		let relatedResources = [];
		relationTypes.forEach(function(relationType) {
			let resources = pqfLib.resources.getResourcesFromRelationTypeId(relationType.id, "Project", project.id, ["HRM-RES-TYP-EMP"]);
			// Attach relation name to resource
			resources.forEach(function(res) {
				res.relationType = relationType.id;
				res.relationName = relationType.nameForward;
			});
			relatedResources = relatedResources.concat(resources);
		});
		return relatedResources;
	}

    function _sendTimedProjectNotifications(type, rule, timing) {

        let periodType;
        let timeLags;
		if (rule.schedule.quarterly) {
			periodType = "quarter";
			timeLags = rule.schedule.quarterly;
		} else if (rule.schedule.monthly) {
			periodType = "month";
			timeLags = rule.schedule.monthly;			
		} else if (rule.schedule.weekly) {
			periodType = "week";
			timeLags = rule.schedule.weekly;
		} else {
			periodType = "month";
			timeLags = null;
		}
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "timeLags = " + JSON.stringify(timeLags));

        if (timeLags) {
			let mockDate = timing && timing !== "now" ? timing : moment().format('YYYY-MM-DD');
			
            let endOfCurrentPeriod = moment(mockDate).endOf(periodType);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "endOfCurrentPeriod = " + endOfCurrentPeriod.format("YYYY-MM-DD"));
			
            let endOfPreviousPeriod = moment(mockDate).subtract(1, periodType).endOf(periodType);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "endOfPreviousPeriod = " + endOfPreviousPeriod.format("YYYY-MM-DD"));

            let relevantTimeLags = _getRelevantTimeLags(timeLags, periodType, endOfCurrentPeriod, endOfPreviousPeriod, mockDate);
			// returns an array of time lags or null, depending if the current day has reached a time lag

            let forceSendingNow = (timing && timing === "now" ? true : false);
            if (forceSendingNow) {
                relevantTimeLags.push(1); // > 0 means "Send a late reminder"
            }

            if (relevantTimeLags.length > 0) {
                relevantTimeLags.forEach(function (timeLag) {

                    let period = {
                        "name": null,
                        "startDate": null,
                        "endDate": null,
                        "status": null,
                        "deadline": null
                    };
					if (!rule.deadline) {
						rule.deadline = 0;
					}

                    let contactEmail = (rule.contact && rule.contact.email ? (typeof rule.contact.email === "string" ? rule.contact.email : rule.contact.email[0]) : null);
                    let contact = {
                        "email": contactEmail,
                        "name": (rule.contact && rule.contact.name ? rule.contact.name : null)
                    };

                    let projects = Pqf.pm.getProjects();
                    if (timeLag <= 0) { // early reminder for current period
                        switch (periodType) {
                        case "quarter":
                            period.name = "Quartal " + endOfCurrentPeriod.format("Q YYYY");
                            break;
                        case "month":
                            period.name = endOfCurrentPeriod.format("MMMM YYYY");
                            break;
                        case "week":
                            period.name = "Woche " + endOfCurrentPeriod.format("W YYYY");
                            break;
                        default:
                        }
                        period.status = "current";
                        period.startDate = moment(mockDate).startOf(periodType);
                        period.endDate = moment(mockDate).endOf(periodType);
                        period.deadline = moment(mockDate).endOf(periodType).add(1, "day");
                        let withMargin = moment(mockDate).endOf('day').add(rule.deadline, "days");
                        if (withMargin.isAfter(period.deadline)) {
                            period.deadline = withMargin;
                        }
                    } else { // late reminder for past period
                        switch (periodType) {
                        case "quarter":
                            period.name = "Quartal " + endOfPreviousPeriod.format("Q YYYY");
                            break;
                        case "month":
                            period.name = endOfPreviousPeriod.format("MMMM YYYY");
                            break;
                        case "week":
                            period.name = "Woche " + endOfPreviousPeriod.format("W YYYY");
                            break;
                        default:
                        }
                        period.status = "past";
                        period.startDate = moment(mockDate).subtract(1, periodType).startOf(periodType);
                        period.endDate = moment(mockDate).subtract(1, periodType).endOf(periodType);
                        period.deadline = moment(mockDate).endOf('day').add(rule.deadline, "days");
                    }
					
					_setStatistics("numProjectsTotal", projects.length);
					
					// ---------------------------------------------------
					// Iterate over all projects and apply the filter of the rule
					// ---------------------------------------------------
                    projects.forEach(function (project) {

                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Checking project " + project.name);

						let projectValid = checkProjectValid(project, rule, mockDate);
						if (projectValid) {

							// ---------------------------------------------------
							// Project found that passes the filter of the rule
							// ---------------------------------------------------

							pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project " + project.id + " relevant");

							// Attach project URL to project
							project.url = Pqf.main.getObjectUrl("Project", project.id);

							// Attach related resources to project
							let relatedResources = _getRelatedResources(project);
							project.relatedResources = relatedResources;

							switch (type) {
							case "Project":
								_sendProjectNotifications(project, period, rule, contact);
								break;
							case "ProjectReport":
								_sendProjectReportNotifications(project, period, rule, contact);
								break;
							case "ProjectEfforts":
								_sendEffortRecordingNotifications(project, period, rule, contact);
								break;
							case "ProjectPortfolioReport":
								// TODO: Not yet implemented
								break;
							default:
							}
						}
                    });

                    // Summary mail
					
					// For backwards compatibility
					let statisticsCompatible = {};
					_statistics.forEach(item => {
						statisticsCompatible[item.id] = item.value;
					});
					
                    rule.contacts?.forEach(function (contact) {
                        let message = contact?.useEmailTemplate(contact, period, statisticsCompatible);
                        if (message && message.subject && message.body && contact.email) {
                            _sendNotification(contact.email, message.subject, message.body, true);
                        } else {
                            let errorInfos = [
                                "No contact defined (or no email) or malformed message (must have subject and body)",
                                JSON.stringify(message)
                            ];
                            pqfLib.utils.misc.log(1, "error", "89318DA4CC4046669B5DACC23F35A7EF", errorInfos);
                        }
                    });

					let infoLines = [];
					if (rule.name) {
						infoLines.push("Rule: " + rule.name);
					}
					_printStatistics(infoLines);
					
                });

            } else {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Not the right time to send timed notifications.");
            }
        } else {
            pqfLib.utils.misc.log(1, "error", "63D5DE192ACB4486A625F034937BF18F", "Schedule of rule not properly defined");
        }
    }

    function _sendEffortRecordingNotifications(project, period, rule, contact) {
        let beginWindow = moment().subtract(1, "month").format("YYYY-MM-DD");
        if (rule.notifyAllocations?.task?.beginWindow) {
            beginWindow = moment().add(rule.notifyAllocations.task.beginWindow, "days").format("YYYY-MM-DD");
        }
        let endWindow = moment().add(1, "month").format("YYYY-MM-DD");
        if (rule.notifyAllocations?.task?.endWindow) {
            endWindow = moment().add(rule.notifyAllocations.task.endWindow, "days").format("YYYY-MM-DD");
        }

        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Relevant time window = " + beginWindow + " to " + endWindow);
        let allocs = Pqf.alc.getProjectPhaseAllocations(project.id, beginWindow, moment(endWindow).clone().add(1, "day").format("YYYY-MM-DD"));
        let resources = [];
        allocs.forEach(function (alloc) {
            let resource = alloc.resource;
            if (resource.type == "HRM-RES-TYP-EMP" && resource.isDeleted == false) {
                let relevantWorkItems = [];
				let effortPlannedMax = 0;
				let effortPlannedCurrent = 0;
				let relevantPhases = Pqf.act.getProjectWithPhasesEfforts(resource.id, project.id);
                alloc.workItems.filter(x => x.workItem).forEach(function (workItemStub) {
					let workItem = Pqf.pm.getWorkItem(workItemStub.workItem.id);
					let relevantPhase = relevantPhases?.phaseEfforts?.find(x => x.id == workItem.id);
					effortPlannedCurrent = moment.duration(relevantPhase?.planned || 0).asHours();
                    if (moment(workItem.beg).isSameOrBefore(moment(endWindow), "day")
						&& moment(workItem.end).subtract(1, "day").isSameOrAfter(moment(beginWindow), "day")
						&& (effortPlannedCurrent >= (rule.notifyAllocations?.allocation?.minEffort || 10))) {
							
						workItem.efforts = relevantPhase;
                        relevantWorkItems.push(workItem);
						effortPlannedMax = (effortPlannedCurrent > effortPlannedMax) ? effortPlannedCurrent : effortPlannedMax;
						
                    }
                });
                if (relevantWorkItems.length > 0) {
					// We augment the resource object by its relevant work items
					resource.relevantWorkItems = relevantWorkItems;
					// We call this only to get the date for actualsReportedUntil
					let allocSlot = Pqf.alc.getMacroAllocationSlot(resource.id, beginWindow, endWindow, project.id)
					let latestReportingDate = allocSlot?.actualsReportedUntil;
					resource.latestReportingDate = latestReportingDate;
					// Add the resource to the list
                    resources.push(resource);
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Relevant resource: " + resource.name);
                }
            }
        });
        if (resources.length > 0) {
			resources.forEach(function(resource) {
				let users = pqfLib.resources.getUsersFromResourceIds([resource.id], false, false);
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Users from resource " + resource.id + ": " + JSON.stringify(users));
				users.forEach(function (user) {
					user.relationName = "Allocation"; // Pseudo relation name
					user.latestReportingDate = resource.latestReportingDate;
					project.children = resource.relevantWorkItems;
				});
				_notifyUsers(users, project, period, contact, rule);
			});
        } else {
			let statsElement = {
                "id": project.id,
                "code": project.code,
                "name": project.name
            };
			_pushStatisticsItem("projectsWithoutRelevantResources", statsElement, "Projects without relevant resources");
        }
    }

	function _getRelevantUsers(project, rule) {
		let allUsers = [];
		let users = null;
		// Get all users with given relation
		if (rule.notifyRelationTypes && Array.isArray(rule.notifyRelationTypes)) {

			rule.notifyRelationTypes.forEach(function (relationTypeId) {
				let resources = [];
				let relation = Pqf.pf.getRelationType(relationTypeId);
				let targetTypes = relation.targetTypes;
				targetTypes.forEach((targetTypeId) => {
					resources = resources.concat(Pqf.pf.getForwardRelations("Project", project.id, targetTypeId, null, relationTypeId, false).map(x => Pqf.res.getResource(x.target.id)));
				});
				if (resources.length > 0) {
					let relationName = Pqf.pf.getRelationType(relationTypeId).nameForward;
					users = pqfLib.resources.getUsersFromResourceIds(resources.map(x => x.id), false, true); // Keeps resouces without user account
					users.forEach(function (user) {
						user.relationName = relationName;
					});
					allUsers = allUsers.concat(users);
				}
			});
			if (allUsers.length == 0) {
				let statsElement = {
					"id": project.id,
					"code": project.code,
					"name": project.name,
					"url": project.url
				};
				_pushStatisticsItem("projectsWithoutRelations", statsElement, "Projects without relations");
			}
		}

		// Get all users with given role
		if (rule.notifyUserRoles && Array.isArray(rule.notifyUserRoles)) {
			rule.notifyUserRoles.forEach(function (userRoleId) {
				let roleName = _roles.find(x => x.id == userRoleId).name;
				users = pqfLib.resources.getUsersFromRoleId(userRoleId, true);
				users.forEach(function (user) {
					user.roleName = roleName;
				});
				allUsers = allUsers.concat(users);
			});
		}
		return allUsers;
	}
	
	function _checkStopAndContinueConditions(project, rule, refReports, period) {
		let existingReports = null;
		let existingReport = {};
		
		// Check continueConditions
        let stopChecking = true;
        if (rule.continueConditions && Array.isArray(rule.continueConditions)) {
            rule.continueConditions.forEach(function (continueCondition) {
                if (continueCondition.endDate && continueCondition.endDate == "endOfPeriod") {
                    existingReports = Pqf.pm.getProjectReportsByType(project.id, rule.objectType);
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   " + existingReports.length + " reports found");
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   period end date = " + period.endDate.format("DD.MM.YYYY"));
                    let relevantReportsFound = existingReports.filter(x => moment(x.validityEnd).subtract(1, "days").isSame(period.endDate, "day"));
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, (relevantReportsFound.length > 0 ? "   At least 1 relevant report included" : "   No relevant report included"));
                    if (relevantReportsFound.length > 0) {
                        if (continueCondition.lifecycleStates && Array.isArray(continueCondition.lifecycleStates)) {
							relevantReportsFound.forEach(relevantReportFound => {
								let reportState = Pqf.lcy.getObjectState(rule.objectType, relevantReportFound.id);
								if (reportState && continueCondition.lifecycleStates.includes(reportState.id)) {
									stopChecking = false;
									pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   At least 1 relevant report found, all continue conditions met.");
									existingReport = relevantReportFound;
									existingReport.stateId = (reportState ? reportState.id : null);
									existingReport.url = (existingReport.stateId ? Pqf.main.getObjectUrl(rule.objectType, existingReport.id) : null);
									existingReport.isNew = false;
								}
							});
						}
					}
                }				
			});
		} else {
			stopChecking = false;
		}
		
		// Check stopConditions
        if (!stopChecking && rule.stopConditions && Array.isArray(rule.stopConditions)) {
            rule.stopConditions.forEach(function (stopCondition) {
                if (stopCondition.endDate && stopCondition.endDate == "endOfPeriod") {
					if (!existingReports) {
						existingReports = Pqf.pm.getProjectReportsByType(project.id, rule.objectType);
						pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   " + existingReports.length + " reports found");
						pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   period end date = " + period.endDate.format("DD.MM.YYYY"));
					}
                    let relevantReportFound = existingReports.find(x => moment(x.validityEnd).subtract(1, "days").isSame(period.endDate, "day"));
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, (relevantReportFound ? "   1 relevant report included" : "   No relevant report included"));
                    if (relevantReportFound) {
                        if (stopCondition.lifecycleStates && Array.isArray(stopCondition.lifecycleStates)) {
                            let reportState = Pqf.lcy.getObjectState(rule.objectType, relevantReportFound.id);
                            if (reportState && stopCondition.lifecycleStates.includes(reportState.id)) {
                                stopChecking = true;
                                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Stop conditions met.");
                            } else {
                                existingReport = relevantReportFound;
                                existingReport.stateId = (reportState ? reportState.id : null);
                                existingReport.url = (existingReport.stateId ? Pqf.main.getObjectUrl(rule.objectType, existingReport.id) : null);
								existingReport.isNew = false;
                                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Relevant report already exists.");
                            }
                        }
                    } else if (rule.createNew) {
                        if (_mockingMode) {
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   MOCK: No existing report. Created new report.");
							// Mock report
							existingReport = {
								type: rule.objectType,
								id: '999999999999999999999999999999999999',
								name: 'Mock Report',
								description: null,
								validityStart: '2099-01-01',
								validityEnd: '2099-02-01',
								stateId: '999999999999999999999999999999999999',
								url: 'https://mockreport.org',
								isNew: true
							};
                        } else {
                            let newReport = Pqf.pm.addProjectReport(project.id, rule.objectType, null, null);
                            newReport = Pqf.pm.getProjectReport(newReport.type, newReport.id);
                            newReport.name = rule.createNew.name ? rule.createNew.name : "Neuer Rapport";
                            newReport.description = rule.createNew.description ? rule.createNew.description : "Automatisch angelegt";
                            newReport.validityStart = period.startDate.format("YYYY-MM-DD");
                            newReport.validityEnd = moment(period.endDate).add(1, "day").format("YYYY-MM-DD");
                            Pqf.pm.putProjectReport(newReport.type, newReport.id, null, newReport);
                            existingReport = newReport;
							existingReport.isNew = true;
                            let reportState = Pqf.lcy.getObjectState(rule.objectType, existingReport.id);
                            existingReport.stateId = (reportState ? reportState.id : null);
                            existingReport.url = (existingReport.stateId ? Pqf.main.getObjectUrl(rule.objectType, existingReport.id) : null);
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   No existing report. Created new report.");
                        }				
                    } else {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   No existing report. NOT creating a new one.");
                    }
                }
            });
        }
		existingReport.parent = project;
		refReports.existingReport = existingReport;
		return stopChecking;
	}

    function _sendProjectNotifications(project, period, rule, contact) {
		
		_incStatisticsCounter("numProjectsRelevant");
		
		let users = _getRelevantUsers(project, rule);
		_notifyUsers(users, project, period, contact, rule);
    }

    function _sendProjectReportNotifications(project, period, rule, contact) {
        let refReports = {};
		
		// Indirectly returns the relevant report as refReports.existingReport
		let stopChecking = _checkStopAndContinueConditions(project, rule, refReports, period);
        if (!stopChecking) {

			_incStatisticsCounter("numProjectsRelevant");

			if (rule.closeRequests) {
				if (Array.isArray(rule.closeRequests)) {
					pqfLib.utils.misc.log(1, "log", null, refReports);
					if (refReports.existingReport.id) {
						_closeProjectReport(refReports.existingReport, rule);
					} else {
						pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Cannot close a non-existing report");
					}
				} else {
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Close requests for report not valid (must be array)");
				}
			}
			let users = _getRelevantUsers(project, rule);
			_notifyUsers(users, refReports.existingReport, period, contact, rule);

        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Project report meets stop criteria");
        }
    }
	
	function _closeProjectReport(report, rule) {
		rule.closeRequests.forEach(request => {
			try {
				let currentState = Pqf.lcy.getObjectState(report.type, report.id);
				if (request.lifecycleStateId) {
					if (request.lifecycleStateId === currentState.id) {
						if (request.transitionId) {
							if (_mockingMode) {
								pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   MOCK closing project report");
								_incStatisticsCounter("numMockProjectReportsClosed", "Number of mock reports automatically closed");
							} else {
								let newState = Pqf.lcy.upgradeObject(rule.objectType, report.id, request.transitionId, request.remark);
								pqfLib.utils.misc.log(1, "log", null, "   Report " + report.id + " closed (transition from state " + currentState.name + " to state " + newState.name + ")");
								_incStatisticsCounter("numProjectReportsClosed", "Number of reports automatically closed");
							}
						} else {
							pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Close request must contain a transition ID");					
						}
					}
				} else {
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Close request must contain a lifecycle state ID");					
				}
			} catch(err) {
				pqfLib.utils.misc.log(1, "error", "BF01E728B1C44FAEB55B02CA7B90CB7F", err);
			}
		});
	}

    function _notifyUsers(users, object, period, contact, rule) {
		// Object may have .parent and .children attributes
		
        if (rule.notifyOptions && !rule.notifyOptions.forceNotify) {
            users = users?.filter(user => user.userNotify) || [];
        }
        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Relevant users: " + JSON.stringify(users));		
        if (users.length > 0) {
            let objectInfos = {
                "type": rule.objectType,
                "id": object?.id || null,
                "isNew": object?.isNew || false,
                "name": object?.name || null,
                "description": object?.description || null,
                "properties": object?.properties || null,
                "subobjects": object?.subobjects || null,
                "state": object?.stateId || null,
                "url": object?.url || null,
            };
            if (object?.parent) {
                objectInfos.parent = object.parent;
				objectInfos.parent.url += "&feature=details";
            }
            if (object?.children) {
                objectInfos.children = object.children;
				objectInfos.children.forEach(function(child) {
					child.url += "&feature=details";
				});
            }
            if (object?.relatedResources) {
                objectInfos.relatedResources = object.relatedResources;
            }
            users.forEach(function (user) {
                let userLanguage = (rule.notifyOptions && rule.notifyOptions.defaultLanguage ? rule.notifyOptions.defaultLanguage : "en");
                if (user.userEmail) {
                    userLanguage = pqfLib.utils.language.getUserLanguage(null, user.userEmail);
                }
				user.url = Pqf.main.getObjectUrl("HRM-RES-TYP-EMP", user.resourceId) + "&feature=timerecording";
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Preparing notification in language " + userLanguage);
                let message = rule.useEmailTemplate(user, objectInfos, period, userLanguage, contact);
                if (message.subject && message.body) {
                    if (user.userEmail) {
                        _sendNotification(user.userEmail, message.subject, message.body);
                    } else if (user.resourceEmail) {
                        _sendNotification(user.resourceEmail, message.subject, message.body);
                    } else {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   " + (user.resourceName ? user.resourceName : "[no resource]") + "|" + (user.userName ? user.userName : "[no username]") + " does not have any assigned email address. Cannot send reminder notification.");
                    }
                } else {
                    let errorInfos = [
                        "Malformed message (must have subject and body)",
                        JSON.stringify(message)
                    ];
                    pqfLib.utils.misc.log(1, "error", "30B2FC9969CF4B9CAC001A1D6916E6FD", errorInfos);
                }
            });

			_incStatisticsCounter("numProjectsNotified");

            users.forEach(function (user) {
				let statsElement = {
                    "userName": (user.userName ? user.userName : null),
                    "resourceName": (user.resourceName ? user.resourceName : null),
                    "email": (user.userEmail ? user.userEmail : user.resourceEmail),
                    "objectName": object?.name || null,
                    "objectLink": object?.url + "&feature=details",
                    "parentName": object?.parent?.name || null,
                    "parentCode": object?.parent?.code || null,
                    "parentLink": object?.parent?.url + "&feature=details",
                    "hasUser": user.userId !== null
                };
				_pushStatisticsItem("recipients", statsElement);
            });
        }
    }

    function _sendTodoWorkingNotifications(rule) {
        // Get all todos in the relevant states
        let todos = null;
        if (rule.notificationDefinition.relevantStates) {
            todos = Pqf.pi.getProjectItems("Todo", rule.notificationDefinition.relevantStates);
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Relevant todo states undefined");
        }
        if (todos && todos.length > 0) {
            let todoCounter = 0;
            todos.forEach(function (todo) {
                todoCounter++;
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing todo #" + todoCounter + " (" + todo.code + ")...");

                // Time to send a reminder? Check deadline of todo. If deadline is missing, send a reminder. Otherwise send reminder if difference to deadline is met.
                let currentDifferenceToDeadline = moment().startOf("day").diff(moment(todo.validityEnd).subtract(1, "days").startOf("day"), "days");
                let maxDifference = Math.max.apply(Math, rule.notificationDefinition.differenceToDeadline);
                if (!todo.validityEnd || rule.notificationDefinition.differenceToDeadline.includes(currentDifferenceToDeadline) || (currentDifferenceToDeadline > maxDifference)) {
                    pqfLib.utils.misc.log(_debuggingMode && !todo.validityEnd ? 1 : 0, "log", null, "Todo has no deadline");
                    pqfLib.utils.misc.log(_debuggingMode && rule.notificationDefinition.differenceToDeadline.includes(currentDifferenceToDeadline) ? 1 : 0, "log", null, "Todo deadline meets difference to today (" + currentDifferenceToDeadline + " days)");
                    pqfLib.utils.misc.log(_debuggingMode && (currentDifferenceToDeadline > maxDifference) ? 1 : 0, "log", null, "Todo long overdue deadline (" + currentDifferenceToDeadline + " days)");
                    // Get all IDs of all owners of this todo
                    let ownerIds = [];
                    if (rule.notificationDefinition.relevantResourceTypes && rule.notificationDefinition.relevantOwnerRelationTypes) {
                        rule.notificationDefinition.relevantResourceTypes.forEach(function (resType) {
                            rule.notificationDefinition.relevantOwnerRelationTypes.forEach(function (relType) {
                                ownerIds = ownerIds.concat(Pqf.pf.getForwardRelations("Todo", todo.id, resType, null, relType, false).map(x => x.target.id));
                            });
                        });
                    }
                    let ownerInfos = ownerIds.map(id => Pqf.res.getResource(id)).map(function (res) {
                        return {
                            "resourceName": res.name,
                            "email": res.eMail
                        };
                    });
                    // Get all IDs of all assignees of this todo
                    let assigneeIds = [];
                    if (rule.notificationDefinition.relevantResourceTypes && rule.notificationDefinition.relevantAssigneeRelationTypes) {
                        rule.notificationDefinition.relevantResourceTypes.forEach(function (resType) {
                            rule.notificationDefinition.relevantAssigneeRelationTypes.forEach(function (relType) {
                                assigneeIds = assigneeIds.concat(Pqf.pf.getForwardRelations("Todo", todo.id, resType, null, relType, false).map(x => x.target.id));
                            });
                        });
                    }
                    // Get all users related to the assignee IDs and notify them (if notify flag is set)
                    let assignees = pqfLib.resources.getUsersFromResourceIds(assigneeIds).filter(user => user.userNotify);
                    if (assignees.length > 0) {
                        let todoInfos = {
                            "name": todo.name,
                            "description": todo.description,
                            "deadline": moment(todo.validityEnd),
                            "daysOverdue": currentDifferenceToDeadline,
                            "url": Pqf.main.getObjectUrl("Todo", todo.id)
                        };
                        let receiverInfos = assignees.map(function (assignee) {
                            return {
                                "name": assignee.userName,
                                "resourceName": assignee.resourceName,
                                "email": assignee.userEmail
                            };
                        });
                        _sendTodoNotification(receiverInfos, ownerInfos, todoInfos, rule.useEmailTemplate);
                    } else {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No assignees found for this todo");
                    }
                } else {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Not time to send a reminder for this todo (" + currentDifferenceToDeadline + " days)");
                }
            });
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No todos to be processed");
        }
    }

    function _sendTodoNotification(receiverInfos, actorInfos, todoInfos, emailTemplateFunction) {
        receiverInfos.forEach(function (receiver) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification email for " + receiver.email + (receiver.name ? " (" + receiver.name + ")" : "") + "...");
            let userLanguage = pqfLib.utils.language.getUserLanguage(null, receiver.email);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification in language " + userLanguage);
            let message = emailTemplateFunction(receiver, actorInfos, todoInfos, userLanguage);
            _sendNotification(receiver.email, message.subject, message.body);
        });
    }

    function _sendTodoReviewingNotifications(rule) {
        // Get all todos in the relevant states
        let todos = null;
        if (rule.notificationDefinition.relevantStates) {
            todos = Pqf.pi.getProjectItems("Todo", rule.notificationDefinition.relevantStates);
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Relevant todo states undefined");
        }
        if (todos && todos.length > 0) {
            let todoCounter = 0;
            todos.forEach(function (todo) {
                todoCounter++;
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing todo #" + todoCounter + " (" + todo.code + ")...");

                // Time to send a reminder? Check completion date of todo.
                let todoLifecycleHistory = Pqf.lcy.getObjectHistory("Todo", todo.id);
                let completionDate = moment(todoLifecycleHistory[todoLifecycleHistory.length - 1].transition.timestamp).startOf("Day");
                let currentDifferenceToCompletion = moment().startOf("day").diff(completionDate, "days");
                let maxDifference = Math.max.apply(Math, rule.notificationDefinition.differenceToCompletion);
                if (rule.notificationDefinition.differenceToCompletion.includes(currentDifferenceToCompletion) || (currentDifferenceToCompletion > maxDifference)) {
                    pqfLib.utils.misc.log(_debuggingMode && rule.notificationDefinition.differenceToCompletion.includes(currentDifferenceToCompletion) ? 1 : 0, "log", null, "Todo completion date meets difference to today (" + currentDifferenceToCompletion + " days)");
                    pqfLib.utils.misc.log(_debuggingMode && (currentDifferenceToCompletion > maxDifference) ? 1 : 0, "log", null, "Todo long overdue (" + currentDifferenceToCompletion + " days)");
                    // Get all IDs of all owners of this todo
                    let ownerIds = [];
                    if (rule.notificationDefinition.relevantResourceTypes && rule.notificationDefinition.relevantOwnerRelationTypes) {
                        rule.notificationDefinition.relevantResourceTypes.forEach(function (resType) {
                            rule.notificationDefinition.relevantOwnerRelationTypes.forEach(function (relType) {
                                ownerIds = ownerIds.concat(Pqf.pf.getForwardRelations("Todo", todo.id, resType, null, relType, false).map(x => x.target.id));
                            });
                        });
                    }
                    let ownerInfos = ownerIds.map(id => Pqf.res.getResource(id)).map(function (res) {
                        return {
                            "resourceName": res.name,
                            "email": res.eMail
                        };
                    });
                    // Get all IDs of all assignees of this todo
                    let assigneeIds = [];
                    if (rule.notificationDefinition.relevantResourceTypes && rule.notificationDefinition.relevantAssigneeRelationTypes) {
                        rule.notificationDefinition.relevantResourceTypes.forEach(function (resType) {
                            rule.notificationDefinition.relevantAssigneeRelationTypes.forEach(function (relType) {
                                assigneeIds = assigneeIds.concat(Pqf.pf.getForwardRelations("Todo", todo.id, resType, null, relType, false).map(x => x.target.id));
                            });
                        });
                    }
                    // Get all users related to the assignee IDs and notify them (if notify flag is set)
                    let assignees = pqfLib.resources.getUsersFromResourceIds(assigneeIds).filter(user => user.userNotify);
                    if (assignees.length > 0) {
                        let todoInfos = {
                            "name": todo.name,
                            "description": todo.description,
                            "deadline": moment(todo.validityEnd),
                            "daysOverdue": currentDifferenceToDeadline,
                            "url": Pqf.main.getObjectUrl("Todo", todo.id)
                        };
                        let receiverInfos = assignees.map(function (assignee) {
                            return {
                                "name": assignee.userName,
                                "resourceName": assignee.resourceName,
                                "email": assignee.userEmail
                            };
                        });
                        _sendTodoNotification(receiverInfos, ownerInfos, todoInfos, rule.useEmailTemplate);
                    } else {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No assignees found for this todo");
                    }
                } else {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Not time to send a reminder for this todo (" + currentDifferenceToDeadline + " days)");
                }
            });
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No todos to be processed");
        }
    }

    function _sendAllocationNotifications(allocationId) {
        let allocation = Pqf.pm.getMacroAllocation(allocationId);
        let allocationHistory = Pqf.alc.getResourceAllocationWorkflowHistory(allocationId);
        if (allocationHistory && allocationHistory.length > 1) {
			let timeDiffMs = moment(allocationHistory[0].timestamp).diff(allocationHistory[1].timestamp);
            let allocationStateChange = {
                "stateNow": allocationHistory[0].state,
                "stateBefore":  allocationHistory[1].state,
                "remark": allocationHistory[allocationHistory.length - 1].remark
            };
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "state transition = " + JSON.stringify(allocationStateChange));

            let ruleCounter = 0;
            _notificationRules.forEach(function (rule) {

                ruleCounter++;				
                pqfLib.utils.misc.log(1, "log", null, "Processing rule #" + ruleCounter);
                pqfLib.utils.misc.log(1, "log", null, "-------------------");
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   rule = " + JSON.stringify(rule));

				if (timeDiffMs < SAME_TIME_DELTA_MS && !rule.forceExecution) {
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   The last two allocation transitions happened virtually simultaneously (within " + timeDiffMs + "ms). Assume automation. Not processing rule.");
					return;
				}
				
                if ((allocationStateChange.stateNow === rule.notificationDefinition.stateNow) &&
                    (rule.notificationDefinition.stateBefore.includes(allocationStateChange.stateBefore))) {

                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Rule is relevant.");
                    let receiverUsers = [];

                    // Fetch allocated resource if it matches the type given by the rule
                    if (rule.notificationDefinition.allocatedResourceTypes && rule.notificationDefinition.allocatedResourceTypes.length > 0) {
						if (rule.notificationDefinition.allocatedResourceTypes.includes(allocation.resourceType)) {
							let resources = pqfLib.resources.getUsersFromResourceIds([allocation.resourceId]);
							receiverUsers = receiverUsers.concat(resources);
						}
					}
					
                    // Fetch resources from project relation types given by the rule
                    if (rule.notificationDefinition.projectRelationTypes && rule.notificationDefinition.projectRelationTypes.length > 0) {
                        rule.notificationDefinition.projectRelationTypes.forEach(function (relationType) {
                            let resources = pqfLib.resources.getUsersFromRelationTypeId(relationType, "Project", allocation.projectId, true);
                            receiverUsers = receiverUsers.concat(resources);
                        });
                    }

                    // Fetch resources from OU relation types from the org unit that the allocated resource belongs to (parent).
					// However, if the allocated resource is itself an org unit, then take the resources related to it.
					let relevantOrgUnitId = null;
					let relevantOrgUnitType = null;
					let relevantOrgUnitInfos = null;
                    let task = Pqf.pm.getWorkItem(allocation.workItemId);
                    if (rule.notificationDefinition.orgUnitRelationTypes && rule.notificationDefinition.orgUnitRelationTypes.length > 0) {
                        switch (allocation.resourceType) {
                        case "HRM-RES-TYP-OU":
						case "EXT-RES-TYP-OU": // Allocated resource is itself an org unit
                            relevantOrgUnitId = allocation.resourceId;
							relevantOrgUnitType = allocation.resourceType;
                            break;
                        default: // Get the parent of the resource
                            try {
								// Get direct parents (ancestors) and find one of type HRM-RES-TYP-OU or EXT-RES-TYP-OU
                                relevantOrgUnitId = Pqf.res.getResourceIdentification(allocation.resourceId).ancestors
									.find(x => x.type == "HRM-RES-TYP-OU" || x.type == "EXT-RES-TYP-OU").id;
								relevantOrgUnitType = Pqf.res.getResourceIdentification(relevantOrgUnitId).type;
                            } catch (err) {
                                pqfLib.utils.misc.log(1, "error", "2603D03767AA4326AE48B5AB22FFA920", err.message);
                            }
                        }
                        if (relevantOrgUnitId) { // Relevant resource found -> Get  resources related to it
                            rule.notificationDefinition.orgUnitRelationTypes.forEach(function (relationType) {
                                let resources = pqfLib.resources.getUsersFromRelationTypeId(relationType,
									relevantOrgUnitType,
									relevantOrgUnitId,
									true,  // Exclude current user
									true   // Include implicit relation types
								); //
                                receiverUsers = receiverUsers.concat(resources);
                            });
							let orgUnitResource = Pqf.res.getResource(relevantOrgUnitId);
							relevantOrgUnitInfos = {
								"id": orgUnitResource.id,
								"type": orgUnitResource.type,
								"name": orgUnitResource.name,
								"url": Pqf.main.getObjectUrl(orgUnitResource.type, orgUnitResource.id)
									+ "&itemtype=Phase&itemid=" + task.id
									+ "&itemparenttype=HRM-RES-TYP-EMP&itemparentid=" + allocation.resourceId
									+ "&feature=dispo"
							};
                        } else {
							pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   No parent (ancestor) found for resource " + allocation.resourceId);
						}
                    }

                    let receiversInfos = receiverUsers.filter(user => user.userNotify).map(function (res) {
                        return {
                            "name": res.userName,
                            "resourceName": res.resourceName,
                            "email": res.userEmail
                        };
                    });

                    // Add static emails to receiver list?
                    if (rule.sendingOptions && rule.sendingOptions.notifyStaticEmails && rule.sendingOptions.notifyStaticEmails.length > 0) {
                        rule.sendingOptions.notifyStaticEmails.forEach(function (staticEmail) {
                            receiversInfos.push({
                                "email": staticEmail
                            });
                        });
                    }

                    let resource = Pqf.res.getResource(allocation.resourceId);
                    let project = Pqf.pm.getProject(allocation.projectId);
                    let projectUrl = Pqf.main.getObjectUrl("Project", project.id);
                    let allocationInfos = {
						"id": allocation.id,
                        "resource": {
                            "id": resource.id,
							"type": resource.type,
                            "name": resource.name,
							"url": Pqf.main.getObjectUrl(resource.type, resource.id) + '&feature=absences'
                        },
                        "project": {
                            "id": project.id,
                            "name": project.name,
                            "url": projectUrl,
                            "task": {
                                "id": task.id,
                                "name": task.name,
                                "startDate": moment(task.beg).format("YYYY-MM-DD"),
                                "endDate": moment(task.end).subtract(1, "days").format("YYYY-MM-DD"),
                                "url": projectUrl + "&itemtype=Phase&itemid=" + task.id + "&feature=gantt",
                            }
                        },
                        "demandedEffort": {
                            "amountInHours": moment.duration(allocation.effectiveDuration).asHours(),
                            "amount": moment.duration(allocation.effectiveDuration).asHours(),
                            "unit": "h"
                        },
                        "remark": allocation.remark
                    };
					if (relevantOrgUnitInfos) {
						allocationInfos.orgUnitResource = relevantOrgUnitInfos;
					}

                    let currentActor = pqfLib.resources.getUserWithResource(allocationHistory[0].initiatedBy.id);
                    let previousActor = pqfLib.resources.getUserWithResource(allocationHistory[1].initiatedBy.id);
                    let actorInfos = {
						"id": currentActor.userId,
                        "name": currentActor.userName,
                        "resourceName": currentActor.resourceName,
                        "email": currentActor.userEmail,
                        "doNotify": currentActor.userNotify,
                        "timestamp": moment(allocationHistory[0].timestamp).format("YYYY-MM-DD HH:mm:ss"),
                        "previousActor": {
							"id": previousActor.userId,
                            "name": previousActor.userName,
                            "resourceName": previousActor.resourceName,
                            "email": previousActor.userEmail,
                            "doNotify": previousActor.userNotify,
                            "timestamp": moment(allocationHistory[1].timestamp).format("YYYY-MM-DD HH:mm:ss")
                        }
                    };
                    receiversInfos.forEach(function (receiverInfos) {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Sending notification email to " + receiverInfos.email + (receiverInfos.name ? " (" + receiverInfos.name + ")" : "") + "...");
						let userLanguage = pqfLib.utils.language.getUserLanguage(null, receiverInfos.email);
						pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification in language " + userLanguage);
                        let message = rule.useEmailTemplate(receiverInfos, allocationInfos, actorInfos, userLanguage);
                        _sendNotification(receiverInfos.email, message.subject, message.body);
                    });
					
					_processAllocationActions(rule.actions, actorInfos, allocationInfos);
					
                } else {
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Rule does not cover this lifecycle transition");
				}
            });
        }
    }

    function _sendAssignmentNotifications(objectType, objectId, action) {
		// objectType and objectId refer to a relation
		// NOTE: We currently assume that the source type of the relation is of type 'ProjectItem' (Todo)
        let ruleCounter = 0;
        _notificationRules.forEach(function (rule) {
            ruleCounter++;
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing rule #" + ruleCounter + "...");
            let rel = null;
            try {
                rel = Pqf.pf.getExplicitRelation(objectType, objectId);
            } catch (err) {
				// Relation non-existing, i.e., it was deleted, so take it from the store
                rel = store.load(objectId);
            }
            if (rel) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Relation found: " + JSON.stringify(rel));
                if (rule.objectType == rel.source.type) {
                    if (rule.action == action) {
						// Get users with their resources that have been assigned
						// (but omitting the current user and ignoring resources without users)
                        let assignees = pqfLib.resources.getUsersFromResourceIds([rel.target.id], true);
						// Ignore users with unchecked notify flag
						assignees = assignees.filter(user => user.userNotify);
                        let todo = Pqf.pi.getProjectItem(rel.source.type, rel.source.id);
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, assignees.length + " assignees found (Note: current user is ignored)");

                        switch (action) {
                        case "CREATED":
							assignees.forEach(ass => {
								pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "New assignee " + ass.resourceName);
							});
							// Keep relation in the store for when it might be deleted
                            store.save(rel.id, rel);
                            break;
                        case "DELETED":
							assignees.forEach(ass => {
								pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Removed assignee " + ass.resourceName);
							});
							// Remove relation from the store
                            store.save(rel.id, null);
                            break;
                        }

                        assignees.forEach(function (assignee) {
							pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification email for " + assignee.userEmail);
							let userLanguage = pqfLib.utils.language.getUserLanguage(null, assignee.userEmail);
							pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification in language " + userLanguage);
							let assigneeInfos = {
								'name': assignee.userName,
								'resourceId': assignee.resourceId,
								'resourceName': assignee.resourceName,
								'email': assignee.userEmail
							};
							let ownerRels = Pqf.pf.getForwardRelations(rel.source.type, rel.source.id, null, null, rule.relationTypeOwner, false);
							let ownerInfos = [];
							ownerRels.forEach(function (ownerRel) {
								let owners = pqfLib.resources.getUsersFromResourceIds([ownerRel.target.id], false, true);
								owners.forEach(function (owner) {
									ownerInfos.push({
										'name': owner.userName,
										'resourceId': owner.resourceId,
										'resourceName': owner.resourceName,
										'email': owner.userEmail
									});
								});
							});
							let currentUser = pqfLib.resources.getCurrentUser();
							let actorInfos = {
								'name': currentUser.userName,
								'resourceId': currentUser.resourceId,
								'resourceName': currentUser.resourceName,
								'email': currentUser.userEmail
							};
							let deadline = todo.validityEnd ? moment(todo.validityEnd).endOf('day').subtract(1, 'days') : null;
							let todoRelatedObjects = _getRelatedObjects(todo);
							let todoInfos = {
								'name': todo.name,
								'description': todo.description ? todo.description : '',
								'deadline': deadline,
								'daysOverdue': deadline ? moment().endOf('day').diff(deadline, 'days') : null,
								'url': Pqf.main.getObjectUrl(rel.source.type, todo.id),
								'relatedObjects': todoRelatedObjects
							};
							let message = rule.useEmailTemplate(assigneeInfos, ownerInfos, actorInfos, todoInfos, userLanguage);
							_sendNotification(assignee.userEmail, message.subject, message.body);
                        });
                    } else {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Rule irrelevant for action " + action);
                    }
                } else {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Rule irrelevant for source object type " + rel.source.type);
                }
            } else {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Relation not found");
            }
        });
    }
	
	function _getRelatedObjects(todo) {
		// Attach objects related to the given Todo object
		// NOTE: Currently we support objects of type
		//       - ProjectPortfolio
		//       - Project
		//       - ProjectReport
		//       - ProjectRisk
		let todoRelations = Pqf.pf.getForwardRelations("Todo", todo.id, null, null, null, true); // Include implicit relations
		let todoRelObjects = [];
		todoRelations.forEach(rel => {
			let relObj = null;
			switch(rel.target.type) {
				case "ProjectPortfolio":
					if (["C4B354EBC08641C797CA84F2300876F3"].includes(rel.relationType)) { // direct relation to portfolio
						relObj = Pqf.pm.getProjectPortfolio(rel.target.id);
						relObj.url = Pqf.main.getObjectUrl(relObj.type, relObj.id);
						relObj.typeName = "Projektportfolio";
					}
					break;
				case "Project":
					if (["0047029E50F8426095B485E2D6069DF5"].includes(rel.relationType)) { // direct relation to project
						relObj = Pqf.pm.getProject(rel.target.id);
						relObj.url = Pqf.main.getObjectUrl(relObj.type, relObj.id);
						relObj.typeName = "Projekt";
					}
					break;
				case "ProjectRisk":
					if (["1C0FE67945434660A493ED3FD4DCC212"].includes(rel.relationType)) { // direct relation to risk
						relObj = Pqf.rsk.getProjectRiskById(rel.target.id);
						// There is no specific view for ProjectRisk objects.
						// We therefore link to the Risks view of the corresponding project
						// and preselect the given risk.
						let project = Pqf.pm.getProject(relObj.projectId);
						relObj.url = Pqf.main.getObjectUrl(project.type, project.id);
						relObj.url += "&feature=projectrisks&itemtype=" + relObj.type + "&itemid=" + relObj.id;
						relObj.typeName = "Projektrisiko";
					}
					break;
				case "ProjectReport":
					if (["932DF63F3DDE434FAD93D235E42536DB"].includes(rel.relationType)) { // direct relation to risk
						relObj = Pqf.pm.getProjectReport("ProjectReport", rel.target.id);									
						relObj.url = Pqf.main.getObjectUrl(relObj.type, relObj.id);
						relObj.typeName = "Projekrapport";
					}
					break;
			}
			if (relObj) {
				let relatedObject = {
					'id': relObj.id,
					'type': relObj.type,
					'typeName': relObj.typeName,
					'name': relObj.name,
					'description': relObj.description,
					'url': relObj.url,
					'relationName': rel.name
				}
				todoRelObjects.push(relatedObject);
			}
		});
		return todoRelObjects;
	}

    function _sendResourceRequestNotification(rule) {
        let orgUnits = Pqf.res.getResourcesByType("HRM-RES-TYP-OU");
        orgUnits.forEach(function (orgUnit) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing org unit " + orgUnit.name);
            // Get the receiver infos for this org unit
            let orgUnitUrl = Pqf.main.getObjectUrl("HRM-RES-TYP-OU", orgUnit.id);
            let receiverInfos = _getReceiverInfos("HRM-RES-TYP-OU", orgUnit.id, rule, "dispo");
            // If any receiver is found, construct the requests
            if (!receiverInfos || receiverInfos.length == 0) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No receivers found for this org unit");
            } else {
                let requests = [];
                // Get allocations of members of this unit
                let members = Pqf.res.getResourceChildren(orgUnit.id);
                // Filter members for the desired resource types
                if (rule.notificationDefinition && rule.notificationDefinition.resourceTypes) {
                    members = members.filter(x => rule.notificationDefinition.resourceTypes.includes(x.type));
                }
                // Also add org unit to the members list (might have generic allocations)
                members.push({
                    "id": orgUnit.id,
                    "name": orgUnit.name
                });

                members.forEach(function (member) {
                    // -------------------------
                    // For each resource
                    // -------------------------
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Member name " + member.name);
                    let dispo = Pqf.dpo.getDispoByResource(member.id, moment().subtract(rule.timeframe.weeksBeforeToday, "weeks").format("YYYY-MM-DD"), moment().add(rule.timeframe.weeksAfterToday, "weeks").format("YYYY-MM-DD"));
                    if (dispo.projects) {
                        dispo.projects.forEach(function (project) {
                            // -------------------------
                            // For each project
                            // -------------------------
                            let requesterResources = [];
                            rule.notificationDefinition.actorRelationTypes.forEach(function (relationType) {
                                let resources = pqfLib.resources.getUsersFromRelationTypeId(relationType, "Project", project.id);
                                requesterResources = requesterResources.concat(resources);
                            });
                            let requesterInfos = requesterResources.map(function (res) {
                                return {
                                    "name": res.userName,
                                    "resourceName": res.resourceName,
                                    "email": res.userEmail
                                };
                            });
                            if (project.phases) {
                                // -------------------------
                                // For each allocation
                                // -------------------------
                                project.phases.filter(_isAllocationRelevant(rule.timeframe, rule.notificationDefinition.type)).forEach(function (task) {
                                    let resourceAllocation = null;
                                    try {
										let scenario = Pqf.pm.getProjectActiveScenario(project.id);
                                        resourceAllocation = Pqf.alc.getMacroAllocationSlot(member.id, moment(task.beg).format("YYYY-MM-DD"), moment(task.end).format("YYYY-MM-DD"), null, scenario?.id, null, null);
                                    } catch (err) {
                                        // TODO: Handle this case more gracefully. Error typically gets thrown because task falls outside planning range of server.
                                        pqfLib.utils.misc.log(1, "error", "3022A4BEE17C443B896EBF5536BCF335", "Pqf.alc.getMacroAllocationSlot failed: " + err.message);
                                    }
                                    if (resourceAllocation) {
                                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Allocation of " + task.assigned + " on task " + task.name + " requested");
                                        let info = {
                                            "orgUnit": orgUnit,
                                            "member": member,
                                            "macAlloc_wSlots": resourceAllocation,
                                            "project": project,
                                            "task": task,
                                            "requesterInfos": requesterInfos
                                        }
                                        let request = _createRequest(info);
										if (request) {
											requests.push(request);
											if (rule.sendingOptions && rule.sendingOptions.lots && rule.sendingOptions.lots == "separate") {
												_sendRequestNotification(receiverInfos, requests, rule.useEmailTemplate);
												requests = [];
											}
										}
                                    }
                                });
                            }
                        });
                    }
                    if (requests && requests.length > 0) {
                        if (rule.sendingOptions && rule.sendingOptions.lots && rule.sendingOptions.lots == "perResource") {
                            _sendRequestNotification(receiverInfos, requests, rule.useEmailTemplate);
                            requests = [];
                        }
                    }
                });
                if (requests && requests.length > 0) {
                    if (!rule.sendingOptions || (rule.sendingOptions && !rule.sendingOptions.lots) || (rule.sendingOptions && rule.sendingOptions.lots && rule.sendingOptions.lots == "bulk")) {
                        _sendRequestNotification(receiverInfos, requests, rule.useEmailTemplate);
                        requests = [];
                    }
                }
            }
        });
    }

    /**
     * Sends notifications for resource allocations that are pending (i.e.,
     * intended for allocations in states like new, changed, denied). The
     * considered states are defined in _allocationStatesPending, which can be
     * adapted via the function _setAllocationStatesPending.
     *
     * @param {object} rule - The rule object. For an extensive description of
     *   the rule object, see the given template sandbox.
     * @example
     * let rule = { // Example rule 2: For pending resource requests
     *   "schedule": { // Required. Quarterly, monthly and weekly can be used in combination, each of them can be an empty array or null or even omitted completely
     *     "quarterly": [], // Optional. Array with days of quarter, e.g., [1, 50] means every first and fiftieth day of a quarter
     *     "monthly": [], // Optional. Array with days of month, e.g., [1, 5] means every first and fifth day of a month
     *     "weekly": [2, 4] // Optional. Array with days of week, where Monday = 1, e.g., [2, 4] means every Tuesday and Thursday, [1,2,3,4,5] means every working day
     *   },
     *   "timeframe": { // Required. Consider only allocations (tasks) that overlap with this timeframe
     *     "weeksBeforeToday": 2,
     *     "weeksAfterToday": 50
     *   },
     *   "notificationDefinition": { // Required
     *     "type": "resourcePending", // Required. This function shall only be called if this type is set to "resourcePending"
     *     "resourceTypes": RESOURCE_TYPES, // Optional. Restricts the notifications to the given resource types. If not set or null, all resource types are considered.
     *     "actorRelationTypes": [  ], // Required. If "notificationType" = "resourceDecision", then they must be relations to projects. If "notificationType" = "resourceRequest", then they must be relations to org units.
     *     "receiverRelationTypes": [ PROJEKT_MANAGER ] // Required. If "notificationType" = "resourceRequest", then they must be relations to projects. If "notificationType" = "resourceDecision", then they must be relations to org units.
     *	   "notifyUserRoles": [ ] // Optional. Specifies user roles which will receive all the emails. Most useful for sendingOptions.lots = "bulk".
     *	 },
     *   "sendingOptions": {
     *     "lots": "perProject", // Optional. For this function, only "bulk", "perProject" and "separate" are allowed. If not set or null (or unknown value), "perProject" is assumed.
     *     //"notifyStaticEmails": NOTIFY_EMAIL_ADRESSES // Optional. Array of strings. Each email notification will ALSO be sent to these static addresses
     *   },
     *   "useEmailTemplate": createPendingResourceRequestSummary // Must be a name of a function with the following arguments: ...
     * };
     * _sendResourcePendingNotification(rule);
     */
    function _sendResourcePendingNotification(rule) {
        // Iterate over all projects in the system
        let prjs = Pqf.pm.getProjects();
        let requests = [];
        let receiverInfos = [];
        // Add notifyUserRoles to receiverInfos
        if (rule.notificationDefinition.notifyUserRoles && rule.notificationDefinition.notifyUserRoles.length > 0) {
            rule.notificationDefinition.notifyUserRoles.forEach(role => {
                let roleUsers = pqfLib.resources.getUsersFromRoleId(role).filter(user => user.userNotify);
                roleUsers.forEach(usr => {
                    receiverInfos.push({
                        "name": usr.userName,
                        "resourceName": usr.resourceName,
                        "email": usr.userEmail
                    });
                });
            });
        }
        // Iterate over all projects in the system
        prjs.forEach(prj => {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing project " + prj.name);
            // Get receiver infos
            let projectReceiverInfos = [];
            try {
                projectReceiverInfos = _getReceiverInfos("Project", prj.id, rule, "gantt");
            } catch (err) {
                console.error(err.message);
            }
            projectReceiverInfos = projectReceiverInfos.concat(receiverInfos);
            // If any receiver is found, construct the requests
            if (!projectReceiverInfos || projectReceiverInfos.length == 0) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No receivers found for this project");
                return;
            }

            // Get all allocations of this project
            let scenario = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectActiveScenario, prj.id, true);
            if (!scenario) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No active scenario found for this project");
                return;
            }
            let macAllocsPrj = Pqf.pm.getProjectScenarioMacroAllocations(scenario.id);
            if (macAllocsPrj.length == 0) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No macro allocations found for this project");
                return;
            }
            // Filter allocations for the desired resource types and states
            if (rule.notificationDefinition && rule.notificationDefinition.resourceTypes) {
                macAllocsPrj = macAllocsPrj.filter(macAllocPrj => rule.notificationDefinition.resourceTypes.includes(macAllocPrj.resourceType));
            }
            macAllocsPrj = macAllocsPrj.filter(macAllocPrj => _isAllocationRelevant(rule.timeframe, "resourcePending")(macAllocPrj));
            if (macAllocsPrj.length == 0) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No allocations left after filtering");
                return;
            }
            // Construct requests
            macAllocsPrj.forEach(macAllocPrj => {
                let member = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResource, macAllocPrj.resourceId);
				if (member) { // Allocation might be from a deleted resource
					let info = {
						"member": member,
						"macAlloc": macAllocPrj,
						"project": prj,
						"task": macAllocPrj.workItemId ? Pqf.pm.getWorkItem(macAllocPrj.workItemId) : null
					}
					let request = _createRequest(info);
					if (request) {
						requests.push(request);
						if (rule.sendingOptions && rule.sendingOptions.lots && rule.sendingOptions.lots == "separate") {
							_sendRequestNotification(projectReceiverInfos, requests, rule.useEmailTemplate);
							requests = [];
						}
					}
				}
            });
            // Send notification
            if (requests && requests.length > 0) {
                if (!rule.sendingOptions || (rule.sendingOptions && !rule.sendingOptions.lots) || (rule.sendingOptions && rule.sendingOptions.lots && rule.sendingOptions.lots == "perResource")) {
                    _sendRequestNotification(projectReceiverInfos, requests, rule.useEmailTemplate);
                    requests = [];
                }
            }
        });
        if (!receiverInfos || receiverInfos.length == 0) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No receivers found.");
            return;
        }
        if (requests && requests.length > 0) {
            if (rule.sendingOptions && rule.sendingOptions.lots && rule.sendingOptions.lots == "bulk") {
                _sendRequestNotification(receiverInfos, requests, rule.useEmailTemplate);
                requests = [];
            } else {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, requests.length + " relevant requests found, but no bulk sending configured");
			}
        } else {
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No relevant requests found");
		}
    }

    function _sendResourceAttentionNotification(rule) {

		let settings = {
			"beg": moment().subtract(rule.timeframe.weeksBeforeToday, 'week').format("YYYY-MM-DD"),
			"end": moment().add(rule.timeframe.weeksAfterToday, 'week').add(1, 'day').format("YYYY-MM-DD"),
			"inclSubOUs": true,
			"onlyConsiderAlloc": false,
			"reasonIds": [
				"reason_overAlloc"
			]
		};
		
		function _getResEnumsToConsider(ouId, settings) {
			// Load all child resource of this OU
			let children = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResourceChildren, ouId);
			if (!children || children.length === 0) {
				return [];
			}
			let resEnums = children.map(child => pqfLib.utils.misc.toEnum(child));
			// If the user wants to consider sub OUs, load all resources of the OU and its children
			if (settings.inclSubOUs) {
				children.forEach(child => {
					resEnums = resEnums.concat(_getResEnumsToConsider(child.id, settings));
				});
			}
			// Filter duplicate resource enums
			resEnums = resEnums.filter((resEnum, index, self) =>
				index === self.findIndex((r) => r.id === resEnum.id)
			);
			
			return resEnums;
		}

		rule.notificationDefinition?.orgUnitResourceTypes?.forEach(orgUnitType => {
			let orgUnits = Pqf.res.getResourcesByType(orgUnitType);
			orgUnits.forEach(function (orgUnit) {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Processing org unit " + orgUnit.name);
				// Get the receiver infos for this org unit
				let orgUnitUrl = Pqf.main.getObjectUrl(orgUnitType, orgUnit.id);
				let receiverInfos = _getReceiverInfos(orgUnitType, orgUnit.id, rule, "absences");
				if (!receiverInfos || receiverInfos.length == 0) {
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   No receivers found for this org unit");
				} else {
					let jtfData = pqfWidgetLib.resAtt.constructJtf(orgUnit.id, settings, _getResEnumsToConsider);
					let attentionItems = jtfData.data.map(item => {
						let resource = item.data[0];
						return {
							"resource": {
								"name": resource.name,
								"url": Pqf.main.getObjectUrl(resource.type, resource.id)
							},
							"issue": {
								"name": item.data[2].name,
								"details": item.data[3].map(x => x.name)
							}
						};
					});
					let attentionSettings = {
						"timeframe": {
							"beg": settings.beg,
							"end": settings.end
						}
					};
					_sendAttentionNotification(receiverInfos, attentionSettings, attentionItems, rule.useEmailTemplate);
				}
			});
		});
	}

    /**
     * Constructs a request object based on the given information. It is
     * intended to be used in the context of resource management notifications.
     * An array of such requests is then passed to the notification mail
     * template function.
     *
     * @param {object} info - The information object
     * @param {object} [info.orgUnit] - The org unit object
     * @param {object} [info.member] - The employee (i.e., resource) object
     * @param {object} [info.macAlloc_wSlots] - The macro allocation object
     *   including the slots (returned by the function
     *   Pqf.alc.getMacroAllocationSlot)
     * @param {object} [info.project] - The project attribute given in the dispo
     *   object (element of dispo.projects) by function
     *   Pqf.dpo.getDispoByResource
     * @param {object} info.task - The task attribute given in the dispo object
     *  (element of dispo.projects[n].phases) by function
     *  Pqf.dpo.getDispoByResource
     * @param {object} [info.macAlloc] - The macro allocation object. If given,
     *   this information will overwrite the task information extracted from the
     *   dispo object.
     * @param {object} [info.requesterInfos] - The requester infos array
     * @returns {object} - The constructed request object
     * @example
     * let info = {
     *   orgUnit: orgUnit,
     *   ...
     * };
     * let request = _createRequest(info);
     * request;
     * // If all input parameters are set, the constructed request will be of the following structure:
     * {
     *   orgUnit: {
     *     id: <orgUnitId>,
     *     name: <orgUnitName>
     *   },
     *   resource: {
     *     id: <resourceId>,
     *     name: <resourceName>,
     *     availabilityInHours: <availabilityInHours>,
     *     workloadInHours: {
     *       active: <activeWorkloadInHours>,
     *       planning: <planningWorkloadInHours>
     *     }
     *   },
     *   project: {
     *     id: <projectId>,
     *     name: <projectName>,
     *     url: <projectUrl>,
     *     lifecycleCategory: <projectLifecycleCategory>,
     *     task: {
     *       id: <taskId>,
     *       name: <taskName>,
     *       startDate: <taskStartDate>,
     *       endDate: <taskEndDate>,
     *       url: <taskUrl>,
     * 		 urlDispo: <dispoUrl>
     *     },
     *     requesterInfos: <requesterInfos>
     *   },
     *   demandedEffort: {
     *     amountInHours: <demandedEffortInHours>,
     *     amount: <demandedEffortAmount>,
     *     unit: <demandedEffortUnit>,
     *     state: <demandedEffortStateId>
     *   }
     * }
     */
    function _createRequest(info) {
        let projectUrl = info.project ? Pqf.main.getObjectUrl("Project", info.project.id) : null;
        let request = {};
		
        if (info.member) {
            request.resource = {
                "id": info.member.id,
                "name": info.member.name
            };
        } else { // Member must be present in order to create a request
			return null;
		}

        let prjLcyState = info.project.status ? pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getState, info.project.status) : null;
        let projectLifecycleCategory = prjLcyState ? prjLcyState.category : null;
        if (info.project) {
            request.project = {
                "id": info.project.id,
                "name": info.project.name,
                "url": projectUrl + "&feature=details",
                "lifecycleCategory": projectLifecycleCategory
            };
        } else { // A project must be present in order to create a request
			return null;
		}
		
        if (info.orgUnit) {
            request.parent = {
                "id": info.orgUnit.id,
                "name": info.orgUnit.name
            };
        }
		
        if (info.macAlloc_wSlots) {
            if (!request.resource) {
                request.resource = {};
            }
            request.resource.availabilityInHours = moment.duration(info.macAlloc_wSlots.slots[0].availability).asHours();
			let indexActive = info.macAlloc_wSlots.grouping.findIndex(x => x == "Active");
			let indexPlanning = info.macAlloc_wSlots.grouping.findIndex(x => x == "Planning");
			let indexSelected = info.macAlloc_wSlots.grouping.findIndex(x => x == "Selected");
            request.resource.workloadInHours = {
                "active": (indexActive > -1 ? moment.duration(info.macAlloc_wSlots.slots[0].forecasts[indexActive].planned).asHours() : 0.0),
                "planning": (indexPlanning > -1 ? moment.duration(info.macAlloc_wSlots.slots[0].forecasts[indexPlanning].planned).asHours() : 0.0),
                "selected": (indexSelected > -1 ? moment.duration(info.macAlloc_wSlots.slots[0].forecasts[indexSelected].planned).asHours() : 0.0)
            };
		}
		
        if (info.task) {
            let orgUnitUrl = info.orgUnit ? Pqf.main.getObjectUrl("HRM-RES-TYP-OU", info.orgUnit.id) : null;
            if (!request.project) {
                request.project = {};
            }
            request.project.task = {
                "id": info.task.id,
                "name": info.task.name,
                "startDate": moment(info.task.beg).format("YYYY-MM-DD"),
                "endDate": moment(info.task.end).subtract(1, "days").format("YYYY-MM-DD"),
                "url": projectUrl + "&itemtype=Phase&itemid=" + info.task.id + "&feature=gantt",
                "urlDispo": (info.member && orgUnitUrl) ? orgUnitUrl + "&itemtype=Phase&itemid=" + info.task.id + "&itemparenttype=HRM-RES-TYP-EMP&itemparentid=" + info.member.id + "&feature=dispo" : null
            };
            request.demandedEffort = {
                "amountInHours": moment.duration(info.task.assigned).asHours(),
                "amount": moment.duration(info.task.assigned).asHours(),
                "unit": "h"
            };
        } else { // A task must be present in order to create a request
			return null;
		}
		
        if (info.macAlloc) { // Potentially overwrite task information with allocation information
            if (!request.demandedEffort) {
                request.demandedEffort = {};
            }
            request.demandedEffort.amount = info.macAlloc.amount;
            request.demandedEffort.unit = info.macAlloc.amountUnit;
            request.demandedEffort.state = info.macAlloc.state;
        }

        if (info.requesterInfos) {
            request.requesterInfos = info.requesterInfos;
        }
        return request;
    }

    /**
     * Function to construct the 'receiverInfos' array for a given object. It is
     * intended to be used in the context of resource management notifications.
     *
     * @param {string} objType - The type of the object
     * @param {string} objId - The ID of the object
     * @param {object} rule - The notification rule (refer to the example
     *   sandboxes for a comprehensive description)
     * @param {string} feature - The feature to be added to the object URL
     * @returns {array} - An array of receiver information objects
     * @example
     * let receiverInfos = _getReceiverInfos("HRM-RES-TYP-OU", "5E9B9D5D5A1A4C8E9F4C6A3F2E3B4D1", rule, "dispo");
     * receiverInfos;
     * // output
     * [
     *   {
     *     "name": "John Doe",
     *     "resourceName": "John Doe",
     *     "email": "john.doe@example.com",
     *     "url": "https://cloud.pqforce.com/...&feature=dispo"
     *   },
     *   ...
     * ]
     */
    function _getReceiverInfos(objType, objId, rule, feature) {
        let receiverResources = [];
        rule.notificationDefinition.receiverRelationTypes.forEach(relType => {
            let resources = pqfLib.resources.getUsersFromRelationTypeId(relType, objType, objId, true, true);
            receiverResources = receiverResources.concat(resources);
        });
        // Add static resources to receiver list?
        if (rule.sendingOptions && rule.sendingOptions.notifyStaticResources && rule.sendingOptions.notifyStaticResources.length > 0) {
            receiverResources = receiverResources.concat(rule.sendingOptions.notifyStaticResources);
        }
        let objUrl = Pqf.main.getObjectUrl(objType, objId);
        let receiverInfos = receiverResources.filter(user => user.userNotify).map(res => {
            return {
                "name": res.userName,
                "resourceName": res.resourceName,
                "email": res.userEmail,
                "url": objUrl + (feature ? "&feature=" + feature : "")
            };
        });
        // Add static emails to receiver list?
        if (rule.sendingOptions && rule.sendingOptions.notifyStaticEmails && rule.sendingOptions.notifyStaticEmails.length > 0) {
            rule.sendingOptions.notifyStaticEmails.forEach(staticEmail => {
                receiverInfos.push({
                    "email": staticEmail,
                    "url": objUrl + (feature ? "&feature=" + feature : "")
                });
            });
        }
        return receiverInfos;
    }

    function _isAllocationRelevant(timeframe, type) {
        return function (allocation) {
            switch (type) {
            case "resourceRequest":
                if (_allocationStatesRequested.includes(allocation.state)
                     && moment(allocation.beg).isBefore(moment().add(timeframe.weeksAfterToday, "weeks"))
                     && moment(allocation.end).isAfter(moment().subtract(timeframe.weeksBeforeToday, "weeks"))) {
                    return true;
                }
                break;
            case "resourcePending":
                if (_allocationStatesPending.includes(allocation.state)
                     && moment(allocation.beg).isBefore(moment().add(timeframe.weeksAfterToday, "weeks"))
                     && moment(allocation.end).isAfter(moment().subtract(timeframe.weeksBeforeToday, "weeks"))) {
                    return true;
                }
                break;
            default:
                pqfLib.utils.misc.log(1, "error", null, "Unknown type " + type + " in _isAllocationRelevant");
            }
            return false;
        };
    }

    function _sendRequestNotification(receiverInfos, requests, emailTemplateFunction) {
        receiverInfos.forEach(function (receiverInfo) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification email for " + receiverInfo.email + (receiverInfo.name ? " (" + receiverInfo.name + ")" : "") + "...");
            let userLanguage = pqfLib.utils.language.getUserLanguage(null, receiverInfo.email);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification in language " + userLanguage);
            let message = emailTemplateFunction(receiverInfo, null, requests, userLanguage);
            _sendNotification(receiverInfo.email, message.subject, message.body);
        });
    }

    function _sendResourceDecisionNotification(rule) {
        console.warn("Function _sendResourceDecisionNotification not implemented yet");
    }

    function _sendAttentionNotification(receiverInfos, attentionSettings, attentionItems, emailTemplateFunction) {
        receiverInfos.forEach(function (receiverInfo) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification email for " + receiverInfo.email + (receiverInfo.name ? " (" + receiverInfo.name + ")" : "") + "...");
            let userLanguage = pqfLib.utils.language.getUserLanguage(null, receiverInfo.email);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification in language " + userLanguage);
            let message = emailTemplateFunction(receiverInfo, attentionSettings, attentionItems, userLanguage);
            _sendNotification(receiverInfo.email, message.subject, message.body);
        });
    }

	function _outboxMaintenanceLifecycle() {
		let outbox = null;
		switch (_outboxMaintenanceMode) {
		case "empty":
			outbox = [];
			store.save(NOTIFICATION_OUTBOX_ID, outbox);
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Outbox emptied");
			break;
		case "initialize":
			// Empty outbox first
			outbox = [];
			store.save(NOTIFICATION_OUTBOX_ID, outbox);
			// Prepare rules so that no emails are sent out immediately
			_notificationRules.forEach(function (rule) {
				delete rule.whenCommented; // this section cannot have rules with outboxing anyway
				if (rule.hasOwnProperty("whenEnteringFromStateIds") && rule.whenEnteringFromStateIds) {
					rule.whenEnteringFromStateIds.forEach(function (subrule) {
						subrule.outboxOnly = true;
					});
				}
				if (rule.hasOwnProperty("whenExitedToStateIds") && rule.whenExitedToStateIds) {
					rule.whenExitedToStateIds.forEach(function (subrule) {
						subrule.outboxOnly = true;
					});
				}
			});

			// Get all objects of relevant types and run rules on them
			let projectReportTypes = Pqf.pm.getProjectReportTypes().map(x => x.id);
			let projectPortfolioReportTypes = Pqf.pm.getProjectPortfolioReportTypes().map(x => x.id);
			_notificationObjectTypes.forEach(function (objectType) {
				let objects = [];
				switch (objectType) {
				case "Project":
					objects = Pqf.pm.getProjects();
					break;
				case "Meeting":
					object = Pqf.mtg.getMeetings();
					break;
				default: // assume project or portfolio report type
					if (projectReportTypes.includes(objectType)) {
						let projects = Pqf.pm.getProjects();
						projects.forEach(function (project) {
							objects = objects.concat(Pqf.pm.getProjectReportsByType(project.id, objectType));
						});
					}
					if (projectPortfolioReportTypes.includes(objectType)) {
						let portfolios = Pqf.pm.getProjectPortfolios();
						portfolios.forEach(function (portfolio) {
							objects = objects.concat(Pqf.pm.getProjectPortfolioReportsByType(portfolio.id, objectType));
						});
					}
				}
				objects.forEach(function (object) {
					_processLifecycleNotifications(objectType, object.id);
					pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing object " + object.name + " (" + object.id + ")");
				});
			});
			break;
		default: // includes "showStatistics"
			outbox = store.load(NOTIFICATION_OUTBOX_ID);
			if (Array.isArray(outbox)) {
				outbox = new Map(outbox); // Must be an array, which we transform into a map
				let infoItemsCounter = 0;
				outbox.forEach(function (envelope, envelopeId, outbox) {
					pqfLib.utils.misc.log(1, "log", null, "------------------------------------");
					pqfLib.utils.misc.log(1, "log", null, "Envelope id " + envelopeId);
					pqfLib.utils.misc.log(1, "log", null, "   Receiver: " + envelope.receiverInfos.resourceName + " (" + envelope.receiverInfos.name + ", " + envelope.receiverInfos.email + ")");
					if (envelope.infoItems) {
						envelope.infoItems = new Map(envelope.infoItems); // Must be an array, which we transform into a map
						pqfLib.utils.misc.log(1, "log", null, "   ...contains " + envelope.infoItems.size + " info items:");
						envelope.infoItems.forEach(function (infoItem, infoItemId, infoItems) {
							infoItemsCounter++;
							let object = infoItem.objectInfos;
							pqfLib.utils.misc.log(1, "log", null, "      Info Item id " + infoItemId);
							pqfLib.utils.misc.log(1, "log", null, "      Object: " + object.name + " (" + object.type + ", " + object.id + ")");
							if (object.parent) {
								let parent = object.parent;
								pqfLib.utils.misc.log(1, "log", null, "      belonging to " + parent.name + " (" + parent.type + ", " + parent.id + ")");
							}
						});
					} else {
						pqfLib.utils.misc.log(1, "log", null, "...is empty");
					}
				});
				pqfLib.utils.misc.log(1, "log", null, "Outbox contains " + outbox.size + " envelopes");
				pqfLib.utils.misc.log(1, "log", null, "...and " + infoItemsCounter + " info items");
			} else {
				pqfLib.utils.misc.log(1, "log", null, "Outbox is empty");
			}
		}		
	}

    function _sendLifecycleNotifications(objectType, objectId) {
        if (objectType && objectId) { // Just process one object
            _processLifecycleNotifications(objectType, objectId);
        } else if (_notificationRules && Array.isArray(_notificationRules)) {
			_outboxMaintenanceLifecycle();
        }
    }

    function _processLifecycleNotifications(objectType, objectId) {
		
        let object = null;
		let family = [];
		let otherRelatedObjects = [];

        let project = null;
        switch (objectType) {
        case "Project":
			// Provide also parent (but no grandparent)
            try {
                project = Pqf.pm.getProjectSummary(objectId);
                object = project.project;
                object.subObjects = project.subObjects;
                object.relations = project.relations;
				family.push({
					"relation": "parent",
					"object": _getPortfolios(project.project.portfolios),
					"type": "ProjectPortfolio"
				});
            } catch (err) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Cannot get summary of project " + objectId + ". Project maybe deleted?");
            }
            break;
		case "Todo":
			// Provide neither parent nor grandparent, instead provide related objects
            try {
                object = Pqf.pi.getProjectItem(objectType, objectId);
				otherRelatedObjects = _getRelatedObjects(object);
            } catch (err) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Cannot get todo " + objectId + ". Todo maybe deleted?");
            }
			break;
        default: // Assume project report type
			// Provide also parent (project) and grandparent (portfolio)
            let reportTypes = Pqf.pm.getProjectReportTypes().map(x => x.id);
            if (reportTypes.includes(objectType)) {
                try {
                    object = Pqf.pm.getProjectReport(objectType, objectId);
                } catch (err) {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Cannot get project report " + objectId + " of type " + objectType + ". Report maybe deleted?");
                }
                if (object) {
                    try {
                        project = Pqf.pm.getProjectSummary(object.projectId);
                        let parent = project.project;
                        parent.subObjects = project.subObjects;
						family.push({
							"relation": "parent",
							"object": parent,
							"type": "Project"
						});
						family.push({
							"relation": "grandparent",
							"object": _getPortfolios(parent.portfolios),
							"type": "ProjectPortfolio"
						});
                    } catch (err) {
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "Cannot get summary of project " + object.projectId + ". Project maybe deleted?");
                        object = null;
                    }
                }
            } else {
                pqfLib.utils.misc.log(1, "error", "4BCEA8B97B8B4C41A9BC1AEBB06EDA86", objectType + " is not a valid object type");
            }
        }
        if (object) {
            let lifecycleHistory = Pqf.lcy.getObjectHistory(objectType, object.id);
            if (lifecycleHistory) {

                // Prepare object and actor infos
                let objectUrl = Pqf.main.getObjectUrl(objectType, object.id);
                let portfolioName = null;
                if (objectType == "Project") { // Get portfolio names
                    portfolioName = "";
                    for (let portfolio of object.portfolios) {
                        portfolioName += portfolio.name + ", ";
                    }
                    if (portfolioName.length > 0) { // remove trailing comma and whitespace
                        portfolioName = portfolioName.slice(0, -2);
                    }
                }
                let objectInfos = {
                    "name": object.name,
                    "type": objectType,
                    "id": object.id,
                    "code": object.code,
                    "description": object.description,
                    "properties": object.properties,
                    "subObjects": object.subObjects,
                    "stateNow": lifecycleHistory.length > 0 ? lifecycleHistory[lifecycleHistory.length - 1].state : null,
                    "stateBefore": lifecycleHistory.length > 1 ? lifecycleHistory[lifecycleHistory.length - 2].state : {
                        "id": NEWLY_CREATED_OBJECT_ID,
                        "name": "Didn't exist yet"
                    },
                    "url": objectUrl + "&feature=details",
                    "portfolioName": portfolioName
                };
                objectInfos.comment = (lifecycleHistory.length > 0 ? lifecycleHistory[lifecycleHistory.length - 1].remark : null);
                objectInfos.isComment = (objectInfos.stateNow && objectInfos.stateBefore) ? objectInfos.stateNow.id == objectInfos.stateBefore.id : false;
				
                family.forEach(familyMember => {
					switch(familyMember.type) {
					case "Project":
						// Assume family member is a single object
						let parentUrl = Pqf.main.getObjectUrl("Project", familyMember.object.id);
						objectInfos[familyMember.relation] = {
							"name": familyMember.object.name,
							"type": familyMember.object.type,
							"id": familyMember.object.id,
							"description": familyMember.object.description,
							"properties": familyMember.object.properties,
							"subObjects": familyMember.object.subObjects,
							"url": parentUrl + "&feature=details"
						};
						break;
					case "ProjectPortfolio":
						// Assume family member is an array of objects
						objectInfos[familyMember.relation] = [];
						familyMember.object.forEach(portfolio => {
							let parentUrl = Pqf.main.getObjectUrl(portfolio.type, portfolio.id);
							objectInfos[familyMember.relation].push({
								"name": portfolio.name,
								"type": portfolio.type,
								"id": portfolio.id,
								"description": portfolio.description,
								"properties": portfolio.properties,
								"url": parentUrl + "&feature=details"
							});
						});
						break;
					}
                });
				
				if (otherRelatedObjects && Array.isArray(otherRelatedObjects) && otherRelatedObjects.length > 0) {
					objectInfos.relatedObjects = otherRelatedObjects;
				}

                let lifecycleStateCurrent = lifecycleHistory.length > 0 ? lifecycleHistory[lifecycleHistory.length - 1] : null;
                let userIdCurrent = (lifecycleStateCurrent && lifecycleStateCurrent.initiatedBy) ? lifecycleStateCurrent.initiatedBy.id : null;
                let currentUser = pqfLib.resources.getUserWithResource(userIdCurrent);
                let timestampCurrent = lifecycleStateCurrent ? lifecycleStateCurrent.timestamp : null;

                let lifecycleStatePrevious = lifecycleHistory.length > 1 ? lifecycleHistory[lifecycleHistory.length - 2] : null;
                let userIdPrevious = (lifecycleStatePrevious && lifecycleStatePrevious.initiatedBy) ? lifecycleStatePrevious.initiatedBy.id : null;
                let previousActor = pqfLib.resources.getUserWithResource(userIdPrevious);
                let timestampPrevious = lifecycleStatePrevious ? lifecycleStatePrevious.timestamp : null;
                let actorInfos = {
                    "name": currentUser ? currentUser.userName : UNKNOWN,
                    "resourceName": currentUser ? currentUser.resourceName : UNKNOWN,
                    "email": currentUser ? currentUser.userEmail : UNKNOWN,
                    "mobile": currentUser ? currentUser.userMobile : UNKNOWN,
                    "doNotify": currentUser ? currentUser.userNotify : false,
                    "timestamp": moment(timestampCurrent).format("YYYY-MM-DD HH:mm:ss"),
                    "previousActor": previousActor ? {
                        "name": previousActor.userName,
                        "resourceName": previousActor.resourceName,
                        "email": previousActor.userEmail,
                        "mobile": previousActor.userMobile,
                        "doNotify": previousActor.userNotify,
                        "timestamp": moment(timestampPrevious).format("YYYY-MM-DD HH:mm:ss")
                    }
                     : null
                };
                let logs = [
                    "Object: " + objectInfos.name + " (Type: " + objectInfos.type + ", ID: " + objectInfos.id + ")",
                    "Current state: " + objectInfos.stateNow.name + " (" + objectInfos.stateNow.id + ")",
                    "Last state: " + objectInfos.stateBefore.name + " (" + objectInfos.stateBefore.id + ")",
                    "Is comment? " + objectInfos.isComment,
                    "Parent: " + (objectInfos.parent ? objectInfos.parent.name : "no parent")
                ];
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, logs);

                // Process rules
                if (_notificationRules) {
                    let rulesCounter = 0;
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Start processing notification rules...");
                    _notificationRules.forEach(function (rule) {
                        rulesCounter++;
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing rule #" + rulesCounter + "...");
                        _processLifecycleRule(rule, actorInfos, objectInfos);
                    });
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, rulesCounter + " notification rules processed");
                } else {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No notification rules set.");
                }
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Done.");
            } else {
                pqfLib.utils.misc.log(1, "error", "2D85D0F53B524626994315B4E22B3419", "Object with ID " + objectId + " of type " + objectType + " has (for an unknowns reason) no lifecycle history!");
            }
        } else {
            pqfLib.utils.misc.log(1, "warn", "9F336960195F46768C1ECF994F52BB73", "Object with ID " + objectId + " of type " + objectType + " not found (may have been deleted).");
        }
    }

    function _processNotification(receiverInfos, actorInfos, objectInfos, emailTemplateFunction, outboxOptions, notificationInfos, outboxOnly) {
        outboxOnly = (typeof outboxOnly != "undefined") ? outboxOnly : false;
        if (receiverInfos.email == actorInfos.email) { // Do not send notifications to oneself
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "User would be receiver (" + receiverInfos.email + "), not creating a notification");
        } else {
            if (emailTemplateFunction && typeof emailTemplateFunction === "function") {
                let userLanguage = pqfLib.utils.language.getUserLanguage(null, receiverInfos.email);
                if (outboxOptions) {
                    // Normalize outboxOptions and set defaults if necessary
                    outboxOptions.removeInfoItems = outboxOptions.removeInfoItems ? true : false;
                    outboxOptions.notBeforeDays = pqfLib.utils.format.isInteger(outboxOptions.notBeforeDays) ? outboxOptions.notBeforeDays : 0;
                    outboxOptions.sendAtDays = (outboxOptions.sendAtDays && Array.isArray(outboxOptions.sendAtDays)) ? outboxOptions.sendAtDays : null;
                    outboxOptions.sendAtDays = outboxOptions.sendAtDays?.filter(function (x) {
                        return pqfLib.utils.format.isInteger(x) && x >= 0;
                    }); // Remove values that are not non-negative integers
                    outboxOptions.repeatTimes = pqfLib.utils.format.isInteger(outboxOptions.repeatTimes) ? outboxOptions.repeatTimes : 0;

                    // Check if info item (message) needs to go to the outbox
                    if (outboxOptions.repeatTimes > 0 || outboxOptions.sendAtDays) {
                        _putIntoOutbox(receiverInfos, actorInfos, objectInfos, notificationInfos, userLanguage, outboxOptions, emailTemplateFunction);
                    }
                    // Check if info items (messages) need to be removed from outbox
                    if (outboxOptions.removeInfoItems) {
                        _removeFromOutbox(notificationInfos.ruleId, objectInfos.id);
                    }
                }
                // Check if message needs to be sent immediately
                let sendNow = !outboxOnly && (!outboxOptions || (outboxOptions.sendAtDays && outboxOptions.sendAtDays.includes(0)) || outboxOptions.notBeforeDays === null || outboxOptions.notBeforeDays === 0);
                if (sendNow) {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Preparing notification in language " + userLanguage);
                    let message = emailTemplateFunction(receiverInfos, actorInfos, objectInfos, userLanguage, "email");
                    if (message.subject && message.body) {
                        _sendNotification(receiverInfos.email, message.subject, message.body);
                    } else {
                        let errorInfos = [
                            "Malformed message (must have subject and body)",
                            JSON.stringify(message)
                        ];
                        pqfLib.utils.misc.log(1, "error", "955A1656DF314606A452B611680359F1", errorInfos);
                    }
                }
            } else {
                let errorInfos = [
                    "emailTemplateFunction is not a function",
                    JSON.stringify(emailTemplateFunction)
                ];
                pqfLib.utils.misc.log(1, "error", "39B5D34C699B41C3B155E828060583AA", errorInfos);
            }
        }
    }

    function _sendNotification(email, subject, message, force) {
        force = (typeof force === "undefined" ? false : force);
        if (_mockingMode && !force) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   MOCK sending email to " + email);
            const emailRegExp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
            _testEmailAddresses = _testEmailAddresses?.filter(addr => emailRegExp.test(addr)) || [];
            if (_testEmailAddresses.length > 0) {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   TESTING: Sending email to " + _testEmailAddresses.join(", "));
                pqfLib.mail.sendHtmlMail(_testEmailAddresses, subject, message, _emailSkin, false);
            }
			_incStatisticsCounter("numMockMessagesTotal");
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Sending email to " + email);
            pqfLib.mail.sendHtmlMail([email], subject, message, _emailSkin, false);
			_incStatisticsCounter("numMessagesTotal");
        }
    }

    function _putIntoOutbox(receiverInfos, actorInfos, objectInfos, notificationInfos, userLanguage, outboxOptions, emailTemplateFunction) {
        // Info items are put into an envelope in the outbox. An envelope is identified by
        //  - the object type (e.g., project or project report)
        //  - the notification type (e.g., decision request or information about a decision)
        //  - the receiver's email address
        //
        // Info items are identified by
        //  - the rule id
        //  - the object id

        let outbox = store.load(NOTIFICATION_OUTBOX_ID);
        if (!Array.isArray(outbox)) { // reset outbox
            outbox = [];
            store.save(NOTIFICATION_OUTBOX_ID, outbox);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Outbox malformatted, resetting it");
        } else {
            outbox = new Map(outbox); // Must be an array, which we transform into a map

            // Get and update envelope
            let envelopeId = _createEnvelopeId(objectInfos.type, notificationInfos.type, receiverInfos.email);
            let envelope = outbox.get(envelopeId);
            if (typeof envelope == "undefined") { // Need to create a new envelope
				// Capture function WITHOUT arguments (will be passed at runtime)
				// store function ID in the envelope
				const emailTemplateId = pqfTaskQueueLib.process
					.captureCall(emailTemplateFunction.name, true); // call is repeatable so that it can be used to create envelopes and also info items
                envelope = {
                    "receiverInfos": receiverInfos, // Information about the receiver
                    "notificationType": notificationInfos.type, // The type of notification, e.g., decision request or information about a decision
                    "infoItems": new Map(), // To collect all information items in this envelope
                    "emailTemplateId": emailTemplateId
                };
                outbox.set(envelopeId, envelope);
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Created new envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ")");
            } else { // Update existing envelope
                if (envelope.infoItems && Array.isArray(envelope.infoItems)) {
                    envelope.infoItems = new Map(envelope.infoItems); // Transform array to a map
                } else {
                    envelope.infoItems = new Map(); // Create a new info items map
                }
                envelope.receiverInfos = receiverInfos; // update receiver infos (just in case something about the receiver changed)
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Retrieved existing envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ") from outbox");
            }

            // Put info item into envelope
            let infoItem = {
                "actorInfos": actorInfos,
                "objectInfos": objectInfos,
                "timestampSaved": moment().format("YYYY-MM-DD HH:mm:ss"),
                "notBeforeDays": outboxOptions.notBeforeDays,
                "repeatTimes": outboxOptions.repeatTimes,
                "sendAtDays": outboxOptions.sendAtDays
            };
            let infoItemId = _createInfoItemId(notificationInfos.ruleId, objectInfos.id);
            envelope.infoItems.set(infoItemId, infoItem); // Store this info item independently of whether there is one already with this object ID
            envelope.infoItems = Array.from(envelope.infoItems); // Transform map to array
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "New info item " + infoItemId + " (concerning object " + infoItem.objectInfos.name + ") put into envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ")");
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Outbox currently contains " + outbox.size + " envelopes");
            store.save(NOTIFICATION_OUTBOX_ID, Array.from(outbox)); // Transform map to array
        }
    }

    function _removeFromOutbox(ruleId, objectId) {
        let outbox = store.load(NOTIFICATION_OUTBOX_ID);
        if (!Array.isArray(outbox)) { // reset outbox
            outbox = [];
            store.save(NOTIFICATION_OUTBOX_ID, outbox);
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Outbox malformatted, resetting it");
        } else {
            outbox = new Map(outbox); // Must be an array, which we transform into a map
            // traverse all envelopes and remove info items matching the requirements
            let removeInfoItemId = _createInfoItemId(ruleId, objectId);
            outbox = new Map(store.load(NOTIFICATION_OUTBOX_ID)); // Must be an array, which we transform into a map
            let counter = 0;
            outbox.forEach(function (envelope, envelopeId, outbox) {
                if (envelope.infoItems && Array.isArray(envelope.infoItems)) {
                    envelope.infoItems = new Map(envelope.infoItems); // Transform array to a map
                    envelope.infoItems.forEach(function (infoItem, infoItemId, infoItems) {
                        if (infoItemId === removeInfoItemId) {
                            infoItems.delete(infoItemId);
                            counter++;
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Info item " + infoItemId + " (concerning object " + infoItem.objectInfos.name + ") removed from envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ")");
                        }
                    });
                    if (envelope.infoItems.size == 0) { // envelope is empty, remove it
                        outbox.delete(envelopeId);
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ") contains no more info items --> removed from outbox");
                    }
                    envelope.infoItems = Array.from(envelope.infoItems); // Tranform map back to array
                } else { // envelope is empty, remove it
                    outbox.delete(envelopeId);
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ") is empty --> removed from outbox");
                }
            });
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Removed " + counter + " info items from outbox");
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Outbox currently contains " + outbox.size + " envelopes");
            store.save(NOTIFICATION_OUTBOX_ID, Array.from(outbox)); // Transform map back to array
        }
    }

    function _createEnvelopeId(objectType, notificationType, email) {
        // An envelope is used to send several info items in one email.
        // Each envelope has an ID consisting of the object type in question, the notification type, and the receiver's email address.
        let text = objectType + "|" + notificationType + "|" + email;
        return pqfLib.utils.misc.MD5(text);
    }

    function _createInfoItemId(ruleId, objectId) {
        // An info item is part of an envelope.
        // Each info item has an ID consisting of the ID of the rule from which it was generated, and the ID of the object in question.
        // Note that the info item ID is only unique within an envelope.
        let text = ruleId + "|" + objectId;
        return pqfLib.utils.misc.MD5(text);
    }

    function _processOutbox(mockDate) {
		let today;
		if (mockDate) {
			let mockDateValid = moment(mockDate).isValid();
			today = mockDateValid ? moment(mockDate).startOf("day") : moment().startOf("day");
		} else {
			today = moment().startOf("day");
		}
        let doSend = false;
        if (_outboxProcessingSchedule && _outboxProcessingSchedule.quarterly
			&& _outboxProcessingSchedule.quarterly.includes(today.clone().diff(today.clone().quarter(today.clone().quarter())), "days")) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Quarterly schedule triggering.");
            doSend = true;
        }
        if (_outboxProcessingSchedule && _outboxProcessingSchedule.monthly && _outboxProcessingSchedule.monthly.includes(today.clone().date())) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Monthly schedule triggering.");
            doSend = true;
        }
        if (_outboxProcessingSchedule && _outboxProcessingSchedule.weekly && _outboxProcessingSchedule.weekly.includes(today.clone().day())) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Weekly schedule triggering.");
            doSend = true;
        }
        if (doSend) {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Time for outbox processing...");
            let outbox = store.load(NOTIFICATION_OUTBOX_ID);
            if (!Array.isArray(outbox)) { // reset outbox
                outbox = [];
                store.save(NOTIFICATION_OUTBOX_ID, outbox);
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Outbox malformatted, resetting it");
            } else {
                outbox = new Map(outbox); // Must be an array, which we transform into a map
                outbox.forEach(function (envelope, envelopeId, outbox) {
                    if (envelope.infoItems && Array.isArray(envelope.infoItems)) {
                        envelope.infoItems = new Map(envelope.infoItems); // Transform array to a map
                        // Assemble info items
                        if (envelope.infoItems.size > 0) { // Envelope contains at least one info item
                            let userLanguage = pqfLib.utils.language.getUserLanguage(null, envelope.receiverInfos.email);
                            // Create email envelope and insert info items
                            if (typeof envelope.emailTemplateId === "string") {
								let message = null;
								try {
									// Create envelope
									// ---------------
									// Run captured email template function
									// and pass arguments here
									message = pqfTaskQueueLib.process
									.replayCall(envelope.emailTemplateId,
										[
											envelope.receiverInfos,
											null,
											null,
											userLanguage,
											"envelope"
										]);
								} catch (err) {
									pqfLib.utils.misc.log(1, "error", "C0533C4BE00A438CA052CAE3FD7DF176", "Calling email template " + envelope.emailTemplateId + " failed: " + err.message);
								}
								if (message && message.subject && message.body) {
									let infoItemsHtml = "";
									let infoItemCounter = 0;
									envelope.infoItems.forEach(function (infoItem, infoItemId, infoItems) {

										if (infoItem.sendAtDays) {

											let daysSinceEvent = today.clone().diff(moment(infoItem.timestampSaved).startOf("day"), "days");
											if (infoItem.sendAtDays.includes(daysSinceEvent)) {
												pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Days since event: " + daysSinceEvent + " --> adding info item to message");
												infoItemCounter++;
												if (infoItemCounter > 1) {
													infoItemsHtml += pqfLib.mail.getHtmlHorizontalLine("black");
												}
												// Run captured email template function
												// and pass arguments here
												infoItemsHtml += pqfTaskQueueLib.process
													.replayCall(envelope.emailTemplateId,
														[
															envelope.receiverInfos,
															infoItem.actorInfos,
															infoItem.objectInfos,
															userLanguage,
															"infoItem"
														]);
												if (Math.max.apply(null, infoItem.sendAtDays) <= daysSinceEvent) {
													infoItems.delete(infoItemId);
													pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Info item deleted from envelope");
												}
											}

										} else {

											// Send repeatedly
											let daysToGo = moment(infoItem.timestampSaved).endOf("day").add(infoItem.notBeforeDays, "days").diff(today.clone(), "days");
											
											if ((daysToGo <= 0) && (infoItem.repeatTimes > 0)) {
												pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Info item to be repeated " + infoItem.repeatTimes + " times --> adding it to message");
												infoItemCounter++;
												if (infoItemCounter > 1) {
													infoItemsHtml += pqfLib.mail.getHtmlHorizontalLine("black");
												}
												// Run captured email template function
												// and pass arguments here
												infoItemsHtml += pqfTaskQueueLib.process
													.replayCall(envelope.emailTemplateId,
														[
															envelope.receiverInfos,
															infoItem.actorInfos,
															infoItem.objectInfos,
															userLanguage,
															"infoItem"
														]);
												infoItem.repeatTimes--;
												if (infoItem.repeatTimes == 0) {
													infoItems.delete(infoItemId);
													pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Info item deleted from envelope");
												}
											}
										}

									});
									if (infoItemsHtml) {
										// Inject info items HTML into email body and send email
										message.body = pqfLib.utils.format.replaceAll(message.body, ENVELOPE_PLACEHOLDER_TEXT_FOR_INFO_ITEMS, infoItemsHtml);
										_sendNotification(envelope.receiverInfos.email, message.subject, message.body);
									} else {
										pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "No info items to send with envelope " + envelopeId + " (receiver " + envelope.receiverInfos.email + ")");
									}
									if (envelope.infoItems.size == 0) {
										outbox.delete(envelopeId);
										pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Envelope empty --> deleted");
									} else {
										envelope.infoItems = Array.from(envelope.infoItems); // Transform map back into array
									}
								} else if (message !== null) {
									let errorInfos = [
										"Malformed message (must have subject and body)",
										JSON.stringify(message)
									];
									pqfLib.utils.misc.log(1, "error", "60764847E4CD48FB8DBB2D821B5E2DE0", errorInfos);
								}
                            } else {
                                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "emailTemplateId is not a string");
                            }
                        } else { // Envelope is emtpty, delete it
                            outbox.delete(envelopeId);
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ") is empty --> removed from outbox");
                        }
                    } else {
                        outbox.delete(envelopeId);
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Envelope " + envelopeId + " (concerning receiver " + envelope.receiverInfos.email + ") is empty --> removed from outbox");
                    }
                });
                store.save(NOTIFICATION_OUTBOX_ID, Array.from(outbox)); // Transform map back to array
            }
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Not time for outbox processing.");
        }
    }

    function _processLifecycleRule(rule, actorInfos, objectInfos) {

        let checkStateInConsideration = false;
        switch (typeof rule.stateId) {
        case "object":
            if (Array.isArray(rule.stateId)) {
                checkStateInConsideration = _checkStateIncluded([objectInfos.stateNow.id, objectInfos.stateBefore.id], rule.stateId);
            }
            break;
        case "string":
            checkStateInConsideration = _checkStateIncluded([objectInfos.stateNow.id, objectInfos.stateBefore.id], [rule.stateId]);
            break;
        case "boolean":
            checkStateInConsideration = rule.stateId;
            break;
        default:
        }

        let notificationInfos = {
            "type": rule.notificationType,
            "ruleId": rule.stateId
        };

        if (checkStateInConsideration) {

            //----------------------------------------------------------------------
            // Check if the state in consideration was COMMENTED
            //----------------------------------------------------------------------

            if (objectInfos.isComment && rule.hasOwnProperty("whenCommented") && rule.whenCommented) {

                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Commented in state " + objectInfos.stateNow.id);

                // NOTIFY STATIC EMAIL ADDRESSES
                if (rule.whenCommented.hasOwnProperty("notifyStaticEmails") && rule.whenCommented.notifyStaticEmails && Array.isArray(rule.whenCommented.notifyStaticEmails)) {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenCommented' --> static emails...");
                    rule.whenCommented.notifyStaticEmails.forEach(function (email) {
                        let receiverInfos = {
                            "name": null,
                            "email": email,
                            "resourceName": null,
                            "roleName": null,
                            "relationName": null,
                        };
                        _processNotification(receiverInfos, actorInfos, objectInfos, rule.whenCommented.useEmailTemplate, null, notificationInfos);
                    });
                }

                // NOTIFY STATIC RESOURCES
                if (rule.whenCommented.hasOwnProperty("notifyStaticResources") && rule.whenCommented.notifyStaticResources && Array.isArray(rule.whenCommented.notifyStaticResources)) {
                    pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenCommented' --> static resources...");
                    let resourceIds = rule.whenCommented.notifyStaticResources.map(res => res.id);
                    let receivers = pqfLib.resources.getUsersFromResourceIds(resourceIds, true).filter(user => user.userNotify);
                    receivers.forEach(receiver => {
                        let receiverInfos = {
                            "name": receiver.userName,
                            "email": receiver.userEmail,
                            "resourceName": receiver.resourceName,
                            "roleName": null,
                            "relationName": null,
                        };
                        _processNotification(receiverInfos, actorInfos, objectInfos, rule.whenCommented.useEmailTemplate, null, notificationInfos);
                    });
                }

                // NOTIFY USER ROLES
                if (rule.whenCommented.hasOwnProperty("notifyRoles") && rule.whenCommented.notifyRoles && Array.isArray(rule.whenCommented.notifyRoles)) {
                    rule.whenCommented.notifyRoles.forEach(function (roleId) {
                        let roleName = _roles.find(x => x.id == roleId).name;
                        let receivers = pqfLib.resources.getUsersFromRoleId(roleId, true).filter(user => user.userNotify);
                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenCommented' --> user role " + roleName + " (" + roleId + ")...");
                        receivers.forEach(function (receiver) {
                            let receiverInfos = {
                                "name": receiver.userName,
                                "email": receiver.userEmail,
                                "resourceName": receiver.resourceName,
                                "roleName": roleName,
                                "relationName": null,
                            };
                            _processNotification(receiverInfos, actorInfos, objectInfos, rule.whenCommented.useEmailTemplate, null, notificationInfos);
                        });
                    });
                }

                // NOTIFY RELATION TYPES
                if (rule.whenCommented.hasOwnProperty("notifyRelationTypes") && rule.whenCommented.notifyRelationTypes && Array.isArray(rule.whenCommented.notifyRelationTypes)) {
                    rule.whenCommented.notifyRelationTypes.forEach(relationType => {
						_notifyRelationType(relationType, objectInfos, actorInfos, rule.whenCommented.useEmailTemplate, null, notificationInfos);
					});
                }
				
				// ACTIONS
				_processLifecycleActions(rule.whenCommented.actions, actorInfos, objectInfos);

            } else {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Block 'whenCommented' is irrelevant");
            }

            //----------------------------------------------------------------------
            // Check if we have ENTERED the state in consideration from a given state
            //----------------------------------------------------------------------

            let checkStateCurrent = false;
            switch (typeof rule.stateId) {
            case "object":
                if (Array.isArray(rule.stateId)) {
                    checkStateCurrent = _checkStateIncluded([objectInfos.stateNow.id], rule.stateId);
                }
                break;
            case "string":
                checkStateCurrent = _checkStateIncluded([objectInfos.stateNow.id], [rule.stateId]);
                break;
            case "boolean":
                checkStateCurrent = rule.stateId && !objectInfos.isComment;
                break;
            default:
            }

            if (checkStateCurrent && rule.hasOwnProperty("whenEnteringFromStateIds") && rule.whenEnteringFromStateIds && Array.isArray(rule.whenEnteringFromStateIds)) {

                rule.whenEnteringFromStateIds.forEach(function (enteredFromState) {

                    let checkStateEnteredFrom = false;
                    switch (typeof enteredFromState.stateId) {
                    case "object":
                        if (Array.isArray(enteredFromState.stateId)) {
                            checkStateEnteredFrom = _checkStateIncluded([objectInfos.stateBefore.id], enteredFromState.stateId);
                        }
                        break;
                    case "string":
                        checkStateEnteredFrom = _checkStateIncluded([objectInfos.stateBefore.id], [enteredFromState.stateId]);
                        break;
                    case "boolean":
                        checkStateEnteredFrom = enteredFromState.stateId && !objectInfos.isComment;
                        break;
                    default:
                    }

                    if (checkStateEnteredFrom) {

                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Entered from state " + objectInfos.stateBefore.id);

                        // NOTIFY STATIC EMAIL ADDRESSES
                        if (enteredFromState.hasOwnProperty("notifyStaticEmails")) {
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenEnteringFrom' --> static emails...");
                            enteredFromState.notifyStaticEmails.forEach(function (email) {
                                let receiverInfos = {
                                    "name": null,
                                    "email": email,
                                    "resourceName": null,
                                    "roleName": null,
                                    "relationName": null,
                                };
                                _processNotification(receiverInfos, actorInfos, objectInfos, enteredFromState.useEmailTemplate, enteredFromState.outboxOptions, notificationInfos, enteredFromState.outboxOnly);
                            });
                        }

                        // NOTIFY STATIC RESOURCES
                        if (enteredFromState.hasOwnProperty("notifyStaticResources")) {
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenEnteringFrom' --> static resources...");
                            let resourceIds = enteredFromState.notifyStaticResources.map(res => res.id);
                            let receivers = pqfLib.resources.getUsersFromResourceIds(resourceIds, true).filter(user => user.userNotify);
                            receivers.forEach(receiver => {
                                let receiverInfos = {
                                    "name": receiver.userName,
                                    "email": receiver.userEmail,
                                    "resourceName": receiver.resourceName,
                                    "roleName": null,
                                    "relationName": null,
                                };
                                _processNotification(receiverInfos, actorInfos, objectInfos, enteredFromState.useEmailTemplate, enteredFromState.outboxOptions, notificationInfos, enteredFromState.outboxOnly);
                            });
                        }

                        // NOTIFY USER ROLES
                        if (enteredFromState.hasOwnProperty("notifyRoles")) {
                            enteredFromState.notifyRoles.forEach(function (roleId) {
                                let roleName = _roles.find(x => x.id == roleId).name;
                                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenEnteringFrom' --> user role " + roleName + " (" + roleId + ")...");
                                let receivers = pqfLib.resources.getUsersFromRoleId(roleId, true).filter(user => user.userNotify);
                                receivers.forEach(function (receiver) {
                                    let receiverInfos = {
                                        "name": receiver.userName,
                                        "email": receiver.userEmail,
                                        "resourceName": receiver.resourceName,
                                        "roleName": roleName,
                                        "relationName": null,
                                    };
                                    _processNotification(receiverInfos, actorInfos, objectInfos, enteredFromState.useEmailTemplate, enteredFromState.outboxOptions, notificationInfos, enteredFromState.outboxOnly);
                                });
                            });
                        }

                        // NOTIFY RELATION TYPES
                        if (enteredFromState.hasOwnProperty("notifyRelationTypes")) {
                            enteredFromState.notifyRelationTypes.forEach(relationType => {
								_notifyRelationType(relationType, objectInfos, actorInfos, enteredFromState.useEmailTemplate, enteredFromState.outboxOptions, notificationInfos);
							});
                        }
						
						// ACTIONS
						_processLifecycleActions(enteredFromState.actions, actorInfos, objectInfos);
                    }
                });
            } else {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "States in list 'whenEnteringFromStateIds' are irrelevant");
            }

            //----------------------------------------------------------------------
            // Check if we have EXITED from the state in consideration to a given state
            //----------------------------------------------------------------------

            let checkStateBefore = false;
            switch (typeof rule.stateId) {
            case "object":
                if (Array.isArray(rule.stateId)) {
                    checkStateBefore = _checkStateIncluded([objectInfos.stateBefore.id], rule.stateId);
                }
                break;
            case "string":
                checkStateBefore = _checkStateIncluded([objectInfos.stateBefore.id], [rule.stateId]);
                break;
            case "boolean":
                checkStateBefore = rule.stateId && !objectInfos.isComment;
                break;
            default:
            }

            if (checkStateBefore && rule.hasOwnProperty("whenExitedToStateIds") && rule.whenExitedToStateIds && Array.isArray(rule.whenExitedToStateIds)) {

                rule.whenExitedToStateIds.forEach(function (exitedToState) {

                    let checkStateExitedTo = false;
                    switch (typeof exitedToState.stateId) {
                    case "object":
                        if (Array.isArray(exitedToState.stateId)) {
                            checkStateExitedTo = _checkStateIncluded([objectInfos.stateNow.id], exitedToState.stateId);
                        }
                        break;
                    case "string":
                        checkStateExitedTo = _checkStateIncluded([objectInfos.stateNow.id], [exitedToState.stateId]);
                        break;
                    case "boolean":
                        checkStateExitedTo = exitedToState.stateId && !objectInfos.isComment;
                        break;
                    default:
                    }

                    if (checkStateExitedTo) {

                        pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Exited to state " + objectInfos.stateNow.id);

                        // NOTIFY STATIC EMAIL ADDRESSES
                        if (exitedToState.hasOwnProperty("notifyStaticEmails")) {
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenExitedTo' --> static emails...");
                            exitedToState.notifyStaticEmails.forEach(function (email) {
                                let receiverInfos = {
                                    "name": null,
                                    "email": email,
                                    "resourceName": null,
                                    "roleName": null,
                                    "relationName": null,
                                };
                                _processNotification(receiverInfos, actorInfos, objectInfos, exitedToState.useEmailTemplate, exitedToState.outboxOptions, notificationInfos, exitedToState.outboxOnly);
                            });
                        }

                        // NOTIFY STATIC RESOURCES
                        if (exitedToState.hasOwnProperty("notifyStaticResources")) {
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenExitedTo' --> static resources...");
                            let resourceIds = exitedToState.notifyStaticResources.map(res => res.id);
                            let receivers = pqfLib.resources.getUsersFromResourceIds(resourceIds, true).filter(user => user.userNotify);
                            receivers.forEach(receiver => {
                                let receiverInfos = {
                                    "name": receiver.userName,
                                    "email": receiver.userEmail,
                                    "resourceName": receiver.resourceName,
                                    "roleName": null,
                                    "relationName": null,
                                };
                                _processNotification(receiverInfos, actorInfos, objectInfos, exitedToState.useEmailTemplate, exitedToState.outboxOptions, notificationInfos, exitedToState.outboxOnly);
                            });
                        }

                        // NOTIFY USER ROLES
                        if (exitedToState.hasOwnProperty("notifyRoles")) {
                            exitedToState.notifyRoles.forEach(function (roleId) {
                                let roleName = _roles.find(x => x.id == roleId).name;
                                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenExitedTo' --> user role " + roleName + " (" + roleId + ")...");
                                let receivers = pqfLib.resources.getUsersFromRoleId(roleId, true).filter(user => user.userNotify);
                                receivers.forEach(function (receiver) {
                                    let receiverInfos = {
                                        "name": receiver.userName,
                                        "email": receiver.userEmail,
                                        "resourceName": receiver.resourceName,
                                        "roleName": roleName,
                                        "relationName": null,
                                    };
                                    _processNotification(receiverInfos, actorInfos, objectInfos, exitedToState.useEmailTemplate, exitedToState.outboxOptions, notificationInfos, exitedToState.outboxOnly);
                                });
                            });
                        }

                        // NOTIFY RELATION TYPES
                        if (exitedToState.hasOwnProperty("notifyRelationTypes")) {
                            exitedToState.notifyRelationTypes.forEach(relationType => {
								_notifyRelationType(relationType, objectInfos, actorInfos, exitedToState.useEmailTemplate, exitedToState.outboxOptions, notificationInfos);
							});
                        }

                        // NOTIFY THE REQUESTING USER
                        if (exitedToState.hasOwnProperty("useEmailTemplateForRequester") && exitedToState.useEmailTemplateForRequester) {
                            let receiverInfos = {
                                "name": actorInfos.previousActor ? actorInfos.previousActor.name : UNKNOWN,
                                "email": actorInfos.previousActor ? actorInfos.previousActor.email : UNKNOWN,
                                "resourceName": actorInfos.previousActor ? actorInfos.previousActor.resourceName : UNKNOWN,
                                "roleName": null,
                                "relationName": null,
                                "isRequester": true
                            };
                            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Informing the requester " + receiverInfos.name + " (" + receiverInfos.email + ")");
                            _processNotification(receiverInfos, actorInfos, objectInfos, exitedToState.useEmailTemplateForRequester, exitedToState.outboxOptions, notificationInfos, exitedToState.outboxOnly);
                        }
						
						// ACTIONS
						_processLifecycleActions(exitedToState.actions, actorInfos, objectInfos);
                    }
                });
            } else {
                pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "States in list 'whenExitedToStateIds' are irrelevant");
            }
        } else {
            pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Current or previous state does not have ID " + rule.stateId + ". Skipping rule");
        }
    }

    function _getProjectEnumProperty(projectInfos, subobjType, propId, enumTypeId) {
        let enumValue = null;
        let subobj = projectInfos.subObjects.find(x => x.type == subobjType);
        if (subobj) {
            let prop = subobj.properties.find(x => x.key == propId);
            if (prop && prop.value) {
                enumValue = Pqf.pf.getEnumValue(enumTypeId, prop.value, true);
            }
        }
        return enumValue;
    }

    function _getProjectRelatedResourceNames(projectInfos, relationType, targetResourceTypes) {
        let resources = [];
        if (projectInfos.relations) {
            let relevantRelations = projectInfos.relations?.filter(x => x.relationType == relationType && targetResourceTypes.includes(x.target.type));
            if (relevantRelations) {
                resources = relevantRelations.map(function (relation) {
                    let resource = null;
                    try {
                        resource = Pqf.res.getResource(relation.target.id);
                    } catch (err) {
                        pqfLib.utils.misc.log(1, "error", "27F0C156E07944A3997215EBC2997BDB", err.message);
                    }
                    if (resource) {
                        resource = resource.name;
                    }
                    return resource;
                });
            }
        }
        return resources;
    }
	
	// ------------------------------------------------------------------------
	// Internal helper functions
	// ------------------------------------------------------------------------

	// Returns true if at least one of stateIds is included in poolOfStates.
	// Both arguments need to be array of strings.
	function _checkStateIncluded(stateIds, poolOfStates) {
		let check = false;
		stateIds.forEach(function (stateId) {
			check = check || poolOfStates.includes(stateId);
		});
		return check;
	}

	function _getPortfolios(portfolioRefs) {
		let portfolios = [];
		portfolioRefs.forEach(portfolioRef => {
			let parentUrl = Pqf.main.getObjectUrl(portfolioRef.type, portfolioRef.id);
			let portfolio = Pqf.pm.getProjectPortfolio(portfolioRef.id);
			portfolios.push({
				"name": portfolio.name,
				"type": portfolio.type,
				"id": portfolio.id,
				"description": portfolio.description,
				"properties": portfolio.properties,
				"url": parentUrl + "&feature=details"
			});
		});
		return portfolios;
	}

	function _notifyRelationType(relationType, objectInfos, actorInfos, emailTemplate, outboxOptions, notificationInfos) {
		let relationTypeId = null;
		let hierarchy = null;
		if (relationType) {
			if (typeof relationType === 'string' || relationType instanceof String) {
				relationTypeId = relationType;
			} else if (typeof relationType === 'object') {
				relationTypeId = relationType.relationTypeId;
				hierarchy = relationType.hierarchy;
			}
		}
		if (relationTypeId) {
			let relationName = null;
			try {
				relationName = Pqf.pf.getRelationType(relationTypeId).nameForward;
			} catch (err) {
				pqfLib.utils.misc.log(1, "error", "04A539F344B24A839941BB3DC54C950C", err.message);
			}
			let objectType = null;
			let objectIds = null;
			if (hierarchy) {
				let familyMember = objectInfos[hierarchy];
				// We currently support 'parent' and 'grandparent' as hierarchical family relations
				if (familyMember) {
					if(Array.isArray(familyMember) && familyMember.length > 0) {
						objectType = familyMember[0].type;
						objectIds = familyMember.map(member => member.id); // Array of IDs
					} else { // Assume familyMember is an object
						objectType = familyMember.type;
						objectIds = [familyMember.id];
					}
				}
			} else {
				objectType = objectInfos.type;
				objectIds = [objectInfos.id];
			}
			if (relationName && objectType && objectIds) {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null,
					"Processing relation name " + relationName + " (" + relationTypeId + ")...");
				let receivers = [];
				objectIds.forEach(objectId => {
					receivers = receivers.concat(
						pqfLib.resources.getUsersFromRelationTypeId(relationTypeId, objectType, objectId, true)
							.filter(user => user.userNotify));
				});
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Found " + receivers.length + " receivers");
				receivers.forEach(function (receiver) {
					let receiverInfos = {
						"name": receiver.userName,
						"email": receiver.userEmail,
						"resourceName": receiver.resourceName,
						"roleName": null,
						"relationName": relationName,
					};
					_processNotification(receiverInfos, actorInfos, objectInfos, emailTemplate, outboxOptions, notificationInfos);
				});
			} else {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "Processing 'whenCommented' --> No object for relation type " + JSON.stringify(relationType) + " found.");
			}
		}
	}
	
	function _processAllocationActions(actions, actorInfos, allocationInfos) {
		if (actions) {
			if (Array.isArray(actions)) {
				actions.forEach(action => {
					switch (action.type) {
						case 'store':
							_storeAllocation(allocationInfos, action.key);
							break;
						case 'unstore':
							_storeAllocation(allocationInfos, action.key, true);
							break;
						case 'comment':
							let remark = action.prefixText || "";
							remark += '<b>' + allocationInfos.demandedEffort.amount
								+ allocationInfos.demandedEffort.unit + '</b>';
							Pqf.alc.commentResourceAllocation(allocationId, remark)
							break;
					}
				});
			} else {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "   actions must be an array");							
			}
		} else {
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   No actions defined in this rule");
		}		
	}

	function _processLifecycleActions(actions, actorInfos, objectInfos) {
		if (actions) {
			if (Array.isArray(actions)) {
				actions.forEach(action => {
					if (typeof action.function === 'function') {
						action.function(actorInfos, objectInfos);
					}
				});
			} else {
				pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "warn", null, "   actions must be an array");							
			}
		} else {
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   No actions defined in this rule");
		}		
	}
			
	function _storeAllocation(allocationInfos, key, doDelete) {
		doDelete = (typeof doDelete === "undefined" ? false : doDelete);
		let storedObject;
		let storedArray = null;
		try {
			storedArray = Pqf.clf.getObjectStore('Phase', allocationInfos.project.task.id, key);
		} catch(err) {
		}
		if (!storedArray || !Array.isArray(storedArray)) {
			storedArray =[]; // Initialize array
		}
		storedObject = storedArray.find(x => x.allocationId === allocationInfos.id) || null;
		if (storedObject) { // object found -> update or delete
			if (doDelete) {
				storedArray = storedArray.filter(x => x.allocationId !== storedObject.allocationId);
			} else {
				storedObject.userId = actorInfos.id;
				storedObject.createdAt = moment().toISOString();
				storedObject.effort = allocationInfos.demandedEffort;
			}
		} else if (!doDelete) { // create new object
			storedObject = {
				'userId': actorInfos.id,
				'allocationId': allocationInfos.id,
				'createdAt': moment().toISOString(),
				'effort': allocationInfos.demandedEffort,
			};
			storedArray.push(storedObject);
		}
		Pqf.clf.putObjectStore('Phase', allocationInfos.project.task.id, key, storedArray);
		if (doDelete) {
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Allocation unstored: " + key + "|" + allocationInfos.id);
		} else {
			pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Allocation stored: " + key + "|" + allocationInfos.id);
		}
		pqfLib.utils.misc.log(_debuggingMode ? 1 : 0, "log", null, "   Allocation infos stored now: " + JSON.stringify(storedArray));
	}

	function _getStatistics(id, statistics) {
		statistics = (typeof statistics === "undefined" ? _statistics : statistics);
		return statistics.find(item => item.id === id);
	}

	function _setStatistics(id, value, name, statistics) {
		statistics = (typeof statistics === "undefined" ? _statistics : statistics);
		let item = statistics.find(item => item.id === id);
		if (item) {
			item.value = value;
			if (!item.name && name) {
				item.name = name;
			}
		} else {
			statistics.push({
				"id": id,
				"name": name || "unknown",
				"value": value
			});
			pqfLib.utils.misc.log(_debuggingMode && !name ? 1 : 0, "warn", null, "Setting unknown statistics value with ID " + id);
		}
	}

	function _incStatisticsCounter(id, name, statistics) {
		statistics = (typeof statistics === "undefined" ? _statistics : statistics);
		let statsItem = _getStatistics(id, statistics);
		let statsValue = statsItem ? statsItem.value + 1 : 1;
		_setStatistics(id, statsValue, name, statistics);
	}
	
	function _pushStatisticsItem(id, element, name, statistics) {
		statistics = (typeof statistics === "undefined" ? _statistics : statistics);
		let statsItem = _getStatistics(id, statistics);
		let statsValue = [];
		if (statsItem) {
			statsValue = statsItem.value;
		}
		statsValue.push(element);
		_setStatistics(id, statsValue, name, statistics);	
	}
	
	function _printStatistics(infoLines, statistics) {
		statistics = (typeof statistics === "undefined" ? _statistics : statistics);
		pqfLib.utils.misc.log(1, "log", null, "");
		pqfLib.utils.misc.log(1, "log", null, "Statistics");
		pqfLib.utils.misc.log(1, "log", null, "----------");
		if (infoLines && Array.isArray(infoLines)) {
			infoLines.forEach(line => {
				pqfLib.utils.misc.log(1, "log", null, line);				
			});
		}
		statistics.forEach(item => {
			let valuePrint = Array.isArray(item.value) ? item.value.length + " items" : item.value;
			pqfLib.utils.misc.log(1, "log", null,
				item.name.padEnd(STATISTICS_PARAMS.minNumCharsForItemNames, ".") + ": " + valuePrint);
		});
		pqfLib.utils.misc.log(1, "log", null, "");
	}

	// ------------------------------------------------------------------------
    // Publish functions
	// ------------------------------------------------------------------------
    return {
        // Functions for setting parameters
        "resetCounter": _resetMailCounter,
        "printCounter": _printMailCounter,
        "setDebuggingMode": _setDebuggingMode,
        "setMockingMode": _setMockingMode,
        "setEmailSkin": _setEmailSkin,
        "setAllocationStatesRequested": _setAllocationStatesRequested,
        "setAllocationStatesPending": _setAllocationStatesPending,
        "setTodoStatesWorking": _setTodoStatesWorking,
        "setTodoStatesReviewing": _setTodoStatesReviewing,
        "setRules": _setRules,
        "setObjectTypes": _setObjectTypes,
        "setOutboxProcessingParameters": _setOutboxProcessingParameters,

        // Operating functions
        "sendLifecycleNotifications": _sendLifecycleNotifications,
        "sendTimedNotifications": _sendTimedNotifications,
        "sendAllocationNotifications": _sendAllocationNotifications,
        "sendAssigmentNotifications": _sendAssignmentNotifications,
        "sendNotifications": _sendNotifications, // DEPRECATED, for backward compatibility only, use "sendLifecycleNotifications" instead
        "processOutbox": _processOutbox,

        // Auxiliary functions and constants
        "getProjectEnumProperty": _getProjectEnumProperty,
        "getProjectRelatedResourceNames": _getProjectRelatedResourceNames,
        "newlyCreatedObjectId": NEWLY_CREATED_OBJECT_ID,
        "infoItemsPlaceholderText": ENVELOPE_PLACEHOLDER_TEXT_FOR_INFO_ITEMS,
		"currentUserText": TEST_MAIL_CURRENT_USER,

        // Tools
        "tools": {
            "timedNotifications": {
                "constructRequest": _createRequest,
                "sendRequestNotification": _sendRequestNotification
            },
			"statistics": {
				"getItem": _getStatistics,
				"setItem": _setStatistics,
				"incItem": _incStatisticsCounter,
				"pushItem": _pushStatisticsItem,
				"print": _printStatistics
			}
        }
    };
})();