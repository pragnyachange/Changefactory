/**
 * ============================================================================
 * REASSESSED TASKS WIDGET - Main Implementation
 * ============================================================================
 * 
 * This widget displays all tasks within a selected timeframe that have had 
 * their effort reassessed. It shows the old estimate vs new estimate and 
 * tracks who made the change and when.
 * 
 * @name Reassessed Tasks Widget
 * @version 1.0.0
 * @description Displays reassessed tasks with effort comparison
 * @author LI
 * @sandboxId 82F6A863771E4D839876BF6668BD3E08
 * @widgetId 89A532D20F584726840B9BCBCDB097C4
 * @created 2026-04-21
 * @modified 2026-04-21
 * @requires MOMENT_WITH_LOCALES - Moment.js for date/time operations
 */

// ============================================================================
// IMPORTS - Type definitions and helper functions
// ============================================================================

import type { JTFClient, JTFDataSection, JTFHint, JTFMetaCategory, JTFMetaColumn, JTFMetaColumnOptions, JsonTableFormat } from './jtf';
import {} from './structs';
import { _toEnum, constructJtfMeta, constructJtfObject, jtfCodeDeEn } from './utils';
import moment from 'moment';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/** Enable debug logging to browser console */
const DEBUG = true;

/** The widget property ID that holds the selected timeframe dropdown value */
const TIMERANGE_PROP_ID = "timerange";

/**
 * Maps timeframe enum IDs to their corresponding Moment.js duration objects
 * These IDs correspond to the enum values created in the system
 * 
 * - 001: Past 7 days
 * - 002: Past 14 days  
 * - 003: From start of current month to today (calculated as day-of-month - 1)
 */
const TIMERANGE_VALUE_MAP: { [key: string]: { duration: moment.Duration } } = {
    "TIMEFRAME-TASKS-REASSESSMENT-001": { duration: moment.duration(7, 'days') },
    "TIMEFRAME-TASKS-REASSESSMENT-002": { duration: moment.duration(14, 'days') },
    "TIMEFRAME-TASKS-REASSESSMENT-003": { duration: moment.duration(moment().date() - 1, 'days') }
};

/** Default timeframe if none selected (Past 7 Days) */
const TIMERANGE_DEFAULT_KEY = "TIMEFRAME-TASKS-REASSESSMENT-001";

/** Fallback duration to use if timeframe not found or invalid */
const TIMERANGE_DEFAULT_DURATION = TIMERANGE_VALUE_MAP[TIMERANGE_DEFAULT_KEY]?.duration;


// ============================================================================
// TABLE DISPLAY OPTIONS
// ============================================================================

/**
 * JTF table display options
 * Defines how the table renders in the UI
 */
const options: JTFMetaColumnOptions = {
    adaptiveColumnWidths: false,  // Use fixed column widths instead of auto-sizing
    showHeader: true              // Display column headers in table
};

/**
 * Table categories/groupings
 * Columns are organized into categories for logical grouping
 * Most columns use "default" category (no special grouping)
 */
const cats: JTFMetaCategory[] = [   
    {
        id: 'default',
        label: null
    }
];

// ============================================================================
// TABLE COLUMN DEFINITIONS - JTF FORMAT
// ============================================================================

/**
 * Defines all columns displayed in the reassessment table
 * Order here matches order in jtfData.push() rows below
 * Each column specifies: ID, label, type, width, formatting, and styling
 */
const columns: JTFMetaColumn[] = [
    /**
     * COLUMN 1: Task Name
     * Displays the work item/task name with clickable link to gantt chart
     * Shows icon for work item type (task icon, phase icon, etc)
     * Width: 300px (resizable by user)
     * Background: light gray for distinction
     */
    {
        catid: "default",
        id: "task",
        label: jtfCodeDeEn('Task', 'Task'),
        type: "enum",              // Enum type allows icons and links
        options: {
            resizable: true,       // User can resize column
            width: 300
        },
        format: {
            showIcon: true,        // Display task/work item type icon
            addLink: true          // Make task clickable (links to gantt)
        },
        style: {
            backgroundColor: "#eee"  // Light gray background
        }
    },

    /**
     * COLUMN 2: New Effort (Aufwand neu)
     * The reassessed/updated remaining effort value
     * Duration type = shows as hours/days/weeks based on value
     * Width: 100px
     * No aggregation = shows individual task values only
     */
    {
        catid: "default",
        id: "remainingEffort_new",
        label: jtfCodeDeEn('Aufwand (neu)', 'Effort (new)'),
        type: "duration",          // Duration type formats time values
        options: {
            width: 100,
            aggregation: "none"    // Don't sum/aggregate values
        }
    },

    /**
     * COLUMN 3: Old Effort (Aufwand alt)
     * The previous/original remaining effort before reassessment
     * Allows user to see what the effort was before the change
     * Duration type = shows as hours/days/weeks
     * Width: 100px
     */
    {
        catid: "default",
        id: "remainingEffort_old",
        label: jtfCodeDeEn('Aufwand (alt)', 'Effort (old)'),
        type: "duration",
        options: {
            width: 100,
            aggregation: "none"
        }
    },

    /**
     * COLUMN 4: Timestamp
     * When the effort was reassessed
     * Date type with custom format: DD.MM.YYYY (e.g., 11.05.2026)
     * Width: 100px
     */
    {
        catid: "default",
        id: "timestamp",
        label: jtfCodeDeEn('Zeitstempel', 'Timestamp'),
        type: "date",              // Date type for timestamp values
        options: {
            width: 100
        },
        format: {
            format: "DD.MM.YYYY"   // Custom date format (German style)
        }
    },

    /**
     * COLUMN 5: User
     * Who made the effort reassessment
     * Enum type shows user icon/avatar and name
     * Link disabled = no clickable link to user profile
     * Width: 200px
     */
    {
        catid: "default",
        id: "user",
        label: jtfCodeDeEn('User', 'User'),
        type: "enum",
        options: {
            width: 200
        },
        format: {
            showIcon: true,       // Display user avatar/icon
            addLink: false        // No link to user profile
        }
    }
];


