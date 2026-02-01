# V3 Implementation Plan

## 1. Stack & Architecture
- **Framework:** React + Vite (Existing)
- **Styling:** Tailwind CSS + **DaisyUI** (New)
- **Typography:** Inter (Google Fonts)
- **Icons:** Lucide React (Existing)
- **Layout:** CSS Grid (12 cols) for dashboards/lists

## 2. Key Libraries
- **Onboarding:** `driver.js` (Tour)
- **Interactivity:** `react-query` (instead of HTMX for React context) or HTMX-patterns if strict
- **Feedback:** `sonner` (Toast), `sweetalert2` (Confirmations)
- **Visualization:** `chart.js` + `react-chartjs-2`
- **Search:** Global Search via ChromaDB API (Planned)

## 3. Migration Steps
1.  **Dependencies**: Install `daisyui`, `driver.js`, `sonner`, `sweetalert2`, `chart.js`, `react-chartjs-2`.
2.  **Configuration**: 
    - Add `daisyui` to `tailwind.config.js`.
    - Configure default theme to `dark`.
    - Ensure 'Inter' font is active.
3.  **UI Refactor (Phase 1)**:
    - Create `DashboardV3` layout using CSS Grid.
    - Implement `TaskDashboard` with DaisyUI components.
    - Repurpose existing `Tasks` data fetching to new UI.
4.  **Feature Implementation**:
    - Add `driver.js` tour on first load (check `user.has_seen_v3_tour`).
    - Replace `toast` with `sonner`.
    - Replace delete confirmations with `sweetalert2`.
    - Add Chart.js widget.
5.  **Cleanup**: Remove unused legacy UI components (gradually).

## 4. Notes
- Backend interactions remain via PocketBase (`pb`).
- "HTMX" requirement is interpreted as "Optimistic UI / No Reloads" using React best practices, as combining direct HTMX with client-side React + PB JSON API is architecturally complex. We will deliver the *experience* of HTMX.
