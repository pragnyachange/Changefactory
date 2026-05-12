/**
 * ============================================================================
 * UTILITY HELPER FUNCTIONS
 * ============================================================================
 * 
 * Reusable helper functions used throughout the widget
 * These functions are called from widget.ts to avoid code duplication
 * and to maintain consistent formatting of data
 */

import { JsonTableFormat, JTFCode, JTFDataEnum, JTFDataSection, JTFHint, JTFId, JTFMetaCategory, JTFMetaColumn, JTFMetaColumnOptions, JTFMetaSection } from './jtf';

/**
 * Creates a bilingual (German/English) text object
 * 
 * Used for all user-facing text in the widget (labels, messages, etc.)
 * Ensures the widget displays correct language based on user's locale
 * 
 * @param {string} deStr - German text
 * @param {string} enStr - English text
 * @returns {JTFCode} Object with 'de' and 'en' properties
 * 
 * @example
 * jtfCodeDeEn('Aufgabe', 'Task')
 * // Returns: { de: 'Aufgabe', en: 'Task' }
 * 
 * @example
 * jtfCodeDeEn('Aufwand (neu)', 'Effort (new)')
 * // Returns: { de: 'Aufwand (neu)', en: 'Effort (new)' }
 */
export function jtfCodeDeEn(deStr: string, enStr: string): JTFCode {
    return {
        de: deStr,
        en: enStr
    };
}

/**
 * Constructs the complete JTF (JSON Table Format) response object
 * 
 * This is the wrapper function that combines all widget components into
 * the final structure that PQForce portal expects
 * 
 * @param {JTFMetaSection} meta - Table metadata (columns, options, categories)
 * @param {JTFDataSection[]} data - Array of table rows
 * @param {JTFId[]} charts - Chart definitions (default: empty array)
 * @param {JTFHint[]} hints - Warning/error messages (default: empty array)
 * @returns {JsonTableFormat} Complete widget response
 * 
 * @example
 * constructJtfObject(
 *     { options, columns, categories },  // meta
 *     tableRows,                         // data
 *     [],                                // charts
 *     warnings                           // hints
 * )
 */
export function constructJtfObject(
    meta: JTFMetaSection, 
    data: JTFDataSection[],
    charts: JTFId[] = [],
    hints: (string | JTFHint)[] = []
): JsonTableFormat {
    return {
        meta: meta,      // Structural info (columns, options, categories)
        data: data,      // Table row data
        charts: charts,  // Optional charts
        hints: hints     // Messages to display in UI
    }
};

/**
 * Constructs the table metadata object
 * 
 * Combines options (display settings), column definitions, and categories
 * into a single metadata object describing the entire table structure
 * 
 * @param {JTFMetaColumnOptions} options - Display options (adaptive widths, headers, etc.)
 * @param {JTFMetaColumn[]} columns - Array of column definitions
 * @param {JTFMetaCategory[]} categories - Column category groupings
 * @returns {JTFMetaSection} Complete metadata structure
 * 
 * @example
 * constructJtfMeta(
 *     { adaptiveColumnWidths: false, showHeader: true },
 *     columnArray,
 *     categoryArray
 * )
 */
export function constructJtfMeta(
    options: JTFMetaColumnOptions, 
    columns: JTFMetaColumn[], 
    categories: JTFMetaCategory[]
): JTFMetaSection {
    return {
        options: options,        // Table display options
        columns: columns,        // Column definitions (with order preserved)
        categories: categories   // Column groupings
    }
};

/**
 * Converts a PQForce API object to JTF enum format
 * 
 * Extracts relevant fields from PQForce objects (tasks, users, projects)
 * and formats them as enums for display in the widget
 * Handles deleted items by appending "(deleted)" to the name
 * 
 * @param {Pqf.pf.Item | Pqf.pm.ProjectWorkItem} obj - PQForce API object
 * @returns {JTFDataEnum | null} Formatted enum object, or null if input is null/invalid
 * 
 * @example
 * _toEnum(taskObject)
 * // Returns: {
 * //   type: 'Phase',
 * //   id: 'TASK-001',
 * //   name: 'Build Feature',
 * //   description: 'Implementation task',
 * //   iconRef: 'task-icon.png',
 * //   color: '#FF0000'
 * // }
 * 
 * @example
 * // Deleted item:
 * _toEnum(deletedTaskObject)
 * // Returns name: ' (deleted)' appended to original name
 */
export function _toEnum(
    obj: Pqf.pf.Item | Pqf.pm.ProjectWorkItem
): JTFDataEnum | null {
    // Return null for null/undefined input
    if (!obj) {
        return null;
    }
    
    // If object is marked as deleted, append "(deleted)" to name for UI clarity
    if ("isDeleted" in obj) obj.name = (obj.isDeleted ? " (deleted)" : "");
    
    // Extract relevant fields and return as enum structure
    return {
        'type': obj.type,           // Object type: "Project", "Phase", "User", etc.
        'id': obj.id,              // Unique identifier
        'name': obj.name,          // Display name
        'description': obj.description,  // Hover tooltip/description
        'iconRef': obj.iconRef,    // URL to icon image
        'color': obj.color         // Color code for visual styling
    };
}