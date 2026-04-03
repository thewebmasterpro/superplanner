# PocketBase SMS Hub Setup (TextLink Clone)

## Collections à créer

### 1. `sms_devices` - Appareils SMS (Android)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| user_id | relation (users) | Oui | Propriétaire |
| name | text | Oui | Nom de l'appareil |
| phone_number | text | Oui | Numéro de téléphone |
| model | text | Non | Modèle (ex: Android 14) |
| api_key | text | Non | Clé API pour authentification |
| status | select (active, offline, disabled) | Oui | Statut de l'appareil |

**API Rules:**
- List/Search: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

---

### 2. `sms_messages` - Messages SMS

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| user_id | relation (users) | Oui | Propriétaire |
| recipient | text | Oui | Numéro du destinataire |
| contact_name | text | Non | Nom du contact |
| body | text | Oui | Contenu du message |
| direction | select (inbound, outbound) | Oui | Direction |
| status | select (pending, sent, delivered, failed) | Oui | Statut |
| read | bool | Non | Lu (pour messages entrants) |
| campaign_id | relation (sms_campaigns) | Non | Campagne associée |
| device_id | relation (sms_devices) | Non | Appareil utilisé |
| sent_at | date | Non | Date d'envoi |

**API Rules:**
- List/Search: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

---

### 3. `sms_campaigns` - Campagnes SMS

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| user_id | relation (users) | Oui | Propriétaire |
| name | text | Oui | Nom de la campagne |
| message | text | Oui | Corps du message (supporte {{name}}, {{phone}}, {{email}}) |
| group_id | relation (sms_groups) | Non | Groupe de destinataires |
| device_id | relation (sms_devices) | Non | Appareil d'envoi |
| status | select (draft, scheduled, sent, failed) | Oui | Statut |
| scheduled_at | date | Non | Date programmée |
| sent_at | date | Non | Date d'envoi effectif |
| sent_count | number | Non | Nombre envoyés |
| delivered_count | number | Non | Nombre délivrés |
| failed_count | number | Non | Nombre échoués |

**API Rules:**
- List/Search: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

---

### 4. `sms_groups` - Groupes de contacts

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| user_id | relation (users) | Oui | Propriétaire |
| name | text | Oui | Nom du groupe |
| description | text | Non | Description |
| member_count | number | Non | Nombre de membres (auto-calculé) |

**API Rules:**
- List/Search: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

---

### 5. `sms_group_members` - Membres des groupes

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| group_id | relation (sms_groups) | Oui | Groupe parent |
| name | text | Non | Nom du contact |
| phone | text | Oui | Numéro de téléphone |
| email | text | Non | Email |

**API Rules:**
- List/Search: `@request.auth.id != ""` (filtrage côté service via group_id)
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

---

### 6. `sms_templates` - Templates de messages

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| user_id | relation (users) | Oui | Propriétaire |
| name | text | Oui | Nom du template |
| body | text | Oui | Corps du message |
| category | text | Non | Catégorie (Marketing, Support, etc.) |

**API Rules:**
- List/Search: `@request.auth.id = user_id`
- View: `@request.auth.id = user_id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user_id`
- Delete: `@request.auth.id = user_id`

---

## Variables de personnalisation

Dans les messages et templates, les variables suivantes sont remplacées automatiquement :

| Variable | Description |
|----------|-------------|
| `{{name}}` | Nom du contact/membre |
| `{{phone}}` | Numéro de téléphone |
| `{{email}}` | Adresse email |

---

## Architecture

```
src/
├── services/sms.service.js          # Service central SMS
├── hooks/useSms.js                   # Hooks React Query
├── pages/v3/SmsPageV3.jsx            # Page wrapper
└── components/sms/
    ├── SmsHub.jsx                    # Hub principal avec onglets
    ├── SmsDashboard.jsx              # Tableau de bord & stats
    ├── SmsCampaignsList.jsx          # Liste des campagnes
    ├── SmsCampaignModal.jsx          # Création/édition campagne
    ├── SmsChat.jsx                   # Interface de chat SMS
    ├── SmsGroupsList.jsx             # Gestion des groupes + import CSV
    ├── SmsDevicesList.jsx            # Liste des appareils
    ├── SmsDeviceModal.jsx            # Ajout/édition appareil
    └── SmsTemplatesList.jsx          # Templates de messages
```

## Fonctionnalités

- **Gestion d'appareils** : Enregistrer des appareils Android comme passerelles SMS
- **Campagnes SMS** : Créer et envoyer des campagnes en masse avec personnalisation
- **Chat SMS** : Interface web pour conversations 1-à-1
- **Groupes de contacts** : Organisation + import/export CSV
- **Templates** : Messages réutilisables avec variables
- **Dashboard** : Statistiques en temps réel (envoyés, délivrés, échoués)
- **API REST** : Via PocketBase pour intégration externe
