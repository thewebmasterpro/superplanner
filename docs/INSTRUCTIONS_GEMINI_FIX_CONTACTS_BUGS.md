# Instructions Gemini - Correction Bugs Contacts

**Date:** 2026-01-30
**Bugs à corriger:** 2 bugs dans la page Contacts
**Priorité:** HAUTE (fonctionnalité cassée)

---

## 🔴 BUG #1: Drag & Drop - activeStatus undefined

### Problème Identifié

Dans les logs console:
```
PipelineBoard.jsx:68 Drag End Debug: {
  activeId: 'ok7qecy63f29orz',
  overId: 'prospect_interested',
  activeStatus: undefined,  // ← PROBLÈME ICI!
  newStatus: 'prospect_interested',
  isValid: true
}
```

**Cause:** Le statut actuel (`activeStatus`) est `undefined` car `active.data.current` ne contient pas le contact correctement.

### Analyse du Code

**PipelineBoard.jsx ligne 56-71:**
```js
const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeContactData = active.data.current  // ← active.data.current est undefined
    const overData = over.data.current

    let newStatus = over.id

    // If dropping over another card, get its status
    if (overData && overData.type === 'contact') {
        newStatus = overData.contact.status
    }

    console.log('Drag End Debug:', {
        activeId: active.id,
        overId: over.id,
        activeStatus: activeContactData?.contact?.status,  // ← undefined
        newStatus,
        isValid: validStatuses.includes(newStatus)
    })

    // Cette ligne ÉCHOUE car activeContactData.contact est undefined
    if (activeContactData.contact.status !== newStatus && validStatuses.includes(newStatus)) {
        onStatusChange(active.id, newStatus)
    }
}
```

**PipelineCard.jsx ligne 26-33:**
```js
const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
} = useSortable({
    id: contact.id,
    data: {
        type: 'contact',
        contact: contact  // ← Le contact est bien passé ici
    },
    disabled: isOverlay
})
```

**Le contact est bien passé dans `useSortable`**, mais `active.data.current` ne le récupère pas.

---

### Solution

Le problème est que la condition `activeContactData.contact.status !== newStatus` échoue silencieusement car `activeContactData` est undefined.

**Fix dans PipelineBoard.jsx ligne 50-79:**

```js
const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeContactData = active.data.current
    const overData = over.data.current

    let newStatus = over.id

    // If dropping over another card, get its status
    if (overData && overData.type === 'contact') {
        newStatus = overData.contact.status
    }

    const validStatuses = COLUMNS.map(c => c.id)

    console.log('Drag End Debug:', {
        activeId: active.id,
        overId: over.id,
        activeContactData,
        activeStatus: activeContactData?.contact?.status,
        newStatus,
        isValid: validStatuses.includes(newStatus)
    })

    // FIX: Récupérer le contact actuel depuis la liste au lieu de active.data
    const activeContact = contacts.find(c => c.id === active.id)

    if (!activeContact) {
        console.error('❌ Active contact not found:', active.id)
        return
    }

    const currentStatus = activeContact.status || 'prospect_new'

    // Vérifier si le statut a changé
    if (currentStatus !== newStatus && validStatuses.includes(newStatus)) {
        console.log('✅ Status change:', currentStatus, '→', newStatus)
        onStatusChange(active.id, newStatus)
    } else {
        console.log('⚠️ No status change needed:', { currentStatus, newStatus })
    }
}
```

**Changements:**
1. ✅ Récupérer `activeContact` depuis la liste `contacts` au lieu de `active.data.current`
2. ✅ Gérer le cas où `status` est undefined (default à 'prospect_new')
3. ✅ Ajouter logs pour debug
4. ✅ Vérifier que le contact existe avant d'update

---

## 🔴 BUG #2: Statut ne persiste pas depuis ContactModal

### Problème Identifié

**Symptôme:** L'utilisateur change le statut dans le ContactModal, ferme, réouvre → le statut est revenu à l'ancien.

