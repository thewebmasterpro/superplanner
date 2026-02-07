# AGENTS.md — SuperPlanner v4 Rebuild

## Contexte Projet

**SuperPlanner** est une app de gestion de tâches et CRM sur-mesure, en cours de rebuild complet sur la branche `v4-dev`.

- **Stack** : React 18 + Vite 5 + Shadcn/ui + TailwindCSS + Framer Motion
- **Backend** : PocketBase (pb.hagendigital.com)
- **State** : Zustand (global) + React Query (serveur)
- **Architecture** : Service Layer → React Query Hooks → Components

## Conventions

- Composants fonctionnels + hooks
- Shadcn/ui pour tous les composants UI
- Imports absolus avec `@/`
- Service Layer Pattern : `services/*.service.js` → `hooks/use*.js` → `components/*.jsx`
- PocketBase relations : two-step pattern (create sans relations, puis update avec)
- Toast notifications pour feedback utilisateur
- Zustand avec persist middleware pour état global

## Ordre de Build

```
Phase 1 ─── foundation
              │
Phase 2 ─┬── ui-ux ── tasks ── workspaces
          │
Phase 3 ─┬── task-extensions    teams
          │
Phase 4 ─┬── gamification ── campaigns ── contacts
          │
Phase 5 ─┬── calendar ────── dashboard
          │
Phase 6 ─── settings-admin
```

## Agents — Vue d'ensemble

| # | Agent | Domaine | Dépendances | Phase |
|---|-------|---------|-------------|-------|
| 1 | `foundation` | PocketBase, auth, routing, layout, stores, UI partagés | — | 1 |
| 2 | `ui-ux` | Responsive, animations, loading/empty/error states, DnD, accessibilité | foundation | 2 |
| 3 | `tasks` | Task CRUD, statuses, priorities, list, modal, bulk actions, trash, archive | foundation, ui-ux | 2 |
| 4 | `workspaces` | Contextes/workspaces, switching, filtrage | foundation | 2 |
| 5 | `task-extensions` | Categories, tags, comments, notes, time tracking, blockers | foundation, tasks | 3 |
| 6 | `teams` | Team CRUD, membership, roles, invitations, task pool | foundation, tasks | 3 |
| 7 | `gamification` | Points, niveaux, streaks, challenges, leaderboard, rewards, shop | foundation, tasks, teams | 4 |
| 8 | `campaigns` | Campaigns, projects, Gantt, progress, meetings, agenda | foundation, tasks, workspaces | 4 |
| 9 | `contacts` | CRM contacts, bulk ops, context linking, email | foundation, workspaces | 4 |
| 10 | `calendar` | Vues jour/semaine/mois, scheduling | foundation, tasks | 5 |
| 11 | `dashboard` | Widget system DnD, prayer times, Pomodoro, Spotify, world clock, scratchpad | foundation, tasks | 5 |
| 12 | `settings-admin` | Préférences, admin, automation, backup, stats | foundation | 6 |

## Collections PocketBase par Agent

| Agent | Collections |
|-------|-------------|
| foundation | `users` |
| ui-ux | — (patterns transversaux, pas de collection propre) |
| tasks | `tasks` |
| workspaces | `contexts` |
| task-extensions | `task_categories`, `tags`, `task_comments`, `task_notes`, `task_time_logs`, `task_dependencies` |
| teams | `teams`, `team_members`, `team_invitations` |
| gamification | `gamification_points`, `points_history`, `challenges`, `user_challenges`, `team_rewards`, `team_reward_history`, `shop_items`, `user_purchases` |
| campaigns | `campaigns`, `projects`, `meeting_items` |
| contacts | `contacts`, `contact_contexts` |
| calendar | — (utilise `tasks`) |
| dashboard | `prayer_schedule` |
| settings-admin | `user_preferences`, `user_roles`, `admin_stats_cache` |

## Fichiers par Agent

### 1. foundation (Phase 1)
| Type | Fichiers |
|------|----------|
| Lib | `lib/pocketbase.js`, `lib/utils.js` |
| Stores | `stores/userStore.js`, `stores/appStore.js`, `stores/uiStore.js` |
| Layout | `components/layout/DashboardLayoutV3.jsx`, `components/layout/TopBar.jsx`, `components/layout/SidebarV3.jsx` |
| Auth | `components/LoginModal.jsx`, `components/LoginPocketBase.jsx` |
| UI | `components/ui/*` (button, card, dialog, input, label, select, tabs, textarea, badge, checkbox, dropdown-menu, tooltip, progress, alert-dialog, avatar, skeleton, command, calendar, FilterButton, StatsCard, PageHeader) |
| Theme | `components/ThemeProvider.jsx`, `components/ThemeToggle.jsx` |
| Routing | `App.jsx` |
| Other | `components/BugReportModal.jsx`, `components/v3/GlobalSearch.jsx` |

### 2. ui-ux (Phase 2)
| Type | Fichiers |
|------|----------|
| Patterns | Animations Framer Motion (fadeIn, slideUp, staggerChildren), transitions de page |
| États | Loading skeletons, empty states, error states avec retry |
| Responsive | Breakpoints mobile/tablet/desktop, sidebar collapsible, grilles adaptatives |
| DnD | Patterns `@dnd-kit` réutilisables (listes, Kanban, widgets) |
| Feedback | Toasts cohérents, confirmations SweetAlert2, micro-interactions |
| A11y | Focus management modals, keyboard nav, labels ARIA, contraste |
| Visuel | Badges statut/priorité, hover effects, validation inline |

