// src/types/units.ts

export const COMMON_UNITS = [
  // Weight
  "g",    // gram
  "kg",   // kilogram
  "mg",   // milligram
  "oz",   // ounce
  "lb",   // pound

  // Volume
  "ml",   // milliliter
  "l",    // liter
  "fl oz",// fluid ounce
  "tsp",  // teaspoon
  "tbsp", // tablespoon
  "cup",  // cup
  "pt",   // pint
  "qt",   // quart
  "gal",  // gallon

  // Count / Pieces
  "pcs",  // pieces
  "unit", // unit
  "item", // item
  "dozen",// dozen
  "pack", // pack
  "can",  // can
  "bottle",// bottle
  "jar",  // jar
  "box",  // box

  // Other common culinary units
  "pinch",
  "dash",
  "clove", // e.g., garlic
  "slice",
  "head",  // e.g., lettuce, cabbage
  "bunch", // e.g., herbs
  "stalk", // e.g., celery
  "sprig", // e.g., thyme
  "leaf",  // e.g., bay leaf
  "",      // For items that don't have a unit (e.g. "1 apple")
] as const;

export type Unit = typeof COMMON_UNITS[number];

// Optional: A more structured way if needed later, for now, a flat list is fine.
// export type WeightUnit = "g" | "kg" | "mg" | "oz" | "lb";
// export type VolumeUnit = "ml" | "l" | "fl oz" | "tsp" | "tbsp" | "cup" | "pt" | "qt" | "gal";
// export type PieceUnit = "pcs" | "unit" | "item" | "dozen" | "pack" | "can" | "bottle" | "jar" | "box";
// export type CulinaryUnit = "pinch" | "dash" | "clove" | "slice" | "head" | "bunch" | "stalk" | "sprig" | "leaf";
// export type Unit = WeightUnit | VolumeUnit | PieceUnit | CulinaryUnit | "";
