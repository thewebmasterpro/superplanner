# Guide d'utilisation API pour ClaudeBot

Ce guide explique comment ClaudeBot (Claude Code) peut interagir avec l'API Superplanner pour ajouter et gérer des tâches.

## Authentification

L'API utilise des **API Keys** pour l'authentification des bots. L'API key est envoyée dans le header `Authorization`.

### Obtenir votre API Key

1. Sur le serveur de production (Hostinger), exécutez :
   ```bash
   cd /path/to/superplanner/server
   npm run create-user
   ```

2. Le script affichera :
   ```
   ✅ API Key created!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔑 API Key for ClaudeBot:
      sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️  Save this key securely - it won't be shown again!
   ```

3. **Sauvegardez cette clé** dans un endroit sécurisé (fichier `.env` local, gestionnaire de mots de passe, etc.)

## Format des requêtes

### Header d'authentification

Toutes les requêtes API doivent inclure le header :

```
Authorization: Bearer sk_your_api_key_here
```

### Base URL

- **Production** : `https://sp.thewebmaster.pro/api`
- **Local** : `http://localhost:3000/api`

## Endpoints disponibles

### 1. Créer une tâche

**POST** `/api/tasks`

**Body** (JSON) :
```json
{
  "title": "Titre de la tâche",
  "description": "Description optionnelle",
  "status": "todo",
  "frequency": "weekly",
  "priority": 1,
  "due_date": "2026-02-01"
}
```

**Paramètres** :
- `title` (requis) : Titre de la tâche
- `description` (optionnel) : Description détaillée
- `status` (optionnel) : `todo`, `in_progress`, `done`, `blocked` (défaut: `todo`)
- `frequency` (optionnel) : `daily`, `weekly`, `monthly` (défaut: `weekly`)
- `priority` (optionnel) : Nombre entier (défaut: 1)
- `due_date` (optionnel) : Date au format `YYYY-MM-DD`

**Réponse** :
```json
{
  "id": 123,
  "message": "Task created"
}
```

### 2. Lister toutes les tâches

**GET** `/api/tasks`

**Réponse** :
```json
[
  {
    "id": 1,
    "project_id": 1,
    "title": "Ma tâche",
    "description": "Description",
    "status": "todo",
    "frequency": "weekly",
    "priority": 1,
    "due_date": "2026-02-01",
    "created_at": "2026-01-26T10:00:00.000Z",
    "updated_at": "2026-01-26T10:00:00.000Z"
  }
]
```

### 3. Obtenir une tâche spécifique

**GET** `/api/tasks/:id`

**Exemple** : `/api/tasks/123`

### 4. Mettre à jour une tâche

**PUT** `/api/tasks/:id`

**Body** : Mêmes champs que POST (tous optionnels sauf `title`)

### 5. Supprimer une tâche

**DELETE** `/api/tasks/:id`

## Exemples d'utilisation

### Avec curl

```bash
# Créer une tâche
curl -X POST https://sp.thewebmaster.pro/api/tasks \
  -H "Authorization: Bearer sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implémenter nouvelle fonctionnalité",
    "description": "Ajouter le support des sous-tâches",
    "status": "todo",
    "priority": 2,
    "due_date": "2026-02-15"
  }'

# Lister les tâches
curl https://sp.thewebmaster.pro/api/tasks \
  -H "Authorization: Bearer sk_your_api_key_here"
```

### Avec JavaScript/Node.js

```javascript
import axios from 'axios'

const API_KEY = 'sk_your_api_key_here'
const BASE_URL = 'https://sp.thewebmaster.pro/api'

// Créer une tâche
async function createTask(taskData) {
  const response = await axios.post(`${BASE_URL}/tasks`, taskData, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  return response.data
}

// Utilisation
const newTask = await createTask({
  title: "Réviser le code",
  description: "Code review du module auth",
  status: "todo",
  priority: 1,
  due_date: "2026-01-30"
})

console.log('Tâche créée:', newTask)
```

### Avec Python

```python
import requests

API_KEY = 'sk_your_api_key_here'
BASE_URL = 'https://sp.thewebmaster.pro/api'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Créer une tâche
task_data = {
    'title': 'Tester l\'authentification',
    'description': 'Tests unitaires pour JWT',
    'status': 'in_progress',
    'priority': 2
}

response = requests.post(f'{BASE_URL}/tasks', json=task_data, headers=headers)
print('Tâche créée:', response.json())
```

## Intégration avec Claude Code

Lorsque Claude Code (ClaudeBot) a besoin d'ajouter une tâche, il peut utiliser cette API :

### Exemple de prompt

```
Claude, ajoute une tâche dans Superplanner :
- Titre : "Déployer en production"
- Description : "Déployer la v2.0 avec authentification"
- Priorité : 3
- Date limite : 2026-02-01
```

### Implémentation Claude Code

Claude peut utiliser un outil MCP (Model Context Protocol) ou directement des requêtes HTTP :

```javascript
// Claude Code peut exécuter ceci
const axios = require('axios')

async function addTaskToSuperplanner(title, description, priority, dueDate) {
  const API_KEY = process.env.SUPERPLANNER_API_KEY
  const response = await axios.post('https://sp.thewebmaster.pro/api/tasks', {
    title,
    description,
    priority,
    due_date: dueDate,
    status: 'todo'
  }, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  })
  return response.data
}
```

## Sécurité

- **Gardez votre API key secrète** : Ne la partagez jamais publiquement
- **Stockez-la en sécurité** : Utilisez des variables d'environnement ou un gestionnaire de secrets
- **Rotation** : Si la clé est compromise, générez-en une nouvelle via la base de données

### Désactiver une API key compromise

Si votre API key est compromise, connectez-vous à la base de données :

```sql
UPDATE api_keys SET is_active = false WHERE name = 'ClaudeBot';
```

Puis créez-en une nouvelle avec `npm run create-user`.

## Limites et quotas

Actuellement, il n'y a pas de limite de taux (rate limiting), mais soyez raisonnable dans vos requêtes.

## Support

Pour toute question ou problème :
- Vérifiez les logs du serveur : `pm2 logs superplanner`
- Testez avec curl pour isoler le problème
- Vérifiez que l'API key est valide et active

---

**Dernière mise à jour** : 2026-01-26
