/*
Author(s): Change Factory (changefactory.swiss)

Description:
    Monthly summary export for an employee, triggered from the
    "timerecording" feature tab (feature=timerecording).

    jsdata structure (matches Excel template placeholder syntax):
      {jsdata.employeeName}
      {jsdata.month}
      {jsdata.exportedBy}
      {jsdata.exportedAt}
      {jsdata.totalPlanned}
      {jsdata.totalActual}
      {jsdata.totalDelta}
      {jsdata.tableHeader[0..7]}
      {jsdata.tableBody[row][col]}  — col 0=customer,1=project,2=task,3=employee,
                                        4=date,5=planned,6=reported,7=comment

Libraries: MOMENT_WITH_LOCALES
*/

'use strict';

var MAX_ROWS         = 200;
var DEFAULT_LANGUAGE = 'en';

// Safe reference guard
var resourceId = (typeof reference !== 'undefined' && reference && reference.id)
    ? reference.id
    : null;

if (!resourceId) {
    console.error('EMP-MONTHLY-ALLOC: No reference provided. Must be triggered from the UI on an Employee.');
}

// Current user & language
var currentUser = null;
try { currentUser = Pqf.acm.getCurrentUser(); } catch (e) {}
var language = (currentUser && currentUser.language)
    ? currentUser.language.split('-')[0]
    : DEFAULT_LANGUAGE;

// Month range from UI calendar, fall back to current month
var beg = null;
if (typeof client !== 'undefined' && client) {
    try {
        var rangeStart = client.screens[0].allocation.calendar.timelines.totalRange.start;
        beg = moment(rangeStart).startOf('month').format('YYYY-MM-DD');
    } catch (e) {}
}
if (!beg) { beg = moment().startOf('month').format('YYYY-MM-DD'); }
var end        = moment(beg).add(1, 'month').format('YYYY-MM-DD');
var monthLabel = moment(beg).locale(language).format('MMMM YYYY');

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
var jsdata = {
    employeeName: resourceId || '',
    month:        monthLabel,
    exportedBy:   currentUser ? currentUser.name : '',
    exportedAt:   moment().format('DD.MM.YYYY HH:mm'),
    totalPlanned: 0,
    totalActual:  0,
    totalDelta:   0,
    tableHeader:  _getHeaders(language),
    tableBody:    _buildEmptyBody(MAX_ROWS)
};

