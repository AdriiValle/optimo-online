import { loadLocalEnv } from "./env";
import { unpooledSql } from "../lib/db";

loadLocalEnv();

// Idempotente: catálogo de materias primas de los menús de Amanda. Valores por 100 g de USDA FoodData Central
// (SR Legacy, dominio público); source_ref = fdc_id. null = el FDC no da el dato (no es 0).
// Convención: cereales, pasta y legumbre secos en crudo; carne y pescado en crudo.
// Solo actualiza filas con source = 'fdc': no pisa lo que Amanda haya editado a mano.
type FoodSeed = {
  name_es: string;
  aliases: string[];
  source_ref: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  iron_mg: number | null;
  calcium_mg: number | null;
  vit_d_ug: number | null;
};

const FOODS: FoodSeed[] = [
  { name_es: "Espinacas", aliases: ["espinacas","espinaca","espinacas baby"], source_ref: "168462", kcal: 23, protein_g: 2.86, carbs_g: 3.63, fat_g: 0.39, fiber_g: 2.2, sodium_mg: 79, iron_mg: 2.71, calcium_mg: 99, vit_d_ug: 0 }, // Spinach, raw
  { name_es: "Remolacha cocida", aliases: ["remolacha","remolacha cocida"], source_ref: "169146", kcal: 44, protein_g: 1.68, carbs_g: 9.96, fat_g: 0.18, fiber_g: 2, sodium_mg: 77, iron_mg: 0.79, calcium_mg: 16, vit_d_ug: 0 }, // Beets, cooked, boiled, drained
  { name_es: "Aguacate", aliases: ["aguacate","aguacates"], source_ref: "171705", kcal: 160, protein_g: 2, carbs_g: 8.53, fat_g: 14.66, fiber_g: 6.7, sodium_mg: 7, iron_mg: 0.55, calcium_mg: 12, vit_d_ug: 0 }, // Avocados, raw, all commercial varieties
  { name_es: "Nueces", aliases: ["nueces","nuez"], source_ref: "170187", kcal: 654, protein_g: 15.23, carbs_g: 13.71, fat_g: 65.21, fiber_g: 6.7, sodium_mg: 2, iron_mg: 2.91, calcium_mg: 98, vit_d_ug: 0 }, // Nuts, walnuts, english
  { name_es: "Pimiento rojo", aliases: ["pimiento rojo","pimientos rojos","pimiento","pimientos","pimientos de colores","pimientos salteados"], source_ref: "170108", kcal: 26, protein_g: 0.99, carbs_g: 6.03, fat_g: 0.3, fiber_g: 2.1, sodium_mg: 4, iron_mg: 0.43, calcium_mg: 7, vit_d_ug: 0 }, // Peppers, sweet, red, raw
  { name_es: "Pimiento verde", aliases: ["pimiento verde","pimientos verdes"], source_ref: "170427", kcal: 20, protein_g: 0.86, carbs_g: 4.64, fat_g: 0.17, fiber_g: 1.7, sodium_mg: 3, iron_mg: 0.34, calcium_mg: 10, vit_d_ug: 0 }, // Peppers, sweet, green, raw
  { name_es: "Pimiento amarillo", aliases: ["pimiento amarillo","pimientos amarillos"], source_ref: "169383", kcal: 27, protein_g: 1, carbs_g: 6.32, fat_g: 0.21, fiber_g: 0.9, sodium_mg: 2, iron_mg: 0.46, calcium_mg: 11, vit_d_ug: 0 }, // Peppers, sweet, yellow, raw
  { name_es: "Champiñones", aliases: ["champinones","champinon","champinones rehogados"], source_ref: "169251", kcal: 22, protein_g: 3.09, carbs_g: 3.26, fat_g: 0.34, fiber_g: 1, sodium_mg: 5, iron_mg: 0.5, calcium_mg: 3, vit_d_ug: 0.2 }, // Mushrooms, white, raw
  { name_es: "Cebolla", aliases: ["cebolla","cebollas"], source_ref: "170000", kcal: 40, protein_g: 1.1, carbs_g: 9.34, fat_g: 0.1, fiber_g: 1.7, sodium_mg: 4, iron_mg: 0.21, calcium_mg: 23, vit_d_ug: 0 }, // Onions, raw
  { name_es: "Puerro", aliases: ["puerro","puerros"], source_ref: "169246", kcal: 61, protein_g: 1.5, carbs_g: 14.15, fat_g: 0.3, fiber_g: 1.8, sodium_mg: 20, iron_mg: 2.1, calcium_mg: 59, vit_d_ug: 0 }, // Leeks, (bulb and lower leaf-portion), raw
  { name_es: "Tomate", aliases: ["tomate","tomates"], source_ref: "170457", kcal: 18, protein_g: 0.88, carbs_g: 3.89, fat_g: 0.2, fiber_g: 1.2, sodium_mg: 5, iron_mg: 0.27, calcium_mg: 10, vit_d_ug: 0 }, // Tomatoes, red, ripe, raw, year round average
  { name_es: "Pepino", aliases: ["pepino","pepinos"], source_ref: "168409", kcal: 15, protein_g: 0.65, carbs_g: 3.63, fat_g: 0.11, fiber_g: 0.5, sodium_mg: 2, iron_mg: 0.28, calcium_mg: 16, vit_d_ug: 0 }, // Cucumber, with peel, raw
  { name_es: "Ajo", aliases: ["ajo","ajos"], source_ref: "169230", kcal: 149, protein_g: 6.36, carbs_g: 33.06, fat_g: 0.5, fiber_g: 2.1, sodium_mg: 17, iron_mg: 1.7, calcium_mg: 181, vit_d_ug: 0 }, // Garlic, raw
  { name_es: "Perejil", aliases: ["perejil"], source_ref: "170416", kcal: 36, protein_g: 2.97, carbs_g: 6.33, fat_g: 0.79, fiber_g: 3.3, sodium_mg: 56, iron_mg: 6.2, calcium_mg: 138, vit_d_ug: 0 }, // Parsley, fresh
  { name_es: "Guisantes", aliases: ["guisantes","guisante"], source_ref: "170016", kcal: 77, protein_g: 5.22, carbs_g: 13.62, fat_g: 0.4, fiber_g: 4.5, sodium_mg: 108, iron_mg: 1.53, calcium_mg: 22, vit_d_ug: 0 }, // Peas, green, frozen, unprepared (Includes foods for USDA's Food Distribution Program)
  { name_es: "Zumo de limón", aliases: ["limon","zumo de limon"], source_ref: "167747", kcal: 22, protein_g: 0.35, carbs_g: 6.9, fat_g: 0.24, fiber_g: 0.3, sodium_mg: 1, iron_mg: 0.08, calcium_mg: 6, vit_d_ug: 0 }, // Lemon juice, raw
  { name_es: "Calabacín", aliases: ["calabacin","calabacines"], source_ref: "169291", kcal: 17, protein_g: 1.21, carbs_g: 3.11, fat_g: 0.32, fiber_g: 1, sodium_mg: 8, iron_mg: 0.37, calcium_mg: 16, vit_d_ug: 0 }, // Squash, summer, zucchini, includes skin, raw
  { name_es: "Naranja", aliases: ["naranja","naranjas"], source_ref: "169097", kcal: 47, protein_g: 0.94, carbs_g: 11.75, fat_g: 0.12, fiber_g: 2.4, sodium_mg: 0, iron_mg: 0.1, calcium_mg: 40, vit_d_ug: 0 }, // Oranges, raw, all commercial varieties
  { name_es: "Aceitunas negras", aliases: ["aceitunas negras","aceitunas","aceituna negra"], source_ref: "169094", kcal: 116, protein_g: 0.84, carbs_g: 6.04, fat_g: 10.9, fiber_g: 1.6, sodium_mg: 735, iron_mg: 6.28, calcium_mg: 88, vit_d_ug: 0 }, // Olives, ripe, canned (small-extra large)
  { name_es: "Manzana", aliases: ["manzana","manzanas"], source_ref: "171688", kcal: 52, protein_g: 0.26, carbs_g: 13.81, fat_g: 0.17, fiber_g: 2.4, sodium_mg: 1, iron_mg: 0.12, calcium_mg: 6, vit_d_ug: 0 }, // Apples, raw, with skin (Includes foods for USDA's Food Distribution Program)
  { name_es: "Lechuga", aliases: ["lechuga","lechuga romana","cogollos"], source_ref: "169247", kcal: 17, protein_g: 1.23, carbs_g: 3.29, fat_g: 0.3, fiber_g: 2.1, sodium_mg: 8, iron_mg: 0.97, calcium_mg: 33, vit_d_ug: 0 }, // Lettuce, cos or romaine, raw
  { name_es: "Zanahoria", aliases: ["zanahoria","zanahorias"], source_ref: "170393", kcal: 41, protein_g: 0.93, carbs_g: 9.58, fat_g: 0.24, fiber_g: 2.8, sodium_mg: 69, iron_mg: 0.3, calcium_mg: 33, vit_d_ug: 0 }, // Carrots, raw
  { name_es: "Pipas de calabaza", aliases: ["pipas de calabaza","semillas de calabaza"], source_ref: "170556", kcal: 559, protein_g: 30.23, carbs_g: 10.71, fat_g: 49.05, fiber_g: 6, sodium_mg: 7, iron_mg: 8.82, calcium_mg: 46, vit_d_ug: 0 }, // Seeds, pumpkin and squash seed kernels, dried
  { name_es: "Brócoli", aliases: ["brocoli"], source_ref: "170379", kcal: 34, protein_g: 2.82, carbs_g: 6.64, fat_g: 0.37, fiber_g: 2.6, sodium_mg: 33, iron_mg: 0.73, calcium_mg: 47, vit_d_ug: 0 }, // Broccoli, raw
  { name_es: "Rúcula", aliases: ["rucula"], source_ref: "169387", kcal: 25, protein_g: 2.58, carbs_g: 3.65, fat_g: 0.66, fiber_g: 1.6, sodium_mg: 27, iron_mg: 1.46, calcium_mg: 160, vit_d_ug: 0 }, // Arugula, raw
  { name_es: "Calabaza", aliases: ["calabaza"], source_ref: "168448", kcal: 26, protein_g: 1, carbs_g: 6.5, fat_g: 0.1, fiber_g: 0.5, sodium_mg: 1, iron_mg: 0.8, calcium_mg: 21, vit_d_ug: 0 }, // Pumpkin, raw
  { name_es: "Lombarda", aliases: ["lombarda","col lombarda"], source_ref: "169977", kcal: 31, protein_g: 1.43, carbs_g: 7.37, fat_g: 0.16, fiber_g: 2.1, sodium_mg: 27, iron_mg: 0.8, calcium_mg: 45, vit_d_ug: 0 }, // Cabbage, red, raw
  { name_es: "Espárragos verdes", aliases: ["esparragos","esparragos verdes","esparrago"], source_ref: "168389", kcal: 20, protein_g: 2.2, carbs_g: 3.88, fat_g: 0.12, fiber_g: 2.1, sodium_mg: 2, iron_mg: 2.14, calcium_mg: 24, vit_d_ug: 0 }, // Asparagus, raw
  { name_es: "Judías verdes", aliases: ["judias verdes","judia verde"], source_ref: "169961", kcal: 31, protein_g: 1.83, carbs_g: 6.97, fat_g: 0.22, fiber_g: 2.7, sodium_mg: 6, iron_mg: 1.03, calcium_mg: 37, vit_d_ug: 0 }, // Beans, snap, green, raw
  { name_es: "Plátano", aliases: ["platano","platanos","banana"], source_ref: "173944", kcal: 89, protein_g: 1.09, carbs_g: 22.84, fat_g: 0.33, fiber_g: 2.6, sodium_mg: 1, iron_mg: 0.26, calcium_mg: 5, vit_d_ug: 0 }, // Bananas, raw
  { name_es: "Dátiles", aliases: ["datiles","datil"], source_ref: "168191", kcal: 277, protein_g: 1.81, carbs_g: 74.97, fat_g: 0.15, fiber_g: 6.7, sodium_mg: 1, iron_mg: 0.9, calcium_mg: 64, vit_d_ug: 0 }, // Dates, medjool
  { name_es: "Kiwi", aliases: ["kiwi","kiwis"], source_ref: "168153", kcal: 61, protein_g: 1.14, carbs_g: 14.66, fat_g: 0.52, fiber_g: 3, sodium_mg: 3, iron_mg: 0.31, calcium_mg: 34, vit_d_ug: 0 }, // Kiwifruit, green, raw
  { name_es: "Fresas", aliases: ["fresas","fresa"], source_ref: "167762", kcal: 32, protein_g: 0.67, carbs_g: 7.68, fat_g: 0.3, fiber_g: 2, sodium_mg: 1, iron_mg: 0.41, calcium_mg: 16, vit_d_ug: 0 }, // Strawberries, raw
  { name_es: "Arándanos", aliases: ["arandanos","arandano"], source_ref: "171711", kcal: 57, protein_g: 0.74, carbs_g: 14.49, fat_g: 0.33, fiber_g: 2.4, sodium_mg: 1, iron_mg: 0.28, calcium_mg: 6, vit_d_ug: 0 }, // Blueberries, raw
  { name_es: "Frambuesas", aliases: ["frambuesas","frambuesa"], source_ref: "167755", kcal: 52, protein_g: 1.2, carbs_g: 11.94, fat_g: 0.65, fiber_g: 6.5, sodium_mg: 1, iron_mg: 0.69, calcium_mg: 25, vit_d_ug: 0 }, // Raspberries, raw
  { name_es: "Zumo de naranja", aliases: ["zumo de naranja"], source_ref: "169098", kcal: 45, protein_g: 0.7, carbs_g: 10.4, fat_g: 0.2, fiber_g: 0.2, sodium_mg: 1, iron_mg: 0.2, calcium_mg: 11, vit_d_ug: 0 }, // Orange juice, raw (Includes foods for USDA's Food Distribution Program)
  { name_es: "Pera", aliases: ["pera","peras"], source_ref: "169118", kcal: 57, protein_g: 0.36, carbs_g: 15.23, fat_g: 0.14, fiber_g: 3.1, sodium_mg: 1, iron_mg: 0.18, calcium_mg: 9, vit_d_ug: 0 }, // Pears, raw
  { name_es: "Piña", aliases: ["pina"], source_ref: "169124", kcal: 50, protein_g: 0.54, carbs_g: 13.12, fat_g: 0.12, fiber_g: 1.4, sodium_mg: 1, iron_mg: 0.29, calcium_mg: 13, vit_d_ug: 0 }, // Pineapple, raw, all varieties
  { name_es: "Pechuga de pollo", aliases: ["pechuga de pollo","pechugas de pollo","pollo","pollo plancha","pollo hervido"], source_ref: "171077", kcal: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.62, fiber_g: 0, sodium_mg: 45, iron_mg: 0.37, calcium_mg: 5, vit_d_ug: 0 }, // Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw
  { name_es: "Muslo de pollo (sin piel)", aliases: ["muslo de pollo","muslos de pollo","contramuslo de pollo","contramuslos de pollo"], source_ref: "173627", kcal: 121, protein_g: 19.66, carbs_g: 0, fat_g: 4.12, fiber_g: 0, sodium_mg: 95, iron_mg: 0.81, calcium_mg: 7, vit_d_ug: 0 }, // Chicken, broilers or fryers, dark meat, thigh, meat only, raw
  { name_es: "Pechuga de pavo", aliases: ["pechuga de pavo","pechugas de pavo","pavo"], source_ref: "171098", kcal: 114, protein_g: 23.66, carbs_g: 0.14, fat_g: 1.48, fiber_g: 0, sodium_mg: 113, iron_mg: 0.73, calcium_mg: 11, vit_d_ug: 0.1 }, // Turkey, whole, breast, meat only, raw
  { name_es: "Ternera picada 90/10", aliases: ["hamburguesa de ternera","hamburguesa de calidad de ternera","ternera picada","carne picada de ternera","hamburguesa"], source_ref: "174030", kcal: 176, protein_g: 20, carbs_g: 0, fat_g: 10, fiber_g: 0, sodium_mg: 66, iron_mg: 2.24, calcium_mg: 12, vit_d_ug: 0.1 }, // Beef, ground, 90% lean meat / 10% fat, raw
  { name_es: "Lubina", aliases: ["lubina","lubinas"], source_ref: "175142", kcal: 97, protein_g: 18.43, carbs_g: 0, fat_g: 2, fiber_g: 0, sodium_mg: 68, iron_mg: 0.29, calcium_mg: 10, vit_d_ug: 5.6 }, // Fish, sea bass, mixed species, raw
  { name_es: "Atún fresco", aliases: ["atun","atun fresco","atun a la plancha"], source_ref: "175159", kcal: 109, protein_g: 24.4, carbs_g: 0, fat_g: 0.49, fiber_g: 0, sodium_mg: 45, iron_mg: 0.77, calcium_mg: 4, vit_d_ug: 1.7 }, // Fish, tuna, fresh, yellowfin, raw
  { name_es: "Atún en lata al natural", aliases: ["atun al natural","atun en lata","lata de atun","latas de atun","atun en conserva"], source_ref: "173709", kcal: 86, protein_g: 19.44, carbs_g: 0, fat_g: 0.96, fiber_g: 0, sodium_mg: 247, iron_mg: 1.63, calcium_mg: 17, vit_d_ug: 1.2 }, // Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program)
  { name_es: "Atún en aceite (escurrido)", aliases: ["atun en aceite"], source_ref: "173708", kcal: 198, protein_g: 29.13, carbs_g: 0, fat_g: 8.21, fiber_g: 0, sodium_mg: 416, iron_mg: 1.39, calcium_mg: 13, vit_d_ug: 6.7 }, // Fish, tuna, light, canned in oil, drained solids
  { name_es: "Salmón", aliases: ["salmon"], source_ref: "175167", kcal: 208, protein_g: 20.42, carbs_g: 0, fat_g: 13.42, fiber_g: 0, sodium_mg: 59, iron_mg: 0.34, calcium_mg: 9, vit_d_ug: 11 }, // Fish, salmon, Atlantic, farmed, raw
  { name_es: "Langostinos", aliases: ["langostinos","langostino","gambas","gamba"], source_ref: "175179", kcal: 85, protein_g: 20.1, carbs_g: 0, fat_g: 0.51, fiber_g: null, sodium_mg: 119, iron_mg: 0.52, calcium_mg: 64, vit_d_ug: null }, // Crustaceans, shrimp, raw
  { name_es: "Huevo", aliases: ["huevo","huevos","huevos plancha","huevos a la plancha","huevos revueltos","tortilla"], source_ref: "171287", kcal: 143, protein_g: 12.56, carbs_g: 0.72, fat_g: 9.51, fiber_g: 0, sodium_mg: 142, iron_mg: 1.75, calcium_mg: 56, vit_d_ug: 2 }, // Egg, whole, raw, fresh
  { name_es: "Queso cottage", aliases: ["queso cottage","cottage"], source_ref: "172179", kcal: 98, protein_g: 11.12, carbs_g: 3.38, fat_g: 4.3, fiber_g: 0, sodium_mg: 315, iron_mg: 0.07, calcium_mg: 83, vit_d_ug: 0.1 }, // Cheese, cottage, creamed, large or small curd
  { name_es: "Queso de cabra", aliases: ["queso de cabra","rulo de cabra"], source_ref: "173435", kcal: 264, protein_g: 18.52, carbs_g: 0, fat_g: 21.08, fiber_g: 0, sodium_mg: 459, iron_mg: 1.9, calcium_mg: 140, vit_d_ug: 0.4 }, // Cheese, goat, soft type
  { name_es: "Bacalao", aliases: ["bacalao","bacalao fresco"], source_ref: "171955", kcal: 82, protein_g: 17.81, carbs_g: 0, fat_g: 0.67, fiber_g: 0, sodium_mg: 54, iron_mg: 0.38, calcium_mg: 16, vit_d_ug: 0.9 }, // Fish, cod, Atlantic, raw
  { name_es: "Sardinas en aceite (escurridas)", aliases: ["sardinas","sardinas en aceite","sardinillas"], source_ref: "175139", kcal: 208, protein_g: 24.62, carbs_g: 0, fat_g: 11.45, fiber_g: 0, sodium_mg: 307, iron_mg: 2.92, calcium_mg: 382, vit_d_ug: 4.8 }, // Fish, sardine, Atlantic, canned in oil, drained solids with bone
  { name_es: "Caballa", aliases: ["caballa"], source_ref: "175119", kcal: 205, protein_g: 18.6, carbs_g: 0, fat_g: 13.89, fiber_g: 0, sodium_mg: 90, iron_mg: 1.63, calcium_mg: 12, vit_d_ug: 16.1 }, // Fish, mackerel, Atlantic, raw
  { name_es: "Garbanzos (secos)", aliases: ["garbanzos secos"], source_ref: "173756", kcal: 378, protein_g: 20.47, carbs_g: 62.95, fat_g: 6.04, fiber_g: 12.2, sodium_mg: 24, iron_mg: 4.31, calcium_mg: 57, vit_d_ug: 0 }, // Chickpeas (garbanzo beans, bengal gram), mature seeds, raw
  { name_es: "Garbanzos cocidos (bote, escurridos)", aliases: ["garbanzos","garbanzos cocidos","garbanzos de bote"], source_ref: "173800", kcal: 139, protein_g: 7.05, carbs_g: 22.53, fat_g: 2.77, fiber_g: 6.4, sodium_mg: 246, iron_mg: 1.07, calcium_mg: 45, vit_d_ug: 0 }, // Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained solids
  { name_es: "Lentejas (secas)", aliases: ["lentejas"], source_ref: "172420", kcal: 352, protein_g: 24.63, carbs_g: 63.35, fat_g: 1.06, fiber_g: 10.7, sodium_mg: 6, iron_mg: 6.51, calcium_mg: 35, vit_d_ug: 0 }, // Lentils, raw
  { name_es: "Alubias blancas (secas)", aliases: ["alubias","alubias blancas","judias blancas"], source_ref: "175202", kcal: 333, protein_g: 23.36, carbs_g: 60.27, fat_g: 0.85, fiber_g: 15.2, sodium_mg: 16, iron_mg: 10.44, calcium_mg: 240, vit_d_ug: 0 }, // Beans, white, mature seeds, raw
  { name_es: "Arroz blanco (crudo)", aliases: ["arroz","arroz blanco"], source_ref: "169760", kcal: 360, protein_g: 6.61, carbs_g: 79.34, fat_g: 0.58, fiber_g: null, sodium_mg: 1, iron_mg: 0.8, calcium_mg: 9, vit_d_ug: 0 }, // Rice, white, medium-grain, raw, unenriched
  { name_es: "Arroz integral (crudo)", aliases: ["arroz integral"], source_ref: "169703", kcal: 367, protein_g: 7.54, carbs_g: 76.25, fat_g: 3.2, fiber_g: 3.6, sodium_mg: 5, iron_mg: 1.29, calcium_mg: 9, vit_d_ug: 0 }, // Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program)
  { name_es: "Quinoa (cruda)", aliases: ["quinoa","quinua"], source_ref: "168874", kcal: 368, protein_g: 14.12, carbs_g: 64.16, fat_g: 6.07, fiber_g: 7, sodium_mg: 5, iron_mg: 4.57, calcium_mg: 47, vit_d_ug: 0 }, // Quinoa, uncooked
  { name_es: "Boniato", aliases: ["boniato","boniatos","batata","boniato asado","boniato al micro"], source_ref: "168482", kcal: 86, protein_g: 1.57, carbs_g: 20.12, fat_g: 0.05, fiber_g: 3, sodium_mg: 55, iron_mg: 0.61, calcium_mg: 30, vit_d_ug: 0 }, // Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program)
  { name_es: "Patata", aliases: ["patata","patatas","patata cocida"], source_ref: "170026", kcal: 77, protein_g: 2.05, carbs_g: 17.49, fat_g: 0.09, fiber_g: 2.1, sodium_mg: 6, iron_mg: 0.81, calcium_mg: 12, vit_d_ug: 0 }, // Potatoes, flesh and skin, raw
  { name_es: "Pasta (cruda)", aliases: ["pasta","espaguetis","espaguettis","espaguetti","macarrones","spaghetti"], source_ref: "168927", kcal: 371, protein_g: 13.04, carbs_g: 74.67, fat_g: 1.51, fiber_g: 3.2, sodium_mg: 6, iron_mg: 1.3, calcium_mg: 21, vit_d_ug: 0 }, // Pasta, dry, unenriched
  { name_es: "Pasta sin gluten (maíz, cruda)", aliases: ["pasta sin gluten","macarrones sin gluten","espaguetis sin gluten"], source_ref: "168899", kcal: 357, protein_g: 7.46, carbs_g: 79.26, fat_g: 2.08, fiber_g: 11, sodium_mg: 3, iron_mg: 0.93, calcium_mg: 4, vit_d_ug: null }, // Pasta, gluten-free, corn, dry
  { name_es: "Pasta integral (cruda)", aliases: ["pasta integral","macarrones integrales","espaguetis integrales"], source_ref: "169738", kcal: 352, protein_g: 13.87, carbs_g: 73.37, fat_g: 2.93, fiber_g: 9.2, sodium_mg: 6, iron_mg: 3.62, calcium_mg: 29, vit_d_ug: 0 }, // Pasta, whole-wheat, dry (Includes foods for USDA's Food Distribution Program)
  { name_es: "Pan sin gluten (blanco)", aliases: ["pan sin gluten","tostadas de pan sin gluten","tostadas sin gluten"], source_ref: "174100", kcal: 248, protein_g: 4.31, carbs_g: 45.78, fat_g: 5.24, fiber_g: 4.3, sodium_mg: 447, iron_mg: 2.63, calcium_mg: 138, vit_d_ug: 0 }, // Bread, gluten-free, white, made with rice flour, corn starch, and/or tapioca
  { name_es: "Tortilla de trigo integral (fajita)", aliases: ["fajita integral","fajita","fajitas","tortilla integral","wrap integral"], source_ref: "174081", kcal: 310, protein_g: 9.76, carbs_g: 45.89, fat_g: 9.76, fiber_g: 9.8, sodium_mg: 617, iron_mg: 2.63, calcium_mg: 244, vit_d_ug: 0 }, // Tortillas, ready-to-bake or -fry, whole wheat
  { name_es: "Copos de avena", aliases: ["avena","copos de avena"], source_ref: "173904", kcal: 379, protein_g: 13.15, carbs_g: 67.7, fat_g: 6.52, fiber_g: 10.1, sodium_mg: 6, iron_mg: 4.25, calcium_mg: 52, vit_d_ug: 0 }, // Cereals, oats, regular and quick, not fortified, dry
  { name_es: "Crema de arroz (cereal)", aliases: ["crema de arroz","papilla de arroz"], source_ref: "173900", kcal: 370, protein_g: 6.3, carbs_g: 82.4, fat_g: 0.5, fiber_g: 0.7, sodium_mg: 6, iron_mg: 28.44, calcium_mg: 5, vit_d_ug: 0 }, // Cereals, CREAM OF RICE, dry
  { name_es: "Miel", aliases: ["miel"], source_ref: "169640", kcal: 304, protein_g: 0.3, carbs_g: 82.4, fat_g: 0, fiber_g: 0.2, sodium_mg: 4, iron_mg: 0.42, calcium_mg: 6, vit_d_ug: 0 }, // Honey
  { name_es: "Mermelada", aliases: ["mermelada"], source_ref: "169641", kcal: 278, protein_g: 0.37, carbs_g: 68.86, fat_g: 0.07, fiber_g: 1.1, sodium_mg: 32, iron_mg: 0.49, calcium_mg: 20, vit_d_ug: 0 }, // Jams and preserves
  { name_es: "Leche entera", aliases: ["leche entera","leche"], source_ref: "172217", kcal: 61, protein_g: 3.15, carbs_g: 4.78, fat_g: 3.27, fiber_g: 0, sodium_mg: 43, iron_mg: 0.03, calcium_mg: 113, vit_d_ug: 0.1 }, // Milk, whole, 3.25% milkfat, without added vitamin A and vitamin D
  { name_es: "Leche semidesnatada", aliases: ["leche semidesnatada","leche semi"], source_ref: "172205", kcal: 50, protein_g: 3.3, carbs_g: 4.8, fat_g: 1.98, fiber_g: 0, sodium_mg: 47, iron_mg: 0.02, calcium_mg: 120, vit_d_ug: 0 }, // Milk, reduced fat, fluid, 2% milkfat, without added vitamin A and vitamin D
  { name_es: "Leche desnatada", aliases: ["leche desnatada"], source_ref: "173432", kcal: 35, protein_g: 3.37, carbs_g: 4.86, fat_g: 0.18, fiber_g: 0, sodium_mg: 42, iron_mg: 0.03, calcium_mg: 122, vit_d_ug: 0 }, // Milk, nonfat, fluid, without added vitamin A and vitamin D (fat free or skim)
  { name_es: "Yogur natural", aliases: ["yogur","yogur natural","yogurt"], source_ref: "171284", kcal: 61, protein_g: 3.47, carbs_g: 4.66, fat_g: 3.25, fiber_g: 0, sodium_mg: 46, iron_mg: 0.05, calcium_mg: 121, vit_d_ug: 0.1 }, // Yogurt, plain, whole milk
  { name_es: "Kéfir", aliases: ["kefir"], source_ref: "170904", kcal: 43, protein_g: 3.79, carbs_g: 4.77, fat_g: 1.02, fiber_g: 0, sodium_mg: 40, iron_mg: 0.04, calcium_mg: 130, vit_d_ug: 1 }, // Kefir, lowfat, plain, LIFEWAY
  { name_es: "Bebida de almendra sin azúcar", aliases: ["bebida de almendra","bebida vegetal","leche de almendra"], source_ref: "174832", kcal: 15, protein_g: 0.4, carbs_g: 1.31, fat_g: 0.96, fiber_g: 0.2, sodium_mg: 72, iron_mg: 0.28, calcium_mg: 184, vit_d_ug: 1 }, // Beverages, almond milk, unsweetened, shelf stable
  { name_es: "Aceite de oliva", aliases: ["aceite","aceite de oliva","aove","aceite de oliva virgen extra"], source_ref: "171413", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, sodium_mg: 2, iron_mg: 0.56, calcium_mg: 1, vit_d_ug: 0 }, // Oil, olive, salad or cooking
  { name_es: "Almendras", aliases: ["almendras","almendra"], source_ref: "170567", kcal: 579, protein_g: 21.15, carbs_g: 21.55, fat_g: 49.93, fiber_g: 12.5, sodium_mg: 1, iron_mg: 3.71, calcium_mg: 269, vit_d_ug: 0 }, // Nuts, almonds
  { name_es: "Avellanas", aliases: ["avellanas","avellana"], source_ref: "170581", kcal: 628, protein_g: 14.95, carbs_g: 16.7, fat_g: 60.75, fiber_g: 9.7, sodium_mg: 0, iron_mg: 4.7, calcium_mg: 114, vit_d_ug: 0 }, // Nuts, hazelnuts or filberts
  { name_es: "Semillas de chía", aliases: ["chia","semillas de chia"], source_ref: "170554", kcal: 486, protein_g: 16.54, carbs_g: 42.12, fat_g: 30.74, fiber_g: 34.4, sodium_mg: 16, iron_mg: 7.72, calcium_mg: 631, vit_d_ug: null }, // Seeds, chia seeds, dried
  { name_es: "Curry en polvo", aliases: ["curry"], source_ref: "170924", kcal: 325, protein_g: 14.29, carbs_g: 55.83, fat_g: 14.01, fiber_g: 53.2, sodium_mg: 52, iron_mg: 19.1, calcium_mg: 525, vit_d_ug: 0 }, // Spices, curry powder
  { name_es: "Cúrcuma", aliases: ["curcuma"], source_ref: "172231", kcal: 312, protein_g: 9.68, carbs_g: 67.14, fat_g: 3.25, fiber_g: 22.7, sodium_mg: 27, iron_mg: 55, calcium_mg: 168, vit_d_ug: 0 }, // Spices, turmeric, ground
  { name_es: "Pimienta negra", aliases: ["pimienta","pimienta negra"], source_ref: "170931", kcal: 251, protein_g: 10.39, carbs_g: 63.95, fat_g: 3.26, fiber_g: 25.3, sodium_mg: 20, iron_mg: 9.71, calcium_mg: 443, vit_d_ug: 0 }, // Spices, pepper, black
  { name_es: "Proteína whey aislada (polvo)", aliases: ["proteina isolada","proteina aislada","whey","batido de proteinas","proteina whey"], source_ref: "173177", kcal: 359, protein_g: 58.14, carbs_g: 29.07, fat_g: 1.16, fiber_g: 0, sodium_mg: 372, iron_mg: 1.26, calcium_mg: 698, vit_d_ug: 0 }, // Beverages, Whey protein powder isolate
];

