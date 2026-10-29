# Changes

Project folder: `C:\Code Base\Resturant`

Change-log convention: Record every future code change here with its affected files/components, source line numbers, and a brief summary.

## 2026-10-29

- `src/supabase.js:8-13`: Updated missing-environment handling so the React app can render without Supabase variables.
- `src/App.jsx:205`: Added an explicit Supabase configuration error for dine-in order submission.
- `src/styles.css:93-114`: Improved Windows and desktop menu layout with a wider page, responsive two-column cards, larger hero content, and desktop spacing.
- `src/components/Sheets.jsx:16-29, 42-67`: Added the two-step order flow so selected items and checkout details are separate stages.
- `src/App.jsx:438-463`, `src/styles.css:66-72`: Added Continue and Cancel actions to the fixed bottom order bar.
- `src/App.jsx:431-435`, `src/styles.css:69`: Made the View order summary non-clickable.
- `src/App.jsx:448-455`: Made bottom-bar Cancel clear the selected cart items.
- `src/App.jsx:415-463`, `src/styles.css:66-72, 106-110`: Restored the order bar to a fixed bottom position.
- `src/styles.css:75-78`: Fixed cart row alignment so item details, quantity controls, and prices stay consistently positioned.
- `src/App.jsx:23-27, 49-56, 110-131`: Preserved the customer menu screen, table, and ordering mode across page refreshes.
