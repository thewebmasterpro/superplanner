# SUPERPLANNER_API.md — Henry's Guide to Superplanner

## 🔑 Access Credentials

```
SUPABASE_URL=https://tytayccjnnwixunjazta.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<demander à Anouar ou voir TOOLS.md>
USER_ID=<demander à Anouar>
```

---

## 🏗️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `tasks` | Tâches et meetings |
| `campaigns` | Campagnes (groupes de tâches) |
| `contexts` | Contextes (Distriweb, Thewebmaster, Agence-smith) |
| `task_dependencies` | Blockers entre tâches |
| `task_categories` | Catégories de tâches |
| `projects` | Projets |
| `tags` | Tags |
| `task_tags` | Junction table tâches-tags |
| `task_notes` | Notes sur les tâches |
| `meetings` | Meetings de campagne |
| `user_preferences` | Préférences utilisateur |

---

## 📖 API Reference

### Tasks

#### Lister les tâches
```sql
SELECT * FROM tasks
WHERE user_id = '<USER_ID>'
  AND context_id = '<CONTEXT_ID>'  -- optionnel
  AND status = 'todo'              -- optionnel: todo, in_progress, done, blocked
ORDER BY priority DESC, created_at DESC;
```

#### Créer une tâche
```sql
INSERT INTO tasks (user_id, title, description, status, priority, context_id, campaign_id, due_date, type)
VALUES (
  '<USER_ID>',
  'Titre de la tâche',
  'Description optionnelle',
  'todo',        -- todo, in_progress, done, blocked
  3,             -- 1 (low) to 5 (critical)
  '<CONTEXT_ID>',-- UUID du contexte (obligatoire sauf vue globale)
  '<CAMPAIGN_ID>',-- optionnel
  '2026-01-30',  -- optionnel, format YYYY-MM-DD
  'task'         -- task ou meeting
);
```

#### Modifier une tâche
```sql
UPDATE tasks
SET status = 'done', -- ou 'in_progress', 'blocked'
    priority = 1,
    description = 'Nouvelle description'
WHERE id = '<TASK_ID>' AND user_id = '<USER_ID>';
```

#### Supprimer une tâche
```sql
DELETE FROM tasks WHERE id = '<TASK_ID>' AND user_id = '<USER_ID>';
```

---

### Contexts

#### Lister les contextes
```sql
SELECT id, name, description, color, status
FROM contexts
WHERE user_id = '<USER_ID>' AND status = 'active'
ORDER BY name;
```

**Résultat attendu:**
| name | description | color |
|------|-------------|-------|
| Distriweb | E-commerce Manager | #22c55e |
| Thewebmaster | Freelance | #6366f1 |
| Agence-smith | Side project | #f59e0b |

---

### Campaigns

#### Lister les campagnes
```sql
SELECT c.*,
  (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id) as task_count,
  (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id AND t.status = 'done') as done_count
FROM campaigns c
WHERE c.user_id = '<USER_ID>'
  AND c.context_id = '<CONTEXT_ID>'  -- optionnel
  AND c.status = 'active'
ORDER BY end_date ASC;
```

#### Créer une campagne
```sql
INSERT INTO campaigns (user_id, name, description, start_date, end_date, context_id, status, priority)
VALUES (
  '<USER_ID>',
  'Pub Printemps',
  'Campagne marketing Q2',
  '2026-02-01',
  '2026-02-28',
  '<CONTEXT_ID>',
  'active',
  3
);
```

---

### Blockers (Dépendances)

#### Voir ce qui bloque une tâche
```sql
SELECT t.id, t.title, t.status, t.priority
FROM task_dependencies td
JOIN tasks t ON t.id = td.blocker_id
WHERE td.task_id = '<TASK_ID>';
```

#### Voir ce qu'une tâche bloque
```sql
SELECT t.id, t.title, t.status
FROM task_dependencies td
JOIN tasks t ON t.id = td.task_id
WHERE td.blocker_id = '<TASK_ID>';
```

#### Ajouter un blocker
```sql
INSERT INTO task_dependencies (task_id, blocker_id)
VALUES ('<TASK_BLOQUÉE_ID>', '<TASK_QUI_BLOQUE_ID>');
-- Note: Validation automatique contre auto-bloc et cycles simples
```

#### Retirer un blocker
```sql
DELETE FROM task_dependencies
WHERE task_id = '<TASK_BLOQUÉE_ID>' AND blocker_id = '<TASK_QUI_BLOQUE_ID>';
```

---

### Analytics Queries

#### Tâches bloquées depuis plus de N jours
```sql
SELECT t.id, t.title, td.created_at,
  EXTRACT(DAY FROM NOW() - td.created_at) as days_blocked
FROM tasks t
JOIN task_dependencies td ON t.id = td.task_id
JOIN tasks blocker ON blocker.id = td.blocker_id
WHERE t.user_id = '<USER_ID>'
  AND blocker.status != 'done'
  AND td.created_at < NOW() - INTERVAL '3 days';
```

