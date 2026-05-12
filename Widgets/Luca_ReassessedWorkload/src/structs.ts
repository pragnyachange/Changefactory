/**
 * ============================================================================
 * CUSTOM DATA STRUCTURES
 * ============================================================================
 * 
 * Defines TypeScript interfaces for complex historical data tracking
 * These structures are used for extended widget features that analyze
 * project and task history over time
 * 
 * Note: Currently not used in the basic Reassessed Tasks widget,
 * but available for extended/derived widgets
 */

/**
 * Container for project history records
 * Wraps array of ProjectHistoryItem objects
 */
export interface ProjectHistory {
    projectHistory: ProjectHistoryItem[];
}

/**
 * Snapshot of project state at a point in time
 * Records all relevant project information for historical analysis
 * 
 * Use cases:
 * - Track how project scope changed over time
 * - Analyze planning vs actual outcomes
 * - Generate historical reports
 */
export interface ProjectHistoryItem {
    timestamp: string;        // When this snapshot was taken (ISO8601 format)
    projId: string;          // Project identifier
    projName: string;        // Project name
    projCategory: string;    // Project category/type
    projBp: string;         // Business process code
    projStart: string;       // Project start date (DateTime format)
    projEnd: string;        // Project end date (DateTime format)
    projPl: string;         // Project lead/manager ID
    projPlDep: string;       // Project lead department
    taskIds: string[];       // Array of task IDs in this project
}

/**
 * Container for task history - definition and controlling records
 * PSP = Project Structure Plan (German: Projektstrukturplan)
 */
export interface PspTaskHistory {
    taskDefinitionHistory: PspTaskHistoryItem[];           // How task was defined
    taskControllingHistory: PspTaskControllingHistoryItem[];  // Financial tracking
}

/**
 * Snapshot of how a task was defined at a point in time
 * Records planning/structural information
 */
export interface PspTaskHistoryItem {
    timestamp: string;       // When this definition was recorded
    taskId: number;         // Task identifier
    taskName: string;       // Task name/description
    taskSoll: number;       // Planned/budgeted effort (Soll = target in German)
}

/**
 * Snapshot of task financial and controlling data at a point in time
 * Records budget, actual costs, revenue, and margins
 * 
 * Used for:
 * - Financial tracking and margin analysis
 * - Budget vs actual comparison
 * - Revenue recognition
 * - Hour/cost allocations
 */
export interface PspTaskControllingHistoryItem {
    timestamp: string;          // When this data was recorded
    marginPlan: number;        // Planned margin (budget)
    rate: number;              // Billing/cost rate (€/hour or similar)
    revenuePlan: number;       // Planned revenue
    revenueActual: number;     // Actual revenue booked
    revenueDate: string;       // Date revenue was recognized
    hoursSum: number;          // Total hours worked on task
    invoicedSum: number;       // Total amount invoiced to customer
    invoicedDate: string;      // Date invoice was sent
    poc: number;               // Proof of Concept flag or percentage
    marginActual: number;      // Actual margin (revenue - costs)
    postedDate: string;        // Date when data was posted/finalized
}
