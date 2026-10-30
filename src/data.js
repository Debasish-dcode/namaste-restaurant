/* ===== Edit your restaurant details here ===== */
export const R = {
  name: "Namaste Restaurant",
  tagline: "Authentic Indian flavours, served with love",
  phone: "+91 8984393959",
  whatsapp: "+918984393959", // country code + number, no + or spaces
  website: "https://www.namasterestaurant.com",
  instagram: "namaste_restaurant", // without @
  deliveryFee: 40,
  freeDeliveryAbove: 500,
  baseRating: 4.6,
  baseReviews: 128,
  hours: { open: "11:00", close: "23:00" },
};

/*
 Dish photos:
  1) If public/images/dishes/<id>.jpg exists, it is used (best: your own photos).
  2) Otherwise the app finds a free photo on Wikimedia Commons using `q`.
  3) If neither works, a neutral "Add photo" tile is shown.
*/
export const MENU = [
  { id: "starters", title: "Starters", note: "Small plates to begin with", scene: "starters", items: [
    { id: "paneer-tikka", name: "Paneer Tikka", desc: "Charred cottage cheese with mint chutney", price: 220, veg: true, isVeg: true, badges: ["bestseller"], q: "paneer tikka" },
    { id: "spring-rolls", name: "Veg Spring Rolls", desc: "Crisp rolls with sweet chilli dip", price: 160, veg: true, isVeg: true, q: "vegetable spring rolls" },
    { id: "hara-bhara-kebab", name: "Hara Bhara Kebab", desc: "Spinach and green pea patties", price: 180, veg: true, isVeg: true, q: "hara bhara kabab" },
    { id: "chicken-65", name: "Chicken 65", desc: "Spicy fried chicken with curry leaves", price: 260, veg: false, isVeg: false, badges: ["spicy"], q: "chicken 65" },
    { id: "fish-amritsari", name: "Fish Amritsari", desc: "Gram-flour battered fish, ajwain", price: 320, veg: false, isVeg: false, q: "amritsari fish fry" },
    { id: "tomato-soup", name: "Tomato Soup", desc: "Slow-cooked with basil and cream", price: 120, veg: true, isVeg: true, q: "tomato soup bowl" },
  ]},
  { id: "mains", title: "Main Course", note: "Lunch & dinner favourites", scene: "mains", items: [
    { id: "dal-makhani", name: "Dal Makhani", desc: "Black lentils simmered overnight", price: 240, veg: true, isVeg: true, q: "dal makhani" },
    { id: "paneer-butter-masala", name: "Paneer Butter Masala", desc: "Rich tomato-butter gravy", price: 280, veg: true, isVeg: true, badges: ["chef"], q: "paneer butter masala" },
    { id: "veg-biryani", name: "Veg Biryani", desc: "Fragrant basmati with vegetables and raita", price: 250, veg: true, isVeg: true, q: "vegetable biryani" },
    { id: "chicken-biryani", name: "Chicken Biryani", desc: "Dum-cooked, served with raita", price: 320, veg: false, isVeg: false, badges: ["bestseller"], q: "chicken biryani" },
    { id: "butter-chicken", name: "Butter Chicken", desc: "Tandoori chicken in creamy tomato sauce", price: 340, veg: false, isVeg: false, q: "butter chicken" },
    { id: "rogan-josh", name: "Mutton Rogan Josh", desc: "Slow-braised Kashmiri-style curry", price: 420, veg: false, isVeg: false, q: "rogan josh" },
    { id: "dalma", name: "Odia Dalma with Rice", desc: "Lentils and vegetables, a local favourite", price: 200, veg: true, isVeg: true, q: "dalma odisha" },
    { id: "butter-naan", name: "Butter Naan", desc: "Soft tandoor bread", price: 50, veg: true, isVeg: true, badges: ["new"], q: "butter naan" },
    { id: "jeera-rice", name: "Jeera Rice", desc: "Basmati tempered with cumin", price: 140, veg: true, isVeg: true, q: "jeera rice" },
  ]},
  { id: "desserts", title: "Desserts", note: "Something sweet to finish", scene: "desserts", items: [
    { id: "gulab-jamun", name: "Gulab Jamun (2 pcs)", desc: "Warm milk dumplings in rose syrup", price: 100, veg: true, isVeg: true, q: "gulab jamun" },
    { id: "rasmalai", name: "Rasmalai (2 pcs)", desc: "Soft cheese discs in saffron milk", price: 130, veg: true, isVeg: true, q: "rasmalai" },
    { id: "chhena-poda", name: "Chhena Poda", desc: "Odisha's caramelised cheese cake", price: 120, veg: true, isVeg: true, q: "chhena poda" },
    { id: "gajar-halwa", name: "Gajar Halwa", desc: "Carrot pudding with nuts", price: 120, veg: true, isVeg: true, q: "gajar ka halwa" },
    { id: "brownie", name: "Brownie with Ice Cream", desc: "Warm chocolate brownie, vanilla scoop", price: 180, veg: true, isVeg: true, q: "chocolate brownie ice cream" },
    { id: "kulfi-falooda", name: "Kulfi Falooda", desc: "Pistachio kulfi with vermicelli", price: 150, veg: true, isVeg: true, q: "kulfi falooda" },
  ]},
];

export const ALL = MENU.flatMap((c) => c.items);
