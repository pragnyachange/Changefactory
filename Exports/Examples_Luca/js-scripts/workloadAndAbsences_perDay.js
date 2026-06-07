/*
Author(s): LI

Description:
    

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "CECD2032D7C44285BDA7199FF4006EA6"
    -   Export
        -   [JavaScriptExportDefinitionId] = "4E44E74359D54BA99F0DD5154E2FAD65"

Libraries:
    -   moment (with locales)
    -   pqfDataCollectorLib
*/

'use strict';
// import 'moment/locale/de';

const DEFAULT_OU = 'HRM-OU-ROOT';
const DEFAULT_LANGUAGE = 'en';

// Check if reference is defined
if (typeof reference !== 'undefined') {
    var ouId = reference.id;
} else {
    var ouId = DEFAULT_OU;
}

// Check user settings 
let loadedItemIds = null;
let selectedStartDate = null;
if (typeof client !== 'undefined') {
    loadedItemIds = client.screens[0].allocation.resources.map(obj => obj.id);
    selectedStartDate = moment(
        client.screens[0].allocation.calender.timelines.totalRange.start).
        add(1, 'day').format('YYYY-MM-DD');
} 
let user = null;
try {
    user = Pqf.acm.getCurrentUser();
} catch (error) {
    console.warn('Failed loading user information.');
}
let language = user ? user.language.split('-')[0] : DEFAULT_LANGUAGE;

// Load all resource IDs, starting from the selected OU
let rootResource = Pqf.res.getResource(ouId);
// Recursively get all children
let resourceObjs = [];
_loadChildResources(rootResource, 0);

// Get date range
let beg = null;
if (selectedStartDate) {
    beg = moment(selectedStartDate).startOf('month').format('YYYY-MM-DD');
} else {
    beg = moment().startOf('month').format('YYYY-MM-DD');
}
let end = moment(beg).add(1, 'month').format('YYYY-MM-DD');

// Per resource, get the planning and macro allocation slots
for (let resourceObj of resourceObjs) {
    try {
        resourceObj.planningSlots = Pqf.alc.getPlanningSlots(
            resourceObj.id, beg, end);
        resourceObj.macroAllocationSlots = Pqf.alc.getMacroAllocationSlots(
            resourceObj.id, beg, end, ['DAY']);
    } catch (error) {
        console.warn(
            `Resource ${resourceObj.name} (${resourceObj.id}) could not be ` +
            `loaded: ${error}`);
    }
}
// Filter
resourceObjs = resourceObjs.filter(
    obj => !loadedItemIds || loadedItemIds.includes(obj.id));

// Construct table
let jsdata = {
    'tableHeader': [],
    'tableBody': []
}
// Get the weekdays between beg and end
for (let day=moment(beg); day.isBefore(end); day.add(1, 'day')) {
    let day_translated = _translateDays(day.format('dddd'), language);
    jsdata.tableHeader.push(day_translated);
}
let availability_translated = language === 'de' ? 
    'Verfügbarkeit' : 'Availability';
let workload_translated = language === 'de' ?
    'Auslastung' : 'Workload';
let allocation_translated = language === 'de' ?
    'Zuweisung' : 'Allocation';
let absences_translated = language === 'de' ?
    'Abwesenheiten' : 'Absences';
let holidy_translated = language === 'de' ?
    'Feiertag' : 'Holiday';
