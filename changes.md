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
- `src/App.jsx:123-130`: Preserved the scanned dine-in table while switching to home delivery, allowing users to switch back to dine-in.
- `src/App.jsx:23-25, 50-54, 113-118`: Added a separate last-scanned-table value so Dine-in remains selectable after delivery mode, including existing saved sessions.
- `src/App.jsx:23-25, 50-54, 113-131`: Reverted the last two dine-in switching changes and restored the previous delivery behavior.
- `src/App.jsx:330-333`: Updated the website link label from “Home delivery” to “Website”.
- `src/components/Sheets.jsx:2,5-24`: Added body scroll locking, Escape-key dismissal, and dialog semantics for order, confirmation, and rating sheets.
- `src/styles.css:2,6-7,35-38,42,61-63,88-92`: Added smooth scrolling, interaction feedback, modal/menu motion, hover states, and reduced-motion support.
- `src/App.jsx:278-286`, `src/styles.css:9-10`: Removed the full-page dish-photo background mosaic so the page uses a clean solid background.
- `src/App.jsx:320-326`, `src/styles.css:20`: Removed the restaurant website link from the contact row while retaining the dine-in table status.
- `src/App.jsx:323-325`, `src/styles.css:21`: Removed the dine-in table status from the contact row so only the phone contact remains.
- `src/styles.css:1-365`: Reworked the visual system with Google Fonts, warm premium palette, responsive hero/navigation/cards, refined controls, modal styling, mobile layout, and accessible motion preferences without changing application behavior.
- `src/styles.css:3-31,107-154,275-323`: Applied the selected luxury-dark visual direction with charcoal surfaces, gold accents, dark glass-like controls, stronger contrast, subtle gold borders, and CSS-only menu entrance motion.
- `src/styles.css:3-31,91-180,286-306`: Replaced the dark theme with a fresh-modern palette using white surfaces, green accents, clean borders, and lighter shadows.
- `src/styles.css:18-25,125-151,190-214,300-350`: Improved responsive alignment, hero sizing, menu grid behavior, touch targets, and the centered sticky order bar with safe-area spacing.
- `src/styles.css:257-277,348`: Fixed desktop card action overflow by fitting price and quantity controls within narrow responsive card columns.
- `src/styles.css:262-278`: Reordered card controls visually so Add/quantity appears on the left and the price appears on the right.
- `src/styles.css:21-32,368-375`: Moved fixed order-bar clearance from after the footer into the main content flow so the footer stays directly below the menu.
- `src/styles.css:359-374`: Fixed narrow mobile card alignment by sizing the quantity control and image so the price remains fully visible inside the card.
- `src/styles.css:346-350`: Increased the desktop menu card minimum width to prevent price and quantity controls from competing for space.
- `src/App.jsx:158-166, 249-257`: Updated WhatsApp order messages to show “New Order”, order ID, restaurant name, table/delivery details, item prices, quantities, and total.
