# Namaste Restaurant – React Menu & Ordering Site

## Run in VS Code

1. Install Node.js from https://nodejs.org and open this folder in VS Code.
2. Open the terminal (`Ctrl + ``) and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open the address shown in the terminal, usually http://localhost:5173.

The QR camera works on `localhost` and on HTTPS.

Before placing dine-in orders, create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Restart the development server after changing environment variables.

## Photos

- Put your own photos in `public/images/dishes/<dish-id>.jpg`. Dish IDs are listed in `src/data.js`, for example `paneer-tikka.jpg`.
- Add the restaurant's main photo at `public/images/restaurant.jpg`.
- Missing photos are looked up automatically on Wikimedia Commons, which requires an internet connection. Check each dish photo and replace any incorrect images.

## Your Details

Edit `src/data.js` to update the restaurant name, phone number, website, Instagram, WhatsApp, menu items, and prices.

## QR Codes

Create one QR code per table containing a link such as `https://yourdomain.com/?table=5` to open the menu directly.

Alternatively, use the text `Table 5`, which works with the in-app scanner.
