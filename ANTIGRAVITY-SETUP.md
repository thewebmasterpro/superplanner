# Antigravity - Frontend Architecture Setup

**Antigravity** is the frontend layer of Superplanner built with React + Vite + Tailwind + Shadcn/ui.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all Antigravity dependencies:
- React Query (API data sync)
- Zustand (state management)
- Tailwind CSS (utility-first styling)
- dnd-kit (drag-drop)
- lucide-react (icons)
- react-hot-toast (notifications)
- date-fns (date utilities)

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your Supabase credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` (or the port Vite assigns)

## Project Structure

```
src/
├── components/
│   ├── ui/           # Shadcn UI components (button, input, card, etc.)
│   ├── layout/       # Layout components (Navbar, Sidebar, MainLayout)
│   └── tasks/        # Task-specific components (create modal, task card, etc.)
├── pages/            # Page components (Dashboard, Tasks, Campaigns, Settings)
├── stores/           # Zustand stores (appStore, userStore, uiStore)
├── hooks/            # Custom React hooks (useTasks, useProjects, etc.)
├── api/              # API client utilities
├── types/            # TypeScript types
├── utils/            # Utility functions
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── globals.css       # Tailwind + global styles
```

## Key Technologies

### Zustand (State Management)
Lightweight state management with 3 stores:
- `appStore` - Tasks, filters, view mode
- `userStore` - User preferences, theme
- `uiStore` - UI state (modals, sidebar, loading)

```javascript
import { useAppStore } from './stores/appStore'

function MyComponent() {
  const { tasks, setTasks } = useAppStore()
}
```

### React Query (Data Sync)
Automatic API sync and caching:
```javascript
import { useTasks, useCreateTask } from './hooks/useTasks'

function MyComponent() {
  const { data: tasks, isLoading } = useTasks(userId)
  const { mutate: createTask } = useCreateTask(userId)
}
```

### Tailwind CSS + Shadcn/ui
Utility-first styling with pre-built components:
```jsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
  Click me
</button>
```

### Custom Color Scheme
Status colors and priority levels:
- Status: todo (gray), in_progress (amber), blocked (red), done (green), cancelled (gray)
- Priority: 1-5 scale (gray to red)

## Development Workflow

### Adding a New Page
1. Create `src/pages/MyPage.jsx`
2. Add route to `App.jsx`
3. Add navigation link to `Sidebar.jsx`

### Adding a Component
1. Create in `src/components/`
2. Import Zustand store if needed
3. Use Tailwind classes for styling

### Adding a Hook
1. Create in `src/hooks/`
2. Use `useQuery` (read) or `useMutation` (write)
3. Export and import in pages/components

### Using Shadcn Components
Install new components as needed:
```bash
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add date-picker
```

## Build for Production

```bash
npm run build
```

Output: `dist/` directory

## Testing

Coming in Sprint 4...

## Next Steps

**Sprint 2:** Complete layout and pages  
**Sprint 3:** Task CRUD + Kanban drag-drop  
**Sprint 4:** Features (tags, timer, notifications)  
**Sprint 5:** Polish (dark mode, search, performance)

## Support

See main README.md for backend setup.