**Dans les logs:**
```
contacts.service.js:135 Sending update to PB: ok7qecy63f29orz {
  name: 'Anouar Asrih',
  email: 'asrihanouar@gmail.com',
  phone: '+32491348143',
  company: 'BE0872230730',
  status: 'prospect_interested',  // ← Le statut EST dans l'update
  ...
}
contacts.service.js:137 PB update response: {...}  // ← L'update PB réussit
```

**Donc l'update vers PocketBase MARCHE**, mais le problème est ailleurs.

### Analyse du Code

**ContactModal.jsx ligne 84-108:**
```js
useEffect(() => {
    if (contact) {
        setFormData({
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            status: contact.status || 'prospect_new',  // ← Charge le statut
            type: contact.type || 'individual',
            notes: contact.notes || '',
            workspaceIds: contact.contact_contexts?.map(cc => cc.context?.id).filter(Boolean) || []
        })
    } else {
        setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
            status: 'prospect_new',
            type: 'individual',
            notes: '',
            workspaceIds: []
        })
    }
}, [contact, open])  // ← Dépend de `contact` et `open`
```

**ContactModal.jsx ligne 110-122:**
```js
const handleSubmit = (e) => {
    e.preventDefault()

    if (isEditing) {
        updateContact({ id: contact.id, ...formData, contextIds: formData.workspaceIds }, {
            onSuccess: () => onOpenChange(false)
        })
    } else {
        createContact({ ...formData, contextIds: formData.workspaceIds }, {
            onSuccess: () => onOpenChange(false)
        })
    }
}
```

**Le problème:** Le `status` est bien envoyé dans `formData`, mais il semble que React Query ne rafraîchit pas les données après l'update.

---

### Solution

Le problème est probablement dans `useContacts` hook - il ne rafraîchit pas après update.

**Fix 1: Vérifier que l'invalidation de cache fonctionne**

**Fichier:** `src/hooks/useContacts.js`

Chercher `updateContact` mutation et vérifier qu'elle invalide le cache:

```js
export function useUpdateContact() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            return await contactsService.update(id, updates)
        },
        onSuccess: () => {
            // IMPORTANT: Invalider le cache pour recharger
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Contact updated')
        },
        onError: (error) => {
            console.error('Error updating contact:', error)
            toast.error('Failed to update contact')
        }
    })
}
```

**Fix 2: Forcer le refresh dans ContactModal**

Si l'invalidation ne suffit pas, forcer le refresh:

**ContactModal.jsx ligne 110-122:**
```js
const handleSubmit = (e) => {
    e.preventDefault()

    if (isEditing) {
        updateContact({ id: contact.id, ...formData, contextIds: formData.workspaceIds }, {
            onSuccess: () => {
                // Fermer le modal
                onOpenChange(false)

                // Forcer un petit délai pour laisser React Query refresh
                setTimeout(() => {
                    console.log('✅ Contact updated successfully')
                }, 100)
            }
        })
    } else {
        createContact({ ...formData, contextIds: formData.workspaceIds }, {
            onSuccess: () => onOpenChange(false)
        })
    }
}
```

**Fix 3: Vérifier contacts.service.js update()**

**Fichier:** `src/services/contacts.service.js`

Vérifier que la méthode `update()` retourne bien l'objet complet:

```js
async update(contactId, updates) {
    const user = pb.authStore.model
    if (!user) throw new Error('Not authenticated')

    // Verify ownership
    const existing = await this.getOne(contactId)
    if (existing.user_id !== user.id) {
        throw new Error('Unauthorized')
    }

    const sanitized = this._sanitize(updates)

    console.log('Sending update to PB:', contactId, sanitized)

    const updated = await pb.collection('contacts').update(contactId, sanitized)

    console.log('PB update response:', updated)

    // IMPORTANT: Retourner l'objet mis à jour
    return updated
}
```

---

## 📋 Checklist de Correction

