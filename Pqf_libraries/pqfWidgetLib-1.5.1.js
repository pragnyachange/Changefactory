/**
 * @name PQFORCE JS Widget Library
 * @version 1.5.1
 * @file pqfWidgetLib.js
 * @description This library serves as a basis for creating JTF Cockpit Widgets.
 * @author LI (INTRASOFT)
 * @pqfId 47474A982C204EBBA5A0A86C51152072
 * @created 2023-01-22
 * @modified 2025-12-11
 * @requires e430d37e331848788acbf975d600dd8e (pqfBasicLib.js), moment.js
 */

/**
 * PQFORCE Widget Library
 * 
 * @module pqfWidgetLib
 */
const pqfWidgetLib = (function () {

    // DEBUGGING ###############################################################

    let message = "";
    let debugLevel = 0;

    function _setDebugLevel(level) {
        debugLevel = level;
        message = "Debug level set to " + level;
        pqfLib.utils.misc.log(debugLevel, "log", "B13C83D67F13416E82DDD10AB497D57B", message);
    }

    function _setDebugMode(bool) {
        _setDebugLevel(bool ? 1 : 0);
        pqfLib.setDebuggingMode(bool);
        message = "Debug mode set to " + (bool ? "ON" : "OFF");
        pqfLib.utils.misc.log(debugLevel, "log", "13098E30B85A4D119BDD2F6820BD08DB", message);
    }

    // FIX PARAMETERS ##########################################################
    
    const DEFAULT_LANG = "en";
    const DEFAULT_CURRENCY = "CURRENCY-CHF";
    const MAX_TB_ACC = "PT50H"; // Maximum allowed time balance in ISO 8601 format
    const RES_KIND_EMP = "RES-KIND-PERSON"; // Assumed to be the same for all tenants
    const OBJS_WITHOUT_LCY = ["Phase"];
    const RES_TYPES = [ "HRM-RES-TYP-EMP", "HRM-RES-TYP-OU", "HRM-RES-TYP-TEA" ];

    // DYNAMIC PARAMETERS ######################################################

    let BEG_LOW = null;
    let END_HIGH = null;
    let WHOURS_PER_DAY = null;
    let USER_LANG = null;
    let USER_CURRENCY_ID = null;
    let ABSENCE_TYPES = null;
    let EMP_TYPE_IDS = null; 
    let CURRENCY_MAPPING = null;
    let DATE_TODAY = null;

    /**
     * Calculates the value of a set of predefined parameters. The corresponding parameter is only calculated if it is not already set.
     * 
     * @param {string} parameter - The parameter to calculate. Possible values:
     *   - "BEG_LOW": The beginning of the planning range, calculated from the server config. Needed as lower limit for API calls the return macro allocation slots.
     *   - "END_HIGH": The end of the planning range, calculated from the server config. Needed as upper limit for API calls the return macro allocation slots.
     *   - "WHOURS_PER_DAY": The standard work hours per day, calculated from the standard worktimes of the HRM resource group.
     *   - "USER_LANG": The language of the current user.
     */
    function _calcParameter(parameter) {
        switch (parameter) {
            case "BEG_LOW":
                if (!BEG_LOW) {
                    let planningrangeFrom = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getServerConfig, "pqforce.planningrange.from");
                    BEG_LOW = moment().startOf("year").add(planningrangeFrom, "years").format("YYYY-MM-DD");
                }
                break;
            case "END_HIGH":
                if (!END_HIGH) {
                    let planningrangeTo = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getServerConfig, "pqforce.planningrange.to");
                    END_HIGH = moment().endOf("year").add(planningrangeTo, "years").format("YYYY-MM-DD");
                }
                break;
            case "WHOURS_PER_DAY":
                if (!WHOURS_PER_DAY) {
                    let standardWorktimes = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResourceGroupStandardWorktimes);
                    let standardWorktime_hrm = standardWorktimes.find(worktime => worktime.id.includes("HRM"));
                    WHOURS_PER_DAY = moment.duration(standardWorktime_hrm.timePerWeek).asHours() / standardWorktime_hrm.daysPerWeek;
                }
                break;
            case "USER_LANG":
                if (!USER_LANG) {
                    let currentUser = pqfLib.utils.apiFunc.exec(Pqf.acm, Pqf.acm.getCurrentUser);
                    USER_LANG = currentUser.language ? currentUser.language.split("-")[0] : DEFAULT_LANG;
                }
                break;
            case "USER_CURRENCY_ID":
                if (!USER_CURRENCY_ID) {
                    let currentUser_prefs = pqfLib.utils.apiFunc.exec(Pqf.acm, Pqf.acm.getCurrentUserPreferences);
                    USER_CURRENCY_ID = currentUser_prefs.currency || DEFAULT_CURRENCY; 
                }
                break;
            case "ABSNECE_TYPES":
                if (!ABSENCE_TYPES) {
                    let absenceTypes = pqfLib.utils.apiFunc.exec(Pqf.alc, Pqf.alc.getAbsenceTypes);
                    ABSENCE_TYPES = absenceTypes || [];
                }
                break;
            case "EMP_TYPE_IDS":
                if (!EMP_TYPE_IDS) {
                    let resTypes = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResourceTypes);
                    EMP_TYPE_IDS = resTypes.filter(type => type.resourceKind === RES_KIND_EMP).map(type => type.id);
                }
                break;
            case "CURRENCY_MAPPING":
                if (!CURRENCY_MAPPING) {
                    let currencies = pqfLib.utils.apiFunc.exec(Pqf.fco, Pqf.fco.getCurrencies);
                    CURRENCY_MAPPING = currencies.reduce((acc, currency) => {
                        let currencyMapping = pqfLib.utils.apiFunc.exec(Pqf.fco, Pqf.fco.getTodaysCurrencyExchangeRate, currency.id);
                        acc[currency.id] = {
                            "name": currency.name,
                            "code": currency.code,
                            "rate": currencyMapping.rate
                        };
                        return acc;
                    }, {});
                    _calcParameter("USER_CURRENCY_ID");
                    if (!CURRENCY_MAPPING[USER_CURRENCY_ID]) {
                        USER_CURRENCY_ID = Object.keys(CURRENCY_MAPPING)[0]; // Fallback to the first currency in the mapping
                        message = "Currency mapping for user currency " + USER_CURRENCY_ID + " not found. Setting user currency to " + USER_CURRENCY_ID + ".";
                        pqfLib.utils.misc.log(debugLevel, "warn", "A04424771E574816A86F9A09CA5D1FE3", message);
                    }
                }
                break;
            case "DATE_TODAY":
                if (!DATE_TODAY) {
                    DATE_TODAY = moment().format("YYYY-MM-DD");
                }
                break;
            default:
                message = "Unknown parameter: " + parameter;
                pqfLib.utils.misc.log(1, "error", "E2AFF8DCBA30424C8C687FF705F41880", message);
                return null;
        }
    }

    function _getParameter(parameter) {
        _calcParameter(parameter);
        const PARAMETERS = {
            "BEG_LOW": BEG_LOW,
            "END_HIGH": END_HIGH,
            "WHOURS_PER_DAY": WHOURS_PER_DAY,
            "USER_LANG": USER_LANG,
            "USER_CURRENCY_ID": USER_CURRENCY_ID,
            "ABSNECE_TYPES": ABSENCE_TYPES,
            "EMP_TYPE_IDS": EMP_TYPE_IDS,
            "CURRENCY_MAPPING": CURRENCY_MAPPING,
            "DATE_TODAY": DATE_TODAY
        };
        if (PARAMETERS.hasOwnProperty(parameter)) {
            return PARAMETERS[parameter];
        }
        message = "Unknown parameter: " + parameter;
        pqfLib.utils.misc.log(1, "error", "969730FA15614DA890A3EB1E48DE0B07", message);
        return null;
    }

    // CACHED DATA #############################################################

    let dimensionDefs = {};
    let statusClassDefs = {};
    let propertyDefs = {};
    let pmMethods = null;
    let pmMethodPhases = null;

    function _getCachedData(cacheName, keys) {
        let key = JSON.stringify(keys);
        switch (cacheName) {
            case "dimensionDefs":
                if (!dimensionDefs[key]) {
                    dimensionDefs[key] = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getIndicatorDimensionDef, keys.repType, keys.dimension);
                }
                return dimensionDefs[key];
            case "statusClassDefs":
                if (!statusClassDefs[key]) {    
                    statusClassDefs[key] = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getIndicatorClassification, keys.statusClassId);
                }
                return statusClassDefs[key];
            case "propertyDefs":
                if (!propertyDefs[key]) {
                    propertyDefs[key] = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getPropertyDefinitions, keys.objType);
                }
                return propertyDefs[key];
            case "pmMethods":
                if (!pmMethods) {
                    pmMethods = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getPmMethods);
                }
                return pmMethods;
            case "pmMethodPhases":
                if (!pmMethodPhases) {
                    pmMethods = _getCachedData("pmMethods");
                    pmMethodPhases = pmMethods.reduce((acc, method) => {
                        let methodPhases_thisMethod = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getPmMethodPhases, method.id);
                        acc = acc.concat(methodPhases_thisMethod);
                        return acc;
                    }, []);
                }
                return pmMethodPhases;
        }
    }

    // WIDGET TAGS (INFOS AND WARNINGS) ########################################

    let hints = [];

    function _addHint(type, label_translated, text_translated, hint_id) {
        _calcParameter("USER_LANG");
        hints.push({
            "type": type,
            "label": _getCorrectTranslation(label_translated, USER_LANG),
            "text": _getCorrectTranslation(text_translated, USER_LANG),
            "id": hint_id
        });
    }

    function _getHints() {
        // Filter dublicates based on hint ID (if specified)
        let seenHintIds = [];
        hints = hints.filter(hint => {
            if (hint.id) {
                if (seenHintIds.includes(hint.id)) {
                    return false;
                } else {
                    seenHintIds.push(hint.id);
                    return true;
                }
            }
            return true;
        });
        return hints;
    }

    // MAPPINGS ################################################################

    let ZOOM_MAPPING = {
        "zoom_day": {
            "zoom": "DAY",
            "unit": "day",
            "format": "DD.MM",
            "axisName": { "en": "Day", "de": "Tag" }
        },
        "zoom_week": {
            "zoom": "WEEK",
            "unit": "week",
            "format": "WW",
            "axisName": { "en": "Week", "de": "Woche" }
        },
        "zoom_month": {
            "zoom": "MONTH",
            "unit": "month",
            "format": "MMM",
            "axisName": { "en": "Month", "de": "Monat" }
        }
    };
    let UNIT_MAPPTING = {
        "unit_hours": {
            "unit": "hour",
            "unit_string": "(h)",
            "getConversion": function (duration) {
                return moment.duration(duration, "hours").asHours();
            },
            "axisName": { "en": "Hours", "de": "Stunden" }
        },
        "unit_wDays": {
            "unit": "day",
            "unit_string": "(PT)",
            "getConversion": function (duration) {
                _calcParameter("WHOURS_PER_DAY");
                return moment.duration(duration, "days").asHours() / WHOURS_PER_DAY;
            },
            "axisName": { "en": "Work Days", "de": "Arbeitstage" }
        }
    };
    let BASE_FLOW_MAPPING = {
        "baseFlow_allocated": {
            "label": { "en": "Allocated", "de": "Alloziert" },
            "getValue": function (macAllocSlots_perCompCol, slotInd, sumBaseflow) {
                let totalAllocated_hours = 0;
                Object.values(macAllocSlots_perCompCol).forEach(slots => {
                    slots[slotInd].forecasts.forEach(forecast => {
                        totalAllocated_hours += moment.duration(forecast.planned).asHours();
                    });
                });
                return moment.duration(totalAllocated_hours, "hours").toISOString();
            }
        },
        "baseFlow_availability": {
            "label": { "en": "Availability", "de": "Verfügbarkeit" },
            "getValue": function (macAllocSlots_perCompCol, slotInd, sumBaseflow) {
                if (sumBaseflow) {
                    let totalAvailability_hours = 0;
                    Object.values(macAllocSlots_perCompCol).forEach(slots => {
                        totalAvailability_hours += moment.duration(slots[slotInd].availability).asHours();
                    });
                    return moment.duration(totalAvailability_hours, "hours").toISOString();
                } else {
                    return Object.values(macAllocSlots_perCompCol)[0][slotInd].availability;
                }
            }
        },
        "baseFlow_presence": {
            "label": { "en": "Presence Time", "de": "Präsenzzeit" },
            "getValue": function (macAllocSlots_perCompCol, slotInd, sumBaseflow) { 
                if (sumBaseflow) {
                    let totalPresence_hours = 0;
                    Object.values(macAllocSlots_perCompCol).forEach(slots => {
                        totalPresence_hours += moment.duration(slots[slotInd].presence).asHours();
                    });
                    return moment.duration(totalPresence_hours, "hours").toISOString();
                } else {
                    return Object.values(macAllocSlots_perCompCol)[0][slotInd].presence;
                }
            }
        },
        "baseFlow_expectedPresence": {
            "label": { "en": "Expected Presence Time", "de": "Erwartete Präsenzzeit" },
            "getValue": function (macAllocSlots_perCompCol, slotInd, sumBaseflow) {
                if (sumBaseflow) {
                    let totalExpectedPresence_hours = 0;
                    Object.values(macAllocSlots_perCompCol).forEach(slots => {
                        totalExpectedPresence_hours += moment.duration(slots[slotInd].expectedPresence).asHours();
                    });
                    return moment.duration(totalExpectedPresence_hours, "hours").toISOString();
                } else {
                    return Object.values(macAllocSlots_perCompCol)[0][slotInd].expectedPresence;
                }
            }
        }
    };
    let COMP_FLOW_MAPPING = {
        "compFlow_allocated": {
            "label": { "en": "Allocated", "de": "Alloziert" },
            "getValue": function (slots, slotInd) {
                let totalAllocated_hours = 0;
                slots[slotInd].forecasts.forEach(forecast => {
                    totalAllocated_hours += moment.duration(forecast.planned).asHours();
                });
                return moment.duration(totalAllocated_hours, "hours").toISOString();
            }
        },
        "compFlow_actual": {
            "label": { "en": "Actual", "de": "IST" },
            "getValue": function (slots, slotInd) {
                let totalActual_hours = 0;
                slots[slotInd].forecasts.forEach(forecast => {
                    totalActual_hours += moment.duration(forecast.actual).asHours();
                });
                return moment.duration(totalActual_hours, "hours").toISOString();
            }
        },
        "compFlow_actualAndRemaining": {
            "label": { "en": "Actual and Remaining", "de": "IST und Ausstehend" },
            "getValue": function (slots, slotInd) {
                let totalActualAndRemaining_hours = 0;
                slots[slotInd].forecasts.forEach(forecast => {
                    totalActualAndRemaining_hours += moment.duration(forecast.actual).asHours() + moment.duration(forecast.remaining).asHours();
                });
                return moment.duration(totalActualAndRemaining_hours, "hours").toISOString();
            }
        }
    };
    function _returnFeedback(objEnum, timeFrame, reason, explanations, feature) {
        _calcParameter("USER_LANG");
        return {
            "timeFrame": _getCorrectTranslation(timeFrame.scope, USER_LANG),
            "reason": {
                "type": objEnum.type,
                "id": objEnum.id,
                "name": _getCorrectTranslation(reason, USER_LANG),
                "description": null,
                "iconRef": null,
                "color": null,
                "feature": feature
            },
            "explanations": explanations.map(explanation => {
                return {
                    "type": null,
                    "id": null,
                    "name": _getCorrectTranslation(explanation, USER_LANG),
                    "description": null,
                    "iconRef": null,
                    "color": null
                }
            })
        }
    }
    function _isEmp(resEnum) {
        _calcParameter("EMP_TYPE_IDS");
        return resEnum.type && EMP_TYPE_IDS.includes(resEnum.type);
    }
    let RES_ATT_MAPPING = {
        "reason_overAlloc": {
            "getReason": function (resEnum, settings, macAllocSlots_prj, macAllocSlots_total) {
                // Find considered time frame - future
                let timeFrame = {
                    "beg": moment(settings.beg_corrected).isBefore(moment().add(1, "days")) ? moment().add(1, "days").format("YYYY-MM-DD") : settings.beg_corrected,
                    "end": moment(settings.end_corrected).isBefore(moment().add(1, "days")) ? moment().add(1, "days").format("YYYY-MM-DD") : settings.end_corrected
                }
                if (timeFrame.beg === timeFrame.end) return; // No time frame to consider
                let timeFrame_string = moment(timeFrame.beg).format("DD.MM.YYYY") + " - " + moment(timeFrame.end).subtract(1, "days").format("DD.MM.YYYY");
                timeFrame.scope = {
                    "en": "Future: " + timeFrame_string,
                    "de": "Zukunft: " + timeFrame_string
                }
                // Find the index of tomorrow in the considered time frame
                let ind_start = moment(timeFrame.beg).diff(moment(settings.beg_corrected), "days");
                // Check on how many days the resource is overallocated. If macAllocSlots_prj is specified, consider only the days the resource is allocated to the project in question.
                let nDays_alloc = 0;
                let mDays_overAlloc = 0;
                for (let i = ind_start; i < macAllocSlots_total.length; i++) {
                    let considerDay = false;
                    if (macAllocSlots_prj) {
                        let nHours_allocPrj = 0;
                        macAllocSlots_prj[i].forecasts.forEach(forecast => {
                            nHours_allocPrj += moment.duration(forecast.planned || "PT0S").asHours();
                        });
                        if (nHours_allocPrj > 0) considerDay = true;
                    } else {
                        considerDay = moment.duration(macAllocSlots_total[i].fte).asHours() > 0;
                    }
                    if (considerDay) {
                        nDays_alloc++;
                        let nHours_allocTotal = 0;
                        macAllocSlots_total[i].forecasts.forEach(forecast => {
                            nHours_allocTotal += moment.duration(forecast.planned || "PT0S").asHours();
                        });
                        if (nHours_allocTotal > moment.duration(macAllocSlots_total[i].availability || "PT0S").asHours()) {
                            mDays_overAlloc++;
                        }
                    }
                }
                // If the resource is overallocated on any day, return the reason
                if (mDays_overAlloc) {
                    let reason = {
                        "en": "Overallocated",
                        "de": "Überalloziert"
                    }
                    let explanations = macAllocSlots_prj ? 
                        [{
                            "en": "Overallocated on " + mDays_overAlloc + " day(s) out of " + nDays_alloc + " day(s) allocated to the project.",
                            "de": "Überalloziert an " + mDays_overAlloc + " Tag(en) von " + nDays_alloc + " Tag(en), an denen die Ressource auf das Projekt alloziert ist."
                        }] : 
                        [{
                            "en": "Overallocated on " + mDays_overAlloc + " day(s) out of " + nDays_alloc + " day(s) the resource is expected to work.",
                            "de": "Überalloziert an " + mDays_overAlloc + " Tag(en) von " + nDays_alloc + " Tag(en), an denen erwartet wird, dass die Ressource arbeitet."
                        }]
                    let parent = null;
                    if (resEnum.type.endsWith("-EMP")) {
						let ancestors = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getResourceAncestors, resEnum.id);
						parent = ancestors ? ancestors.filter(ancestor => ancestor.type === "HRM-RES-TYP-OU")[0] : null;
					}
                    return _returnFeedback(parent || resEnum, timeFrame, reason, explanations, "allocations");
                }
            },
            "getParams": function (resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc) {
                let macAllocSlots_prj = macAllocSlots_prj_perRes ? macAllocSlots_prj_perRes.find(macAllocSlotObj => macAllocSlotObj.resource.id === resEnum.id).workload.slots : null;
                let macAllocSlots_total = macAllocSlots_total_perRes ? macAllocSlots_total_perRes.find(macAllocSlotObj => macAllocSlotObj.resource.id === resEnum.id).workload.slots : null;
                return [resEnum, settings, macAllocSlots_prj, macAllocSlots_total];
            },
            "requiresMacroAllocSlots": true
        },
        "reason_absences": {
            "getReason": function (resEnum, settings) {
                // Find considered time frame - future
                let timeFrame = {
                    "beg": moment(settings.beg_corrected).isBefore(moment().add(1, "days")) ? moment().add(1, "days").format("YYYY-MM-DD") : settings.beg_corrected,
                    "end": moment(settings.end_corrected).isBefore(moment().add(1, "days")) ? moment().add(1, "days").format("YYYY-MM-DD") : settings.end_corrected
                }
                if (timeFrame.beg === timeFrame.end) return; // No time frame to consider
                let timeFrame_string = moment(timeFrame.beg).format("DD.MM.YYYY") + " - " + moment(timeFrame.end).subtract(1, "days").format("DD.MM.YYYY");
                timeFrame.scope = {
                    "en": "Future: " + timeFrame_string,
                    "de": "Zukunft: " + timeFrame_string
                }
                // Load the planning slots of this resource and check if there are any planned absences in the selected time frame
                let planningSlots = pqfLib.utils.apiFunc.exec(Pqf.alc, Pqf.alc.getPlanningSlots, resEnum.id, timeFrame.beg, timeFrame.end);
                if (!planningSlots) {
                    message = "Failed to load planning slots for resource " + resEnum.id + ".";
                    pqfLib.utils.misc.log(debugLevel, "warn", "4602AC3D0B64439C8B3A41A3956B49FC", message);
                    return;
                }
                let nShiftsAbsent_perAbsentType = {};
                let absentOnDay = new Array(moment(settings.end_corrected).diff(moment(settings.beg_corrected), "days")).fill(false);
                planningSlots.shifts.forEach(shift => {
                    shift.slots.forEach( (slot, ind) => {
                        if (slot.absence) {
                            if (!nShiftsAbsent_perAbsentType.hasOwnProperty(slot.absence.absenceType)) {
                                nShiftsAbsent_perAbsentType[slot.absence.absenceType] = 0;
                            }
                            nShiftsAbsent_perAbsentType[slot.absence.absenceType] += 1;
                            absentOnDay[ind] = true;
                        }
                    });
                });
                let nDays_absent = absentOnDay.filter(isAbsent => isAbsent).length;
                // If the resource is absent on any day, return the reason
                if (nDays_absent) {
                    _calcParameter("USER_LANG");
                    let reason = {
                        "en": "Planned Absence",
                        "de": "Geplante Abwesenheit"
                    };
                    let explanations = [{
                        "en": "Planned absences on " + nDays_absent + " day(s).",
                        "de": "Geplante Abwesenheiten an " + nDays_absent + " Tag(en)."
                    }];
                    _calcParameter("ABSNECE_TYPES");
                    Object.keys(nShiftsAbsent_perAbsentType).forEach(absenceType => {
                        let absenceTypeName = (ABSENCE_TYPES.find(obj => obj.id === absenceType) || { name: _getCorrectTranslation({"en": "Unknown", "de": "Unbekannt"}, USER_LANG) }).name;
                        explanations.push({
                            "en": absenceTypeName + ": " + nShiftsAbsent_perAbsentType[absenceType] + " shift(s).",
                            "de": absenceTypeName + ": " + nShiftsAbsent_perAbsentType[absenceType] + " Schicht(en)."
                        });
                    });
                    return _returnFeedback(resEnum, timeFrame, reason, explanations, "absences");
                }
            },
            "getParams": function (resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc) {
                return [resEnum, settings];
            },
            "requiresMacroAllocSlots": false
        },
        "reason_tooMuchTimeRec": {
            "getReason": function (resEnum, settings, macAllocSlots_total) {
                // Find considered time frame - past
                let timeFrame = {
                    "beg": moment(settings.beg_corrected).isAfter(moment()) ? moment().format("YYYY-MM-DD") : settings.beg_corrected,
                    "end": moment(settings.end_corrected).isAfter(moment()) ? moment().format("YYYY-MM-DD") : settings.end_corrected
                }
                if (timeFrame.beg === timeFrame.end) return; // No time frame to consider
                let timeFrame_string = moment(timeFrame.beg).format("DD.MM.YYYY") + " - " + moment(timeFrame.end).subtract(1, "days").format("DD.MM.YYYY");
                timeFrame.scope = {
                    "en": "Past: " + timeFrame_string,
                    "de": "Vergangenheit: " + timeFrame_string
                };
                let ind_end = macAllocSlots_total.length - moment(settings.end_corrected).diff(moment(timeFrame.end), "days");
                // Check if in any of the total macro allocation slots, the actual time recorded is more than the expected presence time.
                let tooMuchTimeRec_onDay = macAllocSlots_total.map((slot, i) => {
                    if (i >= ind_end) return false; // Ignore days after the end of the time frame
                    let nHours_reported = 0;
                    slot.forecasts.forEach(forecast => {
                        nHours_reported += moment.duration(forecast.actual || "PT0S").asHours();
                    });
                    return nHours_reported > moment.duration(slot.expectedPresence || "PT0S").asHours();
                });
                let numberOfDaysTooMuchTimeRec = tooMuchTimeRec_onDay.filter(isTooMuch => isTooMuch).length;
                if (numberOfDaysTooMuchTimeRec > 0) {
                    _calcParameter("USER_LANG");
                    let reason = {
                        "en": "Too much Time Recorded",
                        "de": "Zu viel Zeit erfasst"
                    }
                    let explanations = [{
                        "en": "Recorded more time than present on " + numberOfDaysTooMuchTimeRec + " day(s).",
                        "de": "Mehr Zeit erfasst als anwesend an " + numberOfDaysTooMuchTimeRec + " Tag(en)."
                    }]
                    return _returnFeedback(resEnum, timeFrame, reason, explanations, "timerecording");
                }
            },
            "getParams": function (resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc) {
                let macAllocSlots_total = macAllocSlots_total_perRes ? macAllocSlots_total_perRes.find(macAllocSlotObj => macAllocSlotObj.resource.id === resEnum.id).workload.slots : null;
                return [resEnum, settings, macAllocSlots_total];
            },
            "requiresMacroAllocSlots": true
        },
        "reason_recNotFinished": {
            "getReason": function (resEnum, settings, macAllocSlots_total, actualsReportedUntil) {
                if (!_isEmp(resEnum)) return; // This reason is only applicable to employees
                // Find the reference date - the last day the resource was expected to work in the selected time frame
                let refDate = _lastPresentInTF(settings, macAllocSlots_total);
                if (!refDate) return; // No reference date found in the selected time frame
                // If the reference date is before the last day actuals were reported, return nothing
                if (!actualsReportedUntil || moment(actualsReportedUntil).isBefore(moment(refDate))) {
                    _calcParameter("USER_LANG");
                    let reason = {
                        "en": "Time Recording not finished",
                        "de": "Zeiterfassung nicht abgeschlossen"
                    }
                    let explanations = null;
                    if (actualsReportedUntil) {
                        explanations = [{
                            "en": "Expected to have worked until " + moment(refDate).format("DD.MM.YYYY") + " in the selected time frame, but the last time recording was on " + moment(actualsReportedUntil).format("DD.MM.YYYY") + ".",
                            "de": "Das System erwartet, dass die Ressource bis zum " + moment(refDate).format("DD.MM.YYYY") + " im ausgewählten Zeitraum gearbeitet hat, aber die letzte Zeiterfassung war am " + moment(actualsReportedUntil).format("DD.MM.YYYY") + "."
                        }]
                    } else {
                        explanations = [{
                            "en": "Resource has never recorded time yet.",
                            "de": "Die Ressource hat noch nie Zeit erfasst."
                        }]
                    }
                    let timeFrame = {
                        "scope": {
                            "en": "Reference Date: " + moment(refDate).format("DD.MM.YYYY"),
                            "de": "Stichtag: " + moment(refDate).format("DD.MM.YYYY")
                        }
                    }
                    return _returnFeedback(resEnum, timeFrame, reason, explanations, "timerecording");
                }
            },
            "getParams": function (resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc) {
                let macAllocSlots_total = macAllocSlots_total_perRes ? macAllocSlots_total_perRes.find(macAllocSlotObj => macAllocSlotObj.resource.id === resEnum.id).workload.slots : null;
                let actualsReportedUntil = macAllocSlots_total_perRes ? macAllocSlots_total_perRes.find(macAllocSlotObj => macAllocSlotObj.resource.id === resEnum.id).workload.actualsReportedUntil : null;
                return [resEnum, settings, macAllocSlots_total, actualsReportedUntil];
            },
            "requiresMacroAllocSlots": true
        },
        "reason_negTBAcc": {
            "getReason": function (resEnum, settings, tbAcc) {
                if (!_isEmp(resEnum)) return; // This reason is only applicable to employees
                // Find the reference date - the last day the resource was expected to work in the selected time frame
                let refDate = _refDateinTF(settings);
                if (!refDate) return; // No reference date found in the selected time frame
                // If the resource has a negative time balance, return the reason
                if (tbAcc && moment.duration(tbAcc).asHours() < 0) {
                    _calcParameter("USER_LANG");
                    let reason = {
                        "en": "Negative Time Balance",
                        "de": "Negatives Gleitzeitguthaben"
                    }
                    let explanations = [{
                        "en": "Resource has a negative time balance of " + _round(moment.duration(tbAcc).asHours()) + " hours at the reference date " + moment(refDate).format("DD.MM.YYYY") + ".",
                        "de": "Die Ressource hat ein negatives Gleitzeitguthaben von " + _round(moment.duration(tbAcc).asHours()) + " Stunden am Stichtag " + moment(refDate).format("DD.MM.YYYY") + "."
                    }];
                    let timeFrame = {
                        "scope": {
                            "en": "Reference Date: " + moment(refDate).format("DD.MM.YYYY"),
                            "de": "Stichtag: " + moment(refDate).format("DD.MM.YYYY")
                        }
                    }
                    return _returnFeedback(resEnum, timeFrame, reason, explanations, "worktimeoverview");
                }
            },
            "getParams": function (resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc) {
                return [resEnum, settings, tbAcc];
            },
            "requiresMacroAllocSlots": false,
            "requiresTBAcc": true
        },
        "reason_highTBAcc": {
            "getReason": function (resEnum, settings, tbAcc) {
                if (!_isEmp(resEnum)) return; // This reason is only applicable to employees
                // Find the reference date - the last day the resource was expected to work in the selected time frame
                let refDate = _refDateinTF(settings);
                if (!refDate) return; // No reference date found in the selected time frame
                // If the time balance is higher than the maximum allowed time balance, return the reason
                if (tbAcc && moment.duration(tbAcc) > moment.duration(MAX_TB_ACC)) {
                    _calcParameter("USER_LANG");
                    let reason = {
                        "en": "High Time Balance",
                        "de": "Hohes Gleitzeitguthaben"
                    }
                    let explanations = [{
                        "en": "Resource has a time balance of " + _round(moment.duration(tbAcc).asHours()) + " hours at the reference date " + moment(refDate).format("DD.MM.YYYY") + ". Threshold is set to " + _round(moment.duration(MAX_TB_ACC).asHours()) + " hours.",
                        "de": "Die Ressource hat ein Gleitzeitguthaben von " + _round(moment.duration(tbAcc).asHours()) + " Stunden am Stichtag " + moment(refDate).format("DD.MM.YYYY") + ". Der Schwellenwert ist auf " + _round(moment.duration(MAX_TB_ACC).asHours()) + " Stunden gesetzt."
                    }];
                    let timeFrame = {
                        "scope": {
                            "en": "Reference Date: " + moment(refDate).format("DD.MM.YYYY"),
                            "de": "Stichtag: " + moment(refDate).format("DD.MM.YYYY")
                        }
                    }
                    return _returnFeedback(resEnum, timeFrame, reason, explanations, "worktimeoverview");
                }
            },
            "getParams": function (resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc) {
                return [resEnum, settings, tbAcc];
            },
            "requiresMacroAllocSlots": false,
            "requiresTBAcc": true
        }
    }
    function _getReason_budgetExceeded(prjEnum, prjCosts, timeFrame, inTf) {
        let bgtAmount = (prjCosts.budgetTotal.budgetAmount || {"amount": 0}).amount;
        let plannedAmount = (prjCosts.forecastTotal.planned || {"amount": 0}).amount;
        if (bgtAmount >= plannedAmount) return; // Budget not exceeded
        let reason = {
            "en": inTf ? "Over Costs Budget in selected Time Frame" : "Over Total Costs Budget",
            "de": inTf ? "Über Kostenbudget im ausgewählten Zeitfenster" : "Über gesamtem Kostenbudget"
        };
        let currCode = pqfLib.utils.misc.mapCurrency(prjCosts.forecastTotal.planned.currency);
        let explanations = [{
            "en": "Planned project costs exceed budget by " + pqfLib.utils.format.printNumber(plannedAmount - bgtAmount, 2) + " " + currCode + (inTf ? " in the selected time frame." : "."),
            "de": "Geplante Kosten überschreiten Budget um " + pqfLib.utils.format.printNumber(plannedAmount - bgtAmount, 2) + " " + currCode + (inTf ? " im ausgewählten Zeitraum." : ".")
        }];
        return _returnFeedback(prjEnum, timeFrame, reason, explanations, "costs");
    }
    function _checkIndicator(repType, indicator) {
        let dimensionDef = _getCachedData("dimensionDefs", { "repType": repType, "dimension": indicator.selection.dimension });
        let statusClassDef = _getCachedData("statusClassDefs", { "statusClassId": dimensionDef ? dimensionDef.statusClassId : null });
        if (!dimensionDef || !statusClassDef) {
            message = "Failed to load status class definition for dimension " + indicator.selection.dimension + ".";
            pqfLib.utils.misc.log(debugLevel, "warn", "0521119A6CE74BC589E4528F3481ADDE", message);
            return;
        }
        let worstValue = statusClassDef.values.reduce((worst, value) => {
            if (value.rating < worst.rating) return value;
            return worst;
        }, statusClassDef.values[0]);
        if ((indicator.total.statusClass || { "id": null }).id === worstValue.id) {
            return {
                "en": "Dimension " + dimensionDef.name + " evaluated as " + worstValue.name + ".",
                "de": "Dimension " + dimensionDef.name + " bewertet als " + worstValue.name + "."
            };
        }
    }
    let PRJ_ATT_MAPPING = {
        "reason_overBgtInTF": {
            "getReason": function (prjEnum, settings, prjCosts_inTF) {
                let timeFrame = {
                    "scope": {
                        "en": moment(settings.beg_corrected).format("DD.MM.YYYY") + " - " + moment(settings.end_corrected).subtract(1, "days").format("DD.MM.YYYY"),
                        "de": moment(settings.beg_corrected).format("DD.MM.YYYY") + " - " + moment(settings.end_corrected).subtract(1, "days").format("DD.MM.YYYY")
                    }
                };
                return _getReason_budgetExceeded(prjEnum, prjCosts_inTF, timeFrame, true);
            },
            "getParams": function (prjEnum, settings, prjsCosts_inTF, prjsCosts_total, prjReps_perPrj_perType) {
                let prjCosts_inTF = prjsCosts_inTF.find(prjCosts => prjCosts.reference.id === prjEnum.id);
                return [prjEnum, settings, prjCosts_inTF];
            },
            "requires": ["prjsCosts_inTF"]
        },
        "reason_overBgtTotal": {
            "getReason": function (prjEnum, settings, prjCosts_total) {
                let scenario = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectActiveScenario, prjEnum.id, true);
                let mainTask = scenario ? pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, scenario.id)[0] : null;
                if (!mainTask) {
                    message = "Failed to load main task for project " + prjEnum.id + ".";
                    pqfLib.utils.misc.log(debugLevel, "warn", "A696B3B4C2EF4908ADAEC08776FBB49A", message);
                    return;
                }
                if (moment(mainTask.end) <= moment(settings.beg_corrected).local() || moment(mainTask.beg) >= moment(settings.end_corrected).local()) return; // Main task is outside of the selected time frame
                let timeFrame = {
                    "scope": {
                        "en": "Project Duration (overlaps selected Time Frame)",
                        "de": "Projektdauer (überlappt ausgewählten Zeitraum)"
                    }
                };
                return _getReason_budgetExceeded(prjEnum, prjCosts_total, timeFrame, false);
            },
            "getParams": function (prjEnum, settings, prjsCosts_inTF, prjsCosts_total, prjReps_perPrj_perType) {
                let prjCosts_total = prjsCosts_total.find(prjCosts => prjCosts.reference.id === prjEnum.id);
                return [prjEnum, settings, prjCosts_total];
            },
            "requires": ["prjsCosts_total"]
        },
        "reason_badReport_leadInd": {
            "getReason": function (prjEnum, settings, lastPrjRep) {
                if (!lastPrjRep || !lastPrjRep.indicators.leading) return;
                let explanation = _checkIndicator(lastPrjRep.type, lastPrjRep.indicators.leading);
                if (!explanation) return;
                let reason = {
                    "en": "Bad Report - Leading Indicator",
                    "de": "Schlechter Bericht - Führender Indikator"
                };
                let timeFrame = {
                    "scope": {
                        "en": moment(settings.beg_corrected).format("DD.MM.YYYY") + " - " + moment(settings.end_corrected).subtract(1, "days").format("DD.MM.YYYY"),
                        "de": moment(settings.beg_corrected).format("DD.MM.YYYY") + " - " + moment(settings.end_corrected).subtract(1, "days").format("DD.MM.YYYY")
                    }
                };
                return _returnFeedback(prjEnum, timeFrame, reason, [explanation], "projectreport");
            },
            "getParams": function (prjEnum, settings, prjsCosts_inTF, prjsCosts_total, prjRep_perPrj) {
                return [prjEnum, settings, prjRep_perPrj[prjEnum.id]];
            },
            "requires": ["prjs_latestReports"]
        },
        "reason_badReport_allInd": {
            "getReason": function (prjEnum, settings, lastPrjRep) {
                if (!lastPrjRep) return;
                let explanations = null;
                lastPrjRep.indicators.dimensions.forEach(indicator => {
                    let explanation = _checkIndicator(lastPrjRep.type, indicator);
                    if (explanation) {
                        if (!explanations) explanations = [];
                        explanations.push(explanation);
                    }
                });
                if (!explanations) return;
                let reason = {
                    "en": "Bad Report - All Indicators",
                    "de": "Schlechter Bericht - Alle Indikatoren"
                };
                let timeFrame = {
                    "scope": {
                        "en": moment(settings.beg_corrected).format("DD.MM.YYYY") + " - " + moment(settings.end_corrected).subtract(1, "days").format("DD.MM.YYYY"),
                        "de": moment(settings.beg_corrected).format("DD.MM.YYYY") + " - " + moment(settings.end_corrected).subtract(1, "days").format("DD.MM.YYYY")
                    }
                };
                return _returnFeedback(prjEnum, timeFrame, reason, explanations, "projectreport");
            },
            "getParams": function (prjEnum, settings, prjsCosts_inTF, prjsCosts_total, prjReps_perPrj) {
                return [prjEnum, settings, prjReps_perPrj[prjEnum.id]];
            },
            "requires": ["prjs_latestReports"]
        }
    };
    let LYC_STATE_CATEGORIES_MAPPING = {
        "lcyStateCats_new": "NEW",
        "lcyStateCats_planning": "PLANNING",
        "lcyStateCats_active": "ACTIVE",
        "lcyStateCats_closed": "CLOSED"
    }
    let HIGHLIGHT_RULES = {
        "linesToHighlight_negDelta": {
            "needHighlight": function (row) {
                return moment.duration(row.data[3]) < 0;
            },
            "applyHighlight": function (row) {
                if (!row.style) row.style = {};
                row.style["color"] = "#FF0000"; // Set the font color to red
                return row;
            }
        },
        "linesToHighlight_negTBAcc": {
            "needHighlight": function (row) {
                return moment.duration(row.data[4]) < 0;
            },
            "applyHighlight": function (row) {
                if (!row.style) row.style = {};
                row.style["color"] = "#FF0000"; // Set the font color to red
                return row;
            }
        }
    }
    let OBJS_MAPPING = {
        "Todo": {
            "label": { "en": "Todos", "de": "Todos" },
            "format": { "showIcon": true, "addLink": "details" },
            "getDataObjs": function (resEnums, relEnums, settings) {
                let itemSummaries = [];
                resEnums.forEach(resEnum => {
                    relEnums.forEach(relEnum => {
                        // Load the todos, filtered by the selected lifecycle state ids
                        let newItemSummaries = pqfLib.utils.apiFunc.exec(Pqf.pi, Pqf.pi.getProjectItemSummariesByRef, "Todo", relEnum.id, resEnum.type, resEnum.id, settings.lcyStateIds);
                        if (!newItemSummaries) {
                            let message = "Failed to load todo items for resource " + resEnum.id + " and relation " + relEnum.id + ".";
                            pqfLib.utils.misc.log(debugLevel, "warn", "5D2CACEDDCA148CABAD2684B433A9A52", message);
                            return;
                        }
                        // Filter todos without a validity start date or deadline (if necessary according to settings)
                        if (!settings.consider_noStartDate) {
                            newItemSummaries = newItemSummaries.filter(item => item.validityStart);
                        }
                        if (!settings.consider_noDeadline) {
                            newItemSummaries = newItemSummaries.filter(item => item.validityEnd);
                        }
                        // If time frame should be considered, filter the items by the time frame
                        if (settings.consider_timeFrame) {
                            newItemSummaries = newItemSummaries.filter(item => {
                                if (!item.validityStart && !item.validityEnd) return true; // No earliest start date or deadline specified, therefore not filtered
                                if (item.validityStart && !item.validityEnd) return moment(item.validityStart) <= moment(settings.end).subtract(1, 'days'); // Validity start date is before the end of the time frame
                                if (!item.validityStart && item.validityEnd) return moment(item.validityEnd).subtract(1, 'days') >= moment(settings.beg); // Validity end date is after the beginning of the time frame
                                if (item.validityStart && moment(item.validityStart) >= moment(settings.beg) && moment(item.validityStart) <= moment(settings.end).subtract(1, 'days')) return true; // Validity start date is within the time frame
                                if (item.validityEnd && moment(item.validityEnd).subtract(1, 'days') >= moment(settings.beg) && moment(item.validityEnd) <= moment(settings.end)) return true; // Validity end date is within the time frame
                                return false; // Item is not within the time frame
                            });
                        }
                        itemSummaries = itemSummaries.concat(newItemSummaries);
                    });
                });
                itemSummaries = itemSummaries.filter((item, index, self) => index === self.findIndex(i => i.id === item.id)); // Filter duplicates
                return itemSummaries;
            },
            "objSpecificCategoriesMeta": [
                {
                    "id": "classification_cat",
                    "label": { "en": "Classification", "de": "Klassifizierung" }
                }, 
                {
                    "id": "time_cat",
                    "label": { "en": "Time", "de": "Zeit" }
                }
            ],
            "objSpecificColumnsMeta": [
                {
                    "id": "prio_col",
                    "catid": "classification_cat",
                    "type": "enum",
                    "label": { "en": "Priority", "de": "Priorität" },
                    "options": { "width": 100 },
                    "format": { "showIcon": true, "addLink": false }
                },
                {
                    "id": "color_col",
                    "catid": "classification_cat",
                    "type": "enum",
                    "label": { "en": "Color", "de": "Farbe" },
                    "options": { "width": 100 },
                    "format": { "showIcon": true, "addLink": false }
                },
                {
                    "id": "start_col",
                    "catid": "time_cat",
                    "type": "date",
                    "label": { "en": "Earliest Start Date", "de": "Frühster Startzeitpunkt" },
                    "options": { "width": 100 },
                    "format": { "format": "L" }
                },
                {
                    "id": "end_col",
                    "catid": "time_cat",
                    "type": "date",
                    "label": { "en": "Deadline", "de": "Deadline" },
                    "options": { "width": 100 },
                    "format": { "format": "L" }
                },
                {
                    "id": "timeHorizon_col",
                    "catid": "time_cat",
                    "type": "string",
                    "label": { "en": "Time Horizon Deadline", "de": "Zeithorizont Deadline" },
                    "options": { "width": 200 }
                }
            ],
            "getObjSpecificColumnsData": function (todoSummary) {
                // Get the priority of the todo
                let prioEnum = null;
                if (todoSummary.marker) {
                    switch (todoSummary.marker) {
                        case 'CDE68BA071A2445F8B58D770B212E008':
                            prioEnum = {
                                "type": "prioMarker",
                                "id": "prio_low",
                                "name": _getCorrectTranslation({ "en": "Low", "de": "Tief" }, _getParameter("USER_LANG")),
                                "description": null,
                                "iconRef": null,
                                "color": "#67d1ff"
                            };
                            break;
                        case 'DF8586B06ADA4DA587BE1936BEE2022D':
                            prioEnum = {
                                "type": "prioMarker",
                                "id": "prio_medium",
                                "name": _getCorrectTranslation({ "en": "Medium", "de": "Mittel" }, _getParameter("USER_LANG")),
                                "description": null,
                                "iconRef": null,
                                "color": "#fcc01a"
                            };
                            break;
                        case '1F08A59E18FB489D9CC4649CD5F4BF83':
                            prioEnum = {
                                "type": "prioMarker",
                                "id": "prio_high",
                                "name": _getCorrectTranslation({ "en": "High", "de": "Hoch" }, _getParameter("USER_LANG")),
                                "description": null,
                                "iconRef": null,
                                "color": "#cb4647"
                            };
                            break;
                        default:
                            message = "Unknown priority marker: " + todoSummary.marker + ".";
                            pqfLib.utils.misc.log(1, "error", "C31F75D7905747AF9FEA5DC5BF479C6D", message);
                    }
                }
                // Get the color of the todo
                let colorEnum = pqfLib.utils.misc.toEnum(pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getEnumValue, 'COLOR-TODO', todoSummary.color, true));
                // Get the start and end date of the todo
                let startDate = todoSummary.validityStart ? moment(todoSummary.validityStart).format("YYYY-MM-DD") : null;
                let endDate = todoSummary.validityEnd ? moment(todoSummary.validityEnd).subtract(1, 'days').format("YYYY-MM-DD") : null;
                // Get the time horizon of the todo
                let timeHorizon = "";
                let today_moment = moment(_getParameter("DATE_TODAY"));
                let deadline_moment = todoSummary.validityEnd ? moment(todoSummary.validityEnd).subtract(1, 'days') : null
                let diffDays = deadline_moment ? deadline_moment.diff(today_moment, 'days') : null;
                if (!deadline_moment) {
                    timeHorizon = _getCorrectTranslation({ "en": "No Deadline", "de": "Keine Deadline" }, _getParameter("USER_LANG"));
                } else if (diffDays < 0) {
                    timeHorizon = _getCorrectTranslation({ "en": "Deadline Overdue", "de": "Deadline überfällig" }, _getParameter("USER_LANG"));
                } else if (diffDays === 0) {
                    timeHorizon = _getCorrectTranslation({ "en": "Today", "de": "Heute" }, _getParameter("USER_LANG"));
                } else if (diffDays <= 7) {
                    timeHorizon = _getCorrectTranslation({ "en": "Next 7 Days", "de": "Nächste 7 Tage" }, _getParameter("USER_LANG"));
                } else if (diffDays <= 30) {
                    timeHorizon = _getCorrectTranslation({ "en": "Next 30 Days", "de": "Nächste 30 Tage" }, _getParameter("USER_LANG"));
                } else {
                    timeHorizon = _getCorrectTranslation({ "en": "> 30 Days", "de": "> 30 Tage" }, _getParameter("USER_LANG"));
                }
                return [prioEnum, colorEnum, startDate, endDate, timeHorizon];
            },
            "doPostProcessing": function (row, dataObj) {}
        },
        "Meeting": {
            "label": { "en": "Meetings", "de": "Meetings" },
            "format": { "showIcon": true, "addLink": "details" },
            "getDataObjs": function (resEnums, relEnums, settings) {
                // Load the meeting lifecycle states
                let lcyStates = pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getTypeReachableStates, "Meeting");
                let meetings = [];
                resEnums.forEach(resEnum => {
                    relEnums.forEach(relEnum => {
                        settings.lcyStateIds.forEach(lcyStateId => {
                            // Load the meetings for the given lifecycle state id
                            let newMeetings = pqfLib.utils.apiFunc.exec(Pqf.mtg, Pqf.mtg.getMeetingsByRef, relEnum.id, resEnum.type, resEnum.id, lcyStateId);
                            if (!newMeetings) {
                                let message = "Failed to load meetings for resource " + resEnum.id + ", relation " + relEnum.id + " and lifecycle state " + lcyStateId + ".";
                                pqfLib.utils.misc.log(debugLevel, "warn", "97DA6C91B0FF4C3CBA0C87448B4BE20B", message);
                                return;
                            }
                            // Filter meetings without a start date or end date (if necessary according to settings)
                            if (!settings.consider_noStartDate) {
                                newMeetings = newMeetings.filter(meeting => meeting.timeStart);
                            }
                            // If time frame should be considered, filter the items by the time frame
                            if (settings.consider_timeFrame) {
                                newMeetings = newMeetings.filter(meeting => {
                                    if (!meeting.timeStart && !meeting.timeEnd) return true; // No start date or end date specified, therefore not filtered
                                    let meetingStart = moment(meeting.timeStart);
                                    let meetingEnd = moment(meeting.timeEnd);
                                    return meetingStart.isBetween(settings.beg, settings.end, null, '[]') ||
                                           meetingEnd.isBetween(settings.beg, settings.end, null, '[]');
                                });
                            }
                            // Add the lifecycle state attribute to each meeting
                            let lcyState = lcyStates.find(state => state.id === lcyStateId);
                            newMeetings.forEach(meeting => meeting.state = lcyState);
                            meetings = meetings.concat(newMeetings);
                        });
                    });
                });
                meetings = meetings.filter((meeting, index, self) => index === self.findIndex(m => m.id === meeting.id)); // Filter duplicates
                // For each meeting, load its relations
                meetings.forEach(meeting => {
                    let relations = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getAllRelations, "Meeting", meeting.id);
                    if (!relations) {
                        let message = "Failed to load relations for meeting " + meeting.id + ".";
                        pqfLib.utils.misc.log(debugLevel, "warn", "8757AF01E5F04F11953170D07363B562", message);
                        return;
                    }
                    meeting.relations = relations;
                });
                return meetings;
            },
            "objSpecificCategoriesMeta": [
                {
                    "id": "time_cat",
                    "label": { "en": "Dates", "de": "Daten" }
                }
            ],
            "objSpecificColumnsMeta": [
                {
                    "id": "from_col",
                    "catid": "time_cat",
                    "type": "date",
                    "label": { "en": "Starts on", "de": "Startet am" },
                    "options": { "width": 120 },
                    "format": { "format": "DD.MM.YYYY - HH:mm" }
                },
                {
                    "id": "duration_col",
                    "catid": "time_cat",
                    "type": "duration",
                    "label": { "en": "Duration", "de": "Dauer" },
                    "options": { "width": 80 },
                    "format": { "unit": "hour", "workTime": "HRM", "digits": 1 }
                },
                {
                    "id": "timeHorizon_col",
                    "catid": "time_cat",
                    "type": "string",
                    "label": { "en": "Time Horizon Start", "de": "Zeithorizont Start" },
                    "options": { "width": 200 }
                }
            ],
            "getObjSpecificColumnsData": function (meetingSummary) {
                let duration = moment.duration(moment(meetingSummary.timeEnd).diff(moment(meetingSummary.timeStart)));
                let timeHorizon = "";
                let diffDays = moment(meetingSummary.timeStart).diff(moment(_getParameter("DATE_TODAY")), 'days');
                if (!meetingSummary.timeStart) {
                    timeHorizon = _getCorrectTranslation({ "en": "No Start Date", "de": "Kein Startdatum" }, _getParameter("USER_LANG"));
                } else if (diffDays < 0) {
                    timeHorizon = _getCorrectTranslation({ "en": "In the past", "de": "In der Vergangenheit" }, _getParameter("USER_LANG"));
                } else if (diffDays === 0) {
                    timeHorizon = _getCorrectTranslation({ "en": "Today", "de": "Heute" }, _getParameter("USER_LANG"));
                } else if (diffDays <= 7) {
                    timeHorizon = _getCorrectTranslation({ "en": "In the next 7 days", "de": "In den nächsten 7 Tagen" }, _getParameter("USER_LANG"));
                } else if (diffDays <= 30) {
                    timeHorizon = _getCorrectTranslation({ "en": "In the next 30 days", "de": "In den nächsten 30 Tagen" }, _getParameter("USER_LANG"));
                } else {
                    timeHorizon = _getCorrectTranslation({ "en": "In more than 30 days", "de": "In mehr als 30 Tagen" }, _getParameter("USER_LANG"));
                }
                return  [moment(meetingSummary.timeStart).toISOString(), duration, timeHorizon];
            },
            "doPostProcessing": function (row, dataObj) {}
        },
        "Project": {
            "label": { "en": "Projects", "de": "Projekte" },
            "format": { "showIcon": true, "addLink": "details" },
            "getDataObjs": function (resEnums, relEnums, settings) {
                // Load the project lifecycle states
                let lcyStates = pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getTypeReachableStates, "Project");
                // Get the project IDs that should be considered
                let prjIds = [];
                resEnums.forEach(resEnum => {
                    let rels = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getBackwardRelations, resEnum.type, resEnum.id, "Project", null, null, false);
                    if (!rels) {
                        let message = "Failed to load backward relations for resource " + resEnum.id + ".";
                        pqfLib.utils.misc.log(debugLevel, "warn", "0BC265DA6B364639BB5C16C1BE7D90D0", message);
                        return;
                    }
                    prjIds = prjIds.concat(rels.map(rel => rel.source.id));
                });
                prjIds = prjIds.filter((id, index, self) => index === self.findIndex(i => i === id)); // Filter duplicates
                // For each project ID, load its data
                let prjs = [];
                let prjs_all = prjIds.length > 100 ? pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjects) : null; // Only works if user has permission to view all projects
                prjIds.forEach(prjId => {
                    // Load the project object, either from all projects (if available) or by loading it individually
                    let prj = null;
                    if (!prjs_all) {
                        prj = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProject, prjId);
                    } else {
                        prj = prjs_all.find(p => p.id === prjId);
                    }
                    if (!prj) {
                        let message = "Failed to load project " + prjId + ".";
                        pqfLib.utils.misc.log(debugLevel, "warn", "5BC29F4BFD7E4E178A16B462C8C85A9A", message);
                        return;
                    }
                    // Filter by lifecycle state ids
                    if (!settings.lcyStateIds.includes(prj.status)) return;
                    // Add the main task of the project
                    let scenario = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectActiveScenario, prj.id, true);
                    prj.mainTask = scenario ? (pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, scenario.id, false, null) || [])[0] : null;
                    // Filter by time frame (if necessary)
                    if (settings.consider_timeFrame) {
                        if (prj.mainTask) {
                            if (moment(prj.mainTask.end) <= moment(settings.beg).local() || moment(prj.mainTask.beg) >= moment(settings.end).local()) {
                                return; // Project is outside of the time frame
                            }
                        } else if (!settings.consider_noSchedule) {
                            return; // Project has no main task and unscheduled projects should not be considered
                        }
                    }
                    // Add the lifecycle state object to the project
                    prj.state = lcyStates.find(state => state.id === prj.status);
                    // Add the relations of the project
                    let relations = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getAllRelations, "Project", prjId);
                    if (!relations) {
                        let message = "Failed to load relations for project " + prjId.id + ".";
                        pqfLib.utils.misc.log(debugLevel, "warn", "9A6BF261660D492CB06964C96FB3DCDE", message);
                        return;
                    }
                    prj.relations = relations;
                    prjs.push(prj);
                });
                return prjs;
            },
            "objSpecificCategoriesMeta": [
                {
                    "id": "time_cat",
                    "label": { "en": "Dates", "de": "Daten" }
                }
            ],
            "objSpecificColumnsMeta": [
                {
                    "id": "from_col",
                    "catid": "time_cat",
                    "type": "date",
                    "label": { "en": "Start Date", "de": "Startdatum" },
                    "options": { "width": 100 },
                    "format": { "format": "L" }
                },
                {
                    "id": "to_col",
                    "catid": "time_cat",
                    "type": "date",
                    "label": { "en": "End Date", "de": "Enddatum" },
                    "options": { "width": 100 },
                    "format": { "format": "L" }
                },
                {
                    "id": "timeHorizon_col",
                    "catid": "time_cat",
                    "type": "string",
                    "label": { "en": "Time Horizon Start", "de": "Zeithorizont Start" },
                    "options": { "width": 200 }
                }
            ],
            "getObjSpecificColumnsData": function (todoSummary) {
                // Get the start and end date of the project (from its main task)
                let startDate = todoSummary.mainTask ? moment(todoSummary.mainTask.beg).format("YYYY-MM-DD") : null;
                let endDate = todoSummary.mainTask ? moment(todoSummary.mainTask.end).subtract(1, 'days').format("YYYY-MM-DD") : null;
                // Get the time horizon of the project
                let timeHorizon = "";
                let today = _getParameter("DATE_TODAY");
                let start_moment = todoSummary.mainTask && todoSummary.mainTask.beg ? moment(todoSummary.mainTask.beg) : null;
                let end_moment = todoSummary.mainTask && todoSummary.mainTask.end ? moment(todoSummary.mainTask.end).subtract(1, 'days') : null;
                if (!start_moment || !end_moment) {
                    timeHorizon = _getCorrectTranslation({ "en": "Project not scheduled", "de": "Projekt nicht terminiert" }, _getParameter("USER_LANG"));
                } else if (end_moment.isBefore(moment(today).subtract(30, 'days'))) {
                    timeHorizon = _getCorrectTranslation({ "en": "Finished more than 30 days ago", "de": "Abgeschlossen vor mehr als 30 Tagen" }, _getParameter("USER_LANG"));
                } else if (end_moment.isBefore(moment(today).subtract(7, 'days'))) {
                    timeHorizon = _getCorrectTranslation({ "en": "Finished in the last 30 days", "de": "Abgeschlossen in den letzten 30 Tagen" }, _getParameter("USER_LANG"));
                } else if (end_moment.isBefore(moment(today))) {
                    timeHorizon = _getCorrectTranslation({ "en": "Finished in the last 7 days", "de": "Abgeschlossen in den letzten 7 Tagen" }, _getParameter("USER_LANG"));
                } else if (end_moment.isSame(moment(today), 'day')) {
                    timeHorizon = _getCorrectTranslation({ "en": "Finishing today", "de": "Schließt heute ab" }, _getParameter("USER_LANG"));
                } else if (start_moment.isSame(moment(today), 'day')) {
                    timeHorizon = _getCorrectTranslation({ "en": "Starting today", "de": "Startet heute" }, _getParameter("USER_LANG"));
                } else if (start_moment.isBefore(moment(today))) {
                    timeHorizon = _getCorrectTranslation({ "en": "Currently running", "de": "Aktuell laufend" }, _getParameter("USER_LANG"));
                } else if (start_moment.isBefore(moment(today).add(7, 'days'))) {
                    timeHorizon = _getCorrectTranslation({ "en": "Starting in the next 7 days", "de": "Startet in den nächsten 7 Tagen" }, _getParameter("USER_LANG"));
                } else if (start_moment.isBefore(moment(today).add(30, 'days'))) {
                    timeHorizon = _getCorrectTranslation({ "en": "Starting in the next 30 days", "de": "Startet in den nächsten 30 Tagen" }, _getParameter("USER_LANG"));
                } else {
                    timeHorizon = _getCorrectTranslation({ "en": "Starting in more than 30 days", "de": "Startet in mehr als 30 Tagen" }, _getParameter("USER_LANG"));
                }
                return [startDate, endDate, timeHorizon];
            },
            "doPostProcessing": function (row, dataObj) {}
        },
        "Phase": {
            "label": { "en": "Tasks", "de": "Tasks" },
            "format": { "showIcon": false, "addLink": true },
            "getDataObjs": function (tasks, relEnums, settings) {
                tasks.forEach(task => {
                    let relations = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getAllRelations, "Phase", task.projectId);
                    if (!relations) {
                        let message = "Failed to load relations for task " + task.id + ".";
                        pqfLib.utils.misc.log(debugLevel, "warn", "042A5806C74C4D2EAE37381F6790A3B7", message);
                        return;
                    }
                    task.relations = relations;
                });
                return tasks.filter(task => {
                    return moment(task.beg).local() < moment(settings.end).local() && 
                        moment(task.end).local() > moment(settings.beg).local() && 
                        task.phaseType === "PROJECT_PHASE";
                });
            },
            "objSpecificCategoriesMeta": [
                {
                    "id": "categorization_cat",
                    "label": { "en": "Categorization", "de": "Kategorisierung" }
                },
                {
                    "id": "properties_cat",
                    "label": { "en": "Properties", "de": "Eigenschaften" }
                }
            ],
            "objSpecificColumnsMeta": [
                {
                    "id": "color_col",
                    "catid": "categorization_cat",
                    "type": "enum",
                    "label": { "en": "Color", "de": "Farbe" },
                    "options": { "width": 100 },
                    "format": { "showIcon": true, "addLink": false }
                },
                {
                    "id": "phase_col",
                    "catid": "categorization_cat",
                    "type": "enum",
                    "label": { "en": "Project Phase", "de": "Projektphase" },
                    "options": { "width": 100 },
                    "format": { "showIcon": true, "addLink": false }
                }
            ].concat(pqfLib.properties.constructPropCols("ProjectWorkItem", "properties_cat")),
            "getObjSpecificColumnsData": function (task) {
                let color = {
                    "id": "color_" + (task.color ? task.color.replace("#", "") : ""),
                    "type": null,
                    "name": task.color || _getCorrectTranslation({ "en": "No Color", "de": "Keine Farbe" }, _getParameter("USER_LANG")),
                    "icon": null,
                    "color": task.color || null
                };
                let pmMethodPhase = pqfLib.utils.misc.toEnum(_getCachedData("pmMethodPhases").find(pmMethodPhase => pmMethodPhase.id === task.projectManagementMethodPhaseId));
                task.type = "ProjectWorkItem"; // For property retrieval
                let propValues = pqfLib.properties.getPropValues(task);
                return [color, pmMethodPhase].concat(propValues);
            },
            "doPostProcessing": function (row, dataObj) {
                // Make link work properly
                row.data[0].type = "Project";
                row.data[0].id = dataObj.projectId;
                row.data[0].feature = "gantt&itemtype=Phase&itemid=" + dataObj.id;
            }
        }
    }

    /**
     * Returns the mapping object for the given mapping name.
     * 
     * @param {string} mapping - The name of the mapping to return. Possible values:
     *   - "ZOOM_MAPPING": Returns the zoom mapping object. By default, its attributes map the given zoomId to the following attributes:
     *     - "zoom": The zoom type (e.g., "DAY", "WEEK", "MONTH").
     *     - "unit": The unit of the zoom (e.g., "day", "week", "month").
     *     - "format": The format of the zoom (e.g., "DD.MM", "WW", "MMM").
     *   - "UNIT_MAPPING": Returns the unit mapping object. By default, its attributes map the given unitId to the following attributes:
     *     - "unit": The unit of the duration (e.g., "hour", "day").
     *     - "unit_string": The string representation of the unit (e.g., "(h)", "(PT)").
     *     - "getConversion": A function that takes a duration and returns the value in the selected unit. The function takes a single parameter:
     *       - "duration": The duration in ISO format
     *   - "BASE_FLOW_MAPPING": Returns the base flow mapping object. By default, its attributes map the given baseFlowId to the following attributes:
     *     - "label": The label of the base flow in english and german.
     *     - "getValue": A function that returns the value of the base flow for the given index. The function takes the following parameters:
     *       - "macAllocSlots_perCompCol": An object containing the macro allocation slots for the comparison columns. The keys are the comparison column ids and the values are arrays of macro allocation slots.
     *       - "slotInd": The index of the slot to get the value for.
     *       - "sumBaseflow": A boolean indicating whether to sum the base flow values across all comparison columns. If true, the function will return the total value for the base flow across all comparison columns. If false, it will return the value for the first comparison column only.
     *   - "COMP_FLOW_MAPPING": Returns the comparison flow mapping object. By default, its attributes map the given compFlowId to the following attributes:
     *     - "label": The label of the comparison flow in english and german.
     *     - "getValue": A function that returns the value of the comparison flow for the given index. The function takes the following parameters:
     *       - "slots": An array of macro allocation slots for the comparison flow.
     *       - "slotInd": The index of the slot to get the value for.
     * @return {Object} - The mapping object for the given mapping name.
     * @example
     * const ZOOM_MAPPING = pqfWidgetLib.getMapping("ZOOM_MAPPING");
     * 
     * // returns object:
     * {
     *   "zoom_day": {
     *     "zoom": "DAY",   
     *     "unit": "day",
     *     "format": "DD.MM"
     *   },
     *   "zoom_week": {
     *     "zoom": "WEEK",
     *     "unit": "week",
     *     "format": "WW"
     *   },
     *   "zoom_month": {
     *     "zoom": "MONTH",
     *     "unit": "month",
     *     "format": "MMM"
     *   }
     * }
     */
    function _getMapping(mapping) {
        const MAPPINGS = {
            "ZOOM_MAPPING": ZOOM_MAPPING,
            "UNIT_MAPPING": UNIT_MAPPTING,
            "BASE_FLOW_MAPPING": BASE_FLOW_MAPPING,
            "COMP_FLOW_MAPPING": COMP_FLOW_MAPPING
        }
        if (MAPPINGS[mapping]) return MAPPINGS[mapping];
        message = "Unknown mapping: " + mapping;
        pqfLib.utils.misc.log(debugLevel, "error", "CE8C59A0ECE64E5387F4C732B45F682D", message);
    }

    /**
     * Overwrites the value of a mapping with a new value.
     * 
     * @param {string} mapping - The name of the mapping to overwrite. Possible
     *   types are described in the function definition of _getMapping.
     * @param {Object} value - The new value to set for the mapping. The value
     *   should be an object with at least the attributes that are defined
     *   in the default mapping.
     * @example
     * // Overwrite the ZOOM_MAPPING with a new value
     * pqfWidgetLib.overwriteMapping(
     *   "ZOOM_MAPPING", 
     *   {
     *     "zoom_day": {
     *       "zoom": "DAY",
     *       "unit": "day",
     *       "format": "DD" // changed from "DD.MM" to "DD"
     *     },
     *     ...
     *   }
     * );
     */
    function _overwriteMapping(mapping, value) {
        const knownMappings = {
            "ZOOM_MAPPING": ZOOM_MAPPING,
            "UNIT_MAPPING": UNIT_MAPPTING,
            "BASE_FLOW_MAPPING": BASE_FLOW_MAPPING,
            "COMP_FLOW_MAPPING": COMP_FLOW_MAPPING
        }
        if (knownMappings.hasOwnProperty(mapping)) {
            knownMappings[mapping] = value;
        } else {
            message = "Unknown mapping: " + mapping;
            pqfLib.utils.misc.log(debugLevel, "error", "C2E21C7905CB49E2AE9472E7334C98BF", message);
        }
    }

    // EFFORT WIDGETS ##########################################################

    /**
     * Functions that have been written for the effort widgets.
     * 
     * @namespace json
     * @memberof module:pqfDataCollectorLib
     */

    /**
     * Given the client object, this function reads the property settings and  returns the corresponding ids in a JSON object as key - id pairs.
     * Note: This function assumes that the widget properties are configured in a fixed way. Therefore, it will not work for any other widget type than effort widgets.
     * 
     * @param {Object} client - The client object given to the sandbox, containing the configuration properties with the imputs made by the user.
     * @param {Object} [defaults={ ... }] - Optional default values for the settings These defaults are used if certain values are not provided by the client object. If not specified, the function will use the default values:
     * - "beg": "2024-11-30T23:00:00.000Z"
     * - "end": "2025-06-30T21:59:59.999Z"
     * - "zoomId": "zoom_month"
     * - "unitId": "unit_hours"
     * - "baseFlowId": "baseFlow_allocated"
     * - "compFlowId": "compFlow_actual"
     * - "compSplitTypId": "compSplitTyp_prjs"
     * @returns {Object} - A JSON object with the ids of the made settings. The keys are: "beg", "end", "zoom", "unit", "baseFlow", "compFlow".
     * @alias .readSettings
     * @memberof module:pqfWidgetLib.effort
     */
    function _readSettings_effortWidget(client, defaults) {
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            beg: "2024-11-30T23:00:00.000Z",
            end: "2025-06-30T21:59:59.999Z",
            zoomId: "zoom_month",
            unitId: "unit_hours",
            baseFlowId: "baseFlow_allocated",
            compFlowId: "compFlow_actual",
            compSplitTypId: "compSplitTyp_prjs"
        }
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        // Read the property settings
        function _getSelectedPropId(groupPrefix, defaultId) {
            let props = client.config.properties.filter(prop => prop.id && prop.id.startsWith(groupPrefix));
            if (!props.some(prop => prop.type === "enum")) return (props.find(prop => prop.value) || { "id": defaultId}).id;
            return (props[0] || {"selectedItem": [defaultId]}).selectedItem;
        }
        let settings = {
            "zoomId": _getSelectedPropId("zoom_", defaults.zoomId),
            "unitId": _getSelectedPropId("unit_", defaults.unitId),
            "baseFlowId": _getSelectedPropId("baseFlow_", defaults.baseFlowId),
            "compFlowId": _getSelectedPropId("compFlow_", defaults.compFlowId),
            "compSplitTypId": _getSelectedPropId("compSplitTyp_", defaults.compSplitTypId)
        };
        // Read the selected start and end dates and adjust them to the selected zoom
        settings = _readTimeframe(client, defaults, settings);

        return settings;
    }

    /**
     * Constructs a JTF object with the attributes "meta" and "data". It is intended to be used for JTF widgets that display effort data.
     * 
     * @param {String} refObjId - The id of the reference object for which the JTF is constructed. It usually corresponds to the object on which the widget is displayed.
     * @param {Object} settings - The settings object as received by the function _readSettings_effortWidget. The function adds the following attributes:
     *   - "beg_corrected": The corrected beginning date of the period, adjusted to the planning range. For all API calls, this corrected date should be used.
     *   - "end_corrected": The corrected end date of the period, adjusted to the planning range. For all API calls, this corrected date should be used.
     *   - "prependElements": The number of elements to prepend to the JTF data, if the selected period starts before the planning range.
     *   - "appendElements": The number of elements to append to the JTF data, if the selected period ends after the planning range.
     * @param {Function} _getCompColEnums - A function that returns the comparison column enums for the given reference object and settings. Typically, it returns an array of resource or project enums. It takes the following inputs:
     *   - "refObjId": The id of the reference object for which the comparison columns are constructed.
     *   - "settings": The settings object as received by the function _readSettings_effortWidget, along with the attributes "beg_corrected", "end_corrected", "prependElements", and "appendElements".
     * @param {Function} _getMacAllocSlots_perCompCol - A function that returns the macro allocation slots per comparison column for the given reference object and settings. This object will then be passed to the _getValue function of the base and comparison flow mappings. It takes the following inputs:
     *   - "refObjId": The id of the reference object for which the macro allocation slots are constructed.
     *   - "settings": The settings object as received by the function _readSettings_effortWidget, along with the attributes "beg_corrected", "end_corrected", "prependElements", and "appendElements".
     *   - "compColEnumIds": An array of the enum ids returned by the function _getCompColEnums. They should be used as keys for the returned object.
     * @param {Function} _getMacAllocSlots_total - A function that returns the total macro allocation slots for the given reference object and settings. This object is used as a fallback if the function _getMacAllocSlots_perCompCol returns null. It takes the following inputs:
     *   - "refObjId": The id of the reference object for which the macro allocation slots are constructed.
     *   - "settings": The settings object as received by the function _readSettings_effortWidget, along with the attributes "beg_corrected", "end_corrected", "prependElements", and "appendElements".
     * @returns {Object} - The constructed JTF contains one data row per zoom (i.e., day, month, or year), with its columns displaying information about the selected base and comparison effort flow. For more information about the structure of the object please refer to the documentation of _constructJtf and JTFs in general for more information).
     * @example
     * // Please refer to any effort widget sandbox for an example of how to use this function.
     * @alias .constructJTF
     * @memberof module:pqfWidgetLib.effort
     */
    function _constructJtf_effortWidget(refObjId, settings, _getCompColEnums, _getMacAllocSlots_perCompCol, _getMacAllocSlots_total) {
        // Check if the selected time range is within the allowed planning range and, if not, now many slots need to be prepended and / or appended
        settings = _getCorrectedDates(settings);

        // Define functions to construct the JTF meta
        let _constructOptions = function () {
            return null;
        };
        let _constructCategories = function () {
            return [
                {
                    "id": "period_cat",
                    "label": { "en": "Period", "de": "Zeitraum" }
                },
                {
                    "id": "baseFlow_cat",
                    "label": { "en": "Base Flow", "de": "Basisfluss" }
                },
                {
                    "id": "compFlow_cat",
                    "label": { "en": "Comparison Flow", "de": "Vergleichsfluss" }
                }
            ]
        };
        let _constructColumns = function (unitId, baseFlowId, compFlowId, compColumnNames, _getMacAllocSlots_perCompCol) {
            let columns = [];
            // Add period column
            columns.push({
                "id": "period_col",
                "catid": "period_cat",
                "type": "daterange",
                "label": { "en": "Period", "de": "Zeitraum" },
                "options": { "width": 100, "aggregation": "none" },
                "format": { "format": "L" }
            });
            // Add base flow column
            columns.push({
                "id": "baseFlow_col",
                "catid": "baseFlow_cat",
                "type": "duration",
                "label": _appendPerLang(BASE_FLOW_MAPPING[baseFlowId].label, " Total"),
                "options": { "width": 100, "aggregation": "sum" },
                "format": { "digits": 1, "unit": UNIT_MAPPTING[unitId].unit, "workTime": "HRM" },
                "style": { "fontWeight": "bold" }
            });
            // Add comparison flow columns
            compColumnNames.forEach( (columnName, ind) => {
                columns.push({
                    "id": "compFlow_" + ind + "_col",
                    "catid": "compFlow_cat",
                    "type": "duration",
                    "label": _appendPerLang(COMP_FLOW_MAPPING[compFlowId].label, " - " + columnName),
                    "options": { "width": 100, "aggregation": "sum" },
                    "format": { "digits": 1, "unit": UNIT_MAPPTING[unitId].unit, "workTime": "HRM" }
                });
            });
            return columns;
        }
        let _constructData = function (refObjId, settings, compColEnumIds, _getMacAllocSlots_perCompCol, _getMacAllocSlots_total) { 
            // Load the macro allocation slots for the selected period
            let macAllocSlots_perCompCol = compColEnumIds.length > 0 ? _getMacAllocSlots_perCompCol(refObjId, settings, compColEnumIds) : null;
            let macAllocSlots_total = macAllocSlots_perCompCol ? null : _getMacAllocSlots_total(refObjId, settings);
            if (!macAllocSlots_perCompCol && !macAllocSlots_total) {
                message = "Failed to load macro allocation slots for the selected period with the given settings and function.";
                pqfLib.utils.misc.log(debugLevel, "warn", "F6E06120964445599529DFE16F46E4EE", message);
                return [];
            }
            // Construct the period column values
            let periodCol_values = _constuctPeriodColValues(settings);
            // Construct the data rows
            let jtf_data = [];
            periodCol_values.forEach((period, slotInd) => {
                // Create a new row for each period
                let row = {
                    "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                    "data": [period] // Start with the period column
                };
                // Add base flow value
                let sumBaseflow = settings.compSplitTypId === "compSplitTyp_emps" ? true : false;
                row.data.push(BASE_FLOW_MAPPING[settings.baseFlowId].getValue(macAllocSlots_perCompCol || macAllocSlots_total, slotInd, sumBaseflow));
                // Add comparison flow values for each comparison column (if macAllocSlots_perCompCol is null, simply add 0)
                compColEnumIds.forEach(enumId => {
                    row.data.push((macAllocSlots_perCompCol && macAllocSlots_perCompCol[enumId]) ? COMP_FLOW_MAPPING[settings.compFlowId].getValue(macAllocSlots_perCompCol[enumId], slotInd) : "PT0S");
                });
                jtf_data.push(row);
            });
            return jtf_data;
        };

        // Construct the resulting JTF object
        let compColEnums = _getCompColEnums(refObjId, settings);
        if (!compColEnums) {
            message = "Failed to load comparison columns for the selected reference object and settings. The function _getCompColEnums is expected to return an empty array if no columns shall be present.";
            pqfLib.utils.misc.log(debugLevel, "error", "6EBDE555E1DC40C5943A129233965EB1", message);
            return [];
        }
        let params_options = [];
        let params_categories = [];
        let params_columns = [
            settings.unitId,
            settings.baseFlowId,
            settings.compFlowId,
            compColEnums.map(enumObj => enumObj.name)
        ];
        let params_data = [
            refObjId,
            settings,
            compColEnums.map(enumObj => enumObj.id),
            _getMacAllocSlots_perCompCol,
            _getMacAllocSlots_total
        ];
        let jtf = _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );

        // Add the total column for the comparison flow
        let totalColMeta = {
            "id": "compFlow_total_col",
            "catid": "compFlow_cat",
            "type": "duration",
            "label": _appendPerLang(COMP_FLOW_MAPPING[settings.compFlowId].label, " Total"),
            "options": { width: 100, aggregation: "sum" },
            "format": { digits: 1, "unit": UNIT_MAPPTING[settings.unitId].unit, "workTime": "HRM" },
            "style": { "fontWeight": "bold" }
        };
        let totalColInd = 2;
        let durationColInds = new Array(jtf.meta.columns.length - 2).fill(0).map((_, i) => i + 2);
        jtf = _addTotalDurationCol(jtf, totalColMeta, totalColInd, durationColInds);
        // For each duration columns, add a hidden column with the duration in the selected unit
        jtf = _simplifyDurationCols(jtf, settings);

        return jtf;
    }

    /**
     * Constructs a base vs. comparison chart object for the effort widget. The first element in the datasets array is the base flow, and the subsequent elements are the comparison flows.
     * 
     * @param {Object} jtf - The JTF object containing the data for the chart.
     * @param {Object} settings - The settings object as received by the function effort._readSettings_effortWidget. It should contain the following attributes:
     *   - "baseFlowId": The id of the base flow to use for the chart.
     *   - "compFlowId": The id of the comparison flow to use for the chart.
     * @return {Object} - The chart object that can be appended to the JTF.charts array. 
     * @example
     * let jtf = pqfWidgetLib.effort.constructJTF(...);
     * if (!jtf.charts) jtf.charts = [];
     * jtf.charts = jtf.charts.concat(pqfWidgetLib.effort.getBaseVsCompChart(jtf, settings));
     * // return value
     * {
     *   id: "structuredbar_baseVsComp",
     *   name: "Base Flow vs. Comparison Flow",
     *   type: "structuredbar",
     *   baseline: {
     *     id: "period_col",
     *     name: "Timeline",
     *     type: "daterange",
     *     format: { format: "L" }
     *   },
     *   datasets: [
     *     {
     *       id: "baseFlow_col_numb",
     *       name: "Base Flow Total (h)",
     *       type: "number",
     *       color: null, // null means default color
     *       unit: "h"
     *     },
     *     {
     *       id: "compFlow_0_col_numb",
     *       name: "Comparison Flow - Project 1 (h)",
     *       type: "number",
     *       color: null, // null means default color
     *       aggregation: "sum",
     *       unit: "h"
     *     },
     *     ... // other comparison flows
     *   ],
     *   axis: null
     * }
     * @alias .getBaseVsCompChart
     * @memberof module:pqfWidgetLib.effort
     */
    function _getBaseVsCompChart_effortWidget(jtf, settings) {
        // Define function to get the datasets for the chart
        function _getDatasets(columns, settings) {
            let datasets = [];
            // Add base flow dataset
            datasets.push({
                "id": "baseFlow_col_numb",
                "name": columns.find(col => col.id === "baseFlow_col_numb").label[USER_LANG],
                "type": "number",
                "color": null,
                "unit": UNIT_MAPPTING[settings.unitId].unit_string
            });
            // Add comparison flow dataset
            columns.forEach(col => {
                if (col.id.startsWith("compFlow_") && col.id.endsWith("_numb") && col.id !== "compFlow_total_col_numb") {
                    datasets.push({
                        "id": col.id,
                        "name": col.label[USER_LANG],
                        "type": "number",
                        "color": null, // Blue
                        "aggregation": "sum",
                        "unit": UNIT_MAPPTING[settings.unitId].unit_string
                    });
                }
            });
            return datasets;
        }
        // Construct the chart object
        _calcParameter("USER_LANG");
        return chart = {
            "id": "structuredbar_baseVsComp",
            "name": _concatPerLang(BASE_FLOW_MAPPING[settings.baseFlowId].label, COMP_FLOW_MAPPING[settings.compFlowId].label, " vs. ")[USER_LANG],
            "type": "structuredbar",
            "baseline": {
                "id": "period_col",
                "name": "Timeline",
                "type": jtf.meta.columns[0].type,
                "format": {
                    "format":  ZOOM_MAPPING[settings.zoomId].format
                }
            },
            "datasets": _getDatasets(jtf.meta.columns, settings),
            "axis": {
                "showAxisName": true,
                "x": {
                    "name": ZOOM_MAPPING[settings.zoomId].axisName
                },
                "y": {
                    "name": UNIT_MAPPTING[settings.unitId].axisName
                }
            }
        }
    }

    /**
     * Adds two slots arrays together by index. It sums the duration and number values directly and concatenates the forecasts arrays.
     * 
     * @param {Array} slots_a - The first slots array to sum.
     * @param {Array} slots_b - The second slots array to sum.
     * @param {boolean} [onlyForecasts=false] - If true, only the forecasts arrays will be concatenated, and the other values will not be summed. Needed if the resulting JTF should show the comparison columns per resource.
     * @return {Array} - The summed slots array.
     * @example
     * let slots_a = macAllocSlots[i].workload.slots;
     * let slots_b = macAllocSlots[j].workload.slots;
     * let summedSlots = pqfWidgetLib.effort.sumSlotsArrays(slots_a, slots_b);
     * // return value
     * [
     *   {
     *     availability: "PT8H", // sum of a and b
     *     capacity: "PT8H", // sum of a and b
     *     fte: "PT8H", // sum of a and b
     *     ftePercent: 100, // sum of a and b
     *     presence: "PT8H", // sum of a and b
     *     expectedPresence: "PT8H", // sum of a and b
     *     deviationFromOptimum: 0, // sum of a and b
     *     forecasts: [ // concatenated forecasts from a and b
     *       { // forecast from a
     *         planned: "PT4H",
     *         actual: "PT3H",
     *         expectedActual: "PT3H",
     *         remaining: "PT1H"
     *       },
     *       ... // other forecasts from a and those from b
     *     ]
     *   },
     *   ...
     * ]
     *       
     * @alias .sumSlotsArrays
     * @memberof module:pqfWidgetLib.effort
     */
    function _sumSlotsArrays(slots_a, slots_b, onlyForecasts) {
        if (typeof onlyForecasts === "undefined") {
            onlyForecasts = false; // Default to false if not provided
        }
        if (!slots_a || !slots_b) {
            return slots_a || slots_b;
        }
        // Sum the slots
        let summedSlots = JSON.parse(JSON.stringify(slots_a));
        summedSlots.forEach((slot, ind) => {
            if (!onlyForecasts) {
                slot.availability = moment.duration(slot.availability || "PT0S").add(moment.duration(slots_b[ind].availability || "PT0S")).toISOString();
                slot.capacity = moment.duration(slot.capacity || "PT0S").add(moment.duration(slots_b[ind].capacity || "PT0S")).toISOString();
                slot.fte = moment.duration(slot.fte || "PT0S").add(moment.duration(slots_b[ind].fte || "PT0S")).toISOString();
                slot.ftePercent = (slot.ftePercent || 0) + (slots_b[ind].ftePercent || 0);
                slot.presence = moment.duration(slot.presence || "PT0S").add(moment.duration(slots_b[ind].presence || "PT0S")).toISOString();
                slot.expectedPresence = moment.duration(slot.expectedPresence || "PT0S").add(moment.duration(slots_b[ind].expectedPresence || "PT0S")).toISOString();
                slot.deviationFromOptimum = (slot.deviationFromOptimum || 0) + (slots_b[ind].deviationFromOptimum || 0);
            }
            slot.forecasts = (slot.forecasts || []).concat(slots_b[ind].forecasts || []);
        });
        return summedSlots;
    }

    /**
     * Returns an empty slot object with all values set to zero or empty. This function is intended to be used to pre- and append empty slots in case the selected period starts before or ends after the planning range.
     * 
     * @returns {Object} - An empty slot object with all values set to "PT0S", 0, or empty arrays.
     * @example
     * if (settings.prependElements) {
     *   // Prepend empty slots to the beginning of the array
     *   for (let i = 0; i < settings.prependElements; i++) {
     *     macAllocSlotsObj.slots.unshift(pqfWidgetLib.effort.getEmptySlot());
     *   }
     * }
     * @alias .getEmptySlot
     * @memberof module:pqfWidgetLib.effort
     */
    function _getEmptySlot() {
        return {
            "availability": "PT0S",
            "capacity": "PT0S",
            "fte": "PT0S",
            "ftePercent": 0,
            "presence": "PT0S",
            "expectedPresence": "PT0S",
            "deviationFromOptimum": 0,
            "forecasts": []
        }
    }

    // OPEN CAPACITY ###########################################################

    /**
     * Functions that have been written for the open capacity widgets.
     * 
     * @namespace json
     * @memberof module:pqfDataCollectorLib
     */

    /**
     * Reads the settings for the open capacity widget from the client object (please refer to the documentation of effort.readSettings for more details).
     * 
     * @param {Object} client
     * @param {*} defaults If not specified, the function will use the default values:
     * - "beg": "2024-11-30T23:00:00.000Z"
     * - "end": "2025-06-30T21:59:59.999Z"
     * - "zoomId": "zoom_month"
     * - "unitId": "unit_hours"
     * - "inclMoney": true
     * - "inclSubOUs": false
     * @returns {Object} A JSON object with the ids of the made settings. The keys are: "beg", "end", "zoomId", "unitId", "inclMoney", "inclSubOUs".
     * @alias .readSettings
     * @memberof module:pqfWidgetLib.openCapa
     */
    function _readSettings_openCapaWidget(client, defaults) {
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            beg: "2024-11-30T23:00:00.000Z",
            end: "2025-06-30T21:59:59.999Z",
            zoomId: "zoom_month",
            unitId: "unit_hours",
            inclMoney: true,
            inclSubOUs: false
        }
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        // Read the property settings
        function _getSelectedPropId(groupPrefix, defaultId) {
            let props = client.config.properties.filter(prop => prop.id && prop.id.startsWith(groupPrefix));
            if (!props.some(prop => prop.type === "enum")) return (props.find(prop => prop.value) || { "id": defaultId}).id;
            return (props[0] || {"selectedItem": [defaultId]}).selectedItem;
        }
        // Read the property settings
        let settings = {
            "zoomId": _getSelectedPropId("zoom_", defaults.zoomId),
            "unitId": _getSelectedPropId("unit_", defaults.unitId),
            "inclMoney": (client.config.properties.find(prop => prop.id === "dataToShow_inclMoney") || { "value": defaults.inclMoney }).value,
            "inclSubOUs": (client.config.properties.find(prop => prop.id === "resToConsider_inclSubOUs") || { "value": defaults.inclSubOUs }).value
        };
        // Read the selected start and end dates and adjust them to the selected zoom
        settings = _readTimeframe(client, defaults, settings);

        return settings;
    }

    /**
     * Constructs the JTF for the open capacity widget (please refer to the documentation of effort.constructJTF for more details).
     * 
     * @param {string} refObjId
     * @param {Object} settings - Again adds the attributes "beg_corrected", "end_corrected", "prependElements", and "appendElements".
     * @param {Function} _getResEnumsToConsider - A function returning the resource enums that should be considered for the widget data. It takes the following inputs:
     *   - "refObjId": The id of the reference object for which the resource enums are constructed.
     *   - "settings": The settings object as received by the function _readSettings_openCapaWidget, along with the attributes "beg_corrected", "end_corrected", "prependElements", and "appendElements".
     * @returns {Object} - The constructed JTF object contains one data row per zoom (i.e., day, month, or year), with its columns displaying information about the open capacity (in time and, optionally, money) for each resource enum that is returned by the function _getResEnumsToConsider.
     * @alias .constructJTF
     * @memberof module:pqfWidgetLib.openCapa
     */
    function _constructJtf_openCapaWidget(refObjId, settings, _getResEnumsToConsider) {
        // Check if the selected time range is within the allowed planning range and, if not, now many slots need to be prepended and / or appended
        settings = _getCorrectedDates(settings);

        // Define functions to construct the JTF meta
        let _constructOptions = function () {
            return null;
        };
        let _constructCategories = function (resEnums) {
            let categories = [
                {
                    "id": "default_cat",
                    "label": { "en": "Period", "de": "Zeitraum" }
                }
            ];
            resEnums.forEach((resEnum, ind) => {
                categories.push({
                    "id": "openCapa_" + ind + "_cat",
                    "label": resEnum.name
                })
            });
            return categories
        };
        let _constructColumns = function (settings, resEnums) {
            let columns = [];
            // Add period column
            columns.push({
                "id": "period_col",
                "catid": "default_cat",
                "type": "daterange",
                "label": { "en": "Period", "de": "Zeitraum" },
                "options": { "width": 100, "aggregation": "none" },
                "format": { "format": "L" }
            });
            // Add open capacity columns
            _calcParameter("USER_LANG");
            _calcParameter("USER_CURRENCY_ID");
            _calcParameter("CURRENCY_MAPPING");
            resEnums.forEach( (resEnum, ind) => {
                columns.push({
                    "id": "openCapa_time_" + ind + "_col",
                    "catid": "openCapa_" + ind + "_cat",
                    "type": "duration",
                    "label": {"en": "Time", "de": "Zeit"},
                    "options": { "width": 100, "aggregation": "sum" },
                    "format": { "digits": 1, "unit": UNIT_MAPPTING[settings.unitId].unit, "workTime": "HRM" }
                });
                if (settings.inclMoney) {
                    columns.push({
                        "id": "openCapa_money_" + ind + "_col",
                        "catid": "openCapa_" + ind + "_cat",
                        "type": "money",
                        "label": {"en": "Money", "de": "Geld"},
                        "options": { "width": 100, "aggregation": "sum" },
                        "format": { "digits": 2, "currencyCode": CURRENCY_MAPPING[USER_CURRENCY_ID].code }
                    });
                }
            });
            return columns;
        }
        let _constructData = function (settings, resEnums) { 
            // Load the macro allocation slots for the selected period (with padding)
            let macAllocSlots_perResource = _getPaddedMacAllocSlots_perResource(resEnums.map(resEnum => resEnum.id), settings);
            if (!macAllocSlots_perResource) {
                message = "Failed to load macro allocation slots for the selected period with the given settings.";
                pqfLib.utils.misc.log(debugLevel, "warn", "259C6031A3984C7B82C2D4F13889AE11", message);
                return [];
            }
            // Load the hourly rates for the resources in the user's prefered currency
            _calcParameter("USER_CURRENCY_ID");
            _calcParameter("CURRENCY_MAPPING");
            let hourlyRates = settings.inclMoney ? _getHourlyRates_perResource(resEnums.map(resEnum => resEnum.id), USER_CURRENCY_ID) : null;
            // Construct the period column values
            let periodCol_values = _constuctPeriodColValues(settings);
            // Construct the data rows
            let jtf_data = [];
            periodCol_values.forEach((period, slotInd) => {
                // Create a new row for each period
                let row = {
                    "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                    "data": [period] // Start with the period column
                };
                // Add open capacity values for each resource
                resEnums.forEach(resEnum => {
                    let macAllocSlotsObj = macAllocSlots_perResource.find(macAllocSlots => macAllocSlots.resource.id === resEnum.id);
                    if (macAllocSlotsObj) {
                        let avail_hours = moment.duration(macAllocSlotsObj.workload.slots[slotInd].availability || "PT0S").asHours();
                        let planned_hours = 0;
                        macAllocSlotsObj.workload.slots[slotInd].forecasts.forEach(forecast => {
                            planned_hours += moment.duration(forecast.planned || "PT0S").asHours();
                        });
                        let capa_hours = avail_hours - planned_hours;
                        if (capa_hours > 0) {
                            row.data.push(moment.duration(capa_hours, "hours").toISOString()); // Add the open capacity in hours
                            if (settings.inclMoney) row.data.push({"currencyCode": CURRENCY_MAPPING[USER_CURRENCY_ID].code, "amount": capa_hours * (hourlyRates[resEnum.id] || 0.0)}); // Calculate the money value based on the hourly rate
                        } else {
                            row.data.push("PT0S"); // No open capacity
                            if (settings.inclMoney) row.data.push({"currencyCode": CURRENCY_MAPPING[USER_CURRENCY_ID].code, "amount": 0.0}); // No money value
                        }
                    } 
                });
                jtf_data.push(row);
            });
            return jtf_data;
        };

        // Construct the resulting JTF object and return it
        let resEnums = _getResEnumsToConsider(refObjId, settings);
        let params_options = [];
        let params_categories = [resEnums];
        let params_columns = [settings, resEnums];
        let params_data = [settings, resEnums];
        let jtf = _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );

        // Add the total columns for the open capacity (if more than one resource is considered)
        if (resEnums.length > 1) {
            let totalTimeColMeta = {
                "id": "openCapa_time_total_col",
                "catid": "default_cat",
                "type": "duration",
                "label": { "en": "Total Time", "de": "Total Zeit" },
                "options": { "width": 100 , "aggregation": "sum" },
                "format": { "digits": 1, "unit": UNIT_MAPPTING[settings.unitId].unit, "workTime": "HRM" },
                "style": { "fontWeight": "bold" }
            };
            jtf = _addTotalDurationCol(jtf, totalTimeColMeta, 1, new Array(resEnums.length).fill(0).map((_, i) => i * 2 + 1));
            let totalMoneyColMeta = {
                "id": "openCapa_money_total_col",
                "catid": "default_cat",
                "type": "money",
                "label": { "en": "Total Money", "de": "Total Geld" },
                "options": { "width": 100 , "aggregation": "sum" },
                "format": { "digits": 2, "currencyCode": CURRENCY_MAPPING[USER_CURRENCY_ID].code },
                "style": { "fontWeight": "bold" }
            };
            if (settings.inclMoney) jtf = _addTotalMoneyCol(jtf, totalMoneyColMeta, 2, new Array(resEnums.length).fill(0).map((_, i) => i * 2 + 3));
        }

        // For each duration and money columns, add a hidden column with the duration in the selected unit
        jtf = _simplifyDurationCols(jtf, settings);
        if (settings.inclMoney) jtf = _simplifyMoneyCols(jtf, settings);

        return jtf;
    }
    
    /**
     * Constructs a bar chart object for the open capacity widget in either time or money.
     * 
     * @param {Object} jtf - The JTF object containing the data for the chart.
     * @param {Object} settings - The settings object as received by the function _readSettings_openCapaWidget. It should contain the following attributes:
     * - "unitId": The id of the unit to use for the chart (only relevant if colType is "time").
     * - "zoomId": The id of the zoom to use for the chart.
     * @param {string} colType - The type of column to use for the chart. Must be either "time" or "money".
     * @returns {Object} - The constructed bar chart object.
     * @example
     * let jtf = pqfWidgetLib.openCapa.constructJTF(...);
     * if (!jtf.charts) jtf.charts = [];
     * jtf.charts.push(_getBarCharts_openCapaWidget(jtf, settings, "time"));
     * // return value 
     * jtf.charts;
     * [
     *   ...,
     *   {
     *     id: "barchart_openCapa_time",
     *     name: "Open Capacity - Time",
     *     type: "bar",
     *     baseline: {
     *       id: "period_col",
     *       name: "Timeline",
     *       type: jtf.meta.columns[0].type,
     *       format: {
     *         format:  ZOOM_MAPPING[settings.zoomId].format
     *       }
     *     },
     *     datasets: [
     *       {
     *         id: "openCapa_time_0_col_numb",
     *         name: "Open Capacity - Time",
     *         type: "number",
     *         color: null,
     *         aggregation: "sum",
     *         unit: TYPE_MAPPING[colType].unit
     *       },
     *       ...
     *     ],
     *     axis: {
     *       showAxisName: true,
     *       x: {
     *         name: ZOOM_MAPPING[settings.zoomId].axisName
     *       },
     *       y: {
     *         name: UNIT_MAPPING[settings.unitId].axisName
     *       }
     *     }
     *   },
     *   ...
     * ]
     */
    function _getBarCharts_openCapaWidget(jtf, settings, colType) {
        _calcParameter("USER_LANG");
        _calcParameter("USER_CURRENCY_ID");
        const TYPE_MAPPING = {
            "money": {
                "regex": /^openCapa_money_[0-9]*_col_numb$/,
                "unit": CURRENCY_MAPPING[USER_CURRENCY_ID].code,
                "label": { "en": "Money", "de": "Geld" }
            },
            "time": {
                "regex": /^openCapa_time_[0-9]*_col_numb$/,
                "unit": UNIT_MAPPTING[settings.unitId].unit_string,
                "label": { "en": "Time", "de": "Zeit" }
            }
        }
        // Define function to get the datasets for the chart
        function _getDatasets(columns, settings) {
            let datasets = [];
            columns.forEach(col => {
                if (TYPE_MAPPING[colType].regex.test(col.id)) {
                    let catObj = jtf.meta.categories.find(cat => cat.id === col.catid);
                    datasets.push({
                        "id": col.id,
                        "name": _getCorrectTranslation(catObj.label, [USER_LANG]),
                        "type": "number",
                        "color": null, 
                        "aggregation": "sum",
                        "unit": TYPE_MAPPING[colType].unit
                    });
                }
            });
            return datasets;
        }
        // Construct the chart object
        return chart = {
            "id": "barchart_openCapa_" + colType,
            "name": _getCorrectTranslation(_prependPerLang(TYPE_MAPPING[colType].label, "Open Capacity", " - "), USER_LANG),
            "type": "bar",
            "baseline": {
                "id": "period_col",
                "name": "Timeline",
                "type": jtf.meta.columns[0].type,
                "format": {
                    "format":  ZOOM_MAPPING[settings.zoomId].format
                }
            },
            "datasets": _getDatasets(jtf.meta.columns, settings),
            "axis": {
                "showAxisName": true,
                "x": {
                    "name": ZOOM_MAPPING[settings.zoomId].axisName
                },
                "y": {
                    "name": UNIT_MAPPTING[settings.unitId].axisName
                }
            }
        }
    }

    // RESOURCE ATTENTION WIDGETS ##############################################

    function _readSettings_resAttWidget(client, defaults) {
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            beg: "2024-11-30T23:00:00.000Z",
            end: "2025-06-30T21:59:59.999Z",
            reasonIds: ["reason_overAlloc", "reason_absences"],
            onlyConsiderAlloc: false,
            inclSubOUs: false,
        }
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        // Read the property settings
        let settings = {
            "reasonIds": client.config.properties.filter(prop => prop.id && prop.id.startsWith("reason_") && prop.value).map(prop => prop.id),
            "onlyConsiderAlloc": ((client.config.properties.find(prop => prop.id === "resToConsider_onlyAlloc") || { "value": null }).value) || defaults.onlyConsiderAlloc,
            "inclSubOUs": ((client.config.properties.find(prop => prop.id === "resToConsider_inclSubOUs") || { "value": null }).value) || defaults.inclSubOUs
        };
        // Read the selected start and end dates and adjust them to the selected zoom
        settings = _readTimeframe(client, defaults, settings);

        return settings;
    }

    function _constructJtf_resAttWidget(refObjId, settings, _getResEnumsToConsider) {
        // Check if the selected time range is within the allowed planning range
        settings = _getCorrectedDates(settings);

        // Check if the reference object is a project
        let isProject = true;
        try {
            Pqf.prj.getProject(refObjId);
        } catch (error) {
            // If an error occurs, assume it is not a project
            isProject = false;
        }

        // Define functions to construct the JTF meta
        let _constructOptions = function () {
            return {
                "adaptiveColumnWidths": false,
                "groupBy": { "columnId": "res_col" },
                "sortBy": { "columnId": "reasons_col", "direction": "ASC" }
            }
        };
        let _constructCategories = function () {
            return [
                {
                    "id": "default_cat",
                    "label": null
                }
            ]
        };
        let _constructColumns = function () {
            return [
                {
                    "id": "res_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": { "en": "Resource", "de": "Ressource" },
                    "options": { "width": 100 },
                    "format": { "showIcon": true }
                },
                {
                    "id": "timeFrame_col",
                    "catid": "default_cat",
                    "type": "string",
                    "label": { "en": "Considered Time Frame", "de": "Berücksichtigter Zeitraum" },
                    "options": { "width": 100, "groupable": false }
                },
                {
                    "id": "reasons_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": { "en": "Reasons", "de": "Gründe" },
                    "options": { "width": 100, "groupable": false },
                    "format": { "showIcon": false, "addLink": true }
                },
                {
                    "id": "explanations_col",
                    "catid": "default_cat",
                    "type": "multienum",
                    "label": { "en": "Explanations", "de": "Erläuterungen" },
                    "options": { "width": 200, "groupable": false },
                    "format": { "showIcon": false }
                }
            ]
        }
        let _constructData = function (refObjId, settings, _getResEnumsToConsider) { 
            // Load the resource enums to consider for the selected reference object and settings
            let resEnums = _getResEnumsToConsider(refObjId, settings);
            if (!resEnums) { 
                let message = "Failed to load resource enums for the selected reference object and settings. The function _getResEnumsToConsider is expected to return an empty array if no resources shall be considered.";
                pqfLib.utils.misc.log(debugLevel, "error", "DD9521F80A404FAEB4252F1192EB7DD0", message);
                return []; 
            }
            let resIds = resEnums.map(resEnum => resEnum.id);
            // If necessary, load the macro allocation slots for the selected period
            let macAllocSlots_prj_perRes = null;
            let macAllocSlots_total_perRes = null;
            if (settings.reasonIds.some(reasonId => RES_ATT_MAPPING[reasonId].requiresMacroAllocSlots)) {
                if (isProject) macAllocSlots_prj_perRes = pqfLib.utils.apiFunc.exec(Pqf.alc, Pqf.alc.getMacroAllocationSlotsByResource, resIds, settings.beg_corrected, settings.end_corrected, "DAY", refObjId);
                macAllocSlots_total_perRes = pqfLib.utils.apiFunc.exec(Pqf.alc, Pqf.alc.getMacroAllocationSlotsByResource, resIds, settings.beg_corrected, settings.end_corrected, "DAY");
                if ((!macAllocSlots_prj_perRes && isProject) || !macAllocSlots_total_perRes) {
                    let message = "Failed to load the macro allocation slots for the selected period with the given settings and function.";
                    pqfLib.utils.misc.log(debugLevel, "warn", "95BA9C6BFADA42B58107AF61C53F875E", message);
                    return [];
                }
            } 
            // Construct the data rows
            let jtf_data = [];
            resEnums.forEach(resEnum => {
                // If necessary, calculate the TB-Account value for the resource
                let tbAcc = null;
                if (settings.reasonIds.some(reasonId => RES_ATT_MAPPING[reasonId].requiresTBAcc)) {
                    tbAcc = _calcTBAcc(resEnum, settings);
                }
                // Check all selected reasons
                let timeFrames = [];
                let reasons = [];
                let explanations = [];
                settings.reasonIds.forEach(reasonId => {
                    let feedback = RES_ATT_MAPPING[reasonId].getReason.apply(null, RES_ATT_MAPPING[reasonId].getParams(resEnum, settings, macAllocSlots_prj_perRes, macAllocSlots_total_perRes, tbAcc));
                    if (feedback) {
                        timeFrames.push(feedback.timeFrame);
                        reasons.push(feedback.reason);
                        explanations.push(feedback.explanations);
                    }
                });
                // If any reasons were found, add a new row
                if (reasons.length > 0) {
                    for (let i = 0; i < reasons.length; i++) {
                        jtf_data.push({
                            "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                            "data": [resEnum, timeFrames[i], reasons[i], explanations[i]]
                        });
                    }
                }
            });

            return jtf_data;
        };

        // Construct the resulting JTF object and return it
        let params_options = [];
        let params_categories = [];
        let params_columns = [];
        let params_data = [refObjId, settings, _getResEnumsToConsider];
        return _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );
    }

    // PROJECT ATTENTION WIDGETS ###############################################

    function _readSettings_prjAttWidget(client, defaults) {
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            beg: "2024-11-30T23:00:00.000Z",
            end: "2025-06-30T21:59:59.999Z",
            reasonIds: ["reason_overBgtInTF", "reason_overBgtTotal", "reason_badReport_leadInd", "reason_badReport_allInd"],
            reportType: "ProjectReport",
            reportLcyStateCats: ["lcyStateCats_active", "lcyStateCats_closed"],
            inclSubPPFs: false
        }
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        // Read the property settings
        let settings = {
            "reasonIds": client.config.properties.filter(prop => prop.id && prop.id.startsWith("reason_") && prop.value).map(prop => prop.id),
            "reportType": (client.config.properties.find(prop => prop.id === "prjRepsToConsider_type") || { "selectedItem": defaults.reportType }).selectedItem,
            "reportLcyStateCats": (client.config.properties.find(prop => prop.id === "prjRepsToConsider_lcyStateCats") || { "selectedItems": defaults.reportLcyStateCats }).selectedItems,
            "inclSubPPFs": ((client.config.properties.find(prop => prop.id === "prjsToConsider_inclSubPPFs") || { "value": null }).value) || defaults.inclSubPPFs
        };
        // Read the selected start and end dates and adjust them to the selected zoom
        settings = _readTimeframe(client, defaults, settings);

        return settings;
    }

    function _constructJtf_prjAttWidget(refObjId, settings, _getPrjEnumsToConsider) {
        // Check if the selected time range is within the allowed planning range
        settings = _getCorrectedDates(settings);

        // Define functions to construct the JTF meta
        let _constructOptions = function () {
            return {
                "adaptiveColumnWidths": false,
                "groupBy": { "columnId": "prj_col" },
                "sortBy": { "columnId": "reasons_col", "direction": "ASC" }
            }
        };
        let _constructCategories = function () {
            return [
                {
                    "id": "default_cat",
                    "label": null
                }
            ]
        };
        let _constructColumns = function () {
            return [
                {
                    "id": "prj_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": { "en": "Project", "de": "Projekt" },
                    "options": { "width": 200 },
                    "format": { "showIcon": true }
                },
                {
                    "id": "timeFrame_col",
                    "catid": "default_cat",
                    "type": "string",
                    "label": { "en": "Considered Time Frame", "de": "Berücksichtigter Zeitraum" },
                    "options": { "width": 100, "groupable": false }
                },
                {
                    "id": "reasons_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": { "en": "Reasons", "de": "Gründe" },
                    "options": { "width": 100, "groupable": false },
                    "format": { "showIcon": false, "addLink": true }
                },
                {
                    "id": "explanations_col",
                    "catid": "default_cat",
                    "type": "multienum",
                    "label": { "en": "Explanations", "de": "Erläuterungen" },
                    "options": { "width": 200, "groupable": false },
                    "format": { "showIcon": false }
                }
            ]
        };
        let _constructData = function (refObjId, settings, _getPrjEnumsToConsider) {
            // Load the project enums to consider for the selected reference object and settings
            let prjEnums = _getPrjEnumsToConsider(refObjId, settings);
            if (!prjEnums) {
                let message = "Failed to load project enums for the selected reference object and settings. The function _getPrjEnumsToConsider is expected to return an empty array if no projects shall be considered.";
                pqfLib.utils.misc.log(debugLevel, "error", "A91FAFEED26B40D999A2147D52B04921", message);
                return [];
            }
            // Load necessary data
            let prjsCosts_inTF = [];
            if (settings.reasonIds.some(reasonId => PRJ_ATT_MAPPING[reasonId].requires.includes("prjsCosts_inTF"))) {
                let prjIds = prjEnums.map(prjEnum => prjEnum.id);
                while (prjIds.length > 0) {
                    let prjsCosts_inTF_batch = pqfLib.utils.apiFunc.exec(Pqf.fco, Pqf.fco.getProjectsCostsOverviews, prjIds.slice(0, 100), null, settings.beg_corrected, settings.end_corrected);
                    if (!prjsCosts_inTF_batch) {
                        let message = "Failed to load the project costs overviews in _constructJtf_prjAttWidget.";
                        pqfLib.utils.misc.log(debugLevel, "warn", "5D8DEE9FDF0349EFBC39BE8F17C9A356", message);
                        return [];
                    }
                    prjsCosts_inTF = prjsCosts_inTF.concat(prjsCosts_inTF_batch);
                    prjIds = prjIds.slice(100);
                }
            }
            let prjsCosts_total = [];
            if (settings.reasonIds.some(reasonId => PRJ_ATT_MAPPING[reasonId].requires.includes("prjsCosts_total"))) {
                let prjIds = prjEnums.map(prjEnum => prjEnum.id);
                while (prjIds.length > 0) {
                    let prjsCosts_total_batch = pqfLib.utils.apiFunc.exec(Pqf.fco, Pqf.fco.getProjectsCostsOverviews, prjIds.slice(0, 100));
                    if (!prjsCosts_total_batch) {
                        let message = "Failed to load the project costs overviews in _constructJtf_prjAttWidget.";
                        pqfLib.utils.misc.log(debugLevel, "warn", "A7EC3E0BA73C4ADD8547A0624DFE97BB", message);
                        return [];
                    }
                    prjsCosts_total = prjsCosts_total.concat(prjsCosts_total_batch);
                    prjIds = prjIds.slice(100);
                }
            }
            let prjRep_perPrj = {};
            let consideredPrjRepStates_perType = {};
            function _getPrjRepStates(repType) {
                if (consideredPrjRepStates_perType[repType]) return consideredPrjRepStates_perType[repType];
                let prjRepStates = pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getTypeReachableStates, repType);
                if (!prjRepStates) {
                    let message = "Failed to load the project report states for report type '" + repType + "' in _constructJtf_prjAttWidget.";
                    pqfLib.utils.misc.log(debugLevel, "warn", "52C83B6735C54CEA8E05CC329B792F0F", message);
                    return null;
                }
                consideredPrjRepStates_perType[repType] = prjRepStates.filter(state => settings.reportLcyStateCats.map(id => LYC_STATE_CATEGORIES_MAPPING[id]).includes(state.category));
                return consideredPrjRepStates_perType[repType];
            }
            if (settings.reasonIds.some(reasonId => PRJ_ATT_MAPPING[reasonId].requires.includes("prjs_latestReports"))) {
                prjEnums.forEach(prjEnum => {
                    let consideredStates = _getPrjRepStates(settings.reportType);
                    if (!consideredStates) return;
                    let prjReps = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectReportsByType, prjEnum.id, settings.reportType);
                    if (!prjReps) {
                        let message = "Failed to load the project reports for project '" + prjEnum.id + "' of type '" + settings.reportType + "' in _constructJtf_prjAttWidget.";
                        pqfLib.utils.misc.log(debugLevel, "warn", "4AC48A01403244D493E84AFAAB7C7FE3", message);
                        return;
                    }
                    prjReps = prjReps.filter(prjRep => { // Filter by selected time frame
                        if (!prjRep.validityStart && !prjRep.validityEnd) return true;
                        if (!prjRep.validityEnd) return moment(prjRep.validityStart) <= moment(settings.end_corrected).local().subtract(1, "day");
                        return ((moment(prjRep.validityStart) >= moment(settings.beg_corrected).local() && moment(prjRep.validityStart) <= moment(settings.end_corrected).subtract(1, "day").local()) ||
                                (moment(prjRep.validityEnd).subtract(1, "day") >= moment(settings.beg_corrected).local() && moment(prjRep.validityEnd) <= moment(settings.end_corrected).local()));
                    });
                    prjReps = prjReps.filter(prjRep => { // Filter by selected lifecycle states
                        let lcyState = pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getObjectState, prjRep.type, prjRep.id);
                        if (!lcyState) {
                            let message = "Failed to load the lifecycle state for project report '" + prjRep.id + "' of type '" + prjRep.type + "' in _constructJtf_prjAttWidget.";
                            pqfLib.utils.misc.log(debugLevel, "warn", "6598CDC3B47940DA949C47795C05F11A", message);
                            return false;
                        }
                        return consideredStates.some(state => state.id === lcyState.id);
                    });
                    if (!prjRep_perPrj[prjEnum.id]) prjRep_perPrj[prjEnum.id] = {};
                    let lastPrjRep = null;
                    prjReps.forEach(prjRep => {
                        if (!lastPrjRep || moment(prjRep.validityStart) > moment(lastPrjRep.validityStart)) {
                            lastPrjRep = prjRep;
                        }
                    });
                    prjRep_perPrj[prjEnum.id] = lastPrjRep;
                });
            }
            // Construct the data rows
            let jtf_data = [];
            prjEnums.forEach(prjEnum => {
                // Check all selected reasons
                let timeFrames = [];
                let reasons = [];
                let explanations = [];
                settings.reasonIds.forEach(reasonId => {
                    let feedback = PRJ_ATT_MAPPING[reasonId].getReason.apply(null, PRJ_ATT_MAPPING[reasonId].getParams(prjEnum, settings, prjsCosts_inTF, prjsCosts_total, prjRep_perPrj));
                    if (feedback) {
                        timeFrames.push(feedback.timeFrame);
                        reasons.push(feedback.reason);
                        explanations.push(feedback.explanations);
                    }
                });
                // If any reasons were found, add a new row
                if (reasons.length > 0) {
                    for (let i = 0; i < reasons.length; i++) {
                        jtf_data.push({
                            "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                            "data": [prjEnum, timeFrames[i], reasons[i], explanations[i]]
                        });
                    }
                }
            });
            return jtf_data;
        };

        // Construct the resulting JTF object and return it
        let params_options = [];
        let params_categories = [];
        let params_columns = [];
        let params_data = [refObjId, settings, _getPrjEnumsToConsider];
        return _constructJtf(_constructOptions, params_options, _constructCategories, params_categories, _constructColumns, params_columns, _constructData, params_data);
    }

    // TIME QUOTAS WIDGETS ######################################################

    function _readSettings_timeQuotasWidget(client, defaults) {
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            linesToHighlight: [],
            inclSubOUs: false
        }
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        // Read the property settings
        let settings = {
            "linesToHighlight": client.config.properties.reduce( (acc, prop) => { if (prop.id && prop.id.startsWith("linesToHighlight_") && prop.value) acc.push(prop.id); return acc }, []),
            "inclSubOUs": ((client.config.properties.find(prop => prop.id === "resToConsider_inclSubOUs") || { "value": null }).value) || defaults.inclSubOUs
        };

        return settings;
    }

    function _constructJtf_timeQuotasWidget(refObjId, settings, _getResEnumsToConsider) {
        // Define functions to construct the JTF meta
        _calcParameter("ABSNECE_TYPES");
        let _constructOptions = function () { return null };
        let _constructCategories = function () {
            // Define the categories independent of the tenant config
            let cats = [
                {
                    "id": "default_cat",
                    "label": null
                },
                {
                    "id": "present_cat",
                    "label": { "en": "Present - Year to Date", "de": "Anwesend - aktuelles Jahr bis heute" }
                }
            ];
            // Add a category for each absence type
            ABSENCE_TYPES.forEach(type => {
                cats.push({
                    "id": type.id + "_cat",
                    "label": _prependPerLang( { "en": "Entire Year", "de": "Ganzes Jahr" }, type.name, " - ")
                });
            });
            return cats;
        };
        let _constructColumns = function () {
            // Define the columns independent of the tenant config
            let cols = [
                {
                    "id": "res_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": { "en": "Resource", "de": "Ressource" },
                    "options": { "width": 200 },
                    "format": { "showIcon": true, "addLink": "worktimeoverview" }
                }, 
                {
                    "id": "target_col",
                    "catid": "present_cat",
                    "type": "duration",
                    "label": { "en": "Target", "de": "Soll" },
                    "options": { "width": 100, "aggregation": "none" },
                    "format": { "digits": 2, "unit": "hour", "workTime": "HRM" }
                }, 
                {
                    "id": "actual_col",
                    "catid": "present_cat",
                    "type": "duration",
                    "label": { "en": "Actual", "de": "Ist" },
                    "options": { "width": 100, "aggregation": "none" },
                    "format": { "digits": 2, "unit": "hour", "workTime": "HRM" }
                }, 
                {
                    "id": "delta_col",
                    "catid": "present_cat",
                    "type": "duration",
                    "label": { "en": "Delta", "de": "Delta" },
                    "options": { "width": 100, "aggregation": "none" },
                    "format": { "digits": 2, "unit": "hour", "workTime": "HRM" }
                }, 
                {
                    "id": "tbAccount_col",
                    "catid": "present_cat",
                    "type": "duration",
                    "label": { "en": "TB-Account", "de": "GZ-Konto" },
                    "options": { "width": 100, "aggregation": "none" },
                    "format": { "digits": 2, "unit": "hour", "workTime": "HRM" },
                    "style": { "fontWeight": "bold" }
                }
            ];
            // Add a column for each absence type
            ABSENCE_TYPES.forEach(type => {
                if (type.presencePercentage === 100) return; // Skip types that do not cause an absence
                cols.push({
                    "id": type.id + "_act_col",
                    "catid": type.id + "_cat",
                    "type": "duration",
                    "label": { "en": "Reported", "de": "Rapportiert" },
                    "options": { "width": 100, "aggregation": "none" },
                    "format": { "digits": 2, "unit": "hour", "workTime": "HRM" },
                    "style": { "backgroundColor": _transformColor(type.color) }
                });
                cols.push({
                    "id": type.id + "_account_col",
                    "catid": type.id + "_cat",
                    "type": "duration",
                    "label": { "en": "Account", "de": "Konto" },
                    "options": { "width": 100, "aggregation": "none" },
                    "format": { "digits": 2, "unit": "hour", "workTime": "HRM" },
                    "style": { "backgroundColor": _transformColor(type.color) }
                })
            });
            return cols;
        }
        let _constructData = function (refObjId, settings, _getResEnumsToConsider) { 
            // Get the resource enums to consider for the selected reference object and settings
            let resEnums = _getResEnumsToConsider(refObjId, settings);
            if (!resEnums) {
                let message = "Failed to load resource enums for the selected reference object and settings. The function _getResEnumsToConsider is expected to return an empty array if no resources shall be considered.";
                pqfLib.utils.misc.log(debugLevel, "error", "D0B85444F0B0451694D2D055BA46B79B", message);
                return [];
            }
            // Iterate over the resource enums and construct the data rows
            let jtf_data = [];
            resEnums.forEach(resEnum => {
                // Load all necessary data for the column to be constructed
                let daySummary = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getDaySummary, resEnum.id, moment().startOf("year").format("YYYY-MM-DD"), moment().endOf("year").add(1, "days").format("YYYY-MM-DD"));
                let timeBalance = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getTimeBalance, resEnum.id, parseInt(moment().subtract(1, "years").format("YYYY")));
                let absencesBalance = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getAbsencesBalance, resEnum.id, parseInt(moment().subtract(1, "years").format("YYYY")));
                let timeCorrections = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getResourceTimeCorrections, resEnum.id);
                if (!timeCorrections || !daySummary || !timeBalance || !absencesBalance) {
                    let message = "Failed to load time corrections, day summary, time balance or absences balance for the selected resource enum.";
                    pqfLib.utils.misc.log(debugLevel, "warn", "6725AAA0EDA3496395B1F7AD28FF4F78", message);
                    return; // Skip this resource enum if any data is missing
                }
                // Iterate over the day summaries and accumulate the durations in the target and all actual columns
                let durations_perCol = {
                    "target_col": moment.duration(0),
                    "actual_col": moment.duration(0),
                    "delta_col": moment.duration(0),
                    "tbAccount_col": moment.duration(0)
                }
                ABSENCE_TYPES.forEach(type => {
                    if (type.presencePercentage === 100) return; // Skip types that do not cause an absence
                    durations_perCol[type.id + "_act_col"] = moment.duration(0);
                    durations_perCol[type.id + "_account_col"] = moment.duration(0);
                });
                let ind_today = moment().diff(moment().startOf("year"), "days");
                daySummary.forEach( (day, ind) => {
                    if (ind < ind_today) {
                        durations_perCol["target_col"].add(moment.duration(day.target));
                        durations_perCol["actual_col"].add(moment.duration(day.sumPresences));
                    }
                    day.absences.forEach(absence => {
                        if (ind < ind_today) {
                            durations_perCol["target_col"].add(moment.duration(absence.duration));
                            durations_perCol["actual_col"].add(moment.duration(absence.duration));
                        }
                        durations_perCol[absence.absenceType + "_act_col"].add(moment.duration(absence.duration));
                    });
                });
                // Calculate the delta and TB account
                durations_perCol["delta_col"] = moment.duration(durations_perCol["actual_col"]).subtract(durations_perCol["target_col"]);
                durations_perCol["tbAccount_col"] = moment.duration(durations_perCol["delta_col"]).add(moment.duration(timeBalance.duration));
                let timeCorrections_forTBAccAndYear = timeCorrections.filter(tc => tc.type === "ResourcePresenceTimeCorrection" && moment(tc.date) >= moment().startOf("year") && moment(tc.date) <= moment());
                timeCorrections_forTBAccAndYear.forEach(tc => {
                    durations_perCol["tbAccount_col"].add(moment.duration(tc.duration));
                });
                // Calculate the account for each absence type
                ABSENCE_TYPES.forEach(type => {
                    if (type.presencePercentage === 100) return; // Skip types that do not cause an absence
                    let balanceBalance = absencesBalance.find(balance => balance.absenceType === type.id);
                    let timeCorrections_forTypeAndYear = timeCorrections.filter(tc => tc.type === type.id && moment(tc.date) >= moment().startOf("year") && moment(tc.date) <= moment());
                    durations_perCol[type.id + "_account_col"] = moment.duration(0).subtract(durations_perCol[type.id + "_act_col"]);
                    durations_perCol[type.id + "_account_col"].add(moment.duration(balanceBalance.duration));
                    timeCorrections_forTypeAndYear.forEach(tc => {
                        durations_perCol[type.id + "_account_col"].add(moment.duration(tc.duration));
                    });
                });
                // Construct the data row and push it to the JTF data
                let row = {
                    "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                    "data": [
                        resEnum,
                        durations_perCol["target_col"].toISOString(),
                        durations_perCol["actual_col"].toISOString(),
                        durations_perCol["delta_col"].toISOString(),
                        durations_perCol["tbAccount_col"].toISOString()
                    ].concat(
                        ABSENCE_TYPES.map(type => {
                            if (type.presencePercentage === 100) return []; // Skip types that do not cause an absence
                            return [
                                durations_perCol[type.id + "_act_col"].toISOString(),
                                durations_perCol[type.id + "_account_col"].toISOString()
                            ]
                        }).flat()
                    )
                };
                // If necessary, highlight rows
                settings.linesToHighlight.forEach(highlightId => {
                    if (HIGHLIGHT_RULES[highlightId].needHighlight(row)) row = HIGHLIGHT_RULES[highlightId].applyHighlight(row);
                });
                jtf_data.push(row);
            });

            return jtf_data; 
        };

        // Construct the resulting JTF object and return it
        let params_options = [];
        let params_categories = [];
        let params_columns = [];
        let params_data = [refObjId, settings, _getResEnumsToConsider];
        return _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );
    }

    // OBJECT LIST WIDGETS #####################################################

    function _readSettings_objectListWidget(client, defaults, objType) {
        let targetType = client.selectedObject.type;
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            beg: "2024-11-30T23:00:00.000Z",
            end: "2025-06-30T21:59:59.999Z",
            "lcyStateIds": !OBJS_WITHOUT_LCY.includes(objType) ? pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getTypeReachableStates, objType).map(state => state.id) : null,
            "consider_allocs": false,
            "consider_timeFrame": false,
            "consider_noStartDate": true,
            "consider_noDeadline": true,
            "consider_noSchedule": true,
            "showCat_classification": false,
            "showCat_time": false,
            "showCat_categorization": false,
            "showCat_properties": false,
            "inclSubOUs": false,
            "inclSubPPFs": false
        };
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        // Read the property settings
        function _getSelectedPropId(propId, defaultIds) {
            let prop = client.config.properties.find(prop => prop.id && prop.id.startsWith(propId));
            return (prop || {"selectedItems": [defaultIds]}).selectedItems;
        }
        let settings = {
            "lcyStateIds": _getSelectedPropId("lcyStates_enum", defaults_fallback.lcyStateIds),
            "consider_allocs": (client.config.properties.find(prop => prop.id === "consider_allocs") || { "value": defaults.consider_allocs }).value,
            "consider_timeFrame": (client.config.properties.find(prop => prop.id === "consider_timeFrame") || { "value": defaults.consider_timeFrame }).value,
            "consider_noStartDate": (client.config.properties.find(prop => prop.id === "consider_noStartDate") || { "value": defaults.consider_noStartDate }).value,
            "consider_noDeadline": (client.config.properties.find(prop => prop.id === "consider_noDeadline") || { "value": defaults.consider_noDeadline }).value,
            "consider_noSchedule": (client.config.properties.find(prop => prop.id === "consider_noSchedule") || { "value": defaults.consider_noSchedule }).value,
            "showCat_classification": (client.config.properties.find(prop => prop.id === "showCat_classification") || { "value": defaults.showCat_classification }).value,
            "showCat_time": (client.config.properties.find(prop => prop.id === "showCat_time") || { "value": defaults.showCat_time }).value,
            "showCat_categorization": (client.config.properties.find(prop => prop.id === "showCat_categorization") || { "value": defaults.showCat_categorization }).value,
            "showCat_properties": (client.config.properties.find(prop => prop.id === "showCat_properties") || { "value": defaults.showCat_properties }).value,
            "inclSubOUs": (client.config.properties.find(prop => prop.id === "resToConsider_inclSubOUs") || { "value": defaults.inclSubOUs }).value,
            "inclSubPPFs": (client.config.properties.find(prop => prop.id === "prjsToConsider_inclSubPPFs") || { "value": defaults.inclSubPPFs }).value
        };
        // Read the selected start and end dates
        settings = _readTimeframe(client, defaults, settings);

        return settings;
    }

    function _constructJtf_objectListWidget(refObjId, settings, _getObjEnumsToConsider, objType, showResEnumPerRel, includeImplicitRels) {
        if (typeof includeImplicitRels === "undefined") includeImplicitRels = false;
        // Define functions to construct the JTF meta
        let _constructOptions = function () { 
            return !OBJS_WITHOUT_LCY.includes(objType) ? { "groupBy": { "columnId": "state_col" } } : null;
        };
        let _constructCategories = function (objType) {
            // Define the categories independent of the tenant config
            let cats = [
                {
                    "id": "default_cat",
                    "label": null
                }
            ];
            // Add the object-specific categories if necessary
            if (OBJS_MAPPING[objType].objSpecificCategoriesMeta) cats = cats.concat(OBJS_MAPPING[objType].objSpecificCategoriesMeta);
            return cats;
        };
        let _constructColumns = function (objType, relEnums, showResEnumPerRel, showCats) {
            // Define the columns independent of the tenant config
            let cols = [
                {
                    "id": "obj_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": OBJS_MAPPING[objType].label,
                    "options": { "width": 200 },
                    "format": OBJS_MAPPING[objType].format
                },
                {
                    "id": "desc_col",
                    "catid": "default_cat",
                    "type": "html",
                    "label": { "en": "Description", "de": "Beschreibung" },
                    "options": { "width": 200 }
                },
                {
                    "id": "state_col",
                    "catid": "default_cat",
                    "type": "enum",
                    "label": { "en": "State", "de": "Status" },
                    "options": { "width": 100, "hidden": OBJS_WITHOUT_LCY.includes(objType) },
                    "format": { "showIcon": true, "addLink": false }
                }
            ];
            // Add the columns for the relations
            if (showResEnumPerRel) {
                relEnums.forEach(relEnum => {
                    cols.push({
                        "id": relEnum.id + "_col",
                        "catid": "default_cat",
                        "type": "multienum",
                        "label": relEnum.name,
                        "options": { "width": 100 },
                        "format": { "showIcon": true }
                    });
                });
            } else {
                cols.push({
                    "id": "rels_col",
                    "catid": "default_cat",
                    "type": "multienum",
                    "label": { "en": "Relations", "de": "Beziehungen" },
                    "options": { "width": 100 },
                    "format": { "showIcon": false }
                });
            };
            // Add the object-specific columns if necessary
            if (OBJS_MAPPING[objType].objSpecificColumnsMeta) cols = cols.concat(OBJS_MAPPING[objType].objSpecificColumnsMeta);
            // Check the showCats settings and hide the "not shown" columns
            cols.forEach(col => {
                if (col.catid !== "default_cat" && !showCats.includes(col.catid)) {
                    col.options.hidden = true;
                }
            });
            
            return cols;
        }
        let _constructData = function (objType, settings, objEnums, relEnums, showResEnumPerRel) { 
            // Load the data objects given the objs, relEnums, and settings
            let dataObjs = OBJS_MAPPING[objType].getDataObjs(objEnums, relEnums, settings);
            // Iterate over all data objects and construct the data rows
            let jtf_data = [];
            let resIds = objEnums.map(resEnum => resEnum.id);
            dataObjs.forEach(dataObj => {
                // Define the data row with its most basic attributes
                let row = {
                    "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                    "data": [
                        pqfLib.utils.misc.toEnum(dataObj),
                        dataObj.description,
                        pqfLib.utils.misc.toEnum(dataObj.state)
                    ]
                };
                // Add relation row(s)
                if (showResEnumPerRel) {
                    relEnums.forEach(relEnum => {
                        let rels = dataObj.relations.filter(rel => rel.relationType === relEnum.id && resIds.includes(rel.target.id));
                        let resEnums_wThisRel = rels.map(rel => pqfLib.utils.misc.toEnum(objEnums.find(resEnum => resEnum.id === rel.target.id)));
                        row.data.push(resEnums_wThisRel);
                    });
                } else {
                    let rels = dataObj.relations.filter(rel => resIds.includes(rel.target.id));
                    let relEnums_wTheseResources = relEnums.filter(relEnum => rels.some(rel => rel.relationType === relEnum.id));
                    row.data.push(relEnums_wTheseResources);
                }
                // If necessary, add the object-specific columns
                if (OBJS_MAPPING[objType].objSpecificColumnsMeta) {
                    let objSpecificData = OBJS_MAPPING[objType].getObjSpecificColumnsData(dataObj);
                    if (!objSpecificData) {
                        message = "Failed to load object-specific data for the object with ID " + dataObj.id + ". The function _getObjSpecificColumnsData is expected to return an array with one value per column of appropriate type.";
                        pqfLib.utils.misc.log(debugLevel, "error", "03BDA1D8EF384B5F83CFAEFF3BF4949B", message);
                        return; // Skip this data object if the object-specific data could not be loaded
                    }
                    row.data = row.data.concat(objSpecificData);
                }
                OBJS_MAPPING[objType].doPostProcessing(row, dataObj);
                jtf_data.push(row);
            });
            return jtf_data; 
        };

        // Get the object enums to consider for the selected reference object and settings
        let objEnums = _getObjEnumsToConsider(refObjId, settings);
        if (!objEnums) {
            let message = "Failed to load object enums for the selected reference object and settings. The function _getObjEnumsToConsider is expected to return an empty array if no objects shall be considered.";
            pqfLib.utils.misc.log(debugLevel, "error", "9DB24D7FCDD4480E878EC17BD691DE73", message);
            return [];
        }
        // Construct the relation enums to consider for the selected reference object, settings, and object type
        let _getForwardRelEnums = function (objEnums, objType) {
            //let objTypes = objEnums.map(objEnum => objEnum.type).filter((type, idx, arr) => arr.indexOf(type) === idx);
            let relTypes = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getAllRelationTypesForType, objType);
            console.log("relTypes :" + JSON.stringify(relTypes));
            let relEnums = relTypes.reduce((acc, relType) => {
                if (!relType.explicit && !includeImplicitRels) return acc; // Skip implicit relations
                // Check if it is a forward relation to consider
                //if (relType.sourceTypes.includes(objType) && relType.targetTypes.some(type => objTypes.includes(type))) {
                if (relType.sourceTypes.includes(objType) && relType.targetTypes.some(type => RES_TYPES.includes(type))) {
                    let resEnum = pqfLib.utils.misc.toEnum(relType);
                    resEnum.name = relType.nameForward; // relType has no name attribute, so we use the nameForward attribute
                    resEnum.sortIndex = relType.sortIndexForward;
                    acc.push(resEnum);
                } 
                return acc;
            }, []);
            // Sort the relation enums by their sort index
            relEnums.sort((a, b) => a.sortIndex - b.sortIndex);
            return relEnums;
        };
        let relEnums = _getForwardRelEnums(objEnums, objType, includeImplicitRels);
        // Check which categories to show based on the settings
        let showCats = Object.keys(settings).reduce( (acc, key) => { 
            if (key.startsWith("showCat_") && settings[key]) acc.push(key.replace("showCat_", "") + "_cat");
            return acc; 
        }, []);

        // Construct the resulting JTF object and return it
        let params_options = [];
        let params_categories = [objType];
        let params_columns = [objType, relEnums, showResEnumPerRel, showCats];
        let params_data = [objType, settings, objEnums, relEnums, showResEnumPerRel];
        return _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );
    }

    function _getDonutChart_objectListWidget(jtf, colId, chartMeta) {
        // Construct a helper column to "count" the number of objects per category (if not already present)
        if (!jtf.meta.columns.some(col => col.id === "count_col")) {
            jtf.meta.columns.push({
                "id": "count_col",
                "catid": null,
                "type": "number",
                "label": null,
                "options": { hidden: true },
                "format": { "digits": 0 }
            });
            jtf.data.forEach(row => row.data.push(1));
        }
        // Construct the chart object
        _calcParameter("USER_LANG");
        return chart = {
            "id": "donut_chart_" + colId,
            "name": _getCorrectTranslation(chartMeta.chartName, USER_LANG),
            "type": "donut",
            "baseline": {
                "id": colId,
                "name": chartMeta.baselineName,
                "type": "group"
            },
            "datasets": [
                {
                    "id": "count_col",
                    "name": null,
                    "type": "number",
                    "aggregation": "sum",
                    "unit": "#"
                }
            ]
        }
    }

    // PROJECT DEPENDENCIES WIDGETS ############################################

    function _readSettings_prjDependenciesWidget(client, defaults) {
        let targetType = client.selectedObject.type;
        // Apply fallback to defaults if not provided
        let defaults_fallback = {
            "beg": "2024-11-30T23:00:00.000Z",
            "end": "2025-06-30T21:59:59.999Z",
            "consider_timeFrame": true,
            "lcyState_filter": [],
            "showCat_time": false,
            "showCol_scenario": false,
            "showCol_task": true,
            "showCol_wbsLevel": false,
            "showCol_wiType": false,
            "inclSubPPFs": false,
            "inclOtherPPFs": false
        };
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        let settings = {
            "consider_timeFrame": (client.config.properties.find(prop => prop.id === "consider_timeFrame") || { "value": defaults.consider_timeFrame }).value,
            "lcyState_filter": (client.config.properties.find(prop => prop.id === "lcyStates_filter") || {"selectedItems": defaults.lcyState_filter}).selectedItems,
            "showCat_time": (client.config.properties.find(prop => prop.id === "showCat_time") || { "value": defaults.showCat_time }).value,
            "showCol_scenario": (client.config.properties.find(prop => prop.id === "showCol_scenario") || { "value": defaults.showCol_scenario }).value,
            "showCol_task": (client.config.properties.find(prop => prop.id === "showCol_task") || { "value": defaults.showCol_task }).value,
            "showCol_wbsLevel": (client.config.properties.find(prop => prop.id === "showCol_wbsLevel") || { "value": defaults.showCol_wbsLevel }).value,
            "showCol_wiType": (client.config.properties.find(prop => prop.id === "showCol_wiType") || { "value": defaults.showCol_wiType }).value,
            "inclSubPPFs": (client.config.properties.find(prop => prop.id === "resToConsider_inclSubPPFs") || { "value": defaults.inclSubPPFs }).value,
            "inclOtherPPFs": (client.config.properties.find(prop => prop.id === "resToConsider_inclOtherPPFs") || { "value": defaults.inclOtherPPFs }).value
        };
        // Read the selected start and end dates
        settings = _readTimeframe(client, defaults, settings);

        return settings;
    }

    function _constructJtf_prjDependenciesWidget(refObjId, settings, _getProjectsToConsider) {
        // Define functions to construct the JTF meta
        let _constructOptions = function () { 
            return {
                "sortBy": { "columnId": "date_from_col", "direction": "ASC" }
            }
        };
        let _constructCategories = function () {
            // Define the categories independent of the tenant config
            return cats = [
                {
                    "id": "link_cat",
                    "label": null
                },
                {
                    "id": "from_cat",
                    "label": { "en": "From", "de": "Von" }
                },
                {
                    "id": "to_cat",
                    "label": { "en": "To", "de": "Zu" }
                }, 
                {
                    "id": "time_cat",
                    "label": { "en": "Time", "de": "Zeit" }
                }
            ];
        };
        let _constructColumns = function () {
            // Define the columns independent of the tenant config
            return cols = [
                // LINK column
                {
                    "id": "link_col",
                    "catid": "link_cat",
                    "type": "enum",
                    "label": { "en": "Direct Link", "de": "Direkter Link" },
                    "options": { "width": 100, "sortable": false, "groupable": false },
                    "format": { "showIcon": false, "addLink": true }
                },
                // FROM columns
                {
                    "id": "wiType_col",
                    "catid": "from_cat",
                    "type": "string",
                    "label": { "en": "Type", "de": "Typ" },
                    "options": { "width": 50, "hidden": !settings.showCol_wiType  }
                },
                {
                    "id": "prj_from_col",
                    "catid": "from_cat",
                    "type": "enum",
                    "label": { "en": "Project / Portfolio", "de": "Projekt / Portfolio" },
                    "options": { "width": 200 },
                    "format": { "showIcon": true, "addLink": true }
                },
                {
                    "id": "scen_from_col",
                    "catid": "from_cat",
                    "type": "enum",
                    "label": { "en": "Scenario", "de": "Szenario" },
                    "options": { "width": 100, "hidden": !settings.showCol_scenario },
                    "format": { "showIcon": false, "addLink": true }
                },
                {
                    "id": "workItem_from_col",
                    "catid": "from_cat",
                    "type": "enum",
                    "label": { "en": "Task / Milestone", "de": "Task / Meilenstein" },
                    "options": { "width": 100, "hidden": !settings.showCol_task },
                    "format": { "showIcon": false }
                },
                {
                    "id": "wbsLevel_from_col",
                    "catid": "from_cat",
                    "type": "number",
                    "label": { "en": "WBS Level", "de": "WBS-Level" },
                    "options": { "width": 50, "hidden": !settings.showCol_wbsLevel, "aggregation": "none" },
                    "format": { "digits": 0 }
                },
                {
                    "id": "date_from_col",
                    "catid": "from_cat",
                    "type": "date",
                    "label": { "en": "Date", "de": "Datum" },
                    "options": { "width": 100 },
                    "format": { "format": "L" }
                },
                // TO columns
                {
                    "id": "wiType_to_col",
                    "catid": "to_cat",
                    "type": "string",
                    "label": { "en": "Type", "de": "Typ" },
                    "options": { "width": 50, "hidden": !settings.showCol_wiType }
                },
                {
                    "id": "prj_to_col",
                    "catid": "to_cat",
                    "type": "enum",
                    "label": { "en": "Project / Portfolio", "de": "Projekt / Portfolio" },
                    "options": { "width": 200 },
                    "format": { "showIcon": true, "addLink": true }
                },
                {
                    "id": "scen_to_col",
                    "catid": "to_cat",
                    "type": "enum",
                    "label": { "en": "Scenario", "de": "Szenario" },
                    "options": { "width": 100, "hidden": !settings.showCol_scenario },
                    "format": { "showIcon": false, "addLink": true }
                },
                {
                    "id": "workItem_to_col",
                    "catid": "to_cat",
                    "type": "enum",
                    "label": { "en": "Task / Milestone", "de": "Task / Meilenstein" },
                    "options": { "width": 100, "hidden": !settings.showCol_task },
                    "format": { "showIcon": false }
                },
                {
                    "id": "wbsLevel_to_col",
                    "catid": "to_cat",
                    "type": "number",
                    "label": { "en": "WBS Level", "de": "WBS-Level" },
                    "options": { "width": 50, "hidden": !settings.showCol_wbsLevel, "aggregation": "none" },
                    "format": { "digits": 0 }
                },
                {
                    "id": "date_to_col",
                    "catid": "to_cat",
                    "type": "date",
                    "label": { "en": "Date", "de": "Datum" },
                    "options": { "width": 100 },
                    "format": { "format": "L" }
                },
                // TIME columns
                {
                    "id": "progress_from_col",
                    "catid": "time_cat",
                    "type": "number",
                    "label": { "en": "Progress (From)", "de": "Fortschritt (Von)" },
                    "options": { "width": 50, "hidden": !settings.showCat_time, "aggregation": "none" },
                    "format": { "unit": "%", "digits": 0  }
                },
                {
                    "id": "timeHorizon_col",
                    "catid": "time_cat",
                    "type": "string",
                    "label": { "en": "Time Horizon (To)", "de": "Zeithorizont (Zu)" },
                    "options": { "width": 200, "hidden": !settings.showCat_time }
                },
                {
                    "id": "warnInfo_col",
                    "catid": "time_cat",
                    "type": "enum",
                    "label": { "en": "Warning", "de": "Warnung" },
                    "options": { "width": 100, "hidden": !settings.showCat_time },
                    "format": { "showIcon": true, "addLink": false }
                }
            ];
        }
        let _constructData = function (prjEnums) { 
            // Load the dependencies for the selected projects (per project and scenario)
            let scenarioLcyStates_grouped = pqfLib.utils.apiFunc.exec(Pqf.lcy, Pqf.lcy.getTypeReachableStates, "Scenario").reduce( (acc, state) => {
                switch (state.category) {
                    case "PLANNING": acc.scenLcy_inactive.push(state.id); break;
                    case "ACTIVE": acc.scenLcy_active.push(state.id); break;
                    case "CLOSED": case "NEW": acc.scenLcy_archived.push(state.id); break;
                    default: break;
                }
                return acc;
            }, { "scenLcy_inactive": [], "scenLcy_active": [], "scenLcy_archived": [] });
            prjEnums.forEach(prjEnum => {
                let scenarios_thisPrj = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectScenarios, prjEnum.id);
                if (scenarios_thisPrj) {
                    // Filter the scenarios based on the selected lifecycle states
                    Object.keys(scenarioLcyStates_grouped).forEach(key => {
                        if (!settings.lcyState_filter.includes(key)) {
                            if (key === "scenLcy_inactive" && settings.lcyState_filter.includes("scenLcy_singleInactive")) {
                                if (scenarios_thisPrj.length === 1) return; // Keep the single inactive scenario
                            }
                            scenarios_thisPrj = scenarios_thisPrj.filter(scenario => !scenarioLcyStates_grouped[key].includes(scenario.status));
                        }
                    });
                    scenarios_thisPrj.forEach(scenario => {
                        let deps_thisScen = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectScenarioDependencies, scenario.id);
                        if (deps_thisScen) {
                            // Filter the dependencies based on the selected timeframe
                            if (settings.consider_timeFrame) {
                                deps_thisScen = deps_thisScen.filter(dep => moment(dep.predecessorMilestone.position).isBetween(settings.beg, settings.end) || moment(dep.successorMilestone.position).isBetween(settings.beg, settings.end));
                            }
                            scenario.deps = deps_thisScen;
                        }
                    });
                    prjEnum.scenarios = scenarios_thisPrj;
                }
            });
            // Iterate over all project enums and their scenarios and construct the data rows
            function _findProject(prjId, prjEnums, considerOtherPpfs) {
                if (prjEnums.some(prjEnum => prjEnum.id === prjId)) return prjEnums.find(prjEnum => prjEnum.id === prjId);
                if (considerOtherPpfs) {
                    let prj = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProject, prjId);
                    if (prj) return prj;
                }
                return null;
            }
            let portfolios = null; // Only loaded if necessary
            function _findPortfolio(ppfId, considerSubPpfs, considerOtherPpfs) {
                if (!portfolios) portfolios = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectPortfolios);
                if (portfolios) {
                    let ppf = portfolios.find(ppf => ppf.id === ppfId);
                    if (!ppf) return null;
                    if (ppf.id === refObjId || considerOtherPpfs) return ppf; // Only makes sense if refObjId points to a portfolio!
                    if (considerSubPpfs) {
                        function _getParentPpfIds(ppf) {
                            if (!ppf.parentPortfolioId) return [];
                            let parentPpf = portfolios.find(port => port.id === ppf.parentPortfolioId);
                            let parentPpfIds = [parentPpf.id];
                            parentPpfIds = parentPpfIds.concat(_getParentPpfIds(parentPpf));
                            return parentPpfIds;
                        }
                        let parentPpfs = _getParentPpfIds(ppf);
                        if (parentPpfs.includes(refObjId)) return ppf; // Only makes sense if refObjId points to a portfolio!
                    }
                }
                return null;
            }
            function _findScenario(scenId, prjId, prjEnums, considerOtherPpfs) {
                let prjEnum = _findProject(prjId, prjEnums, considerOtherPpfs);
                if (prjEnum) {
                    if (prjEnum.scenarios && prjEnum.scenarios.some(scen => scen.id === scenId)) {
                        return prjEnum.scenarios.find(scen => scen.id === scenId);
                    }
                }
                if (considerOtherPpfs) {
                    let scen = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectScenario, scenId);
                    if (scen) return scen;
                }
                return null;
            }
            let scen_workItemTrees = {}; // Cache to avoid multiple API calls for the same scenario
            function _getWorkItem(workItemId, scenId, showCol_wbsLevel) {
                if (showCol_wbsLevel) {
                    if (!scen_workItemTrees[scenId]) {
                        let workItemTree = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, scenId, true, null);
                        if (workItemTree) {
                            scen_workItemTrees[scenId] = workItemTree;
                        } else {
                            return null;
                        }
                    }
                    return scen_workItemTrees[scenId].find(wi => wi.id === workItemId);
                } else {
                    return pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getWorkItem, workItemId);
                }
            }
            function _getWorkItemType(workItemId, scenId, showCol_wbsLevel) {
                let workItem = _getWorkItem(workItemId, scenId, showCol_wbsLevel);
                if (workItem) {
                    switch (workItem.phaseType) {
                        case "PROJECT_PHASE":
                            return _getCorrectTranslation({ "en": "Task", "de": "Task" }, _getParameter("USER_LANG"));
                        case "PROJECT_MILESTONE":
                            return _getCorrectTranslation({ "en": "Project MS", "de": "Projekt-MS" }, _getParameter("USER_LANG"));
                        default:
                            return workItem.phaseType; // Fallback: Return the type ID
                    }
                }
                return null;
            }
            function _getWBSLevel(workItemId, scenId) {
                if (!scen_workItemTrees[scenId]) {
                    let workItemTree = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, scenId, true, null);
                    if (workItemTree) {
                        scen_workItemTrees[scenId] = workItemTree;
                    } else {
                        return null;
                    }
                }
                function _getParentWorkItemIds(workItemId, workItemTree) {
                    let workItem = workItemTree.find(wi => wi.id === workItemId);
                    if (!workItem) return null;
                    if (!workItem.parentPhaseId) return [];
                    let parentIds = [workItem.parentPhaseId];
                    parentIds = parentIds.concat(_getParentWorkItemIds(workItem.parentPhaseId, workItemTree));
                    return parentIds;
                }
                let parentIds = _getParentWorkItemIds(workItemId, scen_workItemTrees[scenId]);
                if (parentIds) return parentIds.length;
                return null;
            }
            function _getWorkItemProgress(workItemId) {
                let accValues = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getWorkItemAccumulatedValues, workItemId);
                if (accValues) return accValues.manualProgressOverride || accValues.progressAccumulated;
                return null;
            }
            function _getTimeHorizon(date) {
                let diffDays = moment(date).diff(moment(_getParameter("DATE_TODAY")), "days");
                if (diffDays < 0) return _getCorrectTranslation({ "en": "In the Past", "de": "In der Vergangenheit" }, _getParameter("USER_LANG"));
                if (diffDays === 0) return _getCorrectTranslation({ "en": "Today", "de": "Heute" }, _getParameter("USER_LANG"));
                if (diffDays <= 7) return _getCorrectTranslation({ "en": "Next 7 Days", "de": "Nächste 7 Tage" }, _getParameter("USER_LANG"));
                if (diffDays <= 30) return _getCorrectTranslation({ "en": "Next 30 Days", "de": "Nächste 30 Tage" }, _getParameter("USER_LANG"));
                return _getCorrectTranslation({ "en": "> 30 Days", "de": "> 30 Tage" }, _getParameter("USER_LANG"));
            }
            function _getWarnInfo(date_from, date_to, prg_from) {
                if (moment(date_from).isAfter(date_to)) {
                    return {
                        "id": "4B8F9F6869C14DFD8D5AC36E326B1C00",
                        "type": null,
                        "name": _getCorrectTranslation({ "en": "Violation of dependency", "de": "Verletzung der Abhängigkeit" }, _getParameter("USER_LANG")),
                        "icon": null,
                        "color": "#8B0000"
                    };
                }
                if (prg_from !== null && prg_from < 100 && moment(date_to).isBefore(moment())) {
                    return {
                        "id": "8CC06BD66DF2491A9A1790E603E20C61",
                        "type": null,
                        "name": _getCorrectTranslation({ "en": "Preceding Task is not completed and succeeding Work Item is scheduled to have already started", "de": "Vorhergehender Task ist noch nicht abgeschlossen und Nachfolges Work Item soll bereits gestartet sein" }, _getParameter("USER_LANG")),
                        "icon": null,
                        "color": "#FF0000"
                    };
                }
                if (prg_from !== null && prg_from < 100 && moment(date_to).isBefore(moment().add(7, "days"))) {
                    return {
                        "id": "824CF7615A9A4C8CAA37912220C0D33C",
                        "type": null,
                        "name": _getCorrectTranslation({ "en": "Preceding Task is not completed and succeeding Work Item is scheduled to start within the next 7 days", "de": "Vorhergehender Task ist noch nicht abgeschlossen und Nachfolges Work Item soll innerhalb der nächsten 7 Tage starten" }, _getParameter("USER_LANG")),
                        "icon": null,
                        "color": "#FFA500"
                    };
                }
                return {
                    "id": "644DE88B3D8B4DBFBA94794531AC94F0",
                    "type": null,
                    "name": _getCorrectTranslation({ "en": "Everything fine", "de": "Alles in Ordnung" }, _getParameter("USER_LANG")),
                    "icon": null,
                    "color": "#008000"
                };
            }
            function _pushFromToCells(row, dep, prjEnums, settings, direction, isPrjWorkItem) {
                const FROM_TO_MAPPING = {
                    "from": {
                        "milestone": "predecessorMilestone",
                        "parents": "predecessorMilestoneParents"
                    },
                    "to": {
                        "milestone": "successorMilestone",
                        "parents": "successorMilestoneParents"
                    }
                };
                if (dep[FROM_TO_MAPPING[direction].parents].length === 0) { // Assertion
                    row.data = row.data.concat(Array(4).fill(null));
                    return false;
                }
                if (isPrjWorkItem) {
                    let scenId = dep[FROM_TO_MAPPING[direction].parents].find(obj => obj.type === "Scenario").id;
                    let workItemId = dep[FROM_TO_MAPPING[direction].parents].find(obj => obj.type === "ProjectWorkItem").id;
                    // Work item type
                    row.data.push(settings.showCol_wiType ? _getWorkItemType(workItemId, scenId, settings.showCol_wbsLevel) : null);
                    // Project, Scenario, and Work item
                    let prj = _findProject(dep[FROM_TO_MAPPING[direction].parents].find(obj => obj.type === "Project").id, prjEnums, settings.inclOtherPPFs)
                    if (!prj) return false;
                    let prj_enum = pqfLib.utils.misc.toEnum(prj);
                    let scen = settings.showCol_scenario ? _findScenario(scenId, prj.id, prjEnums, settings.inclOtherPPFs) : null;
                    if (settings.showCol_scenario && !scen) return false;
                    let scen_enum = pqfLib.utils.misc.toEnum(scen);
                    let workItem = settings.showCol_task ? _getWorkItem(workItemId, scenId, settings.showCol_wbsLevel) : null;
                    if (settings.showCol_task && !workItem) return false;
                    prj_enum.feature = "gantt" + (workItem ? "&itemtype=Phase&itemid=" + workItem.id : "")
                    row.data.push(prj_enum);
                    if (scen_enum) scen_enum.feature = "gantt" + (workItem ? "&itemtype=Phase&itemid=" + workItem.id : "")
                    row.data.push(scen_enum);
                    row.data.push(pqfLib.utils.misc.toEnum(workItem));
                    // WBS Level
                    row.data.push(settings.showCol_wbsLevel ? _getWBSLevel(workItem.id, scenId) : null);
                } else {
                    // Work item type
                    row.data.push(_getCorrectTranslation({ "en": "Portfolio MS", "de": "Portfolio-MS" }, _getParameter("USER_LANG")));
                    // Project Portfolio
                    let ppf = _findPortfolio(dep[FROM_TO_MAPPING[direction].parents].find(obj => obj.type === "ProjectPortfolio").id, settings.inclSubPPFs, settings.inclOtherPPFs);
                    if (!ppf) return false;
                    row.data.push(pqfLib.utils.misc.toEnum(ppf));
                    // Scenario
                    row.data.push(null);
                    // Work item
                    row.data.push(settings.showCol_task ? pqfLib.utils.misc.toEnum(dep[FROM_TO_MAPPING[direction].milestone]) : null); // Just show the milestone as text
                    // WBS Level (always 0 for portfolios)
                    row.data.push(settings.showCol_wbsLevel ? 0 : null); 
                }
                row.data.push(dep[FROM_TO_MAPPING[direction].milestone].position);
                return true;
            }
            function _pushLinkCell(parents_from, parents_to, isPrjWorkItem_from, isPrjWorkItem_to) {
                function _findParentPPFs(parents, isPrjWorkItem) {
                    if (isPrjWorkItem) {
                        let prjObj = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProject, parents.find(obj => obj.type === "Project").id);
                        if (!prjObj) {
                            message = "Failed to load project for ID " + parents.find(obj => obj.type === "Project").id + ".";
                            pqfLib.utils.misc.log(debugLevel, "warn", "D4E3F2C1B6C14A3E8F1E6C2B5A9F0B7E", message);
                            return [];
                        }
                        return prjObj.portfolios.map(ppfObj => pqfLib.utils.misc.toEnum(ppfObj));
                    } else {
                        let ppfObj = pqfLib.utils.apiFunc.exec(Pqf.pm, Pqf.pm.getProjectPortfolio, parents.find(obj => obj.type === "ProjectPortfolio").id);
                        return [pqfLib.utils.misc.toEnum(ppfObj)];
                    }
                };
                let ppfs_from = _findParentPPFs(parents_from, isPrjWorkItem_from);
                let ppfs_to = _findParentPPFs(parents_to, isPrjWorkItem_to);
                let intersection = ppfs_from.filter(ppf_from => ppfs_to.some(ppf_to => ppf_to.id === ppf_from.id));
                if (intersection.length > 0) {
                    let workItemId = null;
                    if (isPrjWorkItem_from) {
                        workItemId = parents_from.find(obj => obj.type === "ProjectWorkItem").id;
                    } else if (isPrjWorkItem_to) {
                        workItemId = parents_to.find(obj => obj.type === "ProjectWorkItem").id;
                    }
                    intersection.forEach(ppf => {
                        ppf.name = _getCorrectTranslation({ "en": "Link to Gantt", "de": "Link zum Gantt" }, _getParameter("USER_LANG"));
                        ppf.feature = "portfolio" + (workItemId ? "&itemtype=Phase&itemid=" + workItemId : "");
                    });
                    if (intersection.length > 1) {
                        message = "Multiple common portfolios found for dependency link - case not handled, only first portfolio will be used.";
                        pqfLib.utils.misc.log(debugLevel, "warn", "35C0BE33D8454C07BCC656AD5A2F7F25", message);
                    }
                    return intersection[0];
                } else {
                    return {
                        "id": "AF0A0B27A39149E3816A3F3E0597EA60",
                        "type": null,
                        "name": _getCorrectTranslation({ "en": "No common Portfolio", "de": "Kein gemeinsames Portfolio" }, _getParameter("USER_LANG")),
                        "icon": null,
                        "color": "#808080",
                        "feature": false
                    }
                }
            }

            let data = [];
            let handledDeps = []; // To avoid duplicate dependencies
            prjEnums.forEach(prjEnum => {
                prjEnum.scenarios.forEach(scenario => {
                    scenario.deps.forEach(dep => {
                        if (dep.predecessorMilestone.position === null || dep.successorMilestone.position === null) return; // Skip dependencies to deleted milestones
                        if (handledDeps.includes(dep.id)) return; // Skip already handled dependencies
                        handledDeps.push(dep.id); // Mark this dependency as handled
                        let row = {
                            "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                            "data": []
                        };
                        let isPrjWorkItem_from = dep.predecessorMilestoneParents.some(obj => obj.type === "Project");
                        let isPrjWorkItem_to = dep.successorMilestoneParents.some(obj => obj.type === "Project");
                        // LINK column
                        row.data.push(_pushLinkCell(dep.predecessorMilestoneParents, dep.successorMilestoneParents, isPrjWorkItem_from, isPrjWorkItem_to));
                        // FROM columns
                        if (!_pushFromToCells(row, dep, prjEnums, settings, "from", isPrjWorkItem_from)) return;
                        // TO columns
                        if (!_pushFromToCells(row, dep, prjEnums, settings, "to", isPrjWorkItem_to)) return;
                        // TIME columns
                        let prg_from = isPrjWorkItem_from ? _getWorkItemProgress(dep.predecessorMilestoneParents.find(obj => obj.type === "ProjectWorkItem").id) : null;
                        row.data.push(prg_from);
                        row.data.push(_getTimeHorizon(dep.successorMilestone.position));
                        let warningInfo = _getWarnInfo(dep.predecessorMilestone.position, dep.successorMilestone.position, prg_from);
                        row.data.push(warningInfo);
                        // Color rows (if necessary)
                        if (["4B8F9F6869C14DFD8D5AC36E326B1C00", "8CC06BD66DF2491A9A1790E603E20C61", "824CF7615A9A4C8CAA37912220C0D33C"].includes(warningInfo.id)) {
                            row.style = { "backgroundColor": warningInfo.color + "1A" }; // 10% opacity
                        }
                        data.push(row);
                    });
                });
            });

            return data;
        };

        // Construct the resulting JTF object and return it
        let params_options = [];
        let params_categories = [];
        let params_columns = [settings];
        let params_data = [_getProjectsToConsider(refObjId, settings)];
        return _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );
    }

    // ALLOCATIONS WIDGETS #####################################################

    function _readSettings_allocWidget(client, defaults) {
        // Applyfallback to defaults if not provided
        let defaults_fallback = {
            "beg": "2026-01-01T23:00:00.000Z",
            "end": "2026-12-31T23:00:00.000Z",
            "resToConsider_myself": false,
            "resToConsider_prjRels": [],
            "resToConsider_ouRels": [],
            "resToConsider_inclSubOUs": false,
            "showCat_hist": true
        }
        defaults = _applyFallback(defaults, defaults_fallback);
        // If no client is provided, use the default values
        if (!client || !client.config || !client.config.properties) {
            return defaults;
        }
        let settings = {
            "inclSubOUs": (client.config.properties.find(prop => prop.id === "resToConsider_inclSubOUs") || { "value": defaults.inclSubOUs }).value,
            "showCat_hist": (client.config.properties.find(prop => prop.id === "showCat_hist") || { "value": defaults.showCat_hist }).value,
            "resToConsider_myself": (client.config.properties.find(prop => prop.id === "resToConsider_myself") || { "value": defaults.resToConsider_myself }).value,
            "resToConsider_prjRels": (client.config.properties.find(prop => prop.id === "resToConsider_prjRels") || { "value": defaults.resToConsider_prjRels }).selectedItems,
            "resToConsider_ouRels": (client.config.properties.find(prop => prop.id === "resToConsider_ouRels") || { "value": defaults.resToConsider_ouRels }).selectedItems,
            "resToConsider_inclSubOUs": (client.config.properties.find(prop => prop.id === "resToConsider_inclSubOUs") || { "value": defaults.resToConsider_inclSubOUs }).value
        }
        // Read the selected start and end dates
        settings = _readTimeframe(client, defaults, settings);
        return settings;
    }

    function _constructJtf_allocationsWidget(refObjId, settings, _getMacroAllocsToConsider, objType) {
        // Define functions to construct the JTF meta
        let _constructOptions = function () { 
            return {
                "groupBy": { "columnId": objType === "HRM-RES-TYP-EMP" ? "prj_col" : "res_col" }
            }
        };
        let _constructCategories = function () {
            // Define the categories independent of the tenant config
            return cats = [
                {
                    "id": "res_cat",
                    "label": null
                },
                {
                    "id": "alloc_cat",
                    "label": { "en": "Allocation", "de": "Allokation" }
                },
                {
                    "id": "hist_cat",
                    "label": { "en": "Requested vs. Approved", "de": "Angefragt vs. Genehmigt" }
                }
            ];
        };
        let _constructColumns = function () {
            // Define the columns independent of the tenant config
            return cols = [
                {
                    "id": "res_col",
                    "catid": "res_cat",
                    "type": "enum",
                    "label": { "en": "Resource", "de": "Ressource" },
                    "options": { "width": 200 },
                    "format": { "showIcon": true, "addLink": "absences" }
                },
                {
                    "id": "prj_col",
                    "catid": "alloc_cat",
                    "type": "enum",
                    "label": { "en": "Project", "de": "Projekt" },
                    "options": { "width": 200 },
                    "format": { "showIcon": true, "addLink": true }
                },
                {
                    "id": "workItem_col",
                    "catid": "alloc_cat",
                    "type": "enum",
                    "label": { "en": "Task", "de": "Task" },
                    "options": { "width": 100 },
                    "format": { "showIcon": false, "addLink": false }
                },
                {
                    "id": "alloc_col",
                    "catid": "alloc_cat",
                    "type": "duration",
                    "label": { "en": "Allocation", "de": "Allokation" },
                    "options": { "width": 100, "aggregation": "sum" },
                    "format": { "unit": "hour", "workTime": "HRM", "digits": 1 }
                },
                {
                    "id": "state_col",
                    "catid": "alloc_cat",
                    "type": "enum",
                    "label": { "en": "State", "de": "Status" },
                    "options": { "width": 100 },
                    "format": { "showIcon": true, "addLink": false }
                },
                {
                    "id": "req_col",
                    "catid": "hist_cat",
                    "type": "duration",
                    "label": { "en": "Requested", "de": "Angefragt" },
                    "options": { "width": 100, "aggregation": "sum", "hidden": !settings.showCat_hist },
                    "format": { "unit": "hour", "workTime": "HRM", "digits": 1 }
                },
                {                    
                    "id": "app_col",
                    "catid": "hist_cat",
                    "type": "duration",
                    "label": { "en": "Approved", "de": "Genehmigt" },
                    "options": { "width": 100, "aggregation": "sum", "hidden": !settings.showCat_hist },
                    "format": { "unit": "hour", "workTime": "HRM", "digits": 1 }
                },
                {
                    "id": "cat_col",
                    "catid": "hist_cat",
                    "type": "string",
                    "label": { "en": "Category", "de": "Kategorie" },
                    "options": { "width": 100, "hidden": !settings.showCat_hist }
                }
            ];
        }
        let _constructData = function (macroAllocs) { 
            let data = [];
            // Cache object enums to avoid multiple API calls
            let prjEnums_cache = [];
            let workItemEnums_cache = [];
            let resEnums_cache = [];
            const OBJ_MAPS = {
                "Project": {
                    "enum_cache": prjEnums_cache,
                    "funcObj": Pqf.pm,
                    "func": Pqf.pm.getProject
                },
                "WorkItem": {
                    "enum_cache": workItemEnums_cache,
                    "funcObj": Pqf.pm,
                    "func": Pqf.pm.getWorkItem
                },
                "Resource": {
                    "enum_cache": resEnums_cache,
                    "funcObj": Pqf.res,
                    "func": Pqf.res.getResource
                }
            }
            function _getEnum(objId, objMap) {
                let enumObj = objMap.enum_cache.find(en => en.id === objId);
                if (!enumObj) {
                    let obj = pqfLib.utils.apiFunc.exec(objMap.funcObj, objMap.func, objId);
                    if (obj) {
                        enumObj = pqfLib.utils.misc.toEnum(obj);
                    } else {
                        enumObj = {
                            "id": objId,
                            "type": null,
                            "name": "[Deleted Object]",
                            "icon": null,
                            "color": "#AAAAAA"
                        };
                    }
                    objMap.enum_cache.push(enumObj);
                }
                return enumObj;
            }
            // Map allocation state to enum object
            let allocEnums = null;
            function _mapAllocStateToEnum(stateId) {
                if (!allocEnums) {
                    allocEnums = pqfLib.utils.apiFunc.exec(Pqf.pf, Pqf.pf.getEnumValues, "AllocationWorkflowState");
                }
                return allocEnums.find(enumObj => enumObj.id === stateId);
            }
            // Iterate over all macro allocations and construct the data rows
            macroAllocs.forEach(alloc => {
                let row = {
                    "id": pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.newUuids, 1).newUuids[0],
                    "data": []
                };
                // Resource and Allocation details
                let resEnum = _getEnum(alloc.resourceId, OBJ_MAPS["Resource"]);
                let prjEnum = _getEnum(alloc.projectId, OBJ_MAPS["Project"]);
                let workItemEnum = _getEnum(alloc.workItemId, OBJ_MAPS["WorkItem"]);
                if (prjEnum) prjEnum.feature = "gantt" + (workItemEnum ? "&itemtype=Phase&itemid=" + workItemEnum.id : "");
                row.data.push(resEnum);
                row.data.push(prjEnum);
                row.data.push(workItemEnum);
                row.data.push(alloc.effectiveDuration);
                row.data.push(_mapAllocStateToEnum(alloc.state));
                // History details
                let req_obj = (pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.getObjectStore, "Phase", alloc.workItemId, "requested") || []).find(obj => obj.allocationId === alloc.id);
                let app_obj = (pqfLib.utils.apiFunc.exec(Pqf.clf, Pqf.clf.getObjectStore, "Phase", alloc.workItemId, "approved") || []).find(obj => obj.allocationId === alloc.id);
                let req_iso = req_obj ? moment.duration(req_obj.effort.amountInHours, "hours").toISOString() : null;
                let app_iso = app_obj ? moment.duration(app_obj.effort.amountInHours, "hours").toISOString() : null;
                row.data.push(req_iso);
                row.data.push(app_iso);
                function _mapAllocDiffToCat(requested_iso, approved_iso) {
                    if (requested_iso && approved_iso) {
                        if (moment.duration(approved_iso).asHours() > moment.duration(requested_iso).asHours()) {
                            return _getCorrectTranslation({ "en": "Approved > Requested", "de": "Genehmigt > Angefragt" }, _getParameter("USER_LANG"));
                        } else if (moment.duration(approved_iso).asHours() < moment.duration(requested_iso).asHours()) {
                            return _getCorrectTranslation({ "en": "Approved < Requested", "de": "Genehmigt < Angefragt" }, _getParameter("USER_LANG"));
                        } else {
                            return _getCorrectTranslation({ "en": "Approved = Requested", "de": "Genehmigt = Angefragt" }, _getParameter("USER_LANG"));
                        }
                    } else {
                        return "-";
                    }
                }
                row.data.push(_mapAllocDiffToCat(req_iso, app_iso));
                data.push(row);
            });
            return data;
        };

        // Construct the resulting JTF object and return it
        let params_options = [];
        let params_categories = [];
        let params_columns = [settings];
        let params_data = [_getMacroAllocsToConsider(refObjId, settings)];
        return _constructJtf(
            _constructOptions,
            params_options,
            _constructCategories,
            params_categories,
            _constructColumns,
            params_columns,
            _constructData,
            params_data
        );
    }

    // HELPER FUNCTIONS ########################################################

    /**
     * Constructs a JTF object with the given parameters.
     * 
     * @param {Function} _constructOptions - A function that constructs the options for the JTF object.
     * @param {Array} params_options - The parameters to pass to the _constructOptions
     * @param {Function} _constructCategories - A function that constructs the categories for the JTF object.
     * @param {Array} params_categories - The parameters to pass to the _constructCategories
     * @param {Function} _constructColumns - A function that constructs the columns for the JTF object.
     * @param {Array} params_columns - The parameters to pass to the _constructColumns
     * @param {Function} _constructData - A function that constructs the data for the JTF object.
     * @param {Array} params_data - The parameters to pass to the _constructData
     * @returns {Object} - A JTF object with the attributes "meta" and "data". The "meta" object contains the "options", "categories", and "columns". The "data" object contains the data rows as an array, each typically specified by an "id" and its "data".
     */
    function _constructJtf(_constructOptions, params_options, _constructCategories, params_categories, _constructColumns, params_columns, _constructData, params_data) {
        return {
            "meta": {
                "options": _constructOptions.apply(null, params_options),
                "categories": _constructCategories.apply(null, params_categories),
                "columns": _constructColumns.apply(null, params_columns)
            },
            "data": _constructData.apply(null, params_data)
        }
    }

    function _addTotalDurationCol(jtf, totalColMeta, totalColInd, durationColInds) {
        // Insert the total column metadata into the JTF meta columns
        jtf.meta.columns.splice(totalColInd, 0, totalColMeta);
        // Calculate the total duration for each data row and add it to the total column
        jtf.data.forEach(row => {
            let totalDuration_hours = 0;
            durationColInds.forEach(ind => {
                if (row.data[ind]) {
                    let duration = moment.duration(row.data[ind]);
                    totalDuration_hours += duration.asHours();
                }
            });
            row.data.splice(totalColInd, 0, moment.duration(totalDuration_hours, "hours").toISOString());
        });
        return jtf;
    }

    function _addTotalMoneyCol(jtf, totalColMeta, totalColInd, moneyColInds, currencyId) {
        if (!currencyId) {
            _calcParameter("USER_CURRENCY_ID");
            currencyId = USER_CURRENCY_ID;
        }
        // Insert the total column metadata into the JTF meta columns
        jtf.meta.columns.splice(totalColInd, 0, totalColMeta);
        // Calculate the total money for each data row and add it to the total column
        jtf.data.forEach(row => {
            let totalMoney = { "currencyCode": CURRENCY_MAPPING[currencyId].code, "amount": 0.0 };
            moneyColInds.forEach(ind => {
                if (row.data[ind]) {
                    // If necessary, convert the money value to the selected currency
                    if (row.data[ind].currencyCode !== CURRENCY_MAPPING[currencyId].code) {
                        let convertedAmount = _convertToCurrency(row.data[ind], currencyId);
                        totalMoney.amount += convertedAmount.amount;
                    } else {
                        totalMoney.amount += row.data[ind].amount;
                    }
                }
            });
            row.data.splice(totalColInd, 0, totalMoney);
        });
        return jtf;
    }

    /**
     * Simplifies the duration columns in the JTF object by adding a hidden column per comparison column with the duration as number in the selected unit.
     * 
     * @param {Object} jtf - The JTF object to simplify.
     * @param {Object} settings - The settings object as received by the function _readSettings_effortWidget. It should contain the following attributes:
     *   - "unitId": The id of the unit to use for the duration columns.
     * @return {Object} - The JTF object with the simplified duration columns.
     */
    function _simplifyDurationCols(jtf, settings) {
        jtf.meta.columns.forEach( (col, ind) => {
            if (col.type == "duration") {
                // Add a hidden column with the duration in the selected unit
                jtf.meta.columns.push({
                    "id": col.id + "_numb",
                    "catid": col.catid,
                    "type": "number",
                    "label": _appendPerLang(col.label, UNIT_MAPPTING[settings.unitId].unit_string),
                    "options": { width: 100, aggregation: "sum", hidden: true },
                    "format": { digits: 1 }
                });
                // Add the data for the new column
                jtf.data.forEach(row => {
                    let duration_numb = UNIT_MAPPTING[settings.unitId].getConversion(row.data[ind]);
                    row.data.push(duration_numb);
                });
            }
        });

        return jtf;
    }

    function _simplifyMoneyCols(jtf, settings) {
        _calcParameter("CURRENCY_MAPPING");
        _calcParameter("USER_CURRENCY_ID");
        jtf.meta.columns.forEach( (col, ind) => {
            if (col.type == "money") {
                // Add a hidden column with the money value as number
                jtf.meta.columns.push({
                    "id": col.id + "_numb",
                    "catid": col.catid,
                    "type": "number",
                    "label": _appendPerLang(col.label, CURRENCY_MAPPING[USER_CURRENCY_ID].code),
                    "options": { width: 100, aggregation: "sum", hidden: true },
                    "format": { digits: 2 }
                });
                // Add the data for the new column
                jtf.data.forEach(row => {
                    let money_numb = row.data[ind] ? row.data[ind].amount : 0.0;
                    row.data.push(money_numb);
                });
            }
        });
        return jtf;
    }

    /**
     * Appends a string to the label of a mapping for each language. 
     * 
     * @param {Object} label - The label object of the mapping, which contains the labels for each language.
     * @param {string} stringToAppend - The string to append to the label.
     * @return {Object} - A new label object with the appended string for each language.
     */
    function _appendPerLang(label, stringToAppend, stringToLink) {
        let label_copy = JSON.parse(JSON.stringify(label));
        Object.keys(label_copy).forEach(lang => {
            label_copy[lang] += (stringToLink || " ") + stringToAppend;
        });
        return label_copy;
    }

    function _prependPerLang(label, stringToPrepend, stringToLink) {
        let label_copy = JSON.parse(JSON.stringify(label));
        Object.keys(label_copy).forEach(lang => {
            label_copy[lang] = stringToPrepend + (stringToLink || " ") + label_copy[lang];
        });
        return label_copy;
    }

    /**
     * Concatenates two label objects for each language, optionally linking them with a string.
     * 
     * @param {Object} label1 - The first label object to concatenate.
     * @param {Object} label2 - The second label object to concatenate.
     * @param {string} [stringToLink=""] - An optional string to link the two labels. If not provided, it defaults to an empty string.
     * @return {Object} - A new label object with the concatenated labels for each language.
     * @example
     * let label1 = { "en": "Base Flow", "de": "Basisfluss" };
     * let label2 = { "en": "Total", "de": "Gesamt" };
     * let concatenatedLabel = pqfWidgetLib.effort._concatPerLang(label1, label2, " - ");
     * // concatenatedLabel will be { "en": "Base Flow - Total", "de": "Basisfluss - Gesamt" }
     */
    function _concatPerLang(label1, label2, stringToLink) {
        stringToLink = stringToLink || "";
        let label_copy = JSON.parse(JSON.stringify(label1));
        Object.keys(label_copy).forEach(lang => {
            label_copy[lang] += stringToLink + label2[lang];
        });
        return label_copy;
    }

    function _getCorrectTranslation(translatedString, lang) {
        if (typeof translatedString === "string") return translatedString; // No translations specified
        if (translatedString[lang]) return translatedString[lang];
        if (translatedString.en) return translatedString.en; // Fallback to English if no translation for the requested language
        return translatedString[Object.keys(translatedString)[0]]; // Fallback to the first available translation
    }

    function _constuctPeriodColValues(settings) {
        let periodCol_values = [];
        let beg_period = settings.beg;
        while (moment(beg_period).add(1, ZOOM_MAPPING[settings.zoomId].unit) <= moment(settings.end)) {
            periodCol_values.push({
                "start": moment(beg_period).format("YYYY-MM-DD"),
                "end": moment(beg_period).add(1, ZOOM_MAPPING[settings.zoomId].unit).subtract(1, "days").format("YYYY-MM-DD")
            });
            beg_period = moment(beg_period).add(1, ZOOM_MAPPING[settings.zoomId].unit).format("YYYY-MM-DD");
        }
        return periodCol_values;
    }

    function _getPaddedMacAllocSlots_perResource(resIds, settings) {
        // Load the macro allocation slots for the selected period
        let macAllocSlots_perResource = pqfLib.utils.apiFunc.exec(Pqf.alc, Pqf.alc.getMacroAllocationSlotsByResource, resIds, settings.beg_corrected, settings.end_corrected, ZOOM_MAPPING[settings.zoomId].zoom);
        if (!macAllocSlots_perResource) {
            message = "Failed to load macro allocation slots for the organization unit.";
            pqfLib.utils.misc.log(debugLevel, "warn", "340AD8E51B544042B2912CF2026A00EA", message);
            return {};
        }
        // If necessary, prepend or append empty slots
        if (settings.prependElements) {
            for (let i = 0; i < settings.prependElements; i++) {
                macAllocSlots_perResource.forEach(macAllocSlotsObj => {
                    macAllocSlotsObj.workload.slots.unshift(_getEmptySlot());
                });
            }
        }
        if (settings.appendElements) {
            for (let i = 0; i < settings.appendElements; i++) {
                macAllocSlots_perResource.forEach(macAllocSlotsObj => {
                    macAllocSlotsObj.workload.slots.push(_getEmptySlot());
                });
            }
        }
        return macAllocSlots_perResource;
    }

    function _getHourlyRates_perResource(resIds, currencyId) {
        _calcParameter("CURRENCY_MAPPING");
        let hourlyRates_perResource = resIds.reduce((acc, resId) => {
            // Find the current worktime model 
            let availabilities = pqfLib.utils.apiFunc.exec(Pqf.res, Pqf.res.getAvailabilities, resId);
            if (!availabilities) {
                let message = "Failed to load availabilities for the resource with id " + resId + ".";
                pqfLib.utils.misc.log(debugLevel, "warn", "97CA2CA5905B4137B0E70B24C8AD45AB", message);
                return acc;
            }
            let currentWorktimeModel = availabilities[0];
            availabilities.splice(1).forEach(availability => {
                if (moment(availability.validAfter) >= moment(currentWorktimeModel.validAfter) && moment(availability.validAfter).isBefore(moment())) {
                    currentWorktimeModel = availability;
                }
            });
            // Get the hourly rate for the current worktime model and transform it to the selected currency
            _calcParameter("CURRENCY_MAPPING");
            let hourlyRate_anyCurrency = {
                "currencyCode": CURRENCY_MAPPING[currentWorktimeModel.costCurrency].code,
                "amount": currentWorktimeModel.costPerHour
            }
            let hourlyRate = _convertToCurrency(hourlyRate_anyCurrency, currencyId);
            acc[resId] = hourlyRate ? hourlyRate.amount : null;
            return acc;
        }, {});
        return hourlyRates_perResource;
    }

    function _convertToCurrency(moneyObj, targetCurrencyId) {
        _calcParameter("CURRENCY_MAPPING");
        if (!CURRENCY_MAPPING[targetCurrencyId]) {
            let message = "The currency with id " + targetCurrencyId + " is not supported.";
            pqfLib.utils.misc.log(debugLevel, "error", "BD78584FBAD445178F21B031C27B2834", message);
            return null;
        }
        let startCurrencyMapping = Object.values(CURRENCY_MAPPING).find(obj => obj.code === moneyObj.currencyCode);
        if (!startCurrencyMapping) {
            let message = "The currency with code " + moneyObj.currencyCode + " is not supported.";
            pqfLib.utils.misc.log(debugLevel, "error", "79A2ADA03756404682AC6CD05678C66A", message);
            return null;
        }
        // If the currencies are the same, return the money object as is
        if (CURRENCY_MAPPING[targetCurrencyId].code === moneyObj.currencyCode) {
            return moneyObj;
        }
        // Convert the amount to the target currency
        let convertedAmount = moneyObj.amount * (startCurrencyMapping.rate / CURRENCY_MAPPING[targetCurrencyId].rate);
        // Return the converted money object
        return {
            "currencyCode": CURRENCY_MAPPING[targetCurrencyId].code,
            "amount": convertedAmount
        };
    }

    function _readTimeframe(client, defaults, settings) {
        settings.beg = moment.utc(client.config.period ? client.config.period.startDate.dateISO : defaults.beg).local().format("YYYY-MM-DD");
        settings.end = moment.utc(client.config.period ? client.config.period.endDate.dateISO : defaults.end).local().format("YYYY-MM-DD");
        if (settings.zoomId) {
            settings.beg = moment(settings.beg).startOf(ZOOM_MAPPING[settings.zoomId].unit).format("YYYY-MM-DD");
            settings.end = moment(settings.end).endOf(ZOOM_MAPPING[settings.zoomId].unit).add(1, 'days').format("YYYY-MM-DD");
        } else {
            settings.end = moment(settings.end).add(1, 'days').format("YYYY-MM-DD");
        }

        return settings;
    }

    function _applyFallback(defaults, defaults_fallback) {
        if (!defaults) {
            defaults = defaults_fallback;
        } else {
            Object.keys(defaults_fallback).forEach(key => {
                if (!defaults.hasOwnProperty(key)) {
                    defaults[key] = defaults_fallback[key];
                }
            });
        }
        return defaults;
    }

    function _getCorrectedDates(settings) {
        _calcParameter("BEG_LOW");
        _calcParameter("END_HIGH");
        settings.beg_corrected = settings.beg;
        settings.end_corrected = settings.end;
        if (settings.zoomId) {
            settings.prependElements = null;
            settings.appendElements = null;
        }
        if (moment(settings.beg) < moment(BEG_LOW)) {
            if (settings.zoomId) settings.prependElements = moment(BEG_LOW).diff(moment(settings.beg), ZOOM_MAPPING[settings.zoomId].unit + "s");
            settings.beg_corrected = moment(BEG_LOW).format("YYYY-MM-DD");
        }
        if (moment(settings.end) < moment(BEG_LOW)) {
            if (settings.zoomId) settings.prependElements -= moment(BEG_LOW).diff(moment(settings.end), ZOOM_MAPPING[settings.zoomId].unit + "s");
            settings.end_corrected = moment(BEG_LOW).format("YYYY-MM-DD");
        }
        if (moment(settings.end) > moment(END_HIGH)) {
            if (settings.zoomId) settings.appendElements = moment(settings.end).diff(moment(END_HIGH), ZOOM_MAPPING[settings.zoomId].unit + "s");
            settings.end_corrected = moment(END_HIGH).format("YYYY-MM-DD");
        }
        if (moment(settings.beg) > moment(END_HIGH)) {
            if (settings.zoomId) settings.appendElements -= moment(settings.beg).diff(moment(END_HIGH), ZOOM_MAPPING[settings.zoomId].unit + "s");
            settings.beg_corrected = moment(END_HIGH).format("YYYY-MM-DD");
        }
        return settings;
    }

    function _lastPresentInTF(settings, macAllocSlots) {
        // Handle case where selected time frame lies entirely in the future
        if (moment(settings.beg_corrected).isAfter(moment())) return;
        // Get the last day the resource was expected to work in the selected time frame
        let lastDay = null;
        let ind = null;
        if (moment(settings.end_corrected).isBefore(moment())) {
            // Case where the selected time frame lies entirely in the past
            lastDay = moment(settings.end_corrected).subtract(1, "days").format("YYYY-MM-DD");
            ind = macAllocSlots.length - 1;
        } else {
            // Case where the selected time frame includes the current day
            lastDay = moment().subtract(1, "days").format("YYYY-MM-DD");
            ind = moment(lastDay).diff(moment(settings.beg_corrected), "days");
        }
        let lastDayFound = false;
        while(!lastDayFound && ind >= 0) {
            // Correct for days where the resource is not expected to work
            if (moment.duration(macAllocSlots[ind].expectedPresence).asHours() > 0) {
                lastDayFound = true;
                continue;
            }
            ind--;
            lastDay = moment(lastDay).subtract(1, "days").format("YYYY-MM-DD"); 
        }
        return lastDay;
    }

    function _refDateinTF(settings) {
        // Handle case where selected time frame lies entirely in the future
        if (moment(settings.beg_corrected).isAfter(moment())) return;
        // Get the last day the resource was expected to work in the selected time frame
        let refDate = null;
        if (moment(settings.end_corrected).isBefore(moment())) {
            // Case where the selected time frame lies entirely in the past
            refDate = moment(settings.end_corrected).subtract(1, "days").format("YYYY-MM-DD");
        } else {
            // Case where the selected time frame includes the current day
            refDate = moment().subtract(1, "days").format("YYYY-MM-DD");
        }
        return refDate ? moment(refDate).format("YYYY-MM-DD") : null;
    }

    function _calcTBAcc(resEnum, settings) {
        // Find the reference date - the last day the resource was expected to work in the selected time frame
        let refDate = _refDateinTF(settings);
        if (!refDate) return; // No reference date found in the selected time frame
        // Load needed date to calc the current time balance
        let daySummary = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getDaySummary, resEnum.id, moment(refDate).startOf("year").format("YYYY-MM-DD"), moment(refDate).add(1, "days").format("YYYY-MM-DD"));
        let timeBalance = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getTimeBalance, resEnum.id, parseInt(moment(refDate).subtract(1, "years").format("YYYY")));
        let timeCorrections = pqfLib.utils.apiFunc.exec(Pqf.act, Pqf.act.getResourceTimeCorrections, resEnum.id);
        if (!daySummary || !timeBalance || !timeCorrections) {
            message = "Failed to load day summary, time balance or time corrections for resource " + resEnum.id + ".";
            pqfLib.utils.misc.log(debugLevel, "warn", "B1F2AB0F2A4C4D9B8F3A1E5B6C7D8E9F0", message);
            return;
        }
        // Calculate the time balance of the resource for the reference date
        let target = moment.duration(0);
        let actual = moment.duration(0);
        daySummary.forEach(day => {
            target.add(moment.duration(day.target));
            actual.add(moment.duration(day.sumPresences));
            day.absences.forEach(absence => {
                target.add(moment.duration(absence.duration));
                actual.add(moment.duration(absence.duration));
            });
        });
        let delta = moment.duration(actual).subtract(target);
        let tbAcc = moment.duration(delta).add(moment.duration(timeBalance.duration));
        let timeCorrections_forTBAccAndYear = timeCorrections.filter(tc => tc.type === "ResourcePresenceTimeCorrection" && moment(tc.date) >= moment(refDate).startOf("year") && moment(tc.date) <= moment(refDate));
        timeCorrections_forTBAccAndYear.forEach(tc => {
            tbAcc.add(moment.duration(tc.duration));
        });
        return tbAcc;
    }

    function _round(number, digits) {
        if (typeof number !== "number") return number; // Return the input if it is not a number
        if (digits === undefined || digits < 0) digits = 2; // Default to 2 digits if not provided or negative
        let factor = Math.pow(10, digits);
        return Math.round(number * factor) / factor; // Round the number to the specified number
    }

    function _transformColor(color) {
        if (!color || color === "null" || color === "undefined") return null;
        // Convert HEX color to HSL, then adjust the lightness and convert back to HEX
        let [h, s, l] = hexToHSL(color);
        s *= 0.5;
        l = 90;
        return hslToHex(h, s, l);
    }

    function hexToHSL(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        let r = parseInt(hex.substring(0,2), 16) / 255;
        let g = parseInt(hex.substring(2,4), 16) / 255;
        let b = parseInt(hex.substring(4,6), 16) / 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if(max === min){
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = l - c/2;
        let [r, g, b] = [0, 0, 0];

        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // PUBLIC API ##############################################################

    return {
        "setDebugLevel": _setDebugLevel,
        "setDebugMode": _setDebugMode,
        "getParameter": _getParameter,
        "getMapping": _getMapping,
        "overwriteMapping": _overwriteMapping,
        "addHint": _addHint,
        "getHints": _getHints,
        "effort": {
            "readSettings": _readSettings_effortWidget,
            "constructJtf": _constructJtf_effortWidget,
            "sumSlotsArrays": _sumSlotsArrays,
            "getBaseVsCompChart": _getBaseVsCompChart_effortWidget,
            "getEmptySlot": _getEmptySlot
        },
        "openCapa": {
            "readSettings": _readSettings_openCapaWidget,
            "constructJtf": _constructJtf_openCapaWidget,
            "getBarChart": _getBarCharts_openCapaWidget
        },
        "resAtt": {
            "readSettings": _readSettings_resAttWidget,
            "constructJtf": _constructJtf_resAttWidget
        },
        "prjAtt": {
            "readSettings": _readSettings_prjAttWidget,
            "constructJtf": _constructJtf_prjAttWidget
        },
        "timeQuotas": {
            "readSettings": _readSettings_timeQuotasWidget,
            "constructJtf": _constructJtf_timeQuotasWidget
        },
        "objList": {
            "readSettings": _readSettings_objectListWidget,
            "constructJtf": _constructJtf_objectListWidget,
            "getDonutChart": _getDonutChart_objectListWidget
        },
        "prjDependencies": {
            "readSettings": _readSettings_prjDependenciesWidget,
            "constructJtf": _constructJtf_prjDependenciesWidget
        },
        "allocations": {
            "readSettings": _readSettings_allocWidget,
            "constructJtf": _constructJtf_allocationsWidget
        },
        "utils": {
            "getCorrectTranslation": _getCorrectTranslation,
            "moment": moment
        }
    }
})();