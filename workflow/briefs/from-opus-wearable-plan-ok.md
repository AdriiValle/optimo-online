# from opus — wearable plan ok

- Hecho: sí
- Qué cambió (rutas):
  - `workflow/briefs/plan-wearable.md` (reescrito y anclado al código)
  - `workflow/briefs/from-opus-wearable-plan-ok.md` (este)
  - Sin código tocado.

## Visto bueno

Sí, con 5 correcciones que ya están en el plan:

1. **`POST /api/diaries` pisa todo** (`excluded.*` en todos los campos). Un form corto pondría sueño/HRV a null. Oleada 1 lo pasa a update parcial: clave ausente = no tocar.
2. **RLS:** `integrations_write` es solo de admin, así que el deportista no podría conectar. Se añade una policy para su propia fila. Los tokens van en una tabla aparte, `integration_tokens`, cifrados AES-GCM (`INTEGRATIONS_ENC_KEY`). Las queries de ficha no la leen.
3. **Enum en `schema.sql`:** `ADD VALUE IF NOT EXISTS` sin usar los valores nuevos en el mismo script (corre en una sola transacción implícita).
4. **Mapeo honesto por capacidades:** las docs públicas de Zepp (wiki `zepp-health/rest-api`) solo confirman sueño (deep/shallow/wake) y heartrate, no HRV, ni pulso en reposo, ni score. Amazfit arranca con `sleepHours` de la pulsera y el resto a mano hasta tener la doc de partner. `recovery` sigue a mano: no se copia el score ni se inventa una fórmula.
5. **Admin:** la pestaña `log` hoy solo se pinta para el deportista. El admin verá un chip de estado de solo lectura en la ficha, sin conectar ni desconectar.

## Oleadas

1. sonnet: schema + diario parcial + `lib/integrations/` + rutas `app/api/integrations/amazfit/{connect,callback,refresh,disconnect}` (503 sin env) + `integrationFor` + `.env.example`.
2. sonnet: `device-card.tsx` + form condicional en `home-client.tsx` + chip admin.
3. opus: look de esos bloques.
4. master: push `dev`, preview.

## Riesgos

Docs Zepp sin confirmar (la página de endpoints da 404) · alta de partner solo para empresas, con 3–7 días de revisión · región OAuth · vida del token contradictoria en la wiki · migración en el Neon compartido con prod (additive, pero el enum no se revierte) · RGPD datos de salud · fecha de la noche D vs D-1.

## Bloqueado sin Client ID

OAuth real, pull real, confirmar endpoints/región/scopes, saber si trae score/HRV/pulso en reposo, la fecha de la noche y el redirect URI de preview/prod. Todo lo demás cierra sin claves.

- Duda: para usarlo con deportistas reales hacen falta el alta de partner de Zepp como empresa y un aviso de consentimiento RGPD (datos de salud). No frena las oleadas 1–3.
- Recomendación: lanzar ya las oleadas 1–3. Adrián pide el alta en dev.huami.com a nombre de Óptimo y se añade una línea de consentimiento antes de activar con deportistas reales.
- Bloquea a Adrián: sí, solo para pasar a real (legal + alta de empresa). No bloquea las oleadas.