### 3. tasks
| Type | Fichiers |
|------|----------|
| Service | `services/tasks.service.js` |
| Hook | `hooks/useTasks.js` |
| Page | `pages/Tasks.jsx`, `pages/Trash.jsx`, `pages/Archive.jsx` |
| Components | `components/TaskModal.jsx`, `components/TaskModal/*.jsx`, `components/v3/TaskListV3.jsx`, `components/BulkActionsBar.jsx`, `components/KanbanView.jsx`, `components/PipelineBoard.jsx`, `components/PipelineColumn.jsx`, `components/PipelineCard.jsx`, `components/EisenhowerWidget.jsx` |

### 4. workspaces
| Type | Fichiers |
|------|----------|
| Service | `services/workspaces.service.js` |
| Store | `stores/workspaceStore.js` |
| Page | `pages/Workspace.jsx` |
| Components | `components/WorkspaceManager.jsx`, `components/WorkspaceSelector.jsx` |

### 5. task-extensions
| Type | Fichiers |
|------|----------|
| Services | `services/categories.service.js`, `services/tags.service.js`, `services/comments.service.js`, `services/notes.service.js`, `services/timeTracking.service.js`, `services/blockers.service.js` |
| Hooks | `hooks/useCategories.js`, `hooks/useBlockers.js`, `hooks/useTimeTracking.js` |
| Store | `stores/timerStore.js` |
| Components | `components/CategoryManager.jsx`, `components/TagManager.jsx`, `components/TaskComments.jsx`, `components/TaskNotes.jsx`, `components/TaskTimer.jsx`, `components/GlobalTimerHandler.jsx`, `components/BlockerManager.jsx`, `components/pickers/ReminderPicker.jsx` |

### 6. teams
| Type | Fichiers |
|------|----------|
| Service | `services/teams.service.js` |
| Hook | `hooks/useTaskPool.js` |
| Page | `pages/TeamSettings.jsx` |
| Components | `components/TaskModal/TaskModalAssignment.jsx` |

### 7. gamification
| Type | Fichiers |
|------|----------|
| Service | `services/gamification.service.js` |
| Hook | `hooks/useGamification.js` |
| Store | `stores/gamificationStore.js` |
| Page | `pages/GamificationPageV3.jsx` |
| Components | `components/GamificationBadge.jsx`, `components/TeamRewardsManager.jsx`, `components/TeamChallengesManager.jsx` |

### 8. campaigns
| Type | Fichiers |
|------|----------|
| Services | `services/campaigns.service.js`, `services/projects.service.js`, `services/meetings.service.js` |
| Hooks | `hooks/useCampaigns.js`, `hooks/useProjects.js`, `hooks/useMeetingAgenda.js` |
| Pages | `pages/Campaigns.jsx`, `pages/Meetings.jsx` |
| Components | `components/CampaignModal.jsx`, `components/CampaignDetails.jsx`, `components/CampaignGantt.jsx`, `components/CampaignProgressBar.jsx`, `components/ProjectManager.jsx`, `components/MeetingAgendaManager.jsx` |

### 9. contacts
| Type | Fichiers |
|------|----------|
| Service | `services/contacts.service.js` |
| Hook | `hooks/useContacts.js` |
| Page | `pages/Contacts.jsx` |
| Components | `components/ContactModal.jsx`, `components/ContactsBulkActionsBar.jsx`, `components/ComposeEmailModal.jsx` |

### 10. calendar
| Type | Fichiers |
|------|----------|
| Page | `pages/Calendar.jsx` |
| Components | `components/Calendar.jsx`, `components/DayView.jsx`, `components/WeekView.jsx`, `components/MonthView.jsx` |

### 11. dashboard
| Type | Fichiers |
|------|----------|
| Services | `services/prayerTimesApi.js` |
| Hooks | `hooks/usePrayerTimes.js`, `hooks/useTour.js` |
| Page | `pages/DashboardV3.jsx`, `pages/LandingPage.jsx` |
| Components | `components/PrayerTimes.jsx`, `components/PrayerCountdown.jsx`, `components/Pomodoro.jsx`, `components/SpotifyPlayer.jsx`, `components/WorldClockWidget.jsx`, `components/ScratchpadWidget.jsx`, `components/DailyInspiration.jsx`, `components/SortableWidget.jsx`, `components/v3/WeeklyChart.jsx` |

### 12. settings-admin
| Type | Fichiers |
|------|----------|
| Services | `services/settings.service.js`, `services/admin.service.js`, `services/automation.service.js`, `services/ai.service.js`, `services/backup.service.js` |
| Hooks | `hooks/useTelegramNotifications.js` |
| Lib | `lib/exportUtils.js`, `lib/importUtils.js`, `lib/filterUtils.js`, `lib/frenchContent.js` |
| Pages | `pages/Settings.jsx` |
| Components | `components/Settings.jsx`, `components/settings/DataBackupSettings.jsx` |

## Invocation

Chaque agent a un fichier détaillé dans `.claude/agents/{nom}.md`. Pour invoquer un agent :

```
@foundation    → Mise en place de la base
@ui-ux         → Patterns UI/UX transversaux
@tasks         → Feature tâches
@workspaces    → Feature workspaces
@task-extensions → Extensions tâches
@teams         → Feature équipes
@gamification  → Feature gamification
@campaigns     → Feature campaigns
@contacts      → Feature CRM
@calendar      → Feature calendrier
@dashboard     → Feature dashboard
@settings-admin → Settings et admin
```

## Règles Transversales

1. **Service Layer** : Toute interaction PocketBase passe par un service, jamais directement depuis un composant
2. **Two-Step Relations** : Créer sans relations, puis update avec (contourne les bugs PocketBase)
3. **React Query** : Invalider les queries après chaque mutation
4. **Toasts** : Feedback utilisateur systématique sur les mutations
5. **Error Handling** : Try-catch dans les services, messages utilisateur via toast
6. **Soft Delete** : Utiliser `deleted_at` au lieu de supprimer les records

