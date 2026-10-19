# Namaste Restaurant – React menu & ordering site

## Run in VS Code
1. Install Node.js (https://nodejs.org), then open this folder in VS Code.
2. Open the terminal (Ctrl+`) and run:
   ```
   npm install
   npm run dev
   ```
3. Open the address shown (http://localhost:5173). The QR camera works on `localhost` and on `https`.

## Photos
- Put your own photos in `public/images/dishes/<dish-id>.jpg` (ids are in `src/data.js`, e.g. `paneer-tikka.jpg`)
  and `public/images/restaurant.jpg` for the top picture.
- Missing photos are looked up automatically on Wikimedia Commons (needs internet). Check each dish and replace any that look wrong.

## Your details
Edit `src/data.js` (name, phone, website, Instagram, WhatsApp, menu and prices).

## QR codes
Make one QR code per table that contains a link like `https://yourdomain.com/?table=5` (opens the menu directly),
or just the text `Table 5` (works with the in-app scanner).
