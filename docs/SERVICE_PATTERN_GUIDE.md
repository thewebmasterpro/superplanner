# Service Pattern Guide for AI Assistants

**Target Audience:** Gemini, Claude, and other AI coding assistants
**Purpose:** Ensure consistent, secure, and maintainable service layer implementation
**Last Updated:** 2026-01-30

---

## Quick Reference: Service Template

When creating a new service, use this template:

```js
/**
 * [Entity] Service
 *
 * Centralized service for all [entity]-related operations.
 * Abstracts PocketBase API calls and provides clean, reusable methods.
 *
 * @module services/[entity].service
 */

import pb from '../lib/pocketbase'

class [Entity]Service {
  /**
   * Fetch all [entities] with optional filtering
   *
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of [entity] records
   */
  async getAll(options = {}) {
    const user = pb.authStore.model
    if (!user) return []

    const filters = this._buildFilters(options, user.id)
    const filterString = filters.join(' && ')

    try {
      const queryOptions = {
        sort: '-created',
        expand: 'related_field'
      }

      if (filterString) {
        queryOptions.filter = filterString
      }

      return await pb.collection('[entities]').getFullList(queryOptions)
    } catch (error) {
      console.error('❌ Error fetching [entities]:', error)

      // Fallback without expand
      try {
        const queryOptions = { sort: '-created' }
        if (filterString) {
          queryOptions.filter = filterString
        }

        const records = await pb.collection('[entities]').getFullList(queryOptions)
        console.log('✅ [Entities] fetched without expand:', records.length)
        return records
      } catch (fallbackError) {
        console.error('❌ Failed to fetch [entities]:', fallbackError)
        return []
      }
    }
  }

  /**
   * Get a single [entity] by ID
   * Verifies ownership before returning
   *
   * @param {string} id - [Entity] ID
   * @returns {Promise<Object>} [Entity] record
   * @throws {Error} If not authenticated or unauthorized
   */
  async getOne(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const record = await pb.collection('[entities]').getOne(id)

    // Verify ownership
    if (record.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot access this [entity]')
    }

    return record
  }

  /**
   * Create a new [entity]
   *
   * @param {Object} data - [Entity] data
   * @returns {Promise<Object>} Created [entity] record
   * @throws {Error} If user not authenticated
   */
  async create(data) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    const sanitized = this._sanitize(data)

    return await pb.collection('[entities]').create({
      ...sanitized,
      user_id: user.id
    })
  }

  /**
   * Update an [entity]
   * Verifies ownership before updating
   *
   * @param {string} id - [Entity] ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated [entity] record
   * @throws {Error} If not authenticated or unauthorized
   */
  async update(id, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Verify ownership first
    const existing = await this.getOne(id)
    if (existing.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot update this [entity]')
    }

    const sanitized = this._sanitize(updates)
    return await pb.collection('[entities]').update(id, sanitized)
  }

  /**
   * Delete an [entity]
   * Verifies ownership before deletion
   *
   * @param {string} id - [Entity] ID
   * @returns {Promise<void>}
   * @throws {Error} If not authenticated or unauthorized
   */
  async delete(id) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Verify ownership first
    const existing = await this.getOne(id)
    if (existing.user_id !== user.id) {
      throw new Error('Unauthorized: Cannot delete this [entity]')
    }

    return await pb.collection('[entities]').delete(id)
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Build PocketBase filter string
   *
   * @private
   * @param {Object} options - Filter options
   * @param {string} userId - User ID
   * @returns {string[]} Array of filter conditions
   */
  _buildFilters(options, userId) {
    const filters = []

    // Always filter by user
    filters.push(`user_id = "${userId}"`)

    // Add other filters based on options
    // ...

    return filters
  }

  /**
   * Sanitize data by converting empty strings to null
   * PocketBase requires null for optional fields, not empty strings
   *
   * @private
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  _sanitize(data) {
    const sanitized = { ...data }
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '') {
        sanitized[key] = null
      }
    })
    return sanitized
  }
}

// Export singleton instance
export const [entity]Service = new [Entity]Service()
```

---

