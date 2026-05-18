/**
 * @name PQFORCE JS Gantt SVG Library
 * @version 1.0.0
 * @file pqfGanttSVGLib.js
 * @description Set of utility JS functions to calculate the graphic measurements of each element of a Gantt export.
 * @author AS
 * @pqfId 8A3C0C4964FA457D820B13CD991B8BBB
 * @created 2025-12-19
 * @modified 2025-12-19
 * @requires moment.js,lodash.js
 */

const pqfGanttSVGLib = (function() {

    const _defaultEntryNoLeftPadding = 5;

    /*****************************************************************/
    /*                       Exported functions                      */
    /*****************************************************************/

    function _calculateTaskInfoXPos(level, hasChildren, leftPadding = 10, marginStep = 16, chevronWidth = 24, iconPadding = 1, iconWidth = 18, namePadding = 5) {
        var result = {};
        result.entryNo = _defaultEntryNoLeftPadding;
        if (hasChildren) {
            result.chevron = _calculateStartXPos(level, leftPadding, marginStep);
        }
        result.icon = _calculateTaskIconXPos(level, hasChildren, iconPadding, chevronWidth);
        result.name = _calculateTaskNameXPos(level, hasChildren, namePadding, iconWidth);
        return result;
    }

    function _calculateTaskInfoYPos(hasChildren, rowHeight, rowIndex, fontSize = 13, fontWeight = 400) {
        var result = {};
        result.entryNo = rowHeight - 1;
        if (hasChildren) {
            result.chevron = _calculateChevronYPos(rowHeight);
        }
        result.icon = _calculateIconYPos(rowHeight);
        result.name = _calculateTaskNameYPos(rowHeight, fontSize, fontWeight);
        result.rowY = rowHeight * rowIndex;
        return result;
    }


    function _calculateGridSuperHeaderTextXPos(iconWidth, leftPadding = 4, iconPadding = 1) {
        return leftPadding + iconWidth + iconPadding;
    }

    function _calculateGridSuperHeaderTextYPos(superHeaderHeight, fontSize = 11, fontWeight = 500) {
        var font = fontSize + ((fontWeight / 100) / 2);
        return (superHeaderHeight - font) / 2 + font;
    }

    function _calculateGridSubHeaderTextXPos() {
        return 4;
    }

    function _calculateGridSubHeaderTextYPos(fontSize = 13, fontWeight = 400, topPadding = 1) {
        return topPadding + fontSize + (fontWeight / 100);
    }

    function _calculateGridSubHeaderSepPath(subUnitWidth, subHeaderHeight) {
        // WARN: Move coordinates origin at the top-left angle before drawing.
        var path = "";
        path = pathUtils.moveAbs(path, subUnitWidth, subHeaderHeight);
        path = pathUtils.drawVertical(path, Math.ceil(-subHeaderHeight / 3));
        return path;
    }

    function _calculateGridContentTextXPos() {
        return 4;
    }

    function _calculateGridContentTextYPos(rowHeight, fontSize = 13, fontWeight = 300) {
        var font = fontSize + (fontWeight / 100);
        return (rowHeight - font) / 2 + font;
    }

    function _calculateGanttSuperHeaderXPos(fontSize = 11, fontWeight = 400) {
        return fontSize + ((fontWeight / 100) * 2);
    }

    function _calculateGanttSuperHeaderYPos(superHeaderHeight, fontSize = 11, fontWeight = 400) {
        return (superHeaderHeight - fontSize) / 2 + fontSize;
    }

    function _calculateGanttSubHeaderYPos(fontSize = 11, fontWeight = 400, topPadding = 1) {
        return topPadding + fontSize + (fontWeight / 100);
    }

    function _calculateGanttSubHeaderSepPath(subUnitWidth, subHeaderHeight) {
        // WARN: Move coordinates origin at the top-left angle before drawing.
        var path = "";
        path = pathUtils.moveAbs(path, 0, _.floor(subHeaderHeight / 4));
        path = pathUtils.drawVertical(path, _.floor(subHeaderHeight * 3 / 4));
        path = pathUtils.drawHorizontal(path, _.floor(subUnitWidth / 3));
        path = pathUtils.drawVertical(path, _.ceil(-subHeaderHeight / 4));
        path = pathUtils.move(path, 0, _.floor(subHeaderHeight / 4));
        path = pathUtils.drawHorizontal(path, _.floor(subUnitWidth / 3));
        path = pathUtils.drawVertical(path, _.ceil(-subHeaderHeight / 4));
        path = pathUtils.move(path, 0, _.floor(subHeaderHeight / 4));
        path = pathUtils.drawHorizontal(path, _.floor(subUnitWidth / 3));
        path = pathUtils.drawVertical(path, _.ceil(-subHeaderHeight * 3 / 4));
        return path;
    }

    /**
     * Retrieve, calculate and arrange grid widths in an object.
     * Grid widths are rescaled depending on Gantt ratio.
     */
    function _computeGridSectionsDims(grid, ratio) {
        var x = 0;
        var sections = _.map(grid.cols, (sec) => {
            if (_.hasIn(sec, 'width')) {
                var w = _.floor(sec.width * ratio);
                var obj = {
                    'id': sec.id,
                    'x': x,
                    'width': w,
                };
                x += w;
                return obj;
            } else {
                var obj = {
                    'id': sec.id,
                    'x': x,
                };
                var x1 = 0;
                var subsecs = _.map(sec.items, (item) => {
                    var id = (_.hasIn(item, 'activeCol.id')) ? _.get(item, 'activeCol.id') : _.get(item, 'id');
                    var w = (_.hasIn(item, 'activeCol.width')) ? _.get(item, 'activeCol.width') : _.get(item, 'width');
                    var obj = {
                        'id': id,
                        'x': x1,
                        'width': w,
                    };
                    x1 += w;
                    return obj;
                });
                x += x1;
                obj['width'] = _.sum(_.map(subsecs, (subsec) => subsec.width));
                obj['subsections'] = subsecs;
                return obj;
            }
        });
        var taskName = _.find(sections, _.matchesProperty('id', 'taskName'));
        _.remove(sections, _.matchesProperty('id', 'taskName'));
        return {
            'total': _.sum(_.map(sections, (sec) => sec.width)),
            'taskName': taskName,
            'sections': sections,
        };
    }

    function _computeGanttSectionsDims(gantt, exportWidth) {
        var result = {};
        result.total = _.ceil(exportWidth * (gantt.ganttRatio / 100));
        var start = moment(_extractDate(gantt.timelines.current.start)).startOf('day');
        var end = moment(_extractDate(gantt.timelines.current.end)).startOf('day');
        var duration = _extractDurationDays(gantt.timelines.current.duration);
        result.baseWidth = result.total / duration;
        result.superHeader = _splitSuperHeaderWidth(start, end, result.baseWidth, gantt.timelines.current.labels[1]);
        result.subHeader = _splitSubHeaderWidth(start, end, result.baseWidth, gantt.timelines.current.labels[0]);
        return result;
    }

    function _computeGanttItemsDims(gantt, baseWidth, heights) {
        var start = new Date(gantt.timelines.current.start);
        var result = _.map(gantt.items, (item, i) => {
            switch (item.type) {
                case 'task':
                case 'folder':
                case 'object':
                    var is = new Date(item.start);
                    var ie = new Date(item.end);
                    var x = _dateDiffInDays(start, is) * baseWidth;
                    var w = _dateDiffInDays(is, ie) * baseWidth;
                    var h = heights.row * 2 / 3;
                    var y = (heights.row - h) / 2;
                    var rowY = heights.row * i;   // Assumes viewBox or group with coordinates origins translated at top-left corner of body
                    return { 
                        'id': item.id,
                        'x': x,
                        'y': y,
                        'width': w,
                        'height': h,
                        'rowY': rowY,
                        'label': {
                            'x': x + (w/2),
                            'y': heights.row * 2 / 3
                        }
                    };
                case 'milestone':
                case 'portfolioMilestone':
                    var is = new Date(item.start);
                    var diag = heights.row * 2 / 3;
                    var x = _dateDiffInDays(start, is) * baseWidth - diag;
                    var y = heights.row / 2;
                    var polygon = `0 0,${diag/2} ${-diag/2},${diag} 0,${diag/2} ${diag/2}`;
                    var rowY = heights.row * i;   // Assumes viewBox or group with coordinates origins translated at top-left corner of body
                    return {
                        'id': item.id,
                        'x': x,
                        'y': y,
                        'width': diag,
                        'polygon': polygon,
                        'rowY': rowY
                    };
                default:
                    throw new Error(`Dimension calculation for items of type \'${item.type}\' is currently not available.`);
            }
        });
        return result;
    }

    function _computeGanttDependenciesPaths(tasksDims, deps, rowHeight, shift) {
        var result = [];
        _.forEach(deps, (dep) => {
            /* Variables */
            var p = "";
            var f = _.find(tasksDims, _.matchesProperty('id', dep.fromId));
            var t = _.find(tasksDims, _.matchesProperty('id', dep.toId));
            if (f !== undefined && t !== undefined) {
                var fx = (dep.fromType === 'START') ? f.measures.gantt.x : f.measures.gantt.x + f.measures.gantt.width;
                var tx = (dep.toType === 'START') ? t.measures.gantt.x : t.measures.gantt.x + t.measures.gantt.width;
                var fy = f.measures.gantt.rowY + rowHeight / 2;
                var ty = t.measures.gantt.rowY + rowHeight / 2;
                var sfx = (dep.fromType === 'START') ? fx - shift : fx + shift;
                var stx = (dep.toType === 'START') ? tx - shift : tx + shift;
                var halfRow = rowHeight / 2;

                /* Path Calculation */
                p = pathUtils.moveAbs(p, 0, 0);
                p = (dep.fromType === 'START') ? pathUtils.drawHorizontal(p, -shift) : pathUtils.drawHorizontal(p, shift);
                if (dep.fromType === 'START' && sfx <= stx) {
                    p = (fy >= ty) ? pathUtils.drawVertical(p, -halfRow) : pathUtils.drawVertical(p, halfRow);
                    p = pathUtils.drawHorizontal(p, stx - sfx);
                    p = (fy >= ty) ? pathUtils.drawVertical(p, -(fy - ty + halfRow)) : pathUtils.drawVertical(p, ty - fy - halfRow);
                } else if (dep.fromType === 'START' && sfx > stx) {
                    if (dep.toType === 'START') {
                        p = pathUtils.drawHorizontal(p, -(sfx - stx));
                        p = pathUtils.drawVertical(p, ty - fy);
                    } else {
                        p = pathUtils.drawHorizontal(p, -(sfx - stx) / 2);
                        p = pathUtils.drawVertical(p, ty - fy);
                        p = pathUtils.drawHorizontal(p, -(sfx - stx) / 2);
                    }
                } else if (dep.fromType === 'END' && sfx <= stx) {
                    if (dep.toType === 'START') {
                        p = pathUtils.drawHorizontal(p, (stx - sfx) / 2);
                        p = pathUtils.drawVertical(p, ty - fy);
                        p = pathUtils.drawHorizontal(p, (stx - sfx) / 2);
                    } else {
                        p = pathUtils.drawHorizontal(p, stx - sfx);
                        p = pathUtils.drawVertical(p, ty - fy);
                    }
                } else {
                    p = (fy >= ty) ? pathUtils.drawVertical(p, -halfRow) : pathUtils.drawVertical(p, halfRow);
                    p = pathUtils.drawHorizontal(p, -(sfx - stx));
                    p = (fy >= ty) ? pathUtils.drawVertical(p, -(fy - ty - halfRow)) : pathUtils.drawVertical(p, ty - fy - halfRow);
                }
                p = (dep.toType === 'START') ? pathUtils.drawHorizontal(p, shift) : pathUtils.drawHorizontal(p, -shift);

                /* Add results */
                result.push({
                    'fromId': dep.fromId,
                    'toId': dep.toId,
                    'startX': fx,
                    'startY': fy,
                    'path': p,
                    'status': dep.status
                });
            }
        });
        return result;
    }

    function _retrieveSectionsHeights(grid, totalHeight) {
        /** 
         * Return all heights from client-provided data.
         *
         * NOTE: Since client does not provide Gantt super/subheader heights, both
         * are calculated as half the entire header.
         **/
        var result = {};
        result.grid = {};
        result.grid.superHeader = _.find(grid.rows, _.matchesProperty('id', 'colGroup')).height;    // ID for superHeader
        result.grid.subHeader = _.find(grid.rows, _.matchesProperty('id', 'colName')).height;       // ID for subHeader
        result.grid.totalHeader = result.grid.superHeader + result.grid.subHeader;
        result.gantt = {};
        result.gantt.superHeader = (result.grid.superHeader + result.grid.subHeader) / 2;
        result.gantt.subHeader = (result.grid.superHeader + result.grid.subHeader) / 2;
        result.gantt.totalHeader = result.gantt.superHeader + result.gantt.subHeader;
        result.row = _.find(grid.rows, (row) => !_.includes(['colGroup', 'colName', 'space'], row.id)).height;
        result.body = totalHeight - result.gantt.superHeader;
        return result;
    }

    function _getCurrentDateXPos(gantt, baseWidth) {
        var start = moment(_extractDate(gantt.timelines.current.start)).startOf('day');
        var today = moment().startOf('day');
        var diff = today.diff(start, 'days');
        return diff * baseWidth;
    }

    /*****************************************************************/
    /*                       Internal functions                      */
    /*****************************************************************/

    const pathUtils = (function() {

        function _moveAbs(path, x, y) {
            path = path.concat(`M ${x} ${y}`);
            return path;
        }

        function _move(path, x, y) {
            path = path.concat(`m ${x} ${y}`);
            return path;
        }

        function _drawHorizontal(path, x) {
            path = path.concat(`h ${x}`);
            return path;
        }

        function _drawVertical(path, y) {
            path = path.concat(`v ${y}`);
            return path;
        }
        
        return {
            "moveAbs": _moveAbs,
            "move": _move,
            "drawHorizontal": _drawHorizontal,
            "drawVertical": _drawVertical,
        };
    })();

    /* Calculates starting x-coordinate of task list content. */
    function _calculateStartXPos(level, leftPadding = 10, marginStep = 16) {
        return leftPadding - 4 + (marginStep * level);
    }

    function _calculateTaskIconXPos(level, hasChildren, padding = 1, chevronWidth = 24) {
        return (hasChildren) ? _calculateStartXPos(level) + padding + chevronWidth : _calculateStartXPos(level);
    }

    function _calculateTaskNameXPos(level, hasChildren, padding = 5, iconWidth = 18) {
        return _calculateTaskIconXPos(level, hasChildren) + iconWidth + padding;
    }

    /**
     * WARN: The following calculations are based upon the shapes provided by Giada,
     * which are drawn as paths that goes down, instead of the classic SVG 
     * method that goes up from y-axis, and have a given size.
     **/
    function _calculateChevronYPos(rowHeight) {
        return rowHeight / 2 - 5;
    }

    function _calculateIconYPos(rowHeight) {
        return rowHeight / 2 - 6.5;
    }

    function _calculateTaskNameYPos(rowHeight, fontSize = 13, fontWeight = 400) {
        var font = fontSize + (fontWeight / 100);
        return (rowHeight - font) / 2 + font;
    }

    function _extractDate(isostr) {
        return isostr.match(/^(\S+)T/)[1];
    }

    function _extractDurationDays(duration) {
        var h = _.toNumber(duration.match(/(\d+)H/)[1]);
        return _.floor(h / 24);
    }

    function _splitSuperHeaderWidth(start, end, baseWidth, label) {
        var result = [];
        var x = 0;
        var cur = moment(start);
        while (cur.isBefore(end)) {
            var v = _getValueFromLabel(cur, label);
            var y = cur.year();
            var nv = moment(cur).add(1, label).startOf(label);
            if (nv.isSameOrAfter(end)) {
                nv = end;
            }
            var diff = nv.diff(cur, 'days');
            var w = _.round(baseWidth * diff);
            result.push({
                'label': _getSuperHeaderIDFromLabel(v, y, label),
                'x': x,
                'width': w,
            });
            x += w;
            cur = nv;
        }
        return result;
    }

    function _splitSubHeaderWidth(start, end, baseWidth, label) {
        var result = [];
        var x = 0;
        var cur = moment(start);
        while (cur.isBefore(end)) {
            var v = _getValueFromLabel(cur, label);
            var nv = moment(cur).add(1, label).startOf(label);
            if (nv.isSameOrAfter(end)) {
                nv = end;
            }
            var diff = nv.diff(cur, 'days');
            var w = _.round(baseWidth * diff);
            result.push({
                'label': _getSubHeaderIDFromLabel(v, label),
                'x': x,
                'width': w,
            });
            x += w;
            cur = nv;
        }
        return result;
    }

    function _getValueFromLabel(m, l) {
        switch (l) {
            case 'year': return m.year();
            case 'quarter': return m.quarter();
            case 'month': return m.month();
            case 'week': return m.week();
            default: throw new Error(`Label \'${l}\' is currently not supported in subheader.`);
        }
    }

    function _getSuperHeaderIDFromLabel(v, y, l) {
        switch (l) {
            case 'decade': return `${v}s`;
            case 'year': return `${v}`;
            case 'quarter': return `Q${v} ${y}`;
            case 'month': return `${_getMonthName(v)} ${y}`;
            default: throw new Error(`Label \'${l}\' is currently not supported in subheader.`);
        }
    }

    function _getSubHeaderIDFromLabel(v, l) {
        switch (l) {
            case 'year': return `${v}`;
            case 'quarter': return `Q${v}`;
            case 'month': return `${_getMonthName(v)}`;
            case 'week': return `W${v}`;
            default: throw new Error(`Label \'${l}\' is currently not supported in subheader.`);
        }
    }

    function _dateDiffInDays(first, second) {
        return _.round((second - first) / (1000 * 60 * 60 * 24));
    }

    function _getMonthName(m) {
        switch (m) {
            case 0: return 'JAN';
            case 1: return 'FEB';
            case 2: return 'MAR';
            case 3: return 'APR';
            case 4: return 'MAY';
            case 5: return 'JUN';
            case 6: return 'JUL';
            case 7: return 'AUG';
            case 8: return 'SEP';
            case 9: return 'OCT';
            case 10: return 'NOV';
            case 11: return 'DEC';
            default: throw new Error(`Invalid month: ${m}`);
        }
    }

    /*****************************************************************/
    /*                         Final object                          */
    /*****************************************************************/

    return {
        "static": {
            "taskList": {
                "computeXCoords": _calculateTaskInfoXPos,
                "computeYCoords": _calculateTaskInfoYPos,
            },
            "grid": {
                "superHeader": {
                    "computeXCoord": _calculateGridSuperHeaderTextXPos,
                    "computeYCoord": _calculateGridSuperHeaderTextYPos,
                },
                "subHeader": {
                    "computeXCoord": _calculateGridSubHeaderTextXPos,
                    "computeYCoord": _calculateGridSubHeaderTextYPos,
                    "calculateSepPath": _calculateGridSubHeaderSepPath,
                },
                "content": {
                    "computeXCoord": _calculateGridContentTextXPos,
                    "computeYCoord": _calculateGridContentTextYPos
                }
            },
            "gantt": {
                "superHeader": {
                    "computeXCoord": _calculateGanttSuperHeaderXPos,
                    "computeYCoord": _calculateGanttSuperHeaderYPos,
                },
                "subHeader": {
                    "computeYCoord": _calculateGanttSubHeaderYPos,
                    "calculateSepPath": _calculateGanttSubHeaderSepPath,
                }
            },
        },
        "dynamic": {
            "grid": {
                "computeSectionsDims": _computeGridSectionsDims,
            },
            "gantt": {
                "computeSectionsDims": _computeGanttSectionsDims,
                "computeItemsDims": _computeGanttItemsDims,
                "computeDependenciesPaths": _computeGanttDependenciesPaths,
            }
        },
        "utils": {
            "retrieveSectionsHeights": _retrieveSectionsHeights,
            "getCurrentDateXCoord": _getCurrentDateXPos,
        }
    };
})();