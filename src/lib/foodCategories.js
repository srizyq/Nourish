// Food category icons — shared between FoodSearch (search results, add
// flow) and Dashboard (Favourites row), so a given food always gets the
// same icon wherever it appears. Tabler icon-font icons, not emoji —
// emoji render as blank "tofu" boxes for a lot of glyphs, especially the
// ones dynamically assigned to arbitrary search results, so this always
// renders and looks intentional rather than broken.
export const CATEGORY_STYLES = {
  meat:      { icon: "ti-meat",    color: "#8fbc8f" },
  seafood:   { icon: "ti-fish",    color: "#6aabcf" },
  egg:       { icon: "ti-egg",     color: "#e8c468" },
  dairy:     { icon: "ti-milk",    color: "#9f97e8" },
  fruit:     { icon: "ti-apple",   color: "#c07070" },
  vegetable: { icon: "ti-carrot",  color: "#7fae5f" },
  grain:     { icon: "ti-bread",   color: "#b48250" },
  sweet:     { icon: "ti-cookie",  color: "#d98fb0" },
  beverage:  { icon: "ti-cup",     color: "#6aabcf" },
  alcohol:   { icon: "ti-beer",    color: "#c17a4a" },
  other:     { icon: "ti-package", color: "#888888" },
  custom:    { icon: "ti-stars",   color: "#b48fd9" },
};

// Checked in order — more specific animal-protein categories first, so e.g.
// "Meat pie" matches "meat" before a generic bakery term could. Alcohol is
// deliberately checked after every food category (not just beverage), so
// e.g. "fruit cocktail" or "prawn cocktail" hit their real category via an
// earlier, more specific keyword before "cocktail" is ever tested — and
// "gin" is deliberately NOT a keyword here despite being a common spirit,
// since it's a substring of both "ginger" and "virgin" (as in a
// non-alcoholic "virgin mojito"), which would misclassify far more often
// than it would correctly classify.
export const CATEGORY_KEYWORDS = [
  ["seafood", ["fish", "salmon", "tuna", "prawn", "shrimp", "crab", "oyster", "squid", "calamari", "cod", "barramundi", "trout", "sushi", "sashimi", "seafood"]],
  ["meat", ["chicken", "beef", "pork", "lamb", "turkey", "bacon", "sausage", "mince", "steak", "ham", "meat", "veal", "duck", "mutton", "burger", "sirloin"]],
  ["egg", ["egg"]],
  ["dairy", ["milk", "cheese", "yoghurt", "yogurt", "cream", "butter", "custard"]],
  ["fruit", ["apple", "banana", "orange", "berry", "grape", "mango", "pineapple", "melon", "pear", "peach", "plum", "kiwi", "cherry", "fruit", "avocado"]],
  ["vegetable", ["broccoli", "spinach", "carrot", "potato", "tomato", "lettuce", "cabbage", "onion", "capsicum", "cucumber", "zucchini", "pumpkin", "corn", "bean", "vegetable", "salad", "kale", "mushroom"]],
  ["grain", ["bread", "rice", "oats", "pasta", "noodle", "cereal", "toast", "bagel", "muffin", "cake", "pastry", "pie", "naan", "roti", "wrap", "bun", "pizza", "biscuit", "cracker", "flour", "wheat", "quinoa"]],
  ["sweet", ["chocolate", "candy", "lolly", "sweet", "dessert", "ice cream", "honey", "sugar", "jam", "syrup", "cookie", "donut", "doughnut"]],
  // " ale" and " ipa" (with a leading space, not bare "ale"/"ipa") so real
  // products like "Original Pale Ale (Coopers)" and "XYZ IPA" match without
  // "ale" alone catching "tamale" or "kale" (the latter is moot anyway
  // since "vegetable" is checked first, but "tamale" has no such guard).
  ["alcohol", ["beer", "wine", "cider", "vodka", "whiskey", "whisky", "rum", "tequila", "bourbon", "champagne", "prosecco", "liqueur", "cocktail", "sangria", "spritz", "negroni", "margarita", "martini", "mojito", "sherry", "brandy", "schnapps", "lager", "stout", "porter", " ale", " ipa", "alcohol", "spirits"]],
  ["beverage", ["juice", "soda", "drink", "water", "coffee", "tea", "smoothie", "milkshake", "cola"]],
];

export function guessCategory(name) {
  const n = name.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some(k => n.includes(k))) return category;
  }
  return "other";
}

export function getCategoryStyle(food) {
  return CATEGORY_STYLES[food.category || guessCategory(food.name)] || CATEGORY_STYLES.other;
}
