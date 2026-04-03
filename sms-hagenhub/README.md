# SMS-HagenHub

Service SMS pour HagenHub - Envoi, réception et gestion de campagnes SMS.

## Structure

```
sms-hagenhub/
├── src/
│   ├── api/           # Routes Express (sms, campaigns, webhooks)
│   ├── services/      # Logique métier (SmsService, CampaignService)
│   ├── config/        # Configuration centralisée
│   ├── templates/     # Templates SMS prédéfinis
│   └── utils/         # Logger, validateurs
├── tests/             # Tests unitaires
└── docs/              # Documentation
```

## Installation

```bash
cd sms-hagenhub
npm install
cp .env.example .env
# Configurer les variables dans .env
```

## Démarrage

```bash
npm run dev    # Mode développement (watch)
npm start      # Mode production
npm test       # Lancer les tests
```

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/sms/send` | Envoyer un SMS |
| `POST` | `/api/sms/send-bulk` | Envoyer en masse |
| `POST` | `/api/campaigns` | Créer une campagne |
| `GET` | `/api/campaigns` | Lister les campagnes |
| `GET` | `/api/campaigns/:id` | Détails d'une campagne |
| `POST` | `/api/campaigns/:id/execute` | Exécuter une campagne |
| `POST` | `/api/webhooks/status` | Webhook statut livraison |
| `POST` | `/api/webhooks/inbound` | Webhook SMS entrant |

## Configuration

Voir `.env.example` pour toutes les variables de configuration.

## Fournisseurs SMS supportés

- Twilio (par défaut)
- Extensible pour Vonage, MessageBird, etc.
