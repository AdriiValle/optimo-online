// Rutas de solo lectura por rol. {A} = athleteId, {D} = hoy (YYYY-MM-DD), {F} = hace 6 días.
export const ROUTES = {
  athlete: [
    ["doc", "/a/{A}"],
    ["doc", "/ajustes"],
    ["api", "/api/me"],
    ["api", "/api/diaries?athleteId={A}&date={D}"],
    ["api", "/api/meals?athleteId={A}&from={F}&to={D}"],
  ],
  admin: [
    ["doc", "/panel"],
    ["doc", "/panel/ajustes"],
    ["doc", "/a/{A}"],
    ["api", "/api/athletes"],
    ["api", "/api/admin/accounts"],
  ],
  nutritionist: [
    ["doc", "/nutricion"],
    ["doc", "/nutricion/{A}"],
    ["doc", "/nutricion/{A}/perfil"],
    ["doc", "/nutricion/{A}/seguimiento"],
    ["doc", "/nutricion/{A}/compra"],
    ["doc", "/nutricion/{A}/plantillas"],
    ["doc", "/nutricion/alimentos"],
    ["api", "/api/nutrition/athletes"],
    ["api", "/api/nutrition/foods"],
    ["api", "/api/nutrition/templates"],
    ["api", "/api/nutrition/totals?athleteId={A}&from={F}&to={D}"],
  ],
};
