# Améliorations Optionnelles pour projects.service.js

## JSDoc Complète (2 min)

```js
// Remplacer lignes 60-65
/**
 * Get a single project by ID
 * Verifies ownership before returning
 *
 * @param {string} id - Project ID
 * @returns {Promise<Object>} Project record
 * @throws {Error} If not authenticated or unauthorized
 */

// Remplacer lignes 95-101
/**
 * Update a project
 * Verifies ownership before updating
 *
 * @param {string} id - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated project record
 * @throws {Error} If not authenticated or unauthorized
 */

// Remplacer lignes 116-121
/**
 * Delete a project
 * Verifies ownership before deletion
 *
 * @param {string} id - Project ID
 * @returns {Promise<void>}
 * @throws {Error} If not authenticated or unauthorized
 */
```

## Méthodes Archive/Restore (3 min)

Si les projets ont un champ `status` dans la DB, ajouter après la méthode delete :

```js
/**
 * Archive a project (soft delete)
 *
 * @param {string} id - Project ID
 * @returns {Promise<Object>} Updated project record
 */
async archive(id) {
  return await this.update(id, { status: 'archived' })
}

/**
 * Restore an archived project
 *
 * @param {string} id - Project ID
 * @returns {Promise<Object>} Updated project record
 */
async restore(id) {
  return await this.update(id, { status: 'active' })
}
```

## Résumé

Ces changements ne sont **PAS obligatoires**. Le code fonctionne parfaitement tel quel.

Ils ajoutent juste :
- Documentation plus claire
- Cohérence totale avec campaigns.service.js
