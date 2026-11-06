import type { DishItemRole } from "./parse-dish";

/** Alimento del catálogo tal como lo usa el parser (sin valores nutricionales). */
export type CatalogFood = {
  id: string;
  name_es: string;
  /** Formas en las que aparece en los menús. Se normalizan (sin tildes, minúsculas) al casar. */
  aliases: string[];
  /** Parte del plato por defecto; si falta, el parser usa la posición en el plato. */
  role?: DishItemRole;
};

function food(name_es: string, aliases: string[], role: DishItemRole): CatalogFood {
  const id = name_es
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { id, name_es, aliases: [name_es, ...aliases], role };
}

/**
 * Materias primas de los menús reales (EJEMPLO DE MENU). Base de nombres y alias para el seed de `foods`;
 * los `id` son slugs locales hasta que existan las filas en DB.
 */
export const FOOD_CATALOG: CatalogFood[] = [
  // Verdura / fruta
  food("Espinacas", ["espinaca", "espinacas baby"], "veg"),
  food("Remolacha", [], "veg"),
  food("Tomate", [], "veg"),
  food("Cebolla", [], "veg"),
  food("Pepino", [], "veg"),
  food("Puerro", [], "veg"),
  food("Calabacín", [], "veg"),
  food("Pimiento", ["pimientos de colores"], "veg"),
  food("Champiñón", ["champiñones", "setas"], "veg"),
  food("Guisantes", ["guisante"], "veg"),
  food("Manzana", [], "veg"),
  food("Naranja", [], "veg"),
  food("Limón", ["zumo de limón"], "other"),
  // Proteína
  food("Pechuga de pollo", ["pechugas de pollo", "pollo"], "protein"),
  food("Muslo de pollo", ["muslos de pollo", "contramuslo de pollo", "contramuslos de pollo"], "protein"),
  food("Pechuga de pavo", ["pechugas de pavo", "pavo"], "protein"),
  food("Ternera", [], "protein"),
  food("Hamburguesa de ternera", ["hamburguesa"], "protein"),
  food("Dorada", [], "protein"),
  food("Lubina", [], "protein"),
  food("Merluza", [], "protein"),
  food("Salmón", [], "protein"),
  food("Atún", ["atun fresco"], "protein"),
  food("Melva", ["melva en conserva"], "protein"),
  food("Langostinos", ["langostino", "gambas"], "protein"),
  food("Huevo", ["huevos"], "protein"),
  food("Garbanzos cocidos", ["garbanzos", "garbanzo"], "protein"),
  food("Queso cottage", ["cottage"], "protein"),
  // Hidrato
  food("Arroz", ["arroz blanco"], "carb"),
  food("Quinoa", ["quinua"], "carb"),
  food("Boniato", ["batata"], "carb"),
  food("Patata", ["patatas"], "carb"),
  food("Pasta", ["macarrones", "espaguetis", "espaguettis", "spaghetti", "espagueti"], "carb"),
  food("Pasta sin gluten", ["macarrones sin gluten", "espaguetis sin gluten", "espaguettis sin gluten"], "carb"),
  food("Tortilla de trigo integral", ["fajita integral", "fajita", "fajitas", "wrap integral", "tortilla de trigo"], "carb"),
  // Grasa
  food("Aceite de oliva virgen extra", ["aceite de oliva", "aceite", "aove"], "fat"),
  food("Aguacate", [], "fat"),
  food("Nueces", ["nuez"], "fat"),
  food("Aceitunas negras", ["aceitunas", "aceituna"], "fat"),
  food("Pipas de calabaza", ["semillas de calabaza"], "fat"),
  food("Queso de cabra", ["rulo de cabra"], "fat"),
  // Condimentos
  food("Ajo", [], "other"),
  food("Perejil", [], "other"),
  food("Pimienta", [], "other"),
  food("Sal", [], "other"),
  food("Cúrcuma", [], "other"),
  food("Curry", [], "other"),
];
