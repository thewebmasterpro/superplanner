export const tourConfig = {
  '/': {
    pageTitle: 'Dashboard',
    steps: [
      {
        element: '[data-tour="sidebar-nav"]',
        popover: {
          title: 'Navigation',
          description: 'Accedez a toutes vos pages depuis le menu lateral.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="topbar-actions"]',
        popover: {
          title: 'Actions Rapides',
          description: 'Creez une tache, une reunion, un contact ou signalez un bug depuis n\'importe quelle page.',
        },
      },
      {
        element: '[data-tour="dashboard-stats"]',
        popover: {
          title: 'Vue d\'ensemble',
          description: 'Suivez vos metriques cles : taches totales, completees, productivite et priorites critiques.',
        },
      },
      {
        element: '[data-tour="dashboard-chart"]',
        popover: {
          title: 'Productivite Hebdomadaire',
          description: 'Visualisez votre tendance de productivite sur la semaine.',
        },
      },
      {
        element: '[data-tour="dashboard-tasks"]',
        popover: {
          title: 'Suivi des Taches',
          description: 'Gerez vos taches directement depuis le dashboard.',
        },
      },
      {
        element: '[data-tour="dashboard-widgets"]',
        popover: {
          title: 'Widgets Personnalisables',
          description: 'Prieres, horloge mondiale, bloc-notes, matrice Eisenhower et plus encore.',
        },
      },
      {
        element: '[data-tour="dashboard-edit-widgets"]',
        popover: {
          title: 'Editer les Widgets',
          description: 'Activez, desactivez et reordonnez vos widgets.',
        },
      },
    ],
  },

  '/tasks': {
    pageTitle: 'Taches',
    steps: [
      {
        element: '[data-tour="tasks-create"]',
        popover: {
          title: 'Creer une Tache',
          description: 'Ajoutez rapidement une nouvelle tache.',
        },
      },
      {
        element: '[data-tour="tasks-search"]',
        popover: {
          title: 'Recherche',
          description: 'Recherchez vos taches par titre ou description.',
        },
      },
      {
        element: '[data-tour="tasks-filters"]',
        popover: {
          title: 'Filtres',
          description: 'Filtrez par statut, priorite, workspace, projet, tags et plus.',
        },
      },
      {
        element: '[data-tour="tasks-view-toggle"]',
        popover: {
          title: 'Changer de Vue',
          description: 'Alternez entre la vue tableau et la vue kanban.',
        },
      },
      {
        element: '[data-tour="tasks-table"]',
        popover: {
          title: 'Liste des Taches',
          description: 'Cliquez sur une tache pour la modifier. Cochez pour selectionner en masse.',
        },
      },
    ],
  },

  '/calendar': {
    pageTitle: 'Calendrier',
    steps: [
      {
        element: '[data-tour="calendar-create"]',
        popover: {
          title: 'Nouvelle Tache',
          description: 'Creez une tache directement depuis le calendrier.',
        },
      },
      {
        element: '.rbc-toolbar',
        popover: {
          title: 'Navigation',
          description: 'Basculez entre les vues mois, semaine, jour et agenda.',
        },
      },
      {
        element: '[data-tour="calendar-view"]',
        popover: {
          title: 'Calendrier',
          description: 'Vos taches et reunions s\'affichent ici. Cliquez sur un creneau pour creer.',
        },
      },
    ],
  },

  '/contacts': {
    pageTitle: 'Contacts',
    steps: [
      {
        element: '[data-tour="contacts-create"]',
        popover: {
          title: 'Nouveau Contact',
          description: 'Ajoutez un nouveau contact a votre CRM.',
        },
      },
      {
        element: '[data-tour="contacts-view-toggle"]',
        popover: {
          title: 'Changer de Vue',
          description: 'Alternez entre la vue liste et la vue pipeline CRM.',
        },
      },
      {
        element: '[data-tour="contacts-search"]',
        popover: {
          title: 'Recherche',
          description: 'Recherchez vos contacts par nom, email ou entreprise.',
        },
      },
      {
        element: '[data-tour="contacts-table"]',
        popover: {
          title: 'Vos Contacts',
          description: 'Cliquez sur un contact pour le modifier. Actions rapides disponibles.',
        },
      },
    ],
  },

  '/campaigns': {
    pageTitle: 'Projets',
    steps: [
      {
        element: '[data-tour="campaigns-create"]',
        popover: {
          title: 'Nouveau Projet',
          description: 'Creez un projet pour organiser vos initiatives.',
        },
      },
      {
        element: '[data-tour="campaigns-view-toggle"]',
        popover: {
          title: 'Vues',
          description: 'Alternez entre la vue grille et la vue Gantt.',
        },
      },
      {
        element: '[data-tour="campaigns-filters"]',
        popover: {
          title: 'Filtres',
          description: 'Filtrez par projets actifs, brouillons ou termines.',
        },
      },
      {
        element: '[data-tour="campaigns-list"]',
        popover: {
          title: 'Vos Projets',
          description: 'Cliquez sur un projet pour voir ses details et sa progression.',
        },
      },
    ],
  },

  '/meetings': {
    pageTitle: 'Reunions',
    steps: [
      {
        element: '[data-tour="meetings-create"]',
        popover: {
          title: 'Nouvelle Reunion',
          description: 'Planifiez un nouveau rendez-vous ou appel.',
        },
      },
      {
        element: '[data-tour="meetings-search"]',
        popover: {
          title: 'Recherche & Filtres',
          description: 'Recherchez et filtrez vos reunions.',
        },
      },
      {
        element: '[data-tour="meetings-list"]',
        popover: {
          title: 'Vos Reunions',
          description: 'Cliquez sur une reunion pour la modifier ou voir l\'agenda.',
        },
      },
    ],
  },

  '/stats': {
    pageTitle: 'Statistiques',
    steps: [
      {
        element: '[data-tour="stats-kpis"]',
        popover: {
          title: 'Indicateurs Cles',
          description: 'Vos KPIs en un coup d\'oeil : taches, completees, productivite.',
        },
      },
      {
        element: '[data-tour="stats-chart"]',
        popover: {
          title: 'Tendance Hebdomadaire',
          description: 'Visualisez l\'evolution de votre productivite.',
        },
      },
      {
        element: '[data-tour="stats-breakdown"]',
        popover: {
          title: 'Repartition par Priorite',
          description: 'Analysez la distribution de vos taches par niveau de priorite.',
        },
      },
    ],
  },

  '/settings': {
    pageTitle: 'Parametres',
    steps: [
      {
        element: '[data-tour="settings-tabs"]',
        popover: {
          title: 'Sections',
          description: 'Naviguez entre apparence, preferences, widgets, donnees et configuration.',
        },
      },
      {
        element: '[data-tour="settings-theme"]',
        popover: {
          title: 'Theme Visuel',
          description: 'Personnalisez l\'apparence avec plus de 30 themes disponibles.',
        },
      },
      {
        element: '[data-tour="settings-save"]',
        popover: {
          title: 'Sauvegarder',
          description: 'N\'oubliez pas de sauvegarder vos modifications.',
        },
      },
    ],
  },

  '/trash': {
    pageTitle: 'Corbeille',
    steps: [
      {
        element: '[data-tour="trash-table"]',
        popover: {
          title: 'Elements Supprimes',
          description: 'Restaurez ou supprimez definitivement vos elements.',
        },
      },
      {
        element: '[data-tour="trash-empty"]',
        popover: {
          title: 'Vider la Corbeille',
          description: 'Attention : cette action supprime definitivement tous les elements.',
        },
      },
    ],
  },

  '/archive': {
    pageTitle: 'Archives',
    steps: [
      {
        element: '[data-tour="archive-table"]',
        popover: {
          title: 'Elements Archives',
          description: 'Restaurez ou deplacez vos elements vers la corbeille.',
        },
      },
      {
        element: '[data-tour="archive-empty"]',
        popover: {
          title: 'Vider l\'Archive',
          description: 'Deplacez tous les elements archives vers la corbeille.',
        },
      },
    ],
  },

  '/team': {
    pageTitle: 'Equipe',
    steps: [
      {
        element: '[data-tour="team-header"]',
        popover: {
          title: 'Gestion d\'Equipe',
          description: 'Creez et gerez vos equipes collaboratives.',
        },
      },
      {
        element: '[data-tour="team-members"]',
        popover: {
          title: 'Membres',
          description: 'Visualisez et gerez les membres de votre equipe.',
        },
      },
      {
        element: '[data-tour="team-invite"]',
        popover: {
          title: 'Invitations',
          description: 'Invitez de nouveaux membres par email.',
        },
      },
    ],
  },

}
