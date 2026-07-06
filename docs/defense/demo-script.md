# Guion de la demo en vivo — SprintWell

Guion paso a paso para la demo de la defensa (soporte del issue #104). El objetivo es mostrar el flujo completo en **~4 minutos** sin titubeos. La grabación del **vídeo de respaldo** y el **ensayo** son pasos humanos: este documento es el guion que ambos siguen.

## Preparación previa (antes de la defensa)
1. Levantar el stack: `docker compose up -d postgres`, arrancar el optimizer, el backend (migrado y con seed de un admin), y el frontend (`npm run dev`).
2. Sembrar datos base: un admin, 5–10 miembros con skills, un catálogo de skills.
3. Verificar que el optimizer responde (`POST /solve` de humo).
4. **Grabar el vídeo de respaldo** siguiendo exactamente este guion (issue #104), por si el directo falla.

## Guion (≈4 min)

| # | Acción | Qué decir / mostrar | Tiempo |
|---|---|---|---|
| 1 | Login como admin | "Modelo de 3 perfiles: anónimo, miembro, admin." | 0:15 |
| 2 | Backlog admin → crear sprint + 2–3 tareas (con deadline y dependencia) | "Poblamos el sprint; nótese skills requeridas y una dependencia." | 0:40 |
| 3 | Editor de reglas de un miembro (p. ej. el junior) | "Presupuesto de 100 puntos **en vivo**; añado `LEARN_SKILL devops`. Banner de conflictos si los hubiera." | 0:45 |
| 4 | Volver a admin → **Plan** en el sprint → modal → algoritmo CP-SAT, equidad **Nash** → Run | "Lanzamos la planificación; el solver corre en el servidor." (spinner) | 0:30 |
| 5 | Vista del PlanningRun: **Gantt** por persona/día + **dashboard de bienestar** | "Asignaciones por persona; felicidad media/mín/máx; barras ordenadas de peor a mejor servido." | 0:45 |
| 6 | **Comparador**: misma sprint, Nash vs Utilitario | "El momento clave: cambiar el modo de equidad **reasigna** — el junior sube de 0.50 a 1.00. La equidad importa, y se ve." | 0:45 |
| 7 | Explicabilidad de un miembro | "Por qué su felicidad es la que es: sus reglas y su f_j." | 0:20 |

## Plan de contingencia
- **Si el solver tarda/falla en la escala grande**: usar un sprint pequeño/mediano preparado de antemano (CP-SAT resuelve rápido ahí).
- **Si el directo se cae**: cortar al **vídeo de respaldo** sin dramatismo ("tengo una grabación de este mismo flujo").
- **Si una pantalla no carga**: los estados de carga/error están manejados; refrescar o pasar al vídeo.

## Datos de demo recomendados
- Un sprint pequeño (≈5 personas, ≈15 tareas) con al menos un miembro con `LEARN_SKILL` y otro con `BLACKOUT_DATE`, para que el contraste de equidad sea visible y el solver responda al instante.

> **Pasos humanos pendientes (issue #104):** grabar el vídeo de respaldo con este guion y ensayar la demo hasta ejecutarla en < 4 min sin leer.
