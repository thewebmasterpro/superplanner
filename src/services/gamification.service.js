import pb from '../lib/pocketbase'

// 🚨🚨🚨 VERIFICATION CODE CHARGÉ 🚨🚨🚨
console.log('🚨🚨🚨 GAMIFICATION SERVICE LOADED - VERSION 2.0 🚨🚨🚨')
console.log('🚨 If you see this, the file is loading! 🚨')

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
    console.log('🎮 [Gamification] getUserPoints called:', { userId })
    try {
      const records = await pb.collection('gamification_points').getFullList({
        filter: `user_id = "${userId}"`,
      })

      console.log('🎮 [Gamification] Records found:', records.length)

      if (records.length === 0) {
        // Create initial record if doesn't exist
        console.log('🎮 [Gamification] Creating initial record for user')
        const newRecord = await pb.collection('gamification_points').create({
          user_id: userId,
          points: 0,
          total_earned: 0,
          total_spent: 0,
          level: 1,
          streak_days: 0,
          last_activity_date: new Date().toISOString(),
          leaderboard_visible: false,
        })
        console.log('🎮 [Gamification] Initial record created:', newRecord)
        return newRecord
      }

      console.log('🎮 [Gamification] Returning existing record:', records[0])
      return records[0]
    } catch (error) {
      console.error('❌ [Gamification] Error getting user points:', error)
      console.error('❌ [Gamification] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        response: error.response,
      })
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
    console.log('🎮 [Gamification] awardPoints called:', { userId, actionType, points, metadata })
    try {
      const userPoints = await this.getUserPoints(userId)
      const oldLevel = userPoints.level

      // Check for streak multiplier
      let finalPoints = points
      const hadStreakBonus = userPoints.streak_days > 0
      if (hadStreakBonus) {
        finalPoints = Math.round(points * POINTS_CONFIG.streak_multiplier)
        console.log('🎮 [Gamification] Streak multiplier applied:', {
          original: points,
          final: finalPoints,
          streak: userPoints.streak_days,
        })
      }

      console.log('🎮 [Gamification] Updating points record')
      // Update points
      const updatedPoints = await pb.collection('gamification_points').update(userPoints.id, {
        points: userPoints.points + finalPoints,
        total_earned: userPoints.total_earned + finalPoints,
        last_activity_date: new Date().toISOString(),
      })
      console.log('🎮 [Gamification] Points updated:', updatedPoints)

      console.log('🎮 [Gamification] Creating history entry')
      // Create history entry
      await pb.collection('points_history').create({
        user_id: userId,
        action_type: actionType,
        points_change: finalPoints,
        related_task_id: metadata.taskId || null,
        related_challenge_id: metadata.challengeId || null,
        related_item_id: metadata.itemId || null,
        reason: metadata.description || `${actionType}: +${finalPoints} points`,
      })
      console.log('🎮 [Gamification] History entry created')

      // Check and update level
      console.log('🎮 [Gamification] Checking level update')
      const levelResult = await this.updateUserLevel(userId)
      const newLevel = levelResult?.level || oldLevel
      const didLevelUp = newLevel > oldLevel

      // Check and update challenge progress
      if (actionType === 'task_completed') {
        console.log('🎮 [Gamification] Updating task challenges')
        await this._updateTaskChallenges(userId)
      }

      console.log('🎮 [Gamification] ✅ Points awarded successfully!')

      // Return detailed result for notifications
      return {
        success: true,
        pointsAwarded: finalPoints,
        levelUp: didLevelUp,
        newLevel: newLevel,
        oldLevel: oldLevel,
        streakBonus: hadStreakBonus,
        updatedPoints
      }
    } catch (error) {
      console.error('❌ [Gamification] Error awarding points:', error)
      console.error('❌ [Gamification] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        response: error.response,
      })
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

  /**
   * Update leaderboard visibility for a user
   * @param {string} userId - User ID
   * @param {boolean} visible - Whether to show in leaderboard
   * @returns {Promise<Object>} Updated points record
   */
  async updateLeaderboardVisibility(userId, visible) {
    try {
      const userPoints = await this.getUserPoints(userId)
      const updated = await pb.collection('gamification_points').update(userPoints.id, {
        leaderboard_visible: visible,
      })
      console.log('🎮 [Gamification] Leaderboard visibility updated:', { userId, visible })
      return updated
    } catch (error) {
      console.error('❌ [Gamification] Error updating leaderboard visibility:', error)
      throw error
    }
  }

  /**
   * Get team leaderboard
   * @param {Object} options - Options { limit }
   * @returns {Promise<Array>} Team leaderboard data
   */
  async getTeamLeaderboard({ limit = 10 } = {}) {
    try {
      // Get all teams
      const teams = await pb.collection('teams').getFullList({
        expand: 'owner_id',
      })

      // Get all team members with their points
      const teamsWithPoints = await Promise.all(
        teams.map(async (team) => {
          try {
            // Get all members of this team
            const members = await pb.collection('team_members').getFullList({
              filter: `team_id = "${team.id}"`,
              expand: 'user_id',
            })

            // Get points for each member
            let totalPoints = 0
            let totalEarned = 0
            let memberCount = 0
            let visibleMembers = []

            for (const member of members) {
              try {
                const memberPoints = await pb.collection('gamification_points').getFullList({
                  filter: `user_id = "${member.user_id}"`,
                })

                if (memberPoints.length > 0) {
                  const points = memberPoints[0]
                  totalPoints += points.points || 0
                  totalEarned += points.total_earned || 0
                  memberCount++
                  visibleMembers.push({
                    userId: member.user_id,
                    userName: member.expand?.user_id?.name || 'Unknown',
                    points: points.points || 0,
                    level: points.level || 1,
                  })
                }
              } catch (e) {
                console.error('Error getting member points:', e)
              }
            }

            return {
              teamId: team.id,
              teamName: team.name,
              ownerName: team.expand?.owner_id?.name || 'Unknown',
              totalPoints,
              totalEarned,
              memberCount,
              averagePoints: memberCount > 0 ? Math.round(totalPoints / memberCount) : 0,
              members: visibleMembers,
            }
          } catch (e) {
            console.error('Error processing team:', e)
            return null
          }
        })
      )

      // Filter out null values and sort by total earned points
      const validTeams = teamsWithPoints
        .filter(team => team !== null && team.memberCount > 0)
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, limit)

      // Add ranking
      return validTeams.map((team, index) => ({
        ...team,
        rank: index + 1,
      }))
    } catch (error) {
      console.error('Error getting team leaderboard:', error)
      return []
    }
  }

  // ========== TEAM REWARDS ==========

  /**
   * Create a team reward (team leader only)
   * @param {string} teamId - Team ID
   * @param {Object} rewardData - Reward data { name, description, points }
   * @returns {Promise<Object>} Created reward
   */
  async createTeamReward(teamId, rewardData) {
    console.log('🎁 [TeamRewards] Creating reward:', { teamId, rewardData })
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // Check if user is team leader
      console.log('🎁 [TeamRewards] Checking team ownership for user:', user.id)
      const membership = await pb.collection('team_members').getFullList({
        filter: `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`,
      })

      console.log('🎁 [TeamRewards] Membership check result:', membership)
      if (membership.length === 0) {
        throw new Error('Only team leaders can create rewards')
      }

      console.log('🎁 [TeamRewards] Creating reward in database...')
      const reward = await pb.collection('team_rewards').create({
        team_id: teamId,
        name: rewardData.name,
        description: rewardData.description || '',
        points: rewardData.points,
        start_date: rewardData.start_date || null,
        end_date: rewardData.end_date || null,
        created_by: user.id,
      })

      console.log('🎁 [TeamRewards] Reward created successfully:', reward)
      return reward
    } catch (error) {
      console.error('❌ [TeamRewards] Error creating reward:', error)
      console.error('❌ [TeamRewards] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      throw error
    }
  }

  /**
   * Get all rewards for a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} Team rewards
   */
  async getTeamRewards(teamId) {
    console.log('🎁 [TeamRewards] Fetching rewards for team:', teamId)
    try {
      // Sort by created_at (custom field) instead of created (system field)
      const rewards = await pb.collection('team_rewards').getFullList({
        filter: `team_id = "${teamId}"`,
        sort: '-created_at',
      })
      console.log('🎁 [TeamRewards] Rewards fetched:', rewards.length, 'rewards found')
      console.log('🎁 [TeamRewards] Rewards data:', rewards)
      return rewards
    } catch (error) {
      console.error('❌ [TeamRewards] Error getting rewards:', error)
      console.error('❌ [TeamRewards] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      return []
    }
  }

  /**
   * Delete a team reward (team leader only)
   * @param {string} teamId - Team ID
   * @param {string} rewardId - Reward ID
   * @returns {Promise<void>}
   */
  /**
   * Update a team reward (team leader only)
   * @param {string} teamId - Team ID
   * @param {string} rewardId - Reward ID to update
   * @param {Object} rewardData - Updated reward data
   * @returns {Promise<Object>} Updated reward
   */
  async updateTeamReward(teamId, rewardId, rewardData) {
    console.log('🎁 [TeamRewards] Updating reward:', { teamId, rewardId, rewardData })
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // Check if user is team leader
      const membership = await pb.collection('team_members').getFullList({
        filter: `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`,
      })

      if (membership.length === 0) {
        throw new Error('Only team leaders can update rewards')
      }

      const updated = await pb.collection('team_rewards').update(rewardId, {
        name: rewardData.name,
        description: rewardData.description || '',
        points: rewardData.points,
        start_date: rewardData.start_date || '',
        end_date: rewardData.end_date || '',
      })

      console.log('🎁 [TeamRewards] Reward updated successfully:', updated)
      return updated
    } catch (error) {
      console.error('❌ [TeamRewards] Error updating reward:', error)
      throw error
    }
  }

  async deleteTeamReward(teamId, rewardId) {
    console.log('🎁 [TeamRewards] Deleting reward:', { teamId, rewardId })
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // Check if user is team leader
      console.log('🎁 [TeamRewards] Checking team ownership for user:', user.id)
      const membership = await pb.collection('team_members').getFullList({
        filter: `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`,
      })

      console.log('🎁 [TeamRewards] Membership check result:', membership)
      if (membership.length === 0) {
        throw new Error('Only team leaders can delete rewards')
      }

      console.log('🎁 [TeamRewards] Deleting reward from database...')
      await pb.collection('team_rewards').delete(rewardId)

      console.log('🎁 [TeamRewards] Reward deleted successfully')
    } catch (error) {
      console.error('❌ [TeamRewards] Error deleting reward:', error)
      console.error('❌ [TeamRewards] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      throw error
    }
  }

  /**
   * Award a team reward to a member (team leader only)
   * @param {string} teamId - Team ID
   * @param {string} rewardId - Reward ID
   * @param {string} memberId - User ID of the member
   * @param {string} reason - Reason for the reward
   * @returns {Promise<Object>} Award result
   */
  async awardTeamReward(teamId, rewardId, memberId, reason = '') {
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // Check if user is team leader
      const membership = await pb.collection('team_members').getFullList({
        filter: `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`,
      })

      if (membership.length === 0) {
        throw new Error('Only team leaders can award rewards')
      }

      // Get reward details
      const reward = await pb.collection('team_rewards').getOne(rewardId)

      // Award points to the member
      const result = await this.awardPoints(memberId, 'team_reward', reward.points, {
        description: `Récompense d'équipe: ${reward.name}${reason ? ' - ' + reason : ''}`,
        rewardId: reward.id,
      })

      // Record the award
      await pb.collection('team_reward_history').create({
        team_id: teamId,
        reward_id: rewardId,
        member_id: memberId,
        awarded_by: user.id,
        points: reward.points,
        reason: reason,
      })

      return result
    } catch (error) {
      console.error('Error awarding team reward:', error)
      throw error
    }
  }

  /**
   * Get team reward history
   * @param {string} teamId - Team ID
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Reward history
   */
  async getTeamRewardHistory(teamId, limit = 50) {
    try {
      const history = await pb.collection('team_reward_history').getList(1, limit, {
        filter: `team_id = "${teamId}"`,
        sort: '-created_at',
        expand: 'reward_id,member_id,awarded_by',
      })

      return history.items.map(item => ({
        id: item.id,
        rewardName: item.expand?.reward_id?.name || 'Unknown',
        memberName: item.expand?.member_id?.name || 'Unknown',
        awardedByName: item.expand?.awarded_by?.name || 'Unknown',
        points: item.points,
        reason: item.reason,
        date: item.created,
      }))
    } catch (error) {
      console.error('Error getting team reward history:', error)
      return []
    }
  }

  // ========== CHALLENGES ==========

  /**
   * Get all challenges for a team
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} Team challenges
   */
  async getTeamChallenges(teamId) {
    console.log('🎯 [Challenges] Fetching challenges for team:', teamId)
    try {
      const challenges = await pb.collection('challenges').getFullList({
        filter: `team_id = "${teamId}"`,
        sort: '-created_at',
      })
      console.log('🎯 [Challenges] Team challenges fetched:', challenges.length, 'challenges found')
      return challenges
    } catch (error) {
      console.error('❌ [Challenges] Error getting team challenges:', error)
      return []
    }
  }

  /**
   * Create a challenge (team leader or admin only)
   * @param {Object} challengeData - Challenge data
   * @param {string} teamId - Team ID (optional, null for global challenges)
   * @returns {Promise<Object>} Created challenge
   */
  async createChallenge(challengeData, teamId = null) {
    console.log('✨ NEW CODE ✨ Creating challenge:', { challengeData, teamId })
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      console.log('🔍 User:', { userId: user.id, email: user.email })

      // Check team ownership
      if (teamId) {
        console.log('🔍 Checking membership for:', { teamId, userId: user.id })
        const filter = `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`
        console.log('🔍 Filter query:', filter)

        const membership = await pb.collection('team_members').getFullList({
          filter: filter,
        })

        console.log('🔍 Membership result:', membership)
        console.log('🔍 Membership count:', membership.length)

        if (membership.length === 0) {
          // Try without role filter to see if membership exists at all
          const anyMembership = await pb.collection('team_members').getFullList({
            filter: `team_id = "${teamId}" && user_id = "${user.id}"`,
          })
          console.log('🔍 Any membership (without role filter):', anyMembership)
          throw new Error('Only team leaders can create team challenges')
        }
      }

      // STEP 1: Create challenge WITHOUT relations (to avoid PocketBase issues)
      console.log('STEP 1: Creating challenge without relations...')
      const challenge = await pb.collection('challenges').create({
        title: challengeData.title,
        description: challengeData.description || '',
        type: challengeData.type,
        goal_metric: challengeData.goal_metric,
        goal_value: challengeData.goal_value,
        points_reward: challengeData.points_reward,
        icon: challengeData.icon || 'Target',
        is_active: true,
        start_date: challengeData.start_date,
        end_date: challengeData.end_date,
      })
      console.log('✅ Challenge created:', challenge.id)

      // STEP 2: Immediately update with relations
      console.log('STEP 2: Updating with team_id and created_by...')
      const updated = await pb.collection('challenges').update(challenge.id, {
        team_id: teamId,
        created_by: user.id
      })
      console.log('✅ Relations added:', { team_id: updated.team_id, created_by: updated.created_by })

      return updated
    } catch (error) {
      console.error('❌ [Challenges] Error creating challenge:', error)
      console.error('❌ [Challenges] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data
      })
      throw error
    }
  }

  /**
   * Update a challenge (creator or team leader only)
   * @param {string} challengeId - Challenge ID to update
   * @param {Object} challengeData - Updated challenge data
   * @param {string} teamId - Team ID (optional, for team leader validation)
   * @returns {Promise<Object>} Updated challenge
   */
  async updateChallenge(challengeId, challengeData, teamId = null) {
    console.log('🎯 [Challenges] Updating challenge:', { challengeId, challengeData, teamId })
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // If teamId provided, check if user is team leader
      if (teamId) {
        const membership = await pb.collection('team_members').getFullList({
          filter: `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`,
        })

        if (membership.length === 0) {
          throw new Error('Only team leaders can update team challenges')
        }
      }

      const updated = await pb.collection('challenges').update(challengeId, {
        title: challengeData.title,
        description: challengeData.description || '',
        type: challengeData.type,
        goal_metric: challengeData.goal_metric,
        goal_value: challengeData.goal_value,
        points_reward: challengeData.points_reward,
        icon: challengeData.icon || 'Target',
        start_date: challengeData.start_date,
        end_date: challengeData.end_date,
      })

      console.log('🎯 [Challenges] Challenge updated successfully:', updated)
      return updated
    } catch (error) {
      console.error('❌ [Challenges] Error updating challenge:', error)
      throw error
    }
  }

  /**
   * Delete a challenge (creator or team leader only)
   * @param {string} challengeId - Challenge ID to delete
   * @param {string} teamId - Team ID (optional, for team leader validation)
   * @returns {Promise<void>}
   */
  async deleteChallenge(challengeId, teamId = null) {
    console.log('🎯 [Challenges] Deleting challenge:', { challengeId, teamId })
    try {
      const user = pb.authStore.model
      if (!user) throw new Error('Not authenticated')

      // If teamId provided, check if user is team leader
      if (teamId) {
        const membership = await pb.collection('team_members').getFullList({
          filter: `team_id = "${teamId}" && user_id = "${user.id}" && role = "owner"`,
        })

        if (membership.length === 0) {
          throw new Error('Only team leaders can delete team challenges')
        }
      }

      await pb.collection('challenges').delete(challengeId)
      console.log('🎯 [Challenges] Challenge deleted successfully')
    } catch (error) {
      console.error('❌ [Challenges] Error deleting challenge:', error)
      throw error
    }
  }

  /**
   * Get all active challenges
   * @returns {Promise<Array>} Active challenges
   */
  async getActiveChallenges(userId = null) {
    try {
      const now = new Date().toISOString()
      let filter = `is_active = true && start_date <= "${now}" && end_date >= "${now}"`

      // If userId provided, filter to include global challenges + user's team challenges
      if (userId) {
        // Get user's teams
        const teamMemberships = await pb.collection('team_members').getFullList({
          filter: `user_id = "${userId}"`,
        })
        const teamIds = teamMemberships.map(tm => tm.team_id)

        if (teamIds.length > 0) {
          // Include global challenges (team_id = null or empty) OR challenges from user's teams
          const teamFilter = teamIds.map(id => `team_id = "${id}"`).join(' || ')
          filter += ` && (team_id = null || team_id = "" || ${teamFilter})`
        } else {
          // User has no teams, only show global challenges
          filter += ` && (team_id = null || team_id = "")`
        }
      }

      return await pb.collection('challenges').getFullList({
        filter: filter,
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
      const activeChallenges = await this.getActiveChallenges(userId)
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
      const result = await this.awardPoints(userId, 'challenge_completed', challenge.points_reward, {
        challengeId: challenge.id,
        description: `Challenge completed: ${challenge.title}`,
      })

      // Mark as claimed
      await pb.collection('user_challenges').update(userChallenge.id, {
        claimed: true,
      })

      return result
    } catch (error) {
      console.error('Error claiming reward:', error)
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
    console.log('🎮 [Gamification] onTaskCompleted called:', { taskId, userId })
    try {
      // Get task details to determine points
      const task = await pb.collection('tasks').getOne(taskId)
      console.log('🎮 [Gamification] Task retrieved:', task)

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

      console.log('🎮 [Gamification] Awarding points:', points)

      // Award points
      const result = await this.awardPoints(userId, 'task_completed', points, {
        taskId,
        description: `Task completed: ${task.title}`,
      })

      console.log('🎮 [Gamification] Points awarded successfully:', result)

      // Update task-based challenges
      await this._updateTaskChallenges(userId)
    } catch (error) {
      console.error('❌ [Gamification] Error in onTaskCompleted:', error)
      console.error('❌ [Gamification] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
      })
    }
  }

  /**
   * Handle daily login
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async onDailyLogin(userId) {
    console.log('🎮 [Gamification] onDailyLogin called:', { userId })
    try {
      const userPoints = await this.getUserPoints(userId)
      console.log('🎮 [Gamification] User points retrieved:', userPoints)

      const lastActivity = new Date(userPoints.last_activity_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      lastActivity.setHours(0, 0, 0, 0)

      console.log('🎮 [Gamification] Date comparison:', {
        lastActivity: lastActivity.toISOString(),
        today: today.toISOString(),
        shouldAward: lastActivity < today,
      })

      // Only award once per day
      if (lastActivity < today) {
        console.log('🎮 [Gamification] Awarding daily login bonus')

        const result = await this.awardPoints(userId, 'daily_login', POINTS_CONFIG.daily_login, {
          description: 'Daily login bonus',
        })

        // Update streak
        console.log('🎮 [Gamification] Updating streak')
        const streakResult = await this.checkAndUpdateStreak(userId)

        // Enroll in new challenges
        console.log('🎮 [Gamification] Enrolling in challenges')
        await this.enrollUserInActiveChallenges(userId)

        console.log('🎮 [Gamification] Daily login completed successfully')

        return {
          ...result,
          streakMaintained: streakResult?.maintained || false,
          streakLost: streakResult?.lost || false
        }
      } else {
        console.log('🎮 [Gamification] Daily login already awarded today')
        return { success: false, alreadyAwarded: true }
      }
    } catch (error) {
      console.error('❌ [Gamification] Error in onDailyLogin:', error)
      console.error('❌ [Gamification] Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
      })
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
      let maintained = false
      let lost = false

      if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak += 1
        maintained = true
      } else if (daysDiff > 1) {
        // Missed a day - reset streak
        newStreak = 1
        lost = userPoints.streak_days > 0
      }
      // daysDiff === 0 means same day, keep streak

      if (newStreak !== userPoints.streak_days) {
        const updated = await pb.collection('gamification_points').update(userPoints.id, {
          streak_days: newStreak,
        })
        return {
          ...updated,
          maintained,
          lost,
          oldStreak: userPoints.streak_days,
          newStreak
        }
      }

      return {
        ...userPoints,
        maintained: false,
        lost: false,
        oldStreak: userPoints.streak_days,
        newStreak
      }
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
      const activeChallenges = await this.getActiveChallenges(userId)
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
