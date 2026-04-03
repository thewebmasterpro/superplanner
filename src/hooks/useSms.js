import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { smsService } from '../services/sms.service'
import toast from 'react-hot-toast'

// ==================== DEVICES ====================

export function useSmsDevices() {
  const queryClient = useQueryClient()

  const devicesQuery = useQuery({
    queryKey: ['sms-devices'],
    queryFn: () => smsService.getDevices()
  })

  const createDevice = useMutation({
    mutationFn: (data) => smsService.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-devices'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Appareil ajouté')
    },
    onError: () => toast.error('Erreur lors de l\'ajout de l\'appareil')
  })

  const updateDevice = useMutation({
    mutationFn: ({ id, ...updates }) => smsService.updateDevice(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-devices'] })
      toast.success('Appareil mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const deleteDevice = useMutation({
    mutationFn: (id) => smsService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-devices'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Appareil supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  return {
    devices: devicesQuery.data || [],
    isLoading: devicesQuery.isLoading,
    createDevice: createDevice.mutate,
    updateDevice: updateDevice.mutate,
    deleteDevice: deleteDevice.mutate,
    isCreating: createDevice.isPending
  }
}

// ==================== MESSAGES ====================

export function useSmsMessages(filters = {}) {
  const queryClient = useQueryClient()

  const messagesQuery = useQuery({
    queryKey: ['sms-messages', filters],
    queryFn: () => smsService.getMessages(filters)
  })

  const sendMessage = useMutation({
    mutationFn: (data) => smsService.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] })
      queryClient.invalidateQueries({ queryKey: ['sms-conversations'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Message envoyé')
    },
    onError: () => toast.error('Erreur lors de l\'envoi')
  })

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending
  }
}

export function useSmsConversations() {
  return useQuery({
    queryKey: ['sms-conversations'],
    queryFn: () => smsService.getConversations()
  })
}

export function useSmsConversation(phone) {
  return useQuery({
    queryKey: ['sms-conversation', phone],
    queryFn: () => smsService.getConversation(phone),
    enabled: !!phone
  })
}

// ==================== CAMPAIGNS ====================

export function useSmsCampaigns(filters = {}) {
  const queryClient = useQueryClient()

  const campaignsQuery = useQuery({
    queryKey: ['sms-campaigns', filters],
    queryFn: () => smsService.getCampaigns(filters)
  })

  const createCampaign = useMutation({
    mutationFn: (data) => smsService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Campagne créée')
    },
    onError: () => toast.error('Erreur lors de la création')
  })

  const updateCampaign = useMutation({
    mutationFn: ({ id, ...updates }) => smsService.updateCampaign(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] })
      toast.success('Campagne mise à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const deleteCampaign = useMutation({
    mutationFn: (id) => smsService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Campagne supprimée')
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const launchCampaign = useMutation({
    mutationFn: (id) => smsService.launchCampaign(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['sms-messages'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success(`Campagne envoyée à ${result.sent} destinataires`)
    },
    onError: (error) => toast.error(error.message || 'Erreur lors de l\'envoi')
  })

  return {
    campaigns: campaignsQuery.data || [],
    isLoading: campaignsQuery.isLoading,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
    launchCampaign: launchCampaign.mutate,
    isCreating: createCampaign.isPending,
    isLaunching: launchCampaign.isPending
  }
}

// ==================== GROUPS ====================

export function useSmsGroups() {
  const queryClient = useQueryClient()

  const groupsQuery = useQuery({
    queryKey: ['sms-groups'],
    queryFn: () => smsService.getGroups()
  })

  const createGroup = useMutation({
    mutationFn: (data) => smsService.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-groups'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Groupe créé')
    },
    onError: () => toast.error('Erreur lors de la création du groupe')
  })

  const updateGroup = useMutation({
    mutationFn: ({ id, ...updates }) => smsService.updateGroup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-groups'] })
      toast.success('Groupe mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const deleteGroup = useMutation({
    mutationFn: (id) => smsService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-groups'] })
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] })
      toast.success('Groupe supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  return {
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    createGroup: createGroup.mutate,
    updateGroup: updateGroup.mutate,
    deleteGroup: deleteGroup.mutate,
    isCreating: createGroup.isPending
  }
}

export function useSmsGroupMembers(groupId) {
  const queryClient = useQueryClient()

  const membersQuery = useQuery({
    queryKey: ['sms-group-members', groupId],
    queryFn: () => smsService.getGroupMembers(groupId),
    enabled: !!groupId
  })

  const addMember = useMutation({
    mutationFn: (data) => smsService.addGroupMember(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['sms-groups'] })
      toast.success('Membre ajouté')
    },
    onError: () => toast.error('Erreur lors de l\'ajout')
  })

  const removeMember = useMutation({
    mutationFn: (memberId) => smsService.removeGroupMember(memberId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['sms-groups'] })
      toast.success('Membre retiré')
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  const importMembers = useMutation({
    mutationFn: (members) => smsService.importGroupMembers(groupId, members),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sms-group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['sms-groups'] })
      toast.success(`${result.imported} contacts importés`)
    },
    onError: () => toast.error('Erreur lors de l\'import')
  })

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    addMember: addMember.mutate,
    removeMember: removeMember.mutate,
    importMembers: importMembers.mutate,
    isImporting: importMembers.isPending
  }
}

// ==================== TEMPLATES ====================

export function useSmsTemplates() {
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({
    queryKey: ['sms-templates'],
    queryFn: () => smsService.getTemplates()
  })

  const createTemplate = useMutation({
    mutationFn: (data) => smsService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Template créé')
    },
    onError: () => toast.error('Erreur lors de la création')
  })

  const updateTemplate = useMutation({
    mutationFn: ({ id, ...updates }) => smsService.updateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Template mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour')
  })

  const deleteTemplate = useMutation({
    mutationFn: (id) => smsService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast.success('Template supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression')
  })

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending
  }
}

// ==================== STATS ====================

export function useSmsStats() {
  return useQuery({
    queryKey: ['sms-stats'],
    queryFn: () => smsService.getDashboardStats(),
    refetchInterval: 30000 // Refresh every 30s
  })
}