#### Équilibre des contextes (tâches done par contexte, 14 derniers jours)
```sql
SELECT c.name, c.color, COUNT(t.id) as done_count
FROM contexts c
LEFT JOIN tasks t ON t.context_id = c.id
  AND t.status = 'done'
  AND t.updated_at > NOW() - INTERVAL '14 days'
WHERE c.user_id = '<USER_ID>'
GROUP BY c.id, c.name, c.color
ORDER BY done_count DESC;
```

#### Campagnes finissant dans les N prochains jours
```sql
SELECT c.*, 
  (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id AND t.status = 'done') as done,
  (SELECT COUNT(*) FROM tasks t WHERE t.campaign_id = c.id) as total
FROM campaigns c
WHERE c.user_id = '<USER_ID>'
  AND c.end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND c.status = 'active';
```

#### Tâches urgentes (priorité 1-2, non done)
```sql
SELECT t.*, c.name as context_name
FROM tasks t
LEFT JOIN contexts c ON c.id = t.context_id
WHERE t.user_id = '<USER_ID>'
  AND t.priority <= 2
  AND t.status != 'done'
ORDER BY t.priority ASC, t.due_date ASC;
```

---

## 🎯 Common Patterns for Henry

### Pattern 1: Créer une tâche en conversation
```
User: "ajoute: faire le devis client ABC"
Henry:
  1. Détecter le contexte actif (ou demander si global)
  2. INSERT INTO tasks (title: "Faire le devis client ABC", context_id: ctx)
  3. Confirmer: "Tâche créée dans Distriweb ✓"
```

### Pattern 2: Résumé du jour (Heartbeat)
```
Henry:
  1. SELECT tâches urgentes (priority <= 2)
  2. SELECT tâches bloquées > 3 jours
  3. SELECT campagnes finissant < 7 jours
  4. Formater et envoyer via Telegram
```

### Pattern 3: Marquer comme fait
```
User: "mark 'faire banneurs' as done"
Henry:
  1. Fuzzy match sur title = "faire banneurs"
  2. UPDATE tasks SET status = 'done' WHERE ...
  3. Confirmer: "Tâche terminée ✓"
```

### Pattern 4: Débloquer une tâche
```
User: "retire le blocker sur 'déployer'"
Henry:
  1. Trouver la tâche par fuzzy match
  2. SELECT blockers pour cette tâche
  3. DELETE FROM task_dependencies WHERE ...
  4. Confirmer: "Blocker retiré, tâche débloquée ✓"
```

---

## 🔐 Security Notes

1. **Toujours filtrer par `user_id`** — Ne jamais exposer les données d'autres users
2. **Service Role Key = accès total** — NE PAS exposer côté client
3. **Valider les UUIDs** — Avant INSERT/UPDATE, vérifier format UUID
4. **RLS actif** — Mais contourné par Service Role (attention)

---

## 🚀 Quick Start for Henry

1. **Init Supabase client** (avec Service Role)
2. **getCurrentUser()** → récupérer user_id et contextes
3. **Écouter les messages Telegram**
4. **Pattern match** → détecter l'intention
5. **Exécuter la query** correspondante
6. **Confirmer** via Telegram

---

## 📋 Task Fields Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | auto | Primary key |
| `user_id` | UUID | ✅ | Owner |
| `title` | text | ✅ | Max ~200 chars |
| `description` | text | - | Long text |
| `status` | enum | default: todo | todo, in_progress, done, blocked |
| `priority` | int | default: 3 | 1 (low) → 5 (critical) |
| `context_id` | UUID | ✅ | Foreign key → contexts |
| `campaign_id` | UUID | - | Foreign key → campaigns |
| `project_id` | UUID | - | Foreign key → projects |
| `category_id` | UUID | - | Foreign key → task_categories |
| `due_date` | date | - | YYYY-MM-DD |
| `duration` | int | default: 60 | Minutes |
| `scheduled_time` | timestamp | - | For calendar |
| `type` | enum | default: task | task, meeting |
| `recurrence` | text | - | daily, weekly, monthly, yearly |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

---

## 📋 Campaign Fields Reference

| Field | Type | Required |
|-------|------|----------|
| `id` | UUID | auto |
| `user_id` | UUID | ✅ |
| `name` | text | ✅ |
| `description` | text | - |
| `start_date` | date | ✅ |
| `end_date` | date | ✅ |
| `context_id` | UUID | ✅ |
| `status` | enum | draft, active, completed, archived |
| `priority` | int | 1-5 |

---

*Last updated: 2026-01-27*
