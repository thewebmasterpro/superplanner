/**
 * Teams Service
 *
 * Centralized service for team operations.
 * Manages teams, members, and invitations.
 *
 * @module services/teams.service
 */

import pb from '../lib/pocketbase'
import { escapeFilterValue } from '../lib/filterUtils'

class TeamsService {
    /**
     * Get all team memberships for current user
     * @returns {Promise<Array>}
     */
    async MyMemberships() {
        const user = pb.authStore.model
        if (!user) return []

        return await pb.collection('team_members').getFullList({
            filter: `user_id = "${user.id}"`,
            expand: 'team_id'
        })
    }

    /**
     * Get pending invitations for the current user
     * @returns {Promise<Array>}
     */
    async getReceivedInvitations() {
        const user = pb.authStore.model
        if (!user) return []

        return await pb.collection('team_invitations').getFullList({
            filter: `email = "${user.email}" && status = "pending"`,
            expand: 'team_id'
        })
    }

    /**
     * Accept an invitation
     * @param {string} inviteId 
     * @param {string} teamId 
     */
    async acceptInvitation(inviteId, teamId) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        // 1. Create team member
        try {
            await pb.collection('team_members').create({
                team_id: teamId,
                user_id: user.id,
                role: 'member'
            })
        } catch (e) {
            // If already member, maybe just delete invite
            console.warn('Already member?', e)
        }

        // 2. Delete invitation
        await pb.collection('team_invitations').delete(inviteId)
    }

    /**
     * Get members of a specific team (or teams if array passed)
     * @param {string|string[]} teamIdOrIds
     * @returns {Promise<Array>}
     */
    async getTeamMembers(teamIdOrIds) {
        if (!teamIdOrIds) return []
        if (Array.isArray(teamIdOrIds)) {
            if (teamIdOrIds.length === 0) return []
            const filter = teamIdOrIds.map(id => `team_id = "${id}"`).join(' || ')
            return await pb.collection('team_members').getFullList({
                filter: `(${filter})`,
                expand: 'user_id'
            })
        } else {
            const escapedId = escapeFilterValue(teamIdOrIds)
            return await pb.collection('team_members').getFullList({
                filter: `team_id = "${escapedId}"`,
                expand: 'user_id'
            })
        }
    }

    /**
     * Get pending invitations involved with a team (sent)
     * @param {string} teamId 
     * @returns {Promise<Array>}
     */
    async getTeamInvitations(teamId) {
        const escapedId = escapeFilterValue(teamId)
        return await pb.collection('team_invitations').getFullList({
            filter: `team_id = "${escapedId}" && status = "pending"`
        })
    }

    /**
     * Create a new team
     * @param {string} name 
     * @returns {Promise<Object>} Created team
     */
    async createTeam(name) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        const team = await pb.collection('teams').create({
            name: name,
            owner_id: user.id
        })

        // Add owner as member
        await pb.collection('team_members').create({
            team_id: team.id,
            user_id: user.id,
            role: 'owner'
        })

        return team
    }

    /**
     * Invite a user to a team
     * @param {string} teamId 
     * @param {string} email 
     */
    async inviteMember(teamId, email) {
        const user = pb.authStore.model
        if (!user) throw new Error('Not authenticated')

        return await pb.collection('team_invitations').create({
            team_id: teamId,
            email: email,
            status: 'pending',
            invited_by: user.id
        })
    }

    /**
     * Remove a member from team
     * @param {string} memberId 
     */
    async removeMember(memberId) {
        return await pb.collection('team_members').delete(memberId)
    }

    /**
     * Delete a team
     * @param {string} teamId 
     */
    async deleteTeam(teamId) {
        return await pb.collection('teams').delete(teamId)
    }

    /**
     * Get all users (for assignment)
     * @returns {Promise<Array>}
     */
    async getAllUsers() {
        return await pb.collection('users').getFullList({
            sort: 'name'
        })
    }
}

export const teamsService = new TeamsService()
