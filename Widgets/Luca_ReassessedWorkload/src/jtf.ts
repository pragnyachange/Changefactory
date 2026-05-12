/**
 * ============================================================================
 * JTF TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file defines all TypeScript interfaces for the JSON Table Format (JTF)
 * used by PQForce widgets. JTF is the standard format for displaying data in
 * PQForce dashboard tables.
 * 
 * These interfaces provide:
 * - Type safety during development
 * - IDE autocomplete support
 * - Self-documenting data structures
 * - Compile-time error detection
 */

/**
 * Base interface for any object with an ID
 */
export interface JTFId {
    id: string;
}

/**
 * Hint/message to display in widget UI
 * Used for warnings, errors, and informational messages
 */
export interface JTFHint {
    type: string;                    // "warning", "error", "info"
    label: JTFCode;                  // Bilingual title (de/en)
    text: JTFCode;                   // Bilingual message text (de/en)
}

/**
 * Bilingual text object
 * Contains German (de) and English (en) versions of text
 * @example { de: "Aufgabe", en: "Task" }
 */
export type JTFCode = {[lang: string]: string};

/**
 * Bilingual text with code structure
 * Used in API responses for localized content
 */
export type JTFCodeLong = {code: string, text: string}

/**
 * CSS style definition object
 * Key-value pairs of CSS properties
 * @example { backgroundColor: "#eee", color: "#333" }
 */
export type JTFStyleDef = {[key: string]: string};

/**
 * Generic option/configuration object
 * Key-value pairs where values can be strings, numbers, or booleans
 */
export type JTFOption = {[key: string]: (string | number | boolean)};

/**
 * Complex data item that can be any type
 * Used for custom/flexible data in table cells
 */
export type JTFDataComplexItem = unknown;

/**
 * Enum data item (task, user, project reference, etc)
 * Used to display objects with icons, names, and optional links
 */
export interface JTFDataEnum {
    id: string;                      // Unique identifier
    type: string;                    // "Project", "Task", "User", etc.
    name: string | null;             // Display name
    description: string | null;      // Hover text/description
    iconRef: string | null;          // URL to icon image
    color: string | null;            // Color code for display
    feature?: string;                // Link target (e.g., "gantt&itemid=...")
}

/**
 * Single row/record in table data
 * Contains data values for one table row
 */
export interface JTFDataSection {
    data: (string | number | JTFDataEnum | JTFDataComplexItem)[];  // Cell values (order matches columns)
    id: string;                      // Unique row ID
    style?: JTFStyleDef[];          // Optional row styling
}

/**
 * Column category/group definition
 * Used to organize columns into logical sections in the table
 */
export interface JTFMetaCategory {
    id: string;                      // Category ID (e.g., "default", "groupname")
    label: JTFCode | null;          // Bilingual category name (null = default)
}

/**
 * Column formatting options
 * Defines how cell values are displayed (format, colors, links, etc.)
 */
export interface JTFMetaColumnFormat {
    format?: string;                // Date/number format string (e.g., "DD.MM.YYYY")
    digits?: number;                // Decimal places for numbers
    unit?: JTFCode;                // Unit label (e.g., "hours", "days")
    showIcon?: boolean;            // Display icon for enum values
    factor?: number;               // Multiplier for numeric values
    addLink?: boolean | string;    // Make value clickable (true, false, or target)
}

/**
 * Column definition for table
 * Specifies what data displays and how it's formatted
 */
export interface JTFMetaColumn {
    catid: string | null;          // Category this column belongs to
    format?: JTFMetaColumnFormat;  // Formatting rules
    id?: string;                    // Column ID (must match data array order)
    label: JTFCode;               // Bilingual column header
    options?: JTFOption;          // Additional options (width, resizable, etc.)
    type: string;                 // Data type: "enum", "duration", "date", "number", "string"
    style?: JTFStyleDef | (string | JTFStyleDef)[] | {[key: string]: JTFStyleDef};  // CSS styling
}

