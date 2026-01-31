/**
 * Blockers Service
 *
 * Centralized service for task dependencies (blockers).
 *
 * @module services/blockers.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class BlockersService {
    /**
     * Get tasks that block the given task (Upstream dependencies)
     * @param {string} taskId 
     * @returns {Promise<Array>}
     */
    async getBlockers(taskId) {
        if (!taskId) return []
        const escapedId = escapeFilterValue(taskId)

        return await pb.collection('task_dependencies').getFullList({
            filter: `task_id = "${escapedId}"`,
            expand: 'blocker_id'
        })
    }

    /**
     * Get tasks that are blocked BY the given task (Downstream dependencies)
     * @param {string} taskId 
     * @returns {Promise<Array>}
     */
    async getBlockedTasks(taskId) {
        if (!taskId) return []
        const escapedId = escapeFilterValue(taskId)

        return await pb.collection('task_dependencies').getFullList({
            filter: `blocker_id = "${escapedId}"`,
            expand: 'task_id'
        })
    }

    /**
     * Add a blocker dependency
     * @param {string} taskId - The task being blocked
     * @param {string} blockerId - The task that is blocking
     */
    async addBlocker(taskId, blockerId) {
        if (!taskId || !blockerId) throw new Error('Invalid IDs')

        // Validation: no self-blocking
        if (blockerId === taskId) {
            throw new Error('A task cannot block itself')
        }

        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // Validation: check for simple cycle (A↔B)
        // We check if there is a dependency where task_id=blockerId AND blocker_id=taskId
        try {
            const reverseCheck = await pb.collection('task_dependencies').getFirstListItem(`task_id="${blockerId}" && blocker_id="${taskId}"`)
            if (reverseCheck) {
                throw new Error('Circular dependency detected: this would create a cycle')
            }
        } catch (e) {
            if (e.status !== 404) throw e
        }

        // Check if exists
        try {
            const exists = await pb.collection('task_dependencies').getFirstListItem(`task_id="${taskId}" && blocker_id="${blockerId}"`)
            if (exists) {
                throw new Error('This blocker already exists')
            }
        } catch (e) {
            if (e.status !== 404) throw e
        }

        return await pb.collection('task_dependencies').create({
            task_id: taskId,
            blocker_id: blockerId,
            user_id: user.id
        })
    }

    /**
     * Remove a dependency
     * @param {string} dependencyId 
     */
    async removeBlocker(dependencyId) {
        return await pb.collection('task_dependencies').delete(dependencyId)
    }
}

export const blockersService = new BlockersService()
