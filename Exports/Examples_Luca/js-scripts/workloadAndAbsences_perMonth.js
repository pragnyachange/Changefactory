/*
Author(s): LI

Description:
    Timesheet export

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "F1AD49C42F094E0DA60D9DA97774FFF8"
    -   Export
        -   [JavaScriptExportDefinitionId] = "20659244C5CA4363BF37F372B7714EDA"

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
        add(2, 'week').format('YYYY-MM-DD');
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
    beg = moment(selectedStartDate).startOf('year').format('YYYY-MM-DD');
} else {
    beg = moment().startOf('year').format('YYYY-MM-DD');
}
let end = moment(beg).add(1, 'year').format('YYYY-MM-DD');

// Per resource, get the macro allocation slots
for (let resourceObj of resourceObjs) {
    try {
        resourceObj.planningSlotsPerMonth = [];
        for (let i=0; i<12; i++) {
            let month = moment(beg).add(i, 'month');
            resourceObj.planningSlotsPerMonth.push(
                Pqf.alc.getPlanningSlots(
                    resourceObj.id, 
                    month.format('YYYY-MM-DD'), 
                    month.add(1, 'month').format('YYYY-MM-DD'))
            );
        }
        resourceObj.macroAllocationSlots = Pqf.alc.getMacroAllocationSlots(
            resourceObj.id, beg, end, ['MONTH']);
    } catch (error) {
        console.warn(
            `Resource ${resourceObj.name} (${resourceObj.id}) could not be ` +
            `loaded: ${error}`);
    }
}
resourceObjs = resourceObjs.filter(
    obj => !loadedItemIds || loadedItemIds.includes(obj.id));

// Construct table
let jsdata = {
    'tableHeader': [],
    'tableBody': []
}
// Get the weekdays between beg and end
for (let month=moment(beg); month.isBefore(end); month.add(1, 'month')) {
    let month_translated = _translateMonths(month.format('MMMM'), language);
    jsdata.tableHeader.push(month_translated);
}
let availability_translated = language === 'de' ? 
    'Verfügbarkeit' : 'Availability';
let workload_translated = language === 'de' ?
    'Auslastung' : 'Workload';
let allocation_translated = language === 'de' ?
    'Zuweisung' : 'Allocation';
let absences_translated = language === 'de' ?
    'Abwesenheiten' : 'Absences';
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
        availability_translated, 0];
    let row_workload = ['workload', null, null, workload_translated, 0];
    let row_allocation = [
        'allocation', null, null, allocation_translated, 0];
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
    // Fourth row: Absences
    let row_absences = ['absences', null, null, absences_translated, 0];
    // If employee, check for absences
    if (resourceObj.type === 'HRM-RES-TYP-EMP') {
        // Iterate over months
        for (let month=0; month<12; month++) {
            let absences_thisMonth = 0;
            // Iterate over days
            for (let day=0; 
                day<resourceObj.planningSlotsPerMonth[month].shifts[0].slots.
                    length; 
                day++) {
                // Check for absences AM
                if (resourceObj.planningSlotsPerMonth[month].shifts[0].
                    slots[day].absence) {
                    // Check if employee should be working (i.e., no holiday)
                    if (resourceObj.planningSlotsPerMonth[month].shifts[0].
                        slots[day].model.presence === true) {
                        absences_thisMonth += 
                            moment.duration(
                                resourceObj.planningSlotsPerMonth[month].
                                shifts[0].slots[day].model.duration
                            ).asHours();
                    }
                }
                // Check for absences PM
                if (resourceObj.planningSlotsPerMonth[month].shifts[1].
                    slots[day].absence) {
                    // Check if employee should be working (i.e., no holiday)
                    if (resourceObj.planningSlotsPerMonth[month].shifts[1].
                        slots[day].model.presence === true) {
                        absences_thisMonth += 
                            moment.duration(
                                resourceObj.planningSlotsPerMonth[month].
                                shifts[1].slots[day].model.duration
                            ).asHours();
                    }
                }
            }
            row_absences.push(_round(absences_thisMonth, 1) + 'h');
            row_absences[4] += absences_thisMonth;
        }
        // Round summed values
        row_absences[4] = _round(row_absences[4], 1) + 'h';
    }
    jsdata.tableBody.push(row_absences);
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
    jsdata.currentYear = moment(selectedStartDate).format('YYYY');
} else {
    jsdata.currentYear = moment().format('YYYY');
}

jsdata.tooManyRows = jsdata.tableBody.length > 200 ? 
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
 * @param {string} month in englisch.
 * @param {string} language in which the day should be translated ['de', ...].
 * @returns {string} translated day.
 */
function _translateMonths(month, language) {
    switch (month) {
        case 'January':
            return language === 'de' ? 'Januar' : month;
        case 'February':
            return language === 'de' ? 'Februar' : month;
        case 'March':
            return language === 'de' ? 'März' : month;
        case 'April':
            return language === 'de' ? 'April' : month;
        case 'May':
            return language === 'de' ? 'Mai' : month;
        case 'June':
            return language === 'de' ? 'Juni' : month;
        case 'July':
            return language === 'de' ? 'Juli' : month;
        case 'August':
            return language === 'de' ? 'August' : month;
        case 'September':
            return language === 'de' ? 'September' : month;
        case 'October':
            return language === 'de' ? 'Oktober' : month;
        case 'November':
            return language === 'de' ? 'November' : month;
        case 'December':
            return language === 'de' ? 'Dezember' : month;
        default:
            console.warn('Unknown month: ' + month);
            return month;
    }
}