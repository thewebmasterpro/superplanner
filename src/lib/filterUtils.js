/**
 * Filter Utilities for PocketBase
 *
 * Provides utilities for building safe PocketBase filter strings
 * and preventing SQL injection vulnerabilities.
 *
 * @module lib/filterUtils
 */

/**
 * Escape special characters in filter values to prevent SQL injection
 *
 * @param {string|number|boolean} value - Value to escape
 * @returns {string|number|boolean} Escaped value
 *
 * @example
 * escapeFilterValue('test"value') // Returns: 'test\\"value'
 * escapeFilterValue("test' OR 1=1") // Returns: "test\\' OR 1=1"
 */
export function escapeFilterValue(value) {
  // Non-string values are safe
  if (typeof value !== 'string') return value

  // Escape backslashes first, then quotes
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/'/g, "\\'")     // Escape single quotes
}

/**
 * Filter Builder class for constructing PocketBase filter strings
 *
 * @example
 * const filter = new FilterBuilder()
 *   .equals('user_id', userId)
 *   .notEmpty('deleted_at')
 *   .contains('name', searchTerm)
 *   .build()
 */
export class FilterBuilder {
  constructor() {
    this.conditions = []
  }

  /**
   * Add an equals condition
   * @param {string} field - Field name
   * @param {string|number} value - Value to match
   * @returns {FilterBuilder} this for chaining
   */
  equals(field, value) {
    const escaped = escapeFilterValue(value)
    this.conditions.push(`${field} = "${escaped}"`)
    return this
  }

  /**
   * Add a not equals condition
   * @param {string} field - Field name
   * @param {string|number} value - Value to exclude
   * @returns {FilterBuilder} this for chaining
   */
  notEquals(field, value) {
    const escaped = escapeFilterValue(value)
    this.conditions.push(`${field} != "${escaped}"`)
    return this
  }

  /**
   * Add a contains condition (fuzzy search)
   * @param {string} field - Field name
   * @param {string} value - Search term
   * @returns {FilterBuilder} this for chaining
   */
  contains(field, value) {
    const escaped = escapeFilterValue(value)
    this.conditions.push(`${field} ~ "${escaped}"`)
    return this
  }

  /**
   * Check if field is not empty
   * @param {string} field - Field name
   * @returns {FilterBuilder} this for chaining
   */
  notEmpty(field) {
    this.conditions.push(`${field} != ""`)
    return this
  }

  /**
   * Check if field is empty
   * @param {string} field - Field name
   * @returns {FilterBuilder} this for chaining
   */
  isEmpty(field) {
    this.conditions.push(`${field} = ""`)
    return this
  }

  /**
   * Add a greater than condition
   * @param {string} field - Field name
   * @param {string|number} value - Value to compare
   * @returns {FilterBuilder} this for chaining
   */
  greaterThan(field, value) {
    const escaped = escapeFilterValue(value)
    this.conditions.push(`${field} > "${escaped}"`)
    return this
  }

  /**
   * Add a less than condition
   * @param {string} field - Field name
   * @param {string|number} value - Value to compare
   * @returns {FilterBuilder} this for chaining
   */
  lessThan(field, value) {
    const escaped = escapeFilterValue(value)
    this.conditions.push(`${field} < "${escaped}"`)
    return this
  }

  /**
   * Add a raw condition (use with caution)
   * @param {string} condition - Raw filter condition
   * @returns {FilterBuilder} this for chaining
   */
  raw(condition) {
    this.conditions.push(condition)
    return this
  }

  /**
   * Add an OR group of conditions
   * @param {function(FilterBuilder): FilterBuilder} callback - Function that adds conditions
   * @returns {FilterBuilder} this for chaining
   *
   * @example
   * filter.or(f => f.equals('status', 'active').equals('status', 'draft'))
   */
  or(callback) {
    const orBuilder = new FilterBuilder()
    callback(orBuilder)
    const orConditions = orBuilder.build()
    if (orConditions) {
      this.conditions.push(`(${orConditions.replace(/ && /g, ' || ')})`)
    }
    return this
  }

  /**
   * Build the final filter string
   * @returns {string} Filter string for PocketBase
   */
  build() {
    return this.conditions.join(' && ')
  }

  /**
   * Get the number of conditions
   * @returns {number} Number of conditions
   */
  count() {
    return this.conditions.length
  }

  /**
   * Clear all conditions
   * @returns {FilterBuilder} this for chaining
   */
  clear() {
    this.conditions = []
    return this
  }
}

/**
 * Quick helper to build a user filter
 * @param {string} userId - User ID
 * @returns {string} Filter string
 */
export function userFilter(userId) {
  return new FilterBuilder().equals('user_id', userId).build()
}

/**
 * Quick helper to build a workspace filter
 * @param {string} workspaceId - Workspace ID
 * @param {string} userId - User ID
 * @returns {string} Filter string
 */
export function workspaceFilter(workspaceId, userId) {
  return new FilterBuilder()
    .equals('user_id', userId)
    .equals('context_id', workspaceId)
    .build()
}
