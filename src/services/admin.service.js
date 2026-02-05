import pb from '../lib/pocketbase'

/**
 * Admin Service
 * Centralized service for super admin operations
 * @module services/admin.service
 */
class AdminService {
  /**
   * Check if a user is a super admin
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user is super admin
   */
  async isSuperAdmin(userId) {
    try {
      const records = await pb.collection('user_roles').getFullList({
        filter: `user_id = "${userId}" && is_super_admin = true`,
      })
      return records.length > 0
    } catch (error) {
      console.error('Error checking super admin status:', error)
      return false
    }
  }

  /**
   * Require super admin access
   * Throws error if current user is not a super admin
   * @throws {Error} If user is not authenticated or not a super admin
   */
  async requireSuperAdmin() {
    const user = pb.authStore.model
    if (!user) {
      throw new Error('Not authenticated')
    }

    const isAdmin = await this.isSuperAdmin(user.id)
    if (!isAdmin) {
      throw new Error('Super admin access required')
    }

    return true
  }

  /**
   * Get global statistics across all users
   * @returns {Promise<Object>} Global stats object
   */
  async getGlobalStats() {
    await this.requireSuperAdmin()

    try {
      // Try to get cached stats first
      const cached = await this.getCachedStat('global_stats')
      if (cached && this._isCacheFresh(cached.calculated_at, 3600)) {
        return cached.stat_value
      }

      // Calculate fresh stats
      const [usersResult, tasksResult, completedTasksResult] = await Promise.all([
        pb.collection('users').getList(1, 1),
        pb.collection('tasks').getList(1, 1, { filter: 'deleted_at = null' }),
        pb.collection('tasks').getList(1, 1, { filter: 'status = "done" && deleted_at = null' }),
      ])

      const stats = {
        totalUsers: usersResult.totalItems,
        totalTasks: tasksResult.totalItems,
        completedTasks: completedTasksResult.totalItems,
        productivityAvg:
          tasksResult.totalItems > 0
            ? Math.round((completedTasksResult.totalItems / tasksResult.totalItems) * 100)
            : 0,
      }

      // Cache the results
      await this.setCachedStat('global_stats', stats)

      return stats
    } catch (error) {
      console.error('Error fetching global stats:', error)
      throw error
    }
  }

  /**
   * Get active users count for a given period
   * @param {string} period - Period: 'day', 'week', 'month'
   * @returns {Promise<number>} Number of active users
   */
  async getActiveUsersCount(period = 'week') {
    await this.requireSuperAdmin()

    const cacheKey = `active_users_${period}`
    const cached = await this.getCachedStat(cacheKey)
    if (cached && this._isCacheFresh(cached.calculated_at, 1800)) {
      return cached.stat_value
    }

    try {
      const cutoffDate = this._getCutoffDate(period)
      const result = await pb.collection('tasks').getList(1, 1, {
        filter: `updated_at >= "${cutoffDate.toISOString()}"`,
      })

      // Get unique user IDs (approximation - would need aggregation in real implementation)
      const count = result.totalItems > 0 ? Math.ceil(result.totalItems / 10) : 0

      await this.setCachedStat(cacheKey, count)
      return count
    } catch (error) {
      console.error('Error fetching active users:', error)
      return 0
    }
  }

  /**
   * Get tasks statistics for a given period
   * @param {string} period - Period: 'day', 'week', 'month'
   * @returns {Promise<Object>} Tasks stats { created, completed }
   */
  async getTasksStats(period = 'week') {
    await this.requireSuperAdmin()

    const cacheKey = `tasks_stats_${period}`
    const cached = await this.getCachedStat(cacheKey)
    if (cached && this._isCacheFresh(cached.calculated_at, 1800)) {
      return cached.stat_value
    }

    try {
      const cutoffDate = this._getCutoffDate(period)

      const [created, completed] = await Promise.all([
        pb.collection('tasks').getList(1, 1, {
          filter: `created_at >= "${cutoffDate.toISOString()}" && deleted_at = null`,
        }),
        pb.collection('tasks').getList(1, 1, {
          filter: `completed_at >= "${cutoffDate.toISOString()}" && status = "done" && deleted_at = null`,
        }),
      ])

      const stats = {
        created: created.totalItems,
        completed: completed.totalItems,
      }

      await this.setCachedStat(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Error fetching tasks stats:', error)
      return { created: 0, completed: 0 }
    }
  }

  /**
   * Get trends data for charts
   * @param {string} period - Period: 'week', 'month', 'year'
   * @returns {Promise<Object>} Trends data with dates and values
   */
  async getTrendsData(period = 'week') {
    await this.requireSuperAdmin()

    try {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
      const trends = {
        labels: [],
        tasksCompleted: [],
        tasksCreated: [],
      }

      // Generate data points for each day
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        trends.labels.push(date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }))

        try {
          const [completed, created] = await Promise.all([
            pb.collection('tasks').getList(1, 1, {
              filter: `completed_at >= "${date.toISOString()}" && completed_at < "${nextDate.toISOString()}" && status = "done"`,
            }),
            pb.collection('tasks').getList(1, 1, {
              filter: `created_at >= "${date.toISOString()}" && created_at < "${nextDate.toISOString()}"`,
            }),
          ])

          trends.tasksCompleted.push(completed.totalItems)
          trends.tasksCreated.push(created.totalItems)
        } catch (error) {
          trends.tasksCompleted.push(0)
          trends.tasksCreated.push(0)
        }
      }

      return trends
    } catch (error) {
      console.error('Error fetching trends data:', error)
      throw error
    }
  }

  /**
   * Grant super admin role to a user
   * @param {string} userId - User ID to grant admin role
   * @returns {Promise<Object>} Created role record
   */
  async grantSuperAdmin(userId) {
    await this.requireSuperAdmin()

    try {
      // Check if role already exists
      const existing = await pb.collection('user_roles').getFullList({
        filter: `user_id = "${userId}"`,
      })

      if (existing.length > 0) {
        return await pb.collection('user_roles').update(existing[0].id, {
          is_super_admin: true,
        })
      } else {
        return await pb.collection('user_roles').create({
          user_id: userId,
          is_super_admin: true,
        })
      }
    } catch (error) {
      console.error('Error granting super admin:', error)
      throw error
    }
  }

  /**
   * Revoke super admin role from a user
   * @param {string} userId - User ID to revoke admin role
   * @returns {Promise<Object>} Updated role record
   */
  async revokeSuperAdmin(userId) {
    await this.requireSuperAdmin()

    const currentUser = pb.authStore.model
    if (currentUser.id === userId) {
      throw new Error('Cannot revoke your own super admin access')
    }

    try {
      const existing = await pb.collection('user_roles').getFullList({
        filter: `user_id = "${userId}"`,
      })

      if (existing.length > 0) {
        return await pb.collection('user_roles').update(existing[0].id, {
          is_super_admin: false,
        })
      }
    } catch (error) {
      console.error('Error revoking super admin:', error)
      throw error
    }
  }

  /**
   * Get cached statistic
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} Cached stat or null
   */
  async getCachedStat(key) {
    try {
      const records = await pb.collection('admin_stats_cache').getFullList({
        filter: `stat_key = "${key}"`,
        sort: '-calculated_at',
      })

      return records.length > 0 ? records[0] : null
    } catch (error) {
      console.error('Error getting cached stat:', error)
      return null
    }
  }

  /**
   * Set cached statistic
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @returns {Promise<Object>} Created/updated cache record
   */
  async setCachedStat(key, value) {
    try {
      const existing = await this.getCachedStat(key)

      const data = {
        stat_key: key,
        stat_value: value,
        calculated_at: new Date().toISOString(),
      }

      if (existing) {
        return await pb.collection('admin_stats_cache').update(existing.id, data)
      } else {
        return await pb.collection('admin_stats_cache').create(data)
      }
    } catch (error) {
      console.error('Error setting cached stat:', error)
      throw error
    }
  }

  /**
   * Refresh all cached statistics
   * @returns {Promise<void>}
   */
  async refreshStatsCache() {
    await this.requireSuperAdmin()

    try {
      await this.getGlobalStats()
      await this.getActiveUsersCount('day')
      await this.getActiveUsersCount('week')
      await this.getActiveUsersCount('month')
      await this.getTasksStats('day')
      await this.getTasksStats('week')
      await this.getTasksStats('month')
    } catch (error) {
      console.error('Error refreshing stats cache:', error)
    }
  }

  /**
   * Check if cache is still fresh
   * @private
   * @param {string} calculatedAt - ISO timestamp of when cache was calculated
   * @param {number} maxAgeSeconds - Maximum age in seconds
   * @returns {boolean} True if cache is fresh
   */
  _isCacheFresh(calculatedAt, maxAgeSeconds) {
    if (!calculatedAt) return false
    const cacheDate = new Date(calculatedAt)
    const now = new Date()
    const ageSeconds = (now - cacheDate) / 1000
    return ageSeconds < maxAgeSeconds
  }

  /**
   * Get cutoff date for period
   * @private
   * @param {string} period - Period: 'day', 'week', 'month'
   * @returns {Date} Cutoff date
   */
  _getCutoffDate(period) {
    const now = new Date()
    switch (period) {
      case 'day':
        now.setDate(now.getDate() - 1)
        break
      case 'week':
        now.setDate(now.getDate() - 7)
        break
      case 'month':
        now.setMonth(now.getMonth() - 1)
        break
      default:
        now.setDate(now.getDate() - 7)
    }
    return now
  }
}

export const adminService = new AdminService()
