# Briefing : EisenhowerWidget.jsx

## Etat actuel (post-refactoring)

Le widget a ete completement reecrit. Il affiche desormais une **vraie matrice Eisenhower en 4 quadrants** (Q1-Q4) avec classification automatique, actions contextuelles, et integration au systeme de modal. Les corrections techniques majeures (memoisation, date-fns, priorite multi-format, DaisyUI) sont en place.

---

## Bilan des corrections

### Phase 1 : Corrections immediates — COMPLETE

- [x] Import `ArrowRight` et variable `today` supprimes
- [x] Logique de priorite alignee avec `isCritical()` (`checkIsImportant` supporte strings + numeriques)
- [x] Comparaison de dates via `date-fns` (`parseISO`, `isBefore`, `isToday`, `isTomorrow`, `addDays`)
- [x] Magic number `86400000` remplace par `addDays(new Date(), 1)`
- [x] Filtre/tri dans `useMemo` avec `[tasks]`
- [x] `disabled={updateTask.isPending}` sur les boutons d'action

### Phase 2 : Integration au systeme existant — 90%

- [x] Composants shadcn remplaces par classes DaisyUI (`btn`, `badge`, `bg-base-100`)
- [x] `onClick` sur chaque tache ouvre le `TaskModal` via `useUIStore`
- [x] `aria-label` sur les boutons d'action
- [ ] **Etat loading/skeleton** quand les tasks ne sont pas encore chargees

### Phase 3 : Matrice 4 quadrants — 80%

- [x] Logique de classification en 4 quadrants (urgent/important en 2 axes)
- [x] Grille 2x2 responsive (`grid-cols-1 md:grid-cols-2`)
- [x] Affichage de 5 taches max par quadrant avec indicateur "+N autres"
- [x] Actions contextuelles (Q1: done, Q2: modal, Q3: modal, Q4: trash)
- [x] Compteur par quadrant dans le header (badge)
- [ ] **Drag-and-drop entre quadrants** pour reclasser une tache

### Phase 4 : Enhancements optionnels — NON COMMENCE

- [ ] Champ `importance` dans le data model PocketBase
- [ ] Animations de transition entre quadrants
- [ ] Mode compact (1 quadrant) vs etendu (matrice complete)
- [ ] Indicateurs visuels de charge par quadrant

---

## Nouveaux problemes detectes

### 1. CRITIQUE : Classes Tailwind dynamiques (ne fonctionneront pas en production)

```javascript
// L105, L108, L120, L148 — classes construites par interpolation
`bg-${q.color}/5`     // ex: "bg-error/5"
`text-${q.color}`     // ex: "text-error"
`badge-${q.color}`    // ex: "badge-error"
`btn-${q.color}`      // ex: "btn-error"
```

**Probleme** : Tailwind purge les classes inutilisees au build. Le JIT compiler ne peut pas detecter les classes construites dynamiquement par interpolation de string. En production, ces classes seront **absentes du CSS bundle** et les couleurs ne s'afficheront pas.

**Solution** : Utiliser un mapping explicite avec les classes completes :

```javascript
const QUADRANT_STYLES = {
    q1: { bg: 'bg-error/5', text: 'text-error', badge: 'badge-error', btn: 'btn-error' },
    q2: { bg: 'bg-primary/5', text: 'text-primary', badge: 'badge-primary', btn: 'btn-primary' },
    q3: { bg: 'bg-warning/5', text: 'text-warning', badge: 'badge-warning', btn: 'btn-warning' },
    q4: { bg: 'bg-base-content/5', text: 'text-base-content', badge: 'badge-ghost', btn: 'btn-ghost' }
}
```

### 2. Imports inutilises

`AlertTriangle` (L4) et `Target` (L10) sont importes mais jamais utilises dans le nouveau code.

### 3. isPending global au lieu de per-task

```javascript
// L144 — desactive TOUS les boutons si UNE mutation est en cours
disabled={updateTask.isPending || moveToTrash.isPending}
```

Si on complete la tache A, le bouton de la tache B est aussi desactive. Devrait tracker l'ID de la tache en cours de mutation pour ne bloquer que le bouton concerne.

### 4. useMemo avec dependances implicites

```javascript
// L24-27 — defini a chaque render (pas de useCallback)
const checkIsImportant = (t) => { ... }
const checkIsUrgent = (t) => { ... }

// L42-73 — useMemo les utilise mais elles ne sont pas dans [tasks]
const matrix = useMemo(() => {
    // utilise checkIsImportant et checkIsUrgent
}, [tasks])
```

Les helpers sont recrees a chaque render mais ne sont pas dans les dependances du `useMemo`. Fonctionnellement correct (le resultat ne change pas), mais l'ESLint `exhaustive-deps` le signalera. Deplacer les helpers a l'interieur du `useMemo` ou les extraire en fonctions pures en dehors du composant.

### 5. Action Q1 : "done" au lieu de "in_progress"

Le briefing original prevoyait Q1 = "Commencer" (`status: 'in_progress'`). Le code actuel marque directement en `done`. A decider : est-ce que l'action Q1 devrait etre "commencer la tache" ou "la marquer comme terminee" ?

---

## Ce qui reste a faire (priorise)

### Priorite haute (bugs potentiels)

- [ ] Remplacer les classes Tailwind dynamiques par un mapping statique `QUADRANT_STYLES`
- [ ] Supprimer les imports inutilises (`AlertTriangle`, `Target`)
- [ ] Deplacer `checkIsImportant` et `checkIsUrgent` en dehors du composant (fonctions pures) ou dans le `useMemo`

### Priorite moyenne (UX)

- [ ] Ajouter un etat loading/skeleton quand `tasks` est vide ou en chargement
- [ ] Tracker la mutation par task ID au lieu du `isPending` global
- [ ] Decider et aligner l'action Q1 : `in_progress` vs `done`

### Priorite basse (evolutions)

- [ ] Drag-and-drop entre quadrants (`@dnd-kit` est deja dans le projet)
- [ ] Mode compact vs etendu (toggle dans le header du widget)
- [ ] Animations de transition entre quadrants
- [ ] Champ `importance` separe dans PocketBase

---

## Fichiers concernes

| Fichier | Role |
|---------|------|
| `src/components/EisenhowerWidget.jsx` | Composant widget (fichier principal) |
| `src/pages/DashboardV3.jsx` | Page parent, passe `tasks` en prop, gere le layout |
| `src/hooks/useTasks.js` | Hooks React Query (useUpdateTask, useMoveToTrash) |
| `src/services/tasks.service.js` | Service PocketBase (update, moveToTrash) |
| `src/stores/uiStore.js` | Store UI (TaskModal open/close) |
| `tailwind.config.js` | Verifier que les classes DaisyUI sont dans le safelist si necessaire |