/**
 * Sort/grouping configuration for table
 */
export interface JTFMetaColumnGroupSortOptions {
    columnId: string;              // Column to sort/group by
    direction?: string;            // "asc" or "desc" for sort direction
}

/**
 * Table display options
 * Controls overall table appearance and behavior
 */
export interface JTFMetaColumnOptions {
    adaptiveColumnWidths: boolean; // Auto-size columns or use fixed widths
    groupBy?: JTFMetaColumnGroupSortOptions;  // Column to group rows by
    showHeader: boolean;           // Display column headers
    sortBy?: JTFMetaColumnGroupSortOptions;   // Default sort column
    style?: JTFStyleDef;          // Global table styling
}

/**
 * Complete table metadata
 * Contains all structural information about the table
 */
export interface JTFMetaSection {
    categories: JTFMetaCategory[];  // Column categories
    columns: JTFMetaColumn[];      // Column definitions (order matters!)
    options: JTFMetaColumnOptions; // Table display options
}

/**
 * Complete JSON Table Format response
 * This is the final output format for all PQForce JTF widgets
 * The PQForce portal expects an object matching this structure
 */
export interface JsonTableFormat {
    charts?: JTFId[];              // Chart definitions (optional)
    code?: JTFCode;               // Bilingual widget code identifier
    description?: JTFCode;        // Bilingual widget description
    id?: string;                   // Widget instance ID
    initialChart?: string;        // Default chart to show
    createdAt?: string;           // Creation timestamp
    createdBy?: string;           // Creator user ID
    data: (string | JTFDataComplexItem | JTFDataSection)[];  // Table row data
    meta: JTFMetaSection;         // Table structure/metadata
    hints?: (string | JTFHint)[]; // Messages/warnings to display
    mimeType?: string;            // Content type (usually "application/json")
    name?: JTFCode;               // Bilingual widget name
    type?: string;                // Widget type (usually "jtf")
}

/**
 * Duration unit types used in widget configurations
 */
type JTFClientDurationUnit = 'MONTH' | 'YEAR';

/**
 * Widget configuration and context object
 * Passed to createWidget() function as the main parameter
 * Contains user settings, selected object, and widget configuration
 */
export interface JTFClient {
    // The currently selected object (usually the project being viewed)
    selectedObject : {
        type: string,              // Object type (e.g., "Project")
        id: string                 // Object ID
    },
    
    // Widget configuration and user settings
    config: {
        view: string,
        lifecycle: boolean,
        colorscheme: 'poly' | 'mono',
        decimals: number,
        legend: {
            show: boolean,
            pos: {
                x: number, y: number, p: boolean
            }
        },
        showHeader: boolean,
        period: {
            startDate: {
                month: number,
                monthId: string,
                year: string,
                date: string,
                dateISO: string
            },
            endDate: {
                month: number,
                monthId: string,
                year: string,
                date: string,
                dateISO: string
            }
        },
        dateRange: {
            startDate: {
                unit: JTFClientDurationUnit,
                delta: number
            },
            duration: {
                unit: JTFClientDurationUnit,
                amount: number
            }
        },
        bubbles: number,
        includeSubportfolios: boolean,
        currency: string,
        chart_deviation: boolean,
        chart_label: boolean,
        chart_percentage: boolean,
        labels: {
            deviation: boolean,
            general: boolean,
            percentage: boolean
        },
        projectStatusFilter: { [projectState: string]: string },
        options: { [key: string]: string },
        canReload: boolean,
        properties: JTFClientDefinitionProperty[]
    }
}

export interface JTFClientDefinitionProperty {
    id?: string,
    type: 'group' | 'enum' | 'multienum' | 'checkbox',
    title?: JTFCodeLong[],
    name?: JTFCodeLong[],
    hint?: JTFCodeLong[],
    sourceUrl?: string,
    selectedItem?: string, // enum
    defaultSelectionStrategy?: string,
    value?: boolean // checkbox
}

declare global {
    let client: JTFClient;
}
