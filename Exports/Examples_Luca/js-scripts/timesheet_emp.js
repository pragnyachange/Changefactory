/*
Author(s): LI

Description:
    Timesheet export

DB Instructions:
    -   Sandbox
        -   [JavaScriptSourceCodeId] = "E4CFE386E1ED447482F7DE7D9EC506C1"
    -   Export
        -   [JavaScriptExportDefinitionId] = "BDB3923698D54093BDB13DF72E2810CD"

Libraries:
    -   moment (with locales)
*/

// Example script for worktime export
// Created for INTRASOFT by SM, 06.12.2023
// // //   // // // ////   //   //// //

var year = moment().year();

var clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

var dayAbsenceConvert = function(abs) {
    return {duration:moment.duration(abs.duration).asSeconds(), absenceType:abs.absenceType};
};

var dayConvert = function(dys) {
    return {target:moment.duration(dys.target).asSeconds(), sumAbsences:moment.duration(dys.sumAbsences).asSeconds(), sumPresences:moment.duration(dys.sumPresences).asSeconds(), absences:dys.absences.map(dayAbsenceConvert)};
};

var absenceConvert = function(abs) {
    return {duration:moment.duration(abs.duration).asSeconds(),absenceType:abs.absenceType};
};

var timeConvert = function(tme) {
    return {duration:moment.duration(tme.duration).asSeconds()};
};

var correctionConvert = function(crc) {
    return {date:crc.date, duration:moment.duration(crc.duration).asSeconds(), comment:crc.comment, type:crc.type};
};

var clockDay = function(clk) {
    return moment(clk.start || clk.startClocked || clk.end || clk.endClocked).format('YYYY-MM-DD');
};

var clockConvert = function(clk) {
    var result;
    if (clk.start) {
        result = moment(clk.start).format('HH:mm') + '*';
    } else if (clk.startClocked) {
        result = moment(clk.startClocked).format('HH:mm');
    } else {
        result = '?';
    }
    if (clk.end) {
        result = result + ' ' + moment(clk.end).format('HH:mm') + '*';
    } else if (clk.endClocked) {
        result = result + ' ' + moment(clk.endClocked).format('HH:mm');
    } else {
        result = result + ' ?';
    }
    return result;
};

var filterDate = function(obj) {
    let date = obj ? obj.date : undefined;
    let dateYear = date ? date.substring(0,4) : undefined;
    return dateYear && (dateYear > year - 3) && (dateYear <= year);
};

var resourceId = reference.id;
var result = {};
result.year = year;
result.month = moment().month() + 1;
result.resource = Pqf.res.getResource(resourceId);
result.absenceTypes = Pqf.alc.getAbsenceTypes();
result.months = [];
for (let y=3; y>=0; y--) {
    let current = {};
    current.absences = Pqf.act.getAbsencesBalance(resourceId, year - y).map(absenceConvert);
    current.times = timeConvert(Pqf.act.getTimeBalance(resourceId, year - y));
    if (y<3) {
        for (let m=1; m<12; m++) {
            current.month = (year - y) + "-" + (m >= 10 ? m : "0" + m);
            result.months.push(current);
            current = clone(current);
        }
    }
    current.month = (year - y) + "-12";
    result.months.push(current);
}
result.day = Pqf.act.getDaySummary(resourceId, (year-2) + '-01-01', (year+1) + '-01-01').map(dayConvert);
// Set target of upcoming days to 0 and fix balance of current year
var fixbalance = 0;
for (let d=moment().startOf('d').diff(moment({ year:year-2, month:0, day:1}), 'd'); d<result.day.length; d++) {
    let day = result.day[d];
    fixbalance += (day.target - day.sumPresences);
    day.target = 0;
    day.sumPresences = 0;
}
for (let m=25; m<37; m++) {
    result.months[m].times.duration += fixbalance;
}

// Update month balances
for (let d = 0; d<result.day.length; d++) {
    let day = result.day[d];
    let thisdate = moment({ year:year-2, month:0, day:1}).add(d, 'd'); //Note: month is zero indexed
    let thisyear = thisdate.year();
    let thismonth = thisdate.month() + 1;
    for (let month = (thisyear - year + 2)*12 + 1; month<(thisyear - year + 2)*12 + thismonth; month++) {
        let monthBalance = result.months[month];
        monthBalance.times.duration += (day.target - day.sumPresences);
        for (let absence of day.absences) {
            for (let absenceBalance of monthBalance.absences) {
                if (absenceBalance.absenceType === absence.absenceType) absenceBalance.duration += absence.duration;
            }
        }
    }
}
var actualPeriods = Pqf.act.getResourceActualsPeriods(resourceId);
var clocking = {};
for (let actualPeriod of actualPeriods) {
    let actualPeriodYear = actualPeriod.beg.substring(0, 4);
    if ((actualPeriodYear > year - 3) && (actualPeriodYear <= year)) {
        let presences = Pqf.act.getResourcePresences(resourceId, actualPeriod.id);
        for (let presence of presences) {
            let date = clockDay(presence);
            if (clocking[date]) {
                clocking[date] = clocking[date] + ' ' + clockConvert(presence);
            } else {
                clocking[date] = clockConvert(presence);
            }
        }
    }
}
result.clocking = [];
for (let date in clocking) {
    result.clocking.push({date:date, clocking:clocking[date]});
}
result.corrections = Pqf.act.getResourceTimeCorrections(resourceId).filter(filterDate).map(correctionConvert);
// Update month balances
for (let correction of result.corrections) {
    let thisdate = moment(correction, 'YYYY-MM-DD');
    let thisyear = thisdate.year();
    let thismonth = thisdate.month() + 1;
    for (let month = (thisyear - year + 2)*12 + 1; month<(thisyear - year + 2)*12 + thismonth; month++) {
        let monthBalance = result.months[month];
        if (correction.type === 'ResourcePresenceTimeCorrection') {
            monthBalance.times.duration -= correction.duration;
        } else {
            for (let absenceBalance of monthBalance.absences) {
                if (absenceBalance.absenceType === correction.type) {
                    absenceBalance.duration -= correction.duration;
                }
            }
        }
    }
}
result.exportedBy = Pqf.acm.getCurrentUser();
result.exportedAt = moment().format('DD.MM.YYYY HH:mm:ss');
result.claim = 'Brought to you by the fantastic server team. Thank you, AS!';

// Log result for debugging purposes
// console.log(result);

// return result with collected data
result;