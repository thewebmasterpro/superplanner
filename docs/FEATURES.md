# Superplanner - Documentation des Fonctionnalites

**Version:** 1.1.0
**Stack:** React 18 + Vite 5 + PocketBase + Zustand + TanStack React Query
**Derniere mise a jour:** 2026-01-31

---

## Table des matieres

1. [Gestion des Taches](#1-gestion-des-taches)
2. [Vues et Visualisation](#2-vues-et-visualisation)
3. [CRM et Contacts](#3-crm-et-contacts)
4. [Campagnes](#4-campagnes)
5. [Calendrier](#5-calendrier)
6. [Gestion du Temps](#6-gestion-du-temps)
7. [Workspaces et Organisation](#7-workspaces-et-organisation)
8. [Equipes](#8-equipes)
9. [Dashboard et Widgets](#9-dashboard-et-widgets)
10. [Recherche et Filtres](#10-recherche-et-filtres)
11. [Authentification](#11-authentification)
12. [Parametres Utilisateur](#12-parametres-utilisateur)
13. [Integrations](#13-integrations)
14. [Gestion des Donnees](#14-gestion-des-donnees)
15. [Interface et UX](#15-interface-et-ux)

---

## 1. Gestion des Taches

Le coeur de Superplanner. Chaque tache est liee a un workspace et a un utilisateur.

### Creation et edition

- **Modale de tache** (`TaskModal.jsx`) : formulaire complet pour creer ou modifier une tache.
- Champs disponibles : titre, description, priorite, statut, date d'echeance, heure planifiee, duree estimee (en minutes).
- Association a une categorie, un projet, des tags (multi-selection), une equipe, un contact et une campagne.
- Deux types de taches :
  - **Tache** : tache classique.
  - **Meeting** : tache de type reunion avec un onglet agenda dedie.

### Statuts

| Statut | Description |
|--------|-------------|
| `todo` | A faire |
| `in_progress` | En cours |
| `blocked` | Bloquee |
| `done` | Terminee |

### Priorites

| Niveau | Valeur | Description |
|--------|--------|-------------|
| 1 | Low | Basse |
| 2 | Medium | Moyenne |
| 3 | Medium-High | Moyenne-haute |
| 4 | High | Haute |
| 5 | Urgent | Urgente |

### Recurrence

Les taches peuvent etre recurrentes avec quatre frequences :
- **Quotidienne** (daily)
- **Hebdomadaire** (weekly)
- **Bi-hebdomadaire** (biweekly)
- **Mensuelle** (monthly)

Une date de fin de recurrence peut etre definie. Les occurrences futures sont generees virtuellement au runtime (non stockees en base) via `generateVirtualOccurrences()` dans `utils/recurrence.js`.

### Onglets de la modale

| Onglet | Description |
|--------|-------------|
| **Notes** | Editeur de texte riche (Quill) pour ajouter des notes detaillees |
| **Commentaires** | Fil de commentaires avec threading |
| **Agenda** | Elements d'agenda pour les meetings (ordre, statut complete) |
| **Blockers** | Gestion des bloqueurs et dependances entre taches |

### Operations groupees

La barre d'actions groupees (`BulkActionsBar.jsx`) permet de selectionner plusieurs taches et d'appliquer :
- Changement de statut en masse
- Changement de priorite en masse
- Suppression groupee
- Archivage groupe
- Restauration vers un workspace
- Assignation de tags/categories

### Cycle de vie

```
Tache active  -->  Archivee (soft delete)  -->  Corbeille (hard delete)  -->  Suppression definitive
      ^                    |                           |
      |                    v                           v
      +--- Restauration ---+---- Restauration ---------+
```

- **Archiver** : deplace la tache vers l'archive (`archived_at` renseigne).
- **Mettre a la corbeille** : deplace la tache vers la corbeille (`deleted_at` renseigne).
- **Restaurer** : remet la tache dans son workspace d'origine.
- **Vider la corbeille/archive** : suppression definitive de toutes les taches.

---

## 2. Vues et Visualisation

Superplanner propose plusieurs manieres de visualiser les taches.

### Vue Table

- Tableau avec colonnes triables : titre, statut, priorite, date d'echeance, categorie, assignation.
- Filtrage par statut, priorite, date, categorie, tag, assignee, client.
- Visibilite des colonnes configurable.
- Selection multiple via cases a cocher.
- Tri par date de creation, echeance, priorite, etc.

### Vue Kanban

- 4 colonnes : **Todo**, **In Progress**, **Blocked**, **Done**.
- Glisser-deposer (`dnd-kit`) pour deplacer les taches entre colonnes.
- Support clavier pour l'accessibilite.
- Cartes avec badges de priorite et d'assignation.

### Vue Meetings

- Page dediee aux taches de type `meeting`.
- Filtrage par statut specifique aux reunions.

---

## 3. CRM et Contacts

Systeme CRM integre pour gerer prospects et clients.

### Gestion des contacts

- **Modale contact** (`ContactModal.jsx`) : creation et edition.
- Champs : nom, email, telephone, entreprise, notes.
- Types : **Individu** ou **Entreprise**.

### Pipeline de vente

Le statut d'un contact suit un pipeline :

```
prospect_new --> prospect_interested --> proposal_sent --> negotiating --> client
```

### Vue Pipeline

- **PipelineBoard** : vue Kanban par statut de contact.
- Glisser-deposer pour changer le statut d'un contact.
- Cartes de pipeline avec informations cles.

### Actions sur les contacts

- Lien WhatsApp (generation automatique du lien).
- Composition d'email (via `ComposeEmailModal.jsx`, backend Resend).
- Onglet activites : historique des taches liees au contact.
- Operations groupees (changement de statut, suppression).

### Association taches-contacts

Les taches peuvent etre liees a un contact via le champ `contact_id`. Cela permet de voir l'activite sur chaque contact.

---

## 4. Campagnes

Gestion de campagnes marketing ou de projets avec suivi de progression.

### Creation et edition

- **Modale campagne** (`CampaignModal.jsx`) : nom, dates de debut/fin, description, membres.
- Statuts : **Draft**, **Active**, **Completed**, **Archived**.
- Association aux taches (via `campaign_id` sur les taches).

### Vues disponibles

| Vue | Description |
|-----|-------------|
| **Liste** | Vue classique en liste |
| **Gantt** | Diagramme de Gantt avec timeline visuelle (`CampaignGantt.jsx`) |
| **Detail** | Vue detaillee d'une campagne avec ses taches et sa progression |

### Suivi de progression

- **Barre de progression** (`CampaignProgressBar.jsx`) : pourcentage de taches completees.
- Membres assignes a la campagne.

---

## 5. Calendrier

Vue calendrier complete basee sur `react-big-calendar`.

### Modes d'affichage

- **Mois** : vue mensuelle.
- **Semaine** : vue hebdomadaire.
- **Jour** : vue journaliere.

### Fonctionnalites

- Affichage des taches avec echeance sur le calendrier.
- Expansion des taches recurrentes (occurrences virtuelles affichees).
- Glisser-deposer pour replanifier une tache.
- Clic sur un evenement pour ouvrir la modale de tache.

---

## 6. Gestion du Temps

### Pomodoro

Widget Pomodoro (`Pomodoro.jsx`) integre au dashboard :
- Cycle de travail : 25 minutes.
- Pause : 5 minutes.
- Controles play/pause/stop.

### Timer de tache

- **TaskTimer** : chronometre lie a une tache specifique.
- **GlobalTimerHandler** : gestion en arriere-plan du timer actif.
- Suivi du temps passe sur chaque tache via `timeTracking.service.js`.

### Horaires de priere

- **PrayerTimes** : affichage des 5 prieres quotidiennes (Fajr, Dhuhr, Asr, Maghrib, Isha).
- **PrayerCountdown** : compte a rebours jusqu'a la prochaine priere avec notifications.
- Localisation configurable dans les parametres.
- API externe : Aladhan / IslamicAPI.

### Horloge mondiale

- **WorldClockWidget** : affichage de l'heure dans plusieurs fuseaux horaires.
- Villes configurables dans les parametres.

---

## 7. Workspaces et Organisation

### Workspaces

Chaque utilisateur peut creer plusieurs workspaces pour organiser ses donnees.

- **Creation** : nom, description, couleur, icone.
- **Selection** : via le `WorkspaceSelector` dans la sidebar.
- **Filtrage** : toutes les donnees (taches, projets, categories, tags) sont filtrees par workspace actif.
- **Vues speciales** :
  - `null` : vue globale (toutes les donnees).
  - `trash` : vue corbeille.
  - `archive` : vue archive.

### Projets

- CRUD complet via `ProjectManager.jsx`.
- Chaque projet est lie a un workspace.
- Les taches sont assignees a un projet.

### Categories

- CRUD via `CategoryManager.jsx`.
- Couleur personnalisable.
- Filtrage des taches par categorie.

### Tags

- CRUD via `TagManager.jsx`.
- Multi-selection sur les taches.
- Couleur personnalisable.

---

## 8. Equipes

### Gestion des equipes

- Creation d'equipes avec nom et description.
- Invitation de membres.
- Roles : **Admin** et **Member**.
- Page de parametres dediee (`/team`).

### Assignation

- Les taches peuvent etre assignees a un membre de l'equipe (`assigned_to`).
- Les taches peuvent etre associees a une equipe (`team_id`).
- Les campagnes peuvent avoir des membres.

---

## 9. Dashboard et Widgets

Le dashboard (`/`) est la page d'accueil avec des widgets personnalisables.

### Widgets disponibles

| Widget | Description |
|--------|-------------|
| **Eisenhower** | Matrice "Do It Now" - taches urgentes et importantes |
| **Scratchpad** | Bloc-notes rapide avec sauvegarde automatique (debounce 1.5s) |
| **Pomodoro** | Timer Pomodoro (25min/5min) |
| **Horaires de priere** | 5 prieres du jour + compte a rebours |
| **Horloge mondiale** | Fuseaux horaires multiples |
| **Inspiration** | Citations, growth hacks, biais cognitifs, tips business (en francais) |
| **Spotify** | Lecteur Spotify integre (playlist embed) |
| **Timer de tache** | Chronometre lie a une tache |
| **Progression campagne** | Barre de progression des campagnes |

### Personnalisation

- **Visibilite** : activer/desactiver chaque widget dans les parametres.
- **Ordre** : reorganiser les widgets par glisser-deposer (`SortableWidget.jsx`).
- La disposition est sauvegardee dans les preferences utilisateur.

---

## 10. Recherche et Filtres

### Recherche globale

- **Command palette** (`GlobalSearch.jsx`) : recherche rapide a travers toute l'application.
- Accessible depuis la navbar.

### Filtres sur les taches

- Statut (todo, in_progress, blocked, done)
- Priorite (1-5)
- Date d'echeance
- Categorie
- Tag
- Assignee
- Client/Contact
- Workspace

### Filtres sur les contacts

- Statut pipeline
- Workspace
- Type (individu/entreprise)

### Filtres sur les campagnes

- Statut (draft, active, completed, archived)
- Recherche textuelle

### Tri

Options de tri disponibles : date de creation, date d'echeance, priorite, titre.

---

## 11. Authentification

### Methodes de connexion

- **Email / mot de passe** : inscription et connexion classique via PocketBase Auth.
- Composants : `LoginModal.jsx`, `LoginPocketBase.jsx`.

### Securite

- Persistance de session via PocketBase `authStore`.
- Listener sur changement d'etat d'authentification.
- Routes protegees : les utilisateurs non authentifies voient la landing page.
- Row Level Security : chaque utilisateur ne voit que ses propres donnees.
- Isolation des donnees via champ `user_id` sur chaque enregistrement.

---

## 12. Parametres Utilisateur

Page de parametres (`/settings`) organisee en onglets.

### Onglets disponibles

| Onglet | Description |
|--------|-------------|
| **Priere** | Localisation pour le calcul des horaires de priere |
| **Telegram** | Configuration du bot Telegram (chat ID, activation) |
| **Dashboard** | Visibilite des widgets (9 toggles) |
| **Horloge** | Configuration des villes pour l'horloge mondiale |
| **Sauvegarde** | Export et import des donnees |

### Preferences persistees

- Theme clair/sombre
- Jours de preparation campagne / jours de reporting
- Heures de travail par membre d'equipe
- URL de playlist Spotify
- Contenu du scratchpad
- Disposition du dashboard

---

## 13. Integrations

### Telegram

- Notifications avant echeance ou reunion.
- Configuration du chat ID dans les parametres.
- Activation/desactivation par toggle.
- Service : `useTelegramNotifications` hook.

### Spotify

- Widget integre dans le dashboard.
- Lecteur de playlist Spotify embarque.
- URL de playlist configurable.

### Horaires de priere (API externe)

- API Aladhan / IslamicAPI.
- Calcul automatique selon la localisation configuree.
- Hook : `usePrayerTimes`.

### WhatsApp

- Generation automatique de liens WhatsApp pour les contacts.
- Lien direct depuis la fiche contact.

### Email

- Composition d'emails depuis la fiche contact.
- Backend : Resend.
- Composant : `ComposeEmailModal.jsx`.

---

## 14. Gestion des Donnees

### Export / Import

- **Export** : sauvegarde des donnees en CSV ou JSON via `exportUtils.js`.
- **Import** : restauration depuis un fichier CSV ou JSON via `importUtils.js`.
- Interface dans les parametres (`DataBackupSettings.jsx`).

### Suppression

- **Archive** : suppression douce (`archived_at` renseigne), restauration possible.
- **Corbeille** : suppression dure (`deleted_at` renseigne), restauration possible.
- **Suppression definitive** : vider la corbeille ou l'archive.

### Securite des donnees

- Prevention d'injection SQL via `FilterBuilder` et `escapeFilterValue()` dans `filterUtils.js`.
- Pas de cles API exposees dans le frontend.
- Row Level Security au niveau base de donnees.

---

## 15. Interface et UX

### Theme

- **Mode clair** et **mode sombre** via `ThemeToggle` / `ThemeProvider`.
- Persistance du choix dans le localStorage.

### Navigation

- **Sidebar** : 12 liens de navigation, selecteur de workspace, lecteur Spotify.
- **Navbar** : recherche globale, boutons de creation rapide (tache, campagne, contact), menu utilisateur, report de bug.
- Raccourci clavier : `Cmd/Ctrl+B` pour toggle la sidebar.

### Composants UI

17 composants Radix UI encapsules dans `components/ui/` :
Button, Input, Card, Dialog, Select, Textarea, Label, Badge, Tabs, Checkbox, DropdownMenu, AlertDialog, Tooltip, Avatar, Progress, Skeleton, Command, Calendar.

### Interactions

- **Glisser-deposer** : taches (kanban), contacts (pipeline), widgets (dashboard).
- **Animations** : transitions Framer Motion sur les elements interactifs.
- **Notifications toast** : confirmations et erreurs via `react-hot-toast`.
- **Modales** : CRUD pour taches, contacts, campagnes.
- **Squelettes de chargement** : pendant le chargement des donnees.

### Responsive

Design adaptatif pour mobile, tablette et desktop.

### Report de bug

- Bouton "Report Bug" dans la navbar.
- Modale dediee (`BugReportModal.jsx`) qui cree une tache de type bug.

---

## Architecture Technique

### Base de donnees (PocketBase)

| Collection | Description |
|------------|-------------|
| `tasks` | Taches (titre, statut, priorite, echeance, recurrence, etc.) |
| `contacts` | Contacts CRM |
| `campaigns` | Campagnes marketing/projets |
| `projects` | Projets par workspace |
| `categories` | Categories de taches |
| `tags` | Tags multi-selection |
| `workspaces` (contexts) | Workspaces utilisateur |
| `teams` | Equipes |
| `team_members` | Membres d'equipe (roles) |
| `prayer_schedule` | Horaires de priere |
| `task_blockers` | Bloqueurs entre taches |
| `task_comments` | Commentaires sur taches |
| `task_notes` | Notes (texte riche) |
| `meeting_agenda_items` | Elements d'agenda de reunion |
| `user_preferences` | Preferences utilisateur (JSON) |

### Services (16 services)

Couche de services isolee entre les composants et PocketBase :

| Service | Responsabilite |
|---------|----------------|
| `tasksService` | CRUD taches + archive/corbeille/restauration + filtres |
| `contactsService` | CRUD contacts + operations groupees |
| `campaignsService` | CRUD campagnes + donnees Gantt |
| `projectsService` | CRUD projets |
| `categoriesService` | CRUD categories |
| `tagsService` | CRUD tags |
| `workspacesService` | CRUD workspaces |
| `teamsService` | Equipes, membres, invitations |
| `blockers.service` | Bloqueurs de taches |
| `comments.service` | Commentaires |
| `notes.service` | Notes |
| `meetings.service` | Operations specifiques reunions |
| `timeTracking.service` | Suivi du temps |
| `settings.service` | Preferences utilisateur |
| `backup.service` | Export/import |
| `prayerTimesApi` | API horaires de priere |

### State Management (5 stores Zustand)

| Store | Donnees |
|-------|---------|
| `useWorkspaceStore` | Workspaces, workspace actif |
| `useUIStore` | Modales, sidebar, recherche, toasts |
| `useUserStore` | Utilisateur, preferences, theme, equipe |
| `useTimerStore` | Timer de tache actif |
| `useAppStore` | Etat general |

---

## Pages de l'Application

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Hub principal avec widgets |
| Taches | `/tasks` | Gestion des taches (table/kanban) |
| Meetings | `/meetings` | Reunions avec filtres |
| Contacts | `/contacts` | Liste CRM |
| Pipeline | `/pipeline` | Kanban pipeline de vente |
| Calendrier | `/calendar` | Vue mois/semaine/jour |
| Campagnes | `/campaigns` | Liste/Gantt/detail |
| Workspace | `/workspace` | Projets, categories, tags |
| Equipe | `/team` | Gestion equipe et membres |
| Parametres | `/settings` | Preferences utilisateur |
| Archive | `/archive` | Taches archivees |
| Corbeille | `/trash` | Taches supprimees |