// ============================================================================
// MAIN WIDGET CREATION FUNCTION
// ============================================================================

/**
 * Main widget logic that processes project data and builds the reassessment table
 * 
 * @param {JTFClient} settings - Widget configuration and runtime context
 *   Contains: selectedObject (project), config (user settings), etc.
 * @returns {JsonTableFormat} Complete JTF object ready for widget rendering
 * 
 * Process flow:
 * 1. Load the project
 * 2. Load the project's active scenario
 * 3. Load all work items in scenario
 * 4. For each work item, get progress corrections (reassessments)
 * 5. Filter by selected timeframe
 * 6. Build table rows comparing old vs new effort
 * 7. Return formatted JTF object
 */
function createWidget(settings: JTFClient): JsonTableFormat {
    // Container for table rows
    const jtfData: JTFDataSection[] = [];
    
    // Container for warning/error messages to display in widget
    const jtfHints: JTFHint[] = [];

    // ========================================================================
    // STEP 1: Load the project
    // ========================================================================
    // Gets the project based on context (e.g., which project user has open)
    // Uses IIFE (Immediately Invoked Function Expression) for try-catch scope
    // settings.selectedObject.id = the project ID from widget context

    const prj = (() => {
        try { 
            // Pqf.pm.getProject - PQForce API call to fetch project details
            return Pqf.pm.getProject(settings.selectedObject.id); 
        } catch {
            // If project loading fails, add warning message for user
            jtfHints.push({
                type: "warning",
                label: jtfCodeDeEn("Ladefehler", "Loading error"),
                text: jtfCodeDeEn("Das Projekt konnte nicht geladen werden.", "The project could not be loaded.")
            })
            return null;  // Return null if load failed
        }
    })();

    // ========================================================================
    // STEP 2: Load the project's active scenario
    // ========================================================================
    // A scenario is a version/variant of the project plan
    // Only proceed if project was successfully loaded (prj !== null)
    // false param = include single inactive scenarios too

    const scen = prj ? 
     (() => {
        try {
            // Pqf.pm.getProjectActiveScenario - Get the active/current scenario
            return Pqf.pm.getProjectActiveScenario(prj.id, false);
        } catch {
            // If scenario load fails, add warning message
            jtfHints.push({
                type: "warning",
                label: jtfCodeDeEn("Ladefehler", "Loading error"),
                text: jtfCodeDeEn("Das Szenario konnte nicht geladen werden. Kann sein, dass kein aktives Szenario vorhanden ist.", "The scenario could not be loaded. It may be that no active scenario is available.")
            });
            return null;  // Return null if load failed
        }
    })() : null;  // Return null if project is null (skip if project load failed)

    // ========================================================================
    // STEP 3: Load all work items (tasks/phases) in the scenario
    // ========================================================================
    // Gets all tasks, phases, and sub-items in the selected scenario
    // true param = include all items in hierarchy

    const workItems = scen ? 
     (() => {
        try {
            // Pqf.pm.getScenarioWorkItems - Fetch all work items/tasks
            return Pqf.pm.getScenarioWorkItems(scen.id, true);
        } catch {
            // If work items fail to load, add warning
            jtfHints.push({
                type: "warning",
                label: jtfCodeDeEn("Ladefehler", "Loading error"),
                text: jtfCodeDeEn("Die Tasks konnten nicht geladen werden.", "The tasks could not be loaded.")
            });
            return [];  // Return empty array to continue processing
        }
    })() : [];  // Return empty array if scenario is null

    // ========================================================================
    // STEP 4: Process work items and find reassessments
    // ========================================================================
    // Only process if we have work items to examine

    if (workItems.length > 0) {
        // Get the selected timeframe from widget settings (dropdown selection)
        // settings.config.properties = array of user-selectable settings
        // Find property with id === "timerange" and get its selectedItem value
        // Fallback to DEFAULT_KEY if not found
        const timerange = TIMERANGE_VALUE_MAP[settings.config.properties.find(prop => prop.id === TIMERANGE_PROP_ID)?.selectedItem || TIMERANGE_DEFAULT_KEY]?.duration;
        
        // Calculate the start date of the selected timeframe
        // moment().subtract(duration).startOf('day') = today minus X days at 00:00:00
        // Example: If duration=7, start = 7 days ago at midnight
        const timeFrameStart = moment().subtract(timerange || TIMERANGE_DEFAULT_DURATION).startOf('day');
        
        console.log("timeFrameStart: " + timeFrameStart.toISOString());

        // Loop through each work item to check for reassessments
        workItems.forEach(workItem => {
            // Pqf.pm.getProjectWorkItemProgressCorrections - Get all effort changes for this task
            // Returns object with .timeline array of all reassessments in chronological order
            const progressCorrections = Pqf.pm.getProjectWorkItemProgressCorrections(workItem.id);

            // ================================================================
            // Find the MOST RECENT reassessment
            // ================================================================
            // Uses reduce() to iterate through timeline array and find latest one
            // (the one with the latest/highest timestamp)

            const currentProgressCorrection = progressCorrections.timeline.reduce((acc: Pqf.pm.ProjectWorkItemRemainingEffortWithOverrides | null, current: Pqf.pm.ProjectWorkItemRemainingEffortWithOverrides) => {
                if (!acc) return current;  // First iteration: use first item as accumulator
                // Keep the one with later timestamp (more recent reassessment)
                return moment(current.at).isAfter(acc.at) ? current : acc;
            }, null);

            // ================================================================
            // Filter: Only include if reassessment is within selected timeframe
            // ================================================================
            // Only process this task if:
            // 1. It has at least one reassessment (currentProgressCorrection !== null)
            // 2. The reassessment date is AFTER the timeframe start (within selected range)

            if (currentProgressCorrection && moment(currentProgressCorrection.at).isAfter(timeFrameStart)) {

                // ============================================================
                // Find the PREVIOUS reassessment for comparison
                // ============================================================
                // Shows what the effort was BEFORE the current reassessment
                // Uses reduce() to find the latest correction that's BEFORE current one
                // This creates the "old vs new" comparison

                const previousProgressCorrection = progressCorrections.timeline.reduce((acc: Pqf.pm.ProjectWorkItemRemainingEffortWithOverrides | null, current: Pqf.pm.ProjectWorkItemRemainingEffortWithOverrides) => {
                    if (!acc) 
                        // First iteration: only include if before current
                        return moment(current.at).isBefore(currentProgressCorrection!.at) ? current : null;
                    // Keep the one with latest timestamp that's still before current
                    return moment(current.at).isAfter(acc.at) && moment(current.at).isBefore(currentProgressCorrection!.at) ? current : acc;
                }, null);

                // ============================================================
                // Convert work item to JTF enum format for table display
                // ============================================================
                // _toEnum() extracts relevant fields and formats as enum
                const workItem_enum = _toEnum(workItem);

                if (workItem_enum) {
                    const workItemId = workItem.id;
                    
                    // Adapt enum so the link works in gantt view
                    // Change type/id from work item to project (for navigation purposes)
                    workItem_enum.type = "Project";
                    workItem_enum.id = workItem.projectId;
                    
                    // Add gantt navigation feature
                    // When user clicks task name, links to this specific task in gantt view
                    workItem_enum.feature = "gantt&itemtype=Phase&itemid=" + workItemId;
                }

                // ============================================================
                // Add row to table data
                // ============================================================
                // Each row contains: [task, new_effort, old_effort, timestamp, user]
                // Order MUST match columns array defined above

                jtfData.push({
                    // Generate unique ID for this row
                    id: Pqf.clf.newUuids(1)?.newUuids[0] || "",

                    // Array of cell values - order matches columns definition
                    data: [
                        workItem_enum,                                    // Column 1: Task name (with link)
                        currentProgressCorrection.remainingEffort,        // Column 2: New/current effort
                        previousProgressCorrection?.remainingEffort,      // Column 3: Old effort (null if none)
                        currentProgressCorrection.at,                     // Column 4: When it was reassessed
                        _toEnum(currentProgressCorrection.modifiedBy)     // Column 5: Who reassessed it
                    ]
                });
            }
        });
    }

    // ========================================================================
    // RETURN: Complete JTF object for widget rendering
    // ========================================================================
    // constructJtfObject wraps metadata and data into proper structure
    // constructJtfMeta builds metadata from options/columns/categories
    
    return constructJtfObject(
        constructJtfMeta(options, columns, cats),  // Metadata
        jtfData,                                    // Table rows
        [],                                         // Charts (empty, not used)
        jtfHints                                    // Warning/error messages
    )
}

// ============================================================================
// EXECUTION & EXPORT
// ============================================================================

// Execute: Create the widget with current context
// 'client' is provided by PQForce sandbox automatically
// Contains current project, user, and widget settings

const jtf = createWidget(client);

// Debug logging: Output widget result to browser console (visible in DevTools)
if (DEBUG) console.log("Generated JTF: " + JSON.stringify(jtf));

// Export the JTF object for widget display
// This is the final output that PQForce renders as the widget
export default jtf;