// Fill body with resource data
for (let resourceObj of resourceObjs) {
    // First three rows: Availability (including resource name), Workload, and 
    // Allocation 
    let levelIndication = '';
    for (let i=0; i<resourceObj.level; i++) {
        levelIndication += '↳ ';
    }
    let row_availability = [
        resourceObj.type, levelIndication, resourceObj.name, 
        availability_translated, 0, null];
    let row_workload = ['workload', null, null, workload_translated, 0, null];
    let row_allocation = [
        'allocation', null, null, allocation_translated, 0, null];
    // Load values per day
    for (let i=0; i<jsdata.tableHeader.length; i++) {
        // Load availability and calculate workload
        let availability = moment.duration(
            resourceObj.macroAllocationSlots.slots[i].availability).asHours();
        // If any allocations were made, load them and calculate workload
        let allocation = 0;
        let workload = 0;
        if (resourceObj.macroAllocationSlots.slots[i].forecasts[0]) {
            allocation = moment.duration(
                resourceObj.macroAllocationSlots.slots[i].forecasts[0].planned).
                asHours();
            if (!allocation) { allocation = 0; }
            else if (allocation > 0 && (!availability || availability == 0)) {
                workload = 9.99;
            }
            else {
                workload = allocation / availability;
                workload = workload > 9.99 ? 9.99 : workload;
            }
        }
        // Push values to rows
        row_availability.push(_round(availability, 1) + 'h');
        row_availability[4] += availability;
        row_workload.push(_round(workload, 2));
        row_allocation.push(_round(allocation, 1) + 'h');
        row_allocation[4] += allocation;
    }
    // Calculate average workload
    row_workload[4] = 
        _round(row_allocation[4] / row_availability[4] * 100, 0) + '%';
    // Round summed values
    row_availability[4] = _round(row_availability[4], 1) + 'h';
    row_allocation[4] = _round(row_allocation[4], 1) + 'h';
    // Push rows to table body
    jsdata.tableBody.push(row_availability);
    jsdata.tableBody.push(row_workload);
    jsdata.tableBody.push(row_allocation);
    // Fourth and fifth row: Absences AM and PM
    let row_absencesAM = ['morning', null, null, absences_translated, 0, 'M'];
    let row_absencesPM = ['afternoon', null, null, null, 0, 'A']; 
    // If employee, check for absences
    if (resourceObj.type === 'HRM-RES-TYP-EMP') {
        // Load values per day
        for (let i=0; i<jsdata.tableHeader.length; i++) {
            // Check for absences AM
            if (resourceObj.planningSlots.shifts[0].slots[i].absence) {
                // Check if employee should be working (i.e., no holiday)
                if (resourceObj.planningSlots.shifts[0].slots[i].model.presence 
                    === true) {
                    row_absencesAM[4] += 
                        moment.duration(
                            resourceObj.planningSlots.shifts[0].slots[i].model.
                            duration
                        ).asHours();
                    row_absencesAM.push(
                        resourceObj.planningSlots.shifts[0].slots[i].absence.
                        absenceName);
                }
                // If holiday, push 'Holiday'
                else {
                    row_absencesAM.push(
                        resourceObj.planningSlots.shifts[0].slots[i].model.
                        holiday ? holidy_translated : null
                    );
                }
            }
            // If no absence, push 'Holiday' or null
            else {
                row_absencesAM.push(
                    resourceObj.planningSlots.shifts[0].slots[i].model.holiday ? 
                    holidy_translated : null);
            }
            // Do same for afternoon
            if (resourceObj.planningSlots.shifts[1].slots[i].absence) {
                if (resourceObj.planningSlots.shifts[1].slots[i].model.presence 
                    === true) {
                    row_absencesPM[4] += 
                        moment.duration(
                            resourceObj.planningSlots.shifts[1].slots[i].model.
                            duration
                        ).asHours();
                    row_absencesPM.push(
                        resourceObj.planningSlots.shifts[1].slots[i].absence.
                        absenceName);
                }
                else {
                    row_absencesPM.push(
                        resourceObj.planningSlots.shifts[1].slots[i].model.
                        holiday ? 
                        holidy_translated : null);
                }
            }
            else {
                row_absencesPM.push(
                    resourceObj.planningSlots.shifts[1].slots[i].model.holiday ? 
                    holidy_translated : null);
            }
        }
        // Round summed values
        row_absencesAM[4] = _round(row_absencesAM[4], 1) + 'h';
        row_absencesPM[4] = _round(row_absencesPM[4], 1) + 'h';
    }
    // Push rows to table body
    jsdata.tableBody.push(row_absencesAM);
    jsdata.tableBody.push(row_absencesPM);
}

// General Info
let currentUser = pqfDataCollectorLib.tools.getCurrentUser();
let timestamp = pqfDataCollectorLib.tools.getTimestamp("DD/MM/YYYY", "HH:mm");
switch (language) {
    case 'en': 
        jsdata.docDesc = 'Workload and Absences View';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        break;
    case 'de':
        jsdata.docDesc = 'Auslastungs- und Abwesenheitsansicht';
        jsdata.exportedBy = `Exportiert von ${currentUser.name} am `+ 
        `${timestamp.date} um ${timestamp.time}`;
        break;
    default:
        jsdata.docDesc = 'Workload and Absences View';
        jsdata.exportedBy = `Exported by ${currentUser.name} on `+ 
        `${timestamp.date} at ${timestamp.time}`;
        console.warn('Unknown language: ' + language);
        break;
}
jsdata.companyName = rootResource.name;
if (selectedStartDate) {
    jsdata.currentMonth = moment(selectedStartDate).format('MMMM YYYY');
} else {
    jsdata.currentMonth = moment().format('MMMM YYYY');
}

jsdata.tooManyRows = jsdata.tableBody.length > 250 ? 
    "Can only display a maximum of 50 resources!" : null;

// Output resulting JSON object
console.log(JSON.stringify(jsdata));

jsdata;

/*
################################################################################
FUNCTIONS
################################################################################
*/

function _loadChildResources(resourceObj, level) {
    // Push information about current resource
    resourceObjs.push({
        'id': resourceObj.id, 
        'name': resourceObj.name, 
        'type': resourceObj.type,
        'level': level
    });
    let childResources = Pqf.res.getResourceChildren(resourceObj.id);
    childResources.sort((a, b) => a.name.localeCompare(b.name));
    let childOUs = [];
    for (let childResource of childResources) {
        if (childResource.type === 'HRM-RES-TYP-OU') {
            childOUs.push(childResource);
        } else if (childResource.type === 'HRM-RES-TYP-EMP') {
            resourceObjs.push({
                'id': childResource.id, 
                'name': childResource.name, 
                'type': childResource.type,
                'level': level + 1
            });
        }
    }
    for (let childOU of childOUs) {
        _loadChildResources(childOU, level + 1);
    }
}

function _round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

/**
 * Hopefully only a temporary solution...
 * 
 * @param {string} day in englisch.
 * @param {string} language in which the day should be translated ['de', ...].
 * @returns {string} translated day.
 */
function _translateDays(day, language) {
    switch (day) {
        case 'Monday':
            return language === 'de' ? 'Montag' : 'Monday';
        case 'Tuesday':
            return language === 'de' ? 'Dienstag' : 'Tuesday';
        case 'Wednesday':
            return language === 'de' ? 'Mittwoch' : 'Wednesday';
        case 'Thursday':
            return language === 'de' ? 'Donnerstag' : 'Thursday';
        case 'Friday':
            return language === 'de' ? 'Freitag' : 'Friday';
        case 'Saturday':
            return language === 'de' ? 'Samstag' : 'Saturday';
        case 'Sunday':
            return language === 'de' ? 'Sonntag' : 'Sunday';
        default:
            console.warn('Unknown day: ' + day);
            return day;
    }
}