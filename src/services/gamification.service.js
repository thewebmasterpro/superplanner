import pb from '../lib/pocketbase'

/**
 * Points configuration
 */
export const POINTS_CONFIG = {
  task_completed: 10,
  high_priority_task: 20,
  medium_priority_task: 15,
  early_completion: 5,
  daily_login: 5,
  challenge_completed: 50, // base, varies per challenge
  streak_multiplier: 1.5, // 1.5x points on streak days
  level_threshold: 100, // 100 points per level
}

/**
 * Gamification Service
 * Handles points, challenges, achievements, and leaderboard
 * @module services/gamification.service
 */
class GamificationService {
  // ========== POINTS MANAGEMENT ==========

  /**
   * Get user's gamification points record
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User points record
   */
  async getUserPoints(userId) {
    try {
      const records = await pb.collection('gamification_points').getFullList({
        filter: `user_id = "${userId}"`,
      })

      if (records.length === 0) {
        // Create initial record if doesn't exist
        return await pb.collection('gamification_points').create({
          user_id: userId,
          points: 0,
          total_earned: 0,
          total_spent: 0,
          level: 1,
          streak_days: 0,
          last_activity_date: new Date().toISOString(),
          leaderboard_visible: false,
        })
      }

      return records[0]
    } catch (error) {
      console.error('Error getting user points:', error)
      throw error
    }
  }

  /**
   * Award points to a user
   * @param {string} userId - User ID
   * @param {string} actionType - Type of action
   * @param {number} points - Points to award
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Updated points record
   */
  async awardPoints(userId, actionType, points, metadata = {}) {
    try {
      const userPoints = await this.getUserPoints(userId)

      // Check for streak multiplier
      let finalPoints = points
      if (userPoints.streak_days > 0) {
        finalPoints = Math.round(points * POINTS_CONFIG.streak_multiplier)
      }

      // Update points
      const updatedPoints = await pb.collection('gamification_points').update(userPoints.id, {
        points: userPoints.points + finalPoints,
        total_earned: userPoints.total_earned + finalPoints,
        last_activity_date: new Date().toISOString(),
      })

      // Create history entry
      await pb.collection('points_history').create({
        user_id: userId,
        action_type: actionType,
        points_change: finalPoints,
        related_task_id: metadata.taskId || null,
        related_challenge_id: metadata.challengeId || null,
        related_item_id: metadata.itemId || null,
        description: metadata.description || `${actionType}: +${finalPoints} points`,
      })

      // Check and update level
      await this.updateUserLevel(userId)

      // Check and update challenge progress
      if (actionType === 'task_completed') {
        await this._updateTaskChallenges(userId)
      }

      return updatedPoints
    } catch (error) {
      console.error('Error awarding points:', error)
      // Don't throw - points are nice to have, not critical
      return null
    }
  }

  /**
   * Get user's points history
   * @param {string} userId - User ID
   * @param {number} limit - Max records to return
   * @returns {Promise<Array>} Points history
   */
  async getPointsHistory(userId, limit = 100) {
    try {
      return await pb.collection('points_history').getList(1, limit, {
        filter: `user_id = "${userId}"`,
        sort: '-created_at',
      })
    } catch (error) {
      console.error('Error getting points history:', error)
      return { items: [], totalItems: 0 }
    }
  }

  /**
   * Get leaderboard
   * @param {Object} options - Options { period, limit }
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard({ period = 'all', limit = 10 } = {}) {
    try {
      let filter = 'leaderboard_visible = true'

      // Period filtering (for future implementation with time-based points)
      if (period === 'week' || period === 'month') {
        const cutoffDate = new Date()
        if (period === 'week') {
          cutoffDate.setDate(cutoffDate.getDate() - 7)
        } else {
          cutoffDate.setMonth(cutoffDate.getMonth() - 1)
        }
        filter += ` && last_activity_date >= "${cutoffDate.toISOString()}"`
      }

      const records = await pb.collection('gamification_points').getList(1, limit, {
        filter,
        sort: '-total_earned',
        expand: 'user_id',
      })

      return records.items.map((record, index) => ({
        rank: index + 1,
        userId: record.user_id,
        userName: record.expand?.user_id?.name || 'Anonymous',
        points: record.points,
        totalEarned: record.total_earned,
        level: record.level,
        streak: record.streak_days,
      }))
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  /**
   * Get user's rank in leaderboard
   * @param {string} userId - User ID
   * @returns {Promise<number|null>} User's rank or null if not in leaderboard
   */
  async getUserRank(userId) {
    try {
      const userPoints = await this.getUserPoints(userId)

      if (!userPoints.leaderboard_visible) {
        return null
      }

      const higherRanked = await pb.collection('gamification_points').getList(1, 1, {
        filter: `total_earned > ${userPoints.total_earned} && leaderboard_visible = true`,
      })

      return higherRanked.totalItems + 1
    } catch (error) {
      console.error('Error getting user rank:', error)
      return null
    }
  }

  // ========== CHALLENGES ==========

  /**
   * Get all active challenges
   * @returns {Promise<Array>} Active challenges
   */
  async getActiveChallenges() {
    try {
      const now = new Date().toISOString()
      return await pb.collection('challenges').getFullList({
        filter: `is_active = true && start_date <= "${now}" && end_date >= "${now}"`,
        sort: 'type,created_at',
      })
    } catch (error) {
      console.error('Error getting active challenges:', error)
      return []
    }
  }

  /**
   * Get user's challenges with progress
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User challenges
   */
  async getUserChallenges(userId) {
    try {
      const userChallenges = await pb.collection('user_challenges').getFullList({
        filter: `user_id = "${userId}"`,
        expand: 'challenge_id',
        sort: '-created_at',
      })

      return userChallenges.map((uc) => ({
        id: uc.id,
        challengeId: uc.challenge_id,
        challenge: uc.expand?.challenge_id,
        progress: uc.progress,
        completed: uc.completed,
        completedAt: uc.completed_at,
        claimed: uc.claimed,
        progressPercentage: uc.expand?.challenge_id
          ? Math.min((uc.progress / uc.expand.challenge_id.goal_value) * 100, 100)
          : 0,
      }))
    } catch (error) {
      console.error('Error getting user challenges:', error)
      return []
    }
  }

  /**
   * Enroll user in all active challenges
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async enrollUserInActiveChallenges(userId) {
    try {
      const activeChallenges = await this.getActiveChallenges()
      const existingEnrollments = await pb.collection('user_challenges').getFullList({
        filter: `user_id = "${userId}"`,
      })

      const enrolledChallengeIds = new Set(existingEnrollments.map((e) => e.challenge_id))

      for (const challenge of activeChallenges) {
        if (!enrolledChallengeIds.has(challenge.id)) {
          await pb.collection('user_challenges').create({
            user_id: userId,
            challenge_id: challenge.id,
            progress: 0,
            completed: false,
            claimed: false,
          })
        }
      }
    } catch (error) {
      console.error('Error enrolling user in challenges:', error)
    }
  }

  /**
   * Update challenge progress
   * @param {string} userId - User ID
   * @param {string} challengeId - Challenge ID
   * @param {number} increment - Amount to increment
   * @returns {Promise<Object|null>} Updated challenge or null
   */
  async updateChallengeProgress(userId, challengeId, increment = 1) {
    try {
      const userChallenges = await pb.collection('user_challenges').getFullList({
        filter: `user_id = "${userId}" && challenge_id = "${challengeId}"`,
        expand: 'challenge_id',
      })

      if (userChallenges.length === 0) {
        return null
      }

      const userChallenge = userChallenges[0]
      const challenge = userChallenge.expand?.challenge_id

      if (!challenge || userChallenge.completed) {
        return userChallenge
      }

      const newProgress = userChallenge.progress + increment

      // Check if challenge is now completed
      const isCompleted = newProgress >= challenge.goal_value

      const updated = await pb.collection('user_challenges').update(userChallenge.id, {
        progress: newProgress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })

      return updated
    } catch (error) {
      console.error('Error updating challenge progress:', error)
      return null
    }
  }

  /**
   * Claim challenge reward
   * @param {string} userId - User ID
   * @param {string} challengeId - Challenge ID
   * @returns {Promise<boolean>} Success status
   */
  async claimReward(userId, challengeId) {
    try {
      const userChallenges = await pb.collection('user_challenges').getFullList({
        filter: `user_id = "${userId}" && challenge_id = "${challengeId}"`,
        expand: 'challenge_id',
      })

      if (userChallenges.length === 0) {
        throw new Error('Challenge not found')
      }

      const userChallenge = userChallenges[0]
      const challenge = userChallenge.expand?.challenge_id

      if (!challenge) {
        throw new Error('Challenge details not found')
      }

      if (!userChallenge.completed) {
        throw new Error('Challenge not completed')
      }

      if (userChallenge.claimed) {
        throw new Error('Reward already claimed')
      }

      // Award points
      await this.awardPoints(userId, 'challenge_completed', challenge.points_reward, {
        challengeId: challenge.id,
        description: `Challenge completed: ${challenge.title}`,
      })

      // Mark as claimed
      await pb.collection('user_challenges').update(userChallenge.id, {
        claimed: true,
      })

      return true
    } catch (error) {
      console.error('Error claiming reward:', error)
      throw error
    }
  }

  /**
   * Create a new challenge (admin only)
   * @param {Object} data - Challenge data
   * @returns {Promise<Object>} Created challenge
   */
  async createChallenge(data) {
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // In a real app, check if user is admin here
      return await pb.collection('challenges').create(data)
    } catch (error) {
      console.error('Error creating challenge:', error)
      throw error
    }
  }

  // ========== SHOP ==========

  /**
   * Get all shop items
   * @returns {Promise<Array>} Shop items
   */
  async getShopItems() {
    try {
      return await pb.collection('shop_items').getFullList({
        filter: 'is_available = true',
        sort: 'price',
      })
    } catch (error) {
      console.error('Error getting shop items:', error)
      return []
    }
  }

  /**
   * Get user's purchases
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User purchases
   */
  async getUserPurchases(userId) {
    try {
      return await pb.collection('user_purchases').getFullList({
        filter: `user_id = "${userId}"`,
        expand: 'item_id',
        sort: '-purchased_at',
      })
    } catch (error) {
      console.error('Error getting user purchases:', error)
      return []
    }
  }

  /**
   * Purchase an item from the shop
   * @param {string} userId - User ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Purchase record
   */
  async purchaseItem(userId, itemId) {
    try {
      // Get item details
      const item = await pb.collection('shop_items').getOne(itemId)

      if (!item.is_available) {
        throw new Error('Item not available')
      }

      // Check if user has enough points
      const userPoints = await this.getUserPoints(userId)

      if (userPoints.points < item.price) {
        throw new Error('Insufficient points')
      }

      // Check if item is already purchased (for unique items)
      const existing = await pb.collection('user_purchases').getFullList({
        filter: `user_id = "${userId}" && item_id = "${itemId}"`,
      })

      if (existing.length > 0) {
        throw new Error('Item already purchased')
      }

      // Deduct points
      await pb.collection('gamification_points').update(userPoints.id, {
        points: userPoints.points - item.price,
        total_spent: userPoints.total_spent + item.price,
      })

      // Create purchase record
      const purchase = await pb.collection('user_purchases').create({
        user_id: userId,
        item_id: itemId,
        purchased_at: new Date().toISOString(),
        is_active: true,
      })

      // Create history entry
      await pb.collection('points_history').create({
        user_id: userId,
        action_type: 'shop_purchase',
        points_change: -item.price,
        related_item_id: itemId,
        description: `Purchased: ${item.name}`,
      })

      return purchase
    } catch (error) {
      console.error('Error purchasing item:', error)
      throw error
    }
  }

  /**
   * Activate/deactivate a purchased item
   * @param {string} userId - User ID
   * @param {string} purchaseId - Purchase ID
   * @param {boolean} active - Active state
   * @returns {Promise<Object>} Updated purchase
   */
  async activateItem(userId, purchaseId, active = true) {
    try {
      const purchase = await pb.collection('user_purchases').getOne(purchaseId)

      if (purchase.user_id !== userId) {
        throw new Error('Unauthorized')
      }

      return await pb.collection('user_purchases').update(purchaseId, {
        is_active: active,
      })
    } catch (error) {
      console.error('Error activating item:', error)
      throw error
    }
  }

  // ========== EVENT HANDLERS ==========

  /**
   * Handle task completion (called from tasks service)
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async onTaskCompleted(taskId, userId) {
    try {
      // Get task details to determine points
      const task = await pb.collection('tasks').getOne(taskId)

      let points = POINTS_CONFIG.task_completed

      // Bonus for high priority
      if (task.priority === 'high') {
        points = POINTS_CONFIG.high_priority_task
      } else if (task.priority === 'medium') {
        points = POINTS_CONFIG.medium_priority_task
      }

      // Bonus for early completion
      if (task.due_date) {
        const dueDate = new Date(task.due_date)
        const now = new Date()
        if (now < dueDate) {
          points += POINTS_CONFIG.early_completion
        }
      }

      // Award points
      await this.awardPoints(userId, 'task_completed', points, {
        taskId,
        description: `Task completed: ${task.title}`,
      })

      // Update task-based challenges
      await this._updateTaskChallenges(userId)
    } catch (error) {
      console.error('Error in onTaskCompleted:', error)
    }
  }

  /**
   * Handle daily login
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async onDailyLogin(userId) {
    try {
      const userPoints = await this.getUserPoints(userId)
      const lastActivity = new Date(userPoints.last_activity_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      lastActivity.setHours(0, 0, 0, 0)

      // Only award once per day
      if (lastActivity < today) {
        await this.awardPoints(userId, 'daily_login', POINTS_CONFIG.daily_login, {
          description: 'Daily login bonus',
        })

        // Update streak
        await this.checkAndUpdateStreak(userId)

        // Enroll in new challenges
        await this.enrollUserInActiveChallenges(userId)
      }
    } catch (error) {
      console.error('Error in onDailyLogin:', error)
    }
  }

  // ========== LEVEL SYSTEM ==========

  /**
   * Calculate level from total points
   * @param {number} totalPoints - Total points earned
   * @returns {number} Level
   */
  calculateLevel(totalPoints) {
    return Math.floor(totalPoints / POINTS_CONFIG.level_threshold) + 1
  }

  /**
   * Update user's level based on total points
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated points record
   */
  async updateUserLevel(userId) {
    try {
      const userPoints = await this.getUserPoints(userId)
      const newLevel = this.calculateLevel(userPoints.total_earned)

      if (newLevel !== userPoints.level) {
        return await pb.collection('gamification_points').update(userPoints.id, {
          level: newLevel,
        })
      }

      return userPoints
    } catch (error) {
      console.error('Error updating user level:', error)
      return null
    }
  }

  // ========== STREAK SYSTEM ==========

  /**
   * Check and update user's streak
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated points record
   */
  async checkAndUpdateStreak(userId) {
    try {
      const userPoints = await this.getUserPoints(userId)
      const lastActivity = new Date(userPoints.last_activity_date)
      const today = new Date()

      // Reset time to midnight for comparison
      today.setHours(0, 0, 0, 0)
      lastActivity.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24))

      let newStreak = userPoints.streak_days

      if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak += 1
      } else if (daysDiff > 1) {
        // Missed a day - reset streak
        newStreak = 1
      }
      // daysDiff === 0 means same day, keep streak

      if (newStreak !== userPoints.streak_days) {
        return await pb.collection('gamification_points').update(userPoints.id, {
          streak_days: newStreak,
        })
      }

      return userPoints
    } catch (error) {
      console.error('Error checking streak:', error)
      return null
    }
  }

  // ========== PRIVATE HELPERS ==========

  /**
   * Update task-based challenges
   * @private
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async _updateTaskChallenges(userId) {
    try {
      const activeChallenges = await this.getActiveChallenges()
      const taskChallenges = activeChallenges.filter((c) => c.goal_metric === 'tasks_completed')

      for (const challenge of taskChallenges) {
        await this.updateChallengeProgress(userId, challenge.id, 1)
      }
    } catch (error) {
      console.error('Error updating task challenges:', error)
    }
  }
}

export const gamificationService = new GamificationService()