### Bug #1: Drag & Drop
- [ ] Ouvrir `src/components/PipelineBoard.jsx`
- [ ] Modifier la fonction `handleDragEnd` (lignes 50-79)
- [ ] Remplacer `activeContactData.contact.status` par lookup dans `contacts`
- [ ] Ajouter logs de debug
- [ ] Tester: Drag & drop doit fonctionner

### Bug #2: Statut ne persiste pas
- [ ] Ouvrir `src/hooks/useContacts.js`
- [ ] Vérifier `useUpdateContact` a `invalidateQueries`
- [ ] Si manquant, ajouter l'invalidation
- [ ] Ouvrir `src/services/contacts.service.js`
- [ ] Vérifier que `update()` retourne l'objet mis à jour
- [ ] Tester: Changer statut dans modal → Fermer → Rouvrir → Statut persiste

---

## 🧪 Tests à Effectuer

### Test Bug #1:
1. Aller sur page Contacts
2. Passer en mode Pipeline
3. Drag & drop un contact vers une autre colonne
4. Vérifier dans console: `activeStatus` n'est plus undefined
5. Vérifier: Le contact change de colonne
6. Vérifier: L'update PB se fait correctement

### Test Bug #2:
1. Cliquer sur un contact
2. Changer le statut (ex: New Prospect → Interested)
3. Cliquer Save
4. Fermer le modal
5. Réouvrir le même contact
6. Vérifier: Le statut est bien "Interested"

---

## 📊 Logs Attendus Après Fix

### Drag & Drop:
```
Drag End Debug: {
  activeId: 'ok7qecy63f29orz',
  overId: 'prospect_interested',
  activeStatus: 'prospect_new',  // ← Plus undefined!
  newStatus: 'prospect_interested',
  isValid: true
}
✅ Status change: prospect_new → prospect_interested
contacts.service.js: Sending update to PB: ok7qecy63f29orz {status: 'prospect_interested'}
contacts.service.js: PB update response: {...}
```

### Update depuis Modal:
```
ContactModal: Submitting update with status: prospect_interested
contacts.service.js: Sending update to PB: ok7qecy63f29orz {..., status: 'prospect_interested'}
contacts.service.js: PB update response: {..., status: 'prospect_interested'}
useContacts: Invalidating cache
useContacts: Refetching contacts
✅ Contact updated successfully
```

---

## ⚠️ Points d'Attention

### Pour Bug #1:
- Ne pas casser le drag & drop sur les colonnes (zones de drop)
- Garder la fonctionnalité de drop sur une autre card
- Vérifier que tous les statuts valides sont supportés

### Pour Bug #2:
- Vérifier que l'invalidation ne cause pas de boucles infinies
- S'assurer que les autres champs (nom, email, etc.) se sauvegardent toujours
- Tester avec plusieurs contacts pour vérifier que le bon est mis à jour

---

## 🚀 Instructions pour Gemini

### Ordre de Correction:

1. **Commencer par Bug #1 (Drag & Drop):**
   - C'est le plus visible
   - Fix rapide (5-10 lignes)
   - Test immédiat

2. **Ensuite Bug #2 (Persistance):**
   - Vérifier useContacts.js d'abord
   - Puis contacts.service.js
   - Tester minutieusement

3. **Tests finaux:**
   - Tester les 2 bugs ensemble
   - S'assurer qu'aucune régression

---

## 💬 Rapport Attendu

Après correction, rapporte:

```
✅ Bug #1 (Drag & Drop) - CORRIGÉ
Fichier: PipelineBoard.jsx
Changements: Récupération activeContact depuis liste contacts
Tests: ✅ Drag & drop fonctionne
Logs: activeStatus n'est plus undefined

✅ Bug #2 (Persistance statut) - CORRIGÉ
Fichiers: useContacts.js, contacts.service.js
Changements: [Décrire les changements]
Tests: ✅ Statut persiste après fermeture modal
```

---

**Bon courage Gemini! Ces bugs sont bien identifiés et les fixes sont clairs.** 🚀