## ✅ Mandatory Checklist

Before submitting a service implementation, verify ALL items:

### Structure & Patterns
- [ ] Service is a class with singleton export: `export const xService = new XService()`
- [ ] All public methods have JSDoc with `@param`, `@returns`, `@throws`
- [ ] Private methods are prefixed with underscore: `_buildFilters()`, `_sanitize()`
- [ ] Service follows naming convention: `[entity].service.js`

### Security
- [ ] **CRITICAL:** All methods check authentication: `if (!user) throw new Error('Not authenticated')`
- [ ] **CRITICAL:** `getOne()`, `update()`, `delete()` verify ownership before operation
- [ ] **CRITICAL:** User input in filters is escaped (use `escapeFilterValue()` or sanitize manually)
- [ ] Create/update methods add `user_id` automatically

### Error Handling
- [ ] Try-catch blocks around PocketBase calls
- [ ] Fallback strategy for failed expand queries
- [ ] Errors are logged with `console.error()`
- [ ] Methods return empty array `[]` for read operations when user not authenticated
- [ ] Methods throw `Error` for write operations when unauthorized

### Data Management
- [ ] `_sanitize()` method converts empty strings to `null`
- [ ] `_buildFilters()` method constructs filter arrays
- [ ] Always include `user_id` filter for multi-tenant data

### Component Integration
- [ ] Component imports the service: `import { xService } from '../services/x.service'`
- [ ] Component does NOT import `pb` directly
- [ ] Component uses service methods for ALL PocketBase operations
- [ ] Component has proper error handling with `try-catch` and `toast`

---

## 🚨 Common Mistakes to Avoid

### ❌ WRONG: Direct PocketBase calls in components

```js
// components/Projects.jsx
const handleDelete = async (id) => {
  await pb.collection('projects').delete(id) // ❌ WRONG!
}
```

### ✅ CORRECT: Use service

```js
// components/Projects.jsx
import { projectsService } from '../services/projects.service'

const handleDelete = async (id) => {
  await projectsService.delete(id) // ✅ CORRECT
}
```

---

### ❌ WRONG: No ownership verification

```js
// services/projects.service.js
async delete(id) {
  return await pb.collection('projects').delete(id) // ❌ Anyone can delete anything!
}
```

### ✅ CORRECT: Verify ownership

```js
// services/projects.service.js
async delete(id) {
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  // Verify ownership
  const project = await this.getOne(id)
  if (project.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  return await pb.collection('projects').delete(id) // ✅ CORRECT
}
```

---

### ❌ WRONG: SQL Injection vulnerability

```js
// services/projects.service.js
_buildFilters(search) {
  const filters = []
  if (search) {
    filters.push(`name ~ "${search}"`) // ❌ If search = 'test" || 1=1', filter breaks!
  }
  return filters
}
```

### ✅ CORRECT: Escape user input

```js
// services/projects.service.js
_buildFilters(search) {
  const filters = []
  if (search) {
    const escaped = search.replace(/"/g, '\\"') // ✅ Escape quotes
    filters.push(`name ~ "${escaped}"`)
  }
  return filters
}
```

---

### ❌ WRONG: Double filtering

```js
// Component
const data = await projectsService.getAll({ search: searchTerm })

// Then in component
const filtered = data.filter(p => p.name.includes(searchTerm)) // ❌ Service already filtered!
```

### ✅ CORRECT: Trust the service

```js
// Component
const data = await projectsService.getAll({ search: searchTerm })
// Use data directly, no additional filtering needed ✅
```

---

## 📚 Reference Examples

### Example 1: tasks.service.js
[src/services/tasks.service.js](../src/services/tasks.service.js)

**What to learn:**
- Complex filtering logic (`_buildFilters()`)
- Recurrence handling (`_handleRecurrence()`)
- Bulk operations (`bulkRestore()`, `bulkDelete()`)
- Comprehensive error handling