async function main() {
  const client = unpooledSql();
  await client.begin(async (tx) => {
    await tx`select set_config('app.current_role', 'admin', true)`;
    let inserted = 0;
    let updated = 0;
    for (const f of FOODS) {
      const rows = await tx<{ inserted: boolean }[]>`
        insert into foods (name_es, aliases, source, source_ref, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, iron_mg, calcium_mg, vit_d_ug)
        values (${f.name_es}, ${tx.array(f.aliases)}, 'fdc', ${f.source_ref}, ${f.kcal}, ${f.protein_g}, ${f.carbs_g}, ${f.fat_g}, ${f.fiber_g}, ${f.sodium_mg}, ${f.iron_mg}, ${f.calcium_mg}, ${f.vit_d_ug})
        on conflict (name_es) do update set
          aliases = excluded.aliases, source_ref = excluded.source_ref, kcal = excluded.kcal, protein_g = excluded.protein_g,
          carbs_g = excluded.carbs_g, fat_g = excluded.fat_g, fiber_g = excluded.fiber_g, sodium_mg = excluded.sodium_mg,
          iron_mg = excluded.iron_mg, calcium_mg = excluded.calcium_mg, vit_d_ug = excluded.vit_d_ug, updated_at = now()
        where foods.source = 'fdc'
          and (foods.aliases, foods.source_ref, foods.kcal, foods.protein_g, foods.carbs_g, foods.fat_g, foods.fiber_g,
               foods.sodium_mg, foods.iron_mg, foods.calcium_mg, foods.vit_d_ug)
          is distinct from
              (excluded.aliases, excluded.source_ref, excluded.kcal, excluded.protein_g, excluded.carbs_g, excluded.fat_g, excluded.fiber_g,
               excluded.sodium_mg, excluded.iron_mg, excluded.calcium_mg, excluded.vit_d_ug)
        returning (xmax = 0) as inserted
      `;
      if (rows[0]?.inserted) inserted++;
      else if (rows[0]) updated++;
    }
    const total = await tx<{ n: number }[]>`select count(*)::int as n from foods`;
    console.log(`seed-foods ok: ${FOODS.length} en el seed · ${inserted} insertadas · ${updated} actualizadas · ${total[0].n} en foods`);
  });
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