try {

    // 1. Load employee
    var employee = null;
    if (resourceId) {
        try { employee = Pqf.res.getResource(resourceId); } catch (e) {
            console.error('EMP-MONTHLY-ALLOC: Cannot load employee ' + resourceId + ': ' + e);
        }
    }
    var employeeName = employee ? employee.name : (resourceId || '');
    jsdata.employeeName = employeeName;

    // 2. Collect actuals keyed by projectId|workItemId
    var actualsByKey = {};
    if (resourceId) {
        try {
            var periods = Pqf.act.getResourceActualsPeriods(resourceId);
            for (var pi = 0; pi < periods.length; pi++) {
                var period    = periods[pi];
                var periodEnd = period.end || '9999-12-31';
                if (periodEnd < beg || period.beg >= end) { continue; }
                var projectTimes = [];
                try {
                    projectTimes = Pqf.act.getResourceProjectTimes(resourceId, period.id);
                } catch (e) {
                    console.warn('EMP-MONTHLY-ALLOC: Could not load project times for period ' + period.id + ': ' + e);
                    continue;
                }
                for (var ti = 0; ti < projectTimes.length; ti++) {
                    var pt = projectTimes[ti];
                    if (!pt.day || pt.day < beg || pt.day >= end) { continue; }
                    var hours = pt.duration ? _round(moment.duration(pt.duration).asHours(), 2) : 0;
                    if (hours === 0) { continue; }
                    var key = (pt.projectId || '') + '|' + (pt.workItemId || '');
                    if (!actualsByKey[key]) {
                        actualsByKey[key] = { projectId: pt.projectId || null, workItemId: pt.workItemId || null, totalHours: 0, dailyRows: [] };
                    }
                    actualsByKey[key].totalHours = _round(actualsByKey[key].totalHours + hours, 2);
                    actualsByKey[key].dailyRows.push({ day: pt.day, hours: hours, comment: pt.comment || '' });
                }
            }
        } catch (e) {
            console.error('EMP-MONTHLY-ALLOC: Error reading actuals: ' + e);
        }
    }

    // 3. Collect planned hours
    var plannedByKey     = {};
    var workItemNameById = {};
    var projectNameById  = {};
    if (resourceId) {
        var involvedProjects = [];
        try { involvedProjects = Pqf.alc.getInvolvedProjects(resourceId) || []; } catch (e) {
            console.warn('EMP-MONTHLY-ALLOC: Could not load involved projects: ' + e);
        }
        for (var ip = 0; ip < involvedProjects.length; ip++) {
            var prjRef = involvedProjects[ip];
            projectNameById[prjRef.id] = prjRef.name || prjRef.id;
            try {
                var phaseAlloc = Pqf.alc.getProjectPhaseAllocationsByResource(prjRef.id, resourceId, beg, end);
                if (!phaseAlloc || !phaseAlloc.workItems) { continue; }
                for (var wi = 0; wi < phaseAlloc.workItems.length; wi++) {
                    var wItem = phaseAlloc.workItems[wi];
                    if (!wItem.workItem) { continue; }
                    workItemNameById[wItem.workItem.id] = wItem.workItem.name || '';
                    var plannedHours = wItem.planned ? _round(moment.duration(wItem.planned).asHours(), 2) : 0;
                    if (plannedHours === 0) { continue; }
                    var pKey = prjRef.id + '|' + wItem.workItem.id;
                    plannedByKey[pKey] = (plannedByKey[pKey] || 0) + plannedHours;
                }
            } catch (e) {
                console.warn('EMP-MONTHLY-ALLOC: Could not load phase allocations for project ' + prjRef.id + ': ' + e);
            }
        }
    }

    // 4. Collect customer names
    var customerByProjectId = {};
    var allProjectIds = {};
    var aKeys = Object.keys(actualsByKey);
    var pKeys = Object.keys(plannedByKey);
    for (var ak = 0; ak < aKeys.length; ak++) {
        var apid = actualsByKey[aKeys[ak]].projectId;
        if (apid) { allProjectIds[apid] = true; }
    }
    for (var pk = 0; pk < pKeys.length; pk++) {
        var ppid = pKeys[pk].split('|')[0];
        if (ppid) { allProjectIds[ppid] = true; }
    }
    var pidList = Object.keys(allProjectIds);
    for (var pidx = 0; pidx < pidList.length; pidx++) {
        var projectId    = pidList[pidx];
        var customerName = '';
        try {
            var detail = Pqf.pm.getProjectDetails(projectId);
            if (detail) {
                var skeys = Object.keys(detail);
                for (var sk = 0; sk < skeys.length; sk++) {
                    if (customerName) { break; }
                    var section = detail[skeys[sk]];
                    if (!section || typeof section !== 'object') { continue; }
                    var propkeys = Object.keys(section);
                    for (var prk = 0; prk < propkeys.length; prk++) {
                        if (customerName) { break; }
                        var lk = propkeys[prk].toLowerCase();
                        if (lk.indexOf('customer') !== -1 || lk.indexOf('kunde') !== -1 || lk.indexOf('client') !== -1) {
                            var pv = section[propkeys[prk]];
                            if (pv && pv.value) { customerName = String(pv.value); }
                        }
                    }
                }
            }
        } catch (e) {}
        if (!projectNameById[projectId]) {
            try {
                var prj = Pqf.pm.getProject(projectId);
                projectNameById[projectId] = prj ? (prj.name || projectId) : projectId;
            } catch (e) { projectNameById[projectId] = projectId; }
        }
        customerByProjectId[projectId] = customerName;
    }

    // 5. Build flat row objects
    var rows    = [];
    var allKeys = {};
    for (var aKey in actualsByKey)  { allKeys[aKey] = true; }
    for (var plKey in plannedByKey) { allKeys[plKey] = true; }
    var allKeyList = Object.keys(allKeys);
    for (var ki = 0; ki < allKeyList.length; ki++) {
        var key2         = allKeyList[ki];
        var parts        = key2.split('|');
        var prjId        = parts[0] || '';
        var wiId         = parts[1] || '';
        var prjName      = projectNameById[prjId]  || prjId;
        var taskName     = workItemNameById[wiId]  || wiId || '(no task)';
        var custName     = customerByProjectId[prjId] || '';
        var plannedTotal = plannedByKey[key2] || 0;
        var actualData   = actualsByKey[key2];

        if (actualData && actualData.dailyRows.length > 0) {
            actualData.dailyRows.sort(function (a, b) { return a.day < b.day ? -1 : a.day > b.day ? 1 : 0; });
            for (var di = 0; di < actualData.dailyRows.length; di++) {
                var dr = actualData.dailyRows[di];
                rows.push([
                    custName, prjName, taskName, employeeName,
                    dr.day,
                    di === 0 ? plannedTotal : '',
                    dr.hours,
                    dr.comment
                ]);
            }
        } else if (plannedTotal > 0) {
            rows.push([custName, prjName, taskName, employeeName, '', plannedTotal, 0, '']);
        }
    }

    rows.sort(function (a, b) {
        for (var fi = 0; fi < 5; fi++) {
            var va = a[fi] || ''; var vb = b[fi] || '';
            if (va < vb) { return -1; } if (va > vb) { return 1; }
        }
        return 0;
    });

    // 6. Totals
    var totalPlanned = 0;
    var totalActual  = 0;
    for (var ri = 0; ri < rows.length; ri++) {
        totalPlanned += (typeof rows[ri][5] === 'number') ? rows[ri][5] : 0;
        totalActual  += (typeof rows[ri][6] === 'number') ? rows[ri][6] : 0;
    }
    jsdata.totalPlanned = _round(totalPlanned, 2);
    jsdata.totalActual  = _round(totalActual,  2);
    jsdata.totalDelta   = _round(totalActual - totalPlanned, 2);

    // 7. Build tableBody — pad to MAX_ROWS with empty arrays
    var tableBody = [];
    for (var ri2 = 0; ri2 < MAX_ROWS; ri2++) {
        tableBody.push(rows[ri2] || ['', '', '', '', '', '', '', '']);
    }
    jsdata.tableBody = tableBody;

    console.warn('EMP-MONTHLY-ALLOC: Export complete. Rows: ' + rows.length
        + ' | Planned: ' + jsdata.totalPlanned + 'h | Actual: ' + jsdata.totalActual + 'h');
    
    console.warn('JSDATA: ' + JSON.stringify(jsdata).substring(0, 500)); 

    if (rows.length > MAX_ROWS) {
        console.warn('EMP-MONTHLY-ALLOC: WARNING — ' + rows.length + ' rows exceed MAX_ROWS (' + MAX_ROWS + ').');
    }

} catch (fatalErr) {
    console.error('EMP-MONTHLY-ALLOC: FATAL error: ' + fatalErr);
}

jsdata;

// HELPERS ####################################################################

function _round(val, dec) {
    if (typeof val !== 'number' || isNaN(val)) { return 0; }
    var f = Math.pow(10, dec);
    return Math.round(val * f) / f;
}

function _getHeaders(lang) {
    var h = {
        en: ['Customer / Portfolio', 'Project', 'Task / Phase', 'Employee', 'Date', 'Planned (h)', 'Reported (h)', 'Comment'],
        de: ['Kunde / Portfolio',    'Projekt', 'Aufgabe / Phase', 'Mitarbeiter', 'Datum', 'Zugeteilt (h)', 'Rapportiert (h)', 'Kommentar'],
        fr: ['Client / Portfolio',   'Projet',  'Tâche / Phase',  'Employé(e)',  'Date',  'Alloué (h)',    'Rapporté (h)',    'Commentaire']
    };
    return h[lang] || h['en'];
}

function _buildEmptyBody(count) {
    var body = [];
    for (var i = 0; i < count; i++) { body.push(['', '', '', '', '', '', '', '']); }
    return body;
}