**Key pattern:**
```js
// tasks.service.js line 214
_buildFilters(workspaceId) {
  const filters = []

  if (workspaceId === 'trash') {
    filters.push('deleted_at != ""')
  } else if (workspaceId === 'archive') {
    filters.push('deleted_at = ""')
    filters.push('archived_at != ""')
  } else {
    filters.push('deleted_at = ""')
    filters.push('archived_at = ""')

    if (workspaceId && workspaceId !== 'all') {
      filters.push(`context_id = "${workspaceId}"`)
    }
  }

  return filters
}
```

---

### Example 2: campaigns.service.js
[src/services/campaigns.service.js](../src/services/campaigns.service.js)

**What to learn:**
- Ownership verification in `update()` and `delete()`
- Multi-option filtering (workspace, status, search)
- Stats aggregation (`getWithStats()`)

**Key pattern:**
```js
// campaigns.service.js line 129
async update(id, updates) {
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  // Verify ownership BEFORE updating
  const existing = await this.getOne(id)
  if (existing.user_id !== user.id) {
    throw new Error('Unauthorized: Cannot update this campaign')
  }

  const sanitized = this._sanitize(updates)
  return await pb.collection('campaigns').update(id, sanitized)
}
```

---

### Example 3: workspaces.service.js
[src/services/workspaces.service.js](../src/services/workspaces.service.js)

**What to learn:**
- Simple CRUD operations
- Soft delete (archive) vs hard delete
- Status filtering

**Key pattern:**
```js
// workspaces.service.js line 90
async delete(id, mode = 'soft') {
  if (mode === 'soft') {
    return await pb.collection('contexts').update(id, { status: 'archived' })
  } else {
    return await pb.collection('contexts').delete(id)
  }
}
```

---

## 🔧 Integration Guide

### Step 1: Create the Service
1. Copy the template above
2. Replace `[Entity]` with your entity name (e.g., `Project`, `Contact`)
3. Replace `[entities]` with collection name (e.g., `projects`, `contacts`)
4. Implement custom logic in `_buildFilters()`

### Step 2: Update the Component
1. Add import: `import { xService } from '../services/x.service'`
2. Remove: `import pb from '../lib/pocketbase'`
3. Replace all `pb.collection('x').*` calls with `xService.*`
4. Add proper error handling with `try-catch` and `toast`

### Step 3: Test
1. Run `npm run build` to check compilation
2. Manually test CRUD operations in the UI
3. Verify ownership checks (try accessing another user's data)
4. Test error cases (network errors, auth failures)

---

## 📝 Quick Reference Table

| Operation | Service Method | Returns | Throws on Error |
|-----------|---------------|---------|-----------------|
| Fetch all | `getAll(options)` | `Promise<Array>` | No, returns `[]` |
| Fetch one | `getOne(id)` | `Promise<Object>` | Yes |
| Create | `create(data)` | `Promise<Object>` | Yes |
| Update | `update(id, data)` | `Promise<Object>` | Yes |
| Delete | `delete(id)` | `Promise<void>` | Yes |

---

## 🎯 Next Services to Create

Based on current codebase analysis, prioritize these services:

1. **projects.service.js** - HIGH priority (14 direct PB calls in ProjectManager.jsx)
2. **contacts.service.js** - HIGH priority (11 direct PB calls in useContacts.js)
3. **categories.service.js** - MEDIUM priority (3 direct PB calls in CategoryManager.jsx)
4. **meetings.service.js** - MEDIUM priority (7 direct PB calls in Meetings.jsx)

---

## ❓ FAQ for AI Assistants

**Q: Should I add TypeScript types?**
A: No, this project uses JavaScript with JSDoc. Add comprehensive JSDoc comments instead.

**Q: What if the collection doesn't have a `user_id` field?**
A: Remove ownership checks but keep authentication checks. Document why in comments.

**Q: Should I add validation logic in services?**
A: Basic validation (null checks) yes. Complex validation (regex, business rules) should be in a separate validation layer.

**Q: What about caching?**
A: Not in services. React Query (in hooks) handles caching. Keep services stateless.

**Q: How do I handle relations/joins?**
A: Use PocketBase's `expand` parameter in queries. Add separate methods like `getWithRelations(id)` if needed.

---

**Last reminder:** Always run `npm run build` after creating a service to catch errors early!
