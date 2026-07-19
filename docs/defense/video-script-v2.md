# Guion de grabación del vídeo — v2 (toma por toma, 100 % fiel a la UI)

> Guion detallado para grabar el vídeo de entrega del TFM (requisito 5 del checklist).
> Cada bloque indica: **[ACCIÓN]** qué hacer y **dónde exactamente** en la web ·
> **[DECIR]** narración textual (léela tal cual o parafrasea) · **[EN PANTALLA]** qué
> debe verse. Los textos de la interfaz están **en inglés** (así es la app); la
> narración va **en español**. Duración objetivo: **8–10 min**.
>
> Todo lo que aquí se describe está verificado contra el código y contra los datos
> del `seed`. Si algo no coincide, manda el código.

---

## 0 · Antes de grabar (checklist de preparación)

1. **Levanta el stack** (opción A local o B contenedores del README) y **siembra**:
   ```bash
   # backend/
   npm run prisma:seed
   ```
   Esto deja el sprint **"Apollo — Sprint 14"** (15 días, 24 tareas), 10 miembros con
   skills y 16 reglas. Es el mismo dataset del caso de estudio del capítulo 7,
   diseñado para que **los modos de equidad den planes distintos**.
2. **Optimizer arriba** en `:8000` (imprescindible para planificar). Comprueba
   `curl localhost:8000/health` → `{"status":"ok"}`.
3. Abre el navegador en **`http://localhost:5173`**, ventana limpia, **zoom ~110 %**,
   pestaña única, sin extensiones que estorben. Cierra notificaciones del sistema.
4. **Empieza sin sesión** (si estabas logueado, pulsa tu nombre arriba a la derecha →
   **Logout**). Así el vídeo arranca desde el estado anónimo.
5. Graba **pantalla completa** a 1080p. Rostro con cámara es **opcional**.
6. Ten esta guía en un segundo monitor o impresa. No leas mirando fijo: habla natural.

> **Credenciales** — admin: `admin@sprintwell.local` / `changeme` ·
> miembros: `hugo@sprintwell.local` (y `ana@`, `beto@`, …) / `changeme`.

---

## 1 · Introducción (~0:45)

- **[ACCIÓN]** Empieza con la pantalla pública en `/` (la home, "Sprints"). No hace
  falta hacer nada aún, solo que se vea la app.
- **[DECIR]**
  > "Hola, soy José Carlos y este es **SprintWell**, mi Trabajo de Fin de Máster.
  > Es un sistema web que planifica los sprints de un equipo de desarrollo teniendo
  > en cuenta algo que las herramientas actuales —Jira, Linear, Asana— dejan fuera:
  > las **preferencias de cada persona**. Además del reparto clásico por capacidad,
  > dependencias y skills, SprintWell optimiza el **bienestar del equipo** con
  > criterios de equidad. Por dentro es un problema de optimización combinatoria
  > **NP-hard**, que resuelvo con el solver CP-SAT de Google OR-Tools. Os lo enseño
  > funcionando."
- **[EN PANTALLA]** La home pública con el encabezado **"Sprints"** y la barra
  superior con el enlace **"Login"** a la derecha.

---

## 2 · Vista pública sin login (~0:40)

- **[ACCIÓN]** En `/` (nav **"Sprints"**), señala la tarjeta **"Apollo — Sprint 14"** y
  **haz clic** en ella → te lleva a `/sprints/<id>` (detalle).
- **[DECIR]**
  > "Cualquier visitante, sin iniciar sesión, puede ver la actividad del equipo. Este
  > es el sprint de ejemplo, **Apollo**. Al entrar veo sus **metadatos** —fecha de
  > inicio, duración, número de tareas— y la **tabla de tareas** con su categoría,
  > dominio, esfuerzo, deadline y estado."
- **[EN PANTALLA]** Detalle del sprint: enlace **"← All sprints"**, título
  **"Apollo — Sprint 14"**, línea de metadatos, y la tabla con columnas
  **Task · Category · Domain · Effort · Deadline · Status**.
- **[ACCIÓN]** Pulsa **"← All sprints"** para volver a `/`.

---

## 3 · Login como admin (~0:30)

- **[ACCIÓN]** Pulsa **"Login"** (barra superior derecha) → vas a `/login`.
- **[ACCIÓN]** En el campo **"Email"** escribe `admin@sprintwell.local`; en
  **"Password"** escribe `changeme`; pulsa el botón **"Sign in"**.
- **[DECIR]**
  > "El sistema tiene tres perfiles: anónimo, miembro y administrador. Entro como
  > **administrador**. La autenticación usa JWT y el backend está en NestJS con
  > arquitectura por capas."
- **[EN PANTALLA]** Formulario con título **"Sign in"**, campos **Email** y
  **Password**, botón que cambia a **"Signing in…"** un instante y redirige a la home.
  La barra superior ahora muestra **tu nombre** (Admin) en vez de "Login", y aparecen
  los enlaces de admin: **Sprints · Team · Backlog · Rules · Compare**.

---

## 4 · Gestión del equipo (~0:45)

- **[ACCIÓN]** Pulsa **"Team"** en la barra (→ `/admin/team`).
- **[DECIR]**
  > "Como admin gestiono el equipo. Aquí están los **miembros** con sus **skills** y
  > nivel, y el **catálogo de skills**. Puedo dar de alta personas, asignarles una
  > skill con su nivel, y crear o borrar skills. Todo esto alimenta al planificador:
  > sin gente con las skills adecuadas, no hay plan posible."
- **[EN PANTALLA]** Título **"Team administration"**, la sección **"Members"** con su
  tabla y formulario de alta, y la sección **"Skills"**. Pasa el ratón por encima sin
  crear nada (los datos del seed ya bastan), o crea un miembro de ejemplo si quieres
  enseñar el formulario.

---

## 5 · El backlog: sprint y tareas (~0:50)

- **[ACCIÓN]** Pulsa **"Backlog"** (→ `/admin/sprints`).
- **[DECIR]**
  > "En el **Backlog** creo y edito sprints y sus tareas. Arriba tengo el formulario
  > para crear un sprint —nombre, fecha de inicio y duración—. Y aquí está **Apollo**,
  > el sprint sembrado."
- **[ACCIÓN]** En la fila de **"Apollo — Sprint 14"**, pulsa **"Manage tasks"**.
- **[DECIR]**
  > "Al desplegar sus tareas veo el formulario de alta: nombre, dominio, esfuerzo,
  > deadline opcional, categoría, y lo importante —los **skills requeridos** y las
  > **dependencias** entre tareas—. Estas restricciones son las que hacen el problema
  > difícil."
- **[EN PANTALLA]** Título **"Sprint administration"**; formulario con **Sprint name /
  Start date / Days** y botón **"Create sprint"**; la fila de Apollo con botones
  **"Plan"**, **"Manage tasks"** (ahora **"Hide tasks"**) y **"Delete"**; al desplegar,
  la sub-tabla **"Tasks"** con el formulario **"Add task"** (campos Task name, Domain,
  Effort, Deadline, Category, **Required skills**, **Depends on**).
- **[ACCIÓN]** Pulsa **"Hide tasks"** para colapsar y dejar la vista limpia.

---

## 6 · Lanzar la 1.ª planificación — Utilitarian (~0:45)

- **[ACCIÓN]** En la fila de Apollo, pulsa **"Plan"** (botón con icono de play). Se abre un
  modal titulado **`Plan "Apollo — Sprint 14"`**.
- **[ACCIÓN]** En el selector **"Algorithm"** deja **`CPSAT`**. En **"Equity mode"**
  elige **`UTILITARIAN`**. Pulsa **"Run planning"**.
- **[DECIR]**
  > "Voy a planificar dos veces el mismo sprint con **modos de equidad distintos**,
  > para compararlos. Primero, modo **utilitarista**: maximiza la felicidad **total**
  > del equipo. Elijo el algoritmo CP-SAT y lanzo. El solver corre en el servidor."
- **[EN PANTALLA]** El modal con los dos desplegables; el botón cambia a
  **"Planning…"** y, al terminar, **redirige** a `/planning-runs/<id>` (la vista de la
  corrida). No te detengas mucho aquí; esta corrida es solo para comparar luego.
- **[DECIR]** (breve, ya en la vista de la corrida)
  > "Aquí tengo el resultado utilitario. Ahora lanzo el otro modo."

---

## 7 · Lanzar la 2.ª planificación — Nash (~0:50)

- **[ACCIÓN]** Vuelve al **"Backlog"** (nav superior). En Apollo, pulsa **"Plan"** otra
  vez. En el modal, **Algorithm** = `CPSAT`, **Equity mode** = **`NASH`**. Pulsa
  **"Run planning"**.
- **[DECIR]**
  > "Ahora el modo **Nash**, que equilibra eficiencia y equidad penalizando dejar a
  > alguien muy insatisfecho. Lanzo de nuevo."
- **[EN PANTALLA]** De nuevo el modal → **"Planning…"** → redirige a la vista de la
  corrida Nash. **Quédate en esta pantalla** para la escena siguiente.

---

## 8 · Leer el resultado: Gantt + bienestar + explicabilidad (~1:30)

Estás en `/planning-runs/<id>` (la corrida **Nash**).

- **[ACCIÓN]** Señala el **encabezado** y baja lentamente por la página.
- **[DECIR]** (sobre el encabezado)
  > "Cada planificación tiene su ficha: algoritmo **CPSAT**, modo **NASH** y estado
  > **OPTIMAL**, con la **felicidad media y mínima** del equipo."
- **[ACCIÓN]** Enseña el **Gantt** (rejilla de personas × días con barras de colores).
  Pasa el ratón por una barra para que salga el **tooltip**.
- **[DECIR]** (sobre el Gantt)
  > "Este es el **diagrama de Gantt** del plan: cada fila es una persona, cada columna
  > un día, y cada barra una tarea coloreada por su estado. De un vistazo se ve la
  > carga repartida, los deadlines y las dependencias respetadas."
- **[ACCIÓN]** Baja hasta la sección **"Wellbeing"**.
- **[DECIR]** (sobre el dashboard)
  > "Y aquí está el **aporte del trabajo**: el dashboard de **bienestar**. Las métricas
  > globales —media, mínimo y máximo de felicidad— y una **barra por persona**,
  > ordenada de peor a mejor servido para que la inequidad salte a la vista."
- **[ACCIÓN]** Baja hasta **"Explain a member"**. En el desplegable
  **"Select a member…"** elige **`hugo`** (o el usuario que aparezca).
- **[DECIR]** (sobre explicabilidad)
  > "Y como toda decisión debe poder justificarse, el panel de **explicabilidad**
  > muestra, para cada persona, sus reglas y la felicidad que ha obtenido: por qué el
  > plan es como es."
- **[EN PANTALLA]** Encabezado **"Planning run"** + línea **"CPSAT · NASH · OPTIMAL"** +
  **"Mean happiness … · min …"**; la leyenda de colores (TODO/IN_PROGRESS/DONE/BLOCKED)
  y el Gantt; la sección **"Wellbeing"** con tres tarjetas (**Mean/Min/Max happiness**)
  y las barras por persona; la sección **"Explain a member"** con el panel
  **"Why hugo?"** y sus reglas.

---

## 9 · Comparar los dos modos — el momento clave (~1:15)

- **[ACCIÓN]** Pulsa **"Compare"** en la barra (→ `/compare`).
- **[ACCIÓN]** En el desplegable **"Sprint"** elige **"Apollo — Sprint 14"**. En
  **"Run A"** elige la corrida **`CPSAT · UTILITARIAN · OPTIMAL`**. En **"Run B"** elige
  **`CPSAT · NASH · OPTIMAL`**.
- **[DECIR]**
  > "Esta es la pantalla que resume la tesis del proyecto: **comparar** dos planes del
  > mismo sprint. A la izquierda el utilitario, a la derecha el de Nash. Fijaos en el
  > **diff de métricas**: con Nash la **felicidad media** sube y, sobre todo, sube el
  > **mínimo** —el peor servido mejora—. Y en la **felicidad por persona** se ve que,
  > al cambiar el modo de equidad, el plan **reasigna** el trabajo: hay quien mejora y
  > quien cede un poco para equilibrar. Eso es la equidad: no dejar a nadie tirado.
  > **No es un eslogan: se ve y se mide.**"
  >
  > _(Nota: el orden exacto de Δ por persona puede variar entre ejecuciones —el solver
  > no fija semilla—, pero la media y el mínimo suben con Nash de forma consistente.)_
- **[EN PANTALLA]** Título **"Compare planning runs"**; tres selectores
  (**Sprint · Run A · Run B**); la tabla de **diff de métricas globales** (con columna
  Δ), el **diff de felicidad por miembro** y la lista de **tareas reasignadas**; debajo,
  **los dos Gantt en paralelo** (**"Run A — UTILITARIAN"** / **"Run B — NASH"**).

---

## 10 · Perfil miembro: mis tareas y mis reglas (~1:15)

- **[ACCIÓN]** Cierra sesión: pulsa **tu nombre** (barra superior derecha) → **"Logout"**.
  Luego **"Login"** y entra como **`hugo@sprintwell.local`** / `changeme`.
- **[DECIR]**
  > "Cambio de perfil. Entro como **Hugo**, un miembro del equipo. Su menú es distinto:
  > solo ve lo suyo."
- **[ACCIÓN]** Pulsa **"My rules"** (→ `/my-rules`).
- **[DECIR]** (sobre el editor de reglas)
  > "Este es el **editor de reglas**, la cara del aporte conceptual. Cada persona
  > declara sus preferencias como reglas con un **presupuesto de 100 puntos** que se
  > actualiza **en vivo** —no puedes quererlo todo al máximo—. Hugo tiene una regla de
  > **aprender devops**. Si añado una regla que se pase del presupuesto, el sistema me
  > lo impide, y si dos reglas se contradicen, aparece un **aviso de conflicto**."
- **[ACCIÓN]** Pulsa **"Add rule"** → se abre el modal **"Add rule"**. Enseña el
  desplegable **"Rule type"** (los 12 tipos), el deslizador **"Weight"** y el check
  **"Hard rule (must be satisfied)"**. Puedes pulsar **"Save rule"** para añadir una y
  ver subir la barra, o **"Cancel"** para no modificar el dato de demo.
- **[ACCIÓN]** Pulsa **"My tasks"** (→ `/my-tasks`).
- **[DECIR]** (sobre mis tareas)
  > "Y en **mis tareas** cada miembro ve lo que el plan le ha asignado y puede cambiar
  > el **estado** de sus propias tareas. Al cambiarlo, el sistema pide **confirmación**."
- **[ACCIÓN]** En una tarea, abre el desplegable de **estado** y elige otro valor (p.
  ej. `IN_PROGRESS`). Aparecerá un cuadro de confirmación
  **`Change "<tarea>" to IN_PROGRESS?`** → **Acepta**.
- **[EN PANTALLA]** Nav de miembro **Sprints · My tasks · My rules**; en My rules, la
  barra **"Weight budget X / 100"**, la lista de reglas con su peso, el modal **"Add
  rule"**; en My tasks, la tabla (**Task · Sprint · Category · Start · Status**) y el
  diálogo de confirmación del navegador.

---

## 11 · Cómo está construido (~0:45)

- **[ACCIÓN]** (Opcional) Cambia a una pestaña con el **repositorio de GitHub** o el
  README, o simplemente narra sobre la app.
- **[DECIR]**
  > "Por debajo, SprintWell son **tres servicios**: un backend en NestJS con dominio,
  > un **optimizer** en Python con OR-Tools CP-SAT, y este frontend en React con un
  > **cliente tipado generado desde el OpenAPI** del backend. Todo el desarrollo se ha
  > hecho asistido por IA de forma **auditable**: 85 Pull Requests revisados, casi 420
  > commits atómicos y CI en verde en cada uno. La memoria completa, el benchmark
  > reproducible y el caso de estudio están en el repositorio."
- **[EN PANTALLA]** El repo o el README (opcional).

---

## 12 · Cierre (~0:20)

- **[DECIR]**
  > "En resumen: SprintWell mete las **preferencias y la equidad dentro del modelo**,
  > resuelve un problema **NP-hard** con CP-SAT y hace que las decisiones sean
  > **explicables y comparables**. Gracias por ver la demo."
- **[EN PANTALLA]** Vuelve a la home o a la vista de una planificación como plano final.

---

## Plan de contingencia (si algo falla en directo)

- **La planificación tarda o da error** → asegúrate de que el **optimizer** está vivo
  (`curl localhost:8000/health`). El sprint del seed es pequeño y CP-SAT responde en
  segundos.
- **`INFEASIBLE`** → no debería pasar con el sprint del seed (es factible por
  construcción). Si tocaste los datos, vuelve a ejecutar `npm run prisma:seed`.
- **"Could not load sprints" u otro error de carga** → el backend no está arriba o el
  frontend apunta a otra URL; revisa `VITE_API_URL` y que el backend escuche en `:3000`.
- **Se te corta la demo** → ten grabado de antemano un vídeo de respaldo con este mismo
  guion y córtate a él sin dramatismo.

## Checklist de grabación

- [ ] Optimizer, backend, frontend y postgres arriba; `npm run prisma:seed` ejecutado.
- [ ] Navegador limpio, zoom ~110 %, en `http://localhost:5173`, **sin** sesión.
- [ ] Audio probado; captura de pantalla a 1080p.
- [ ] Recorrido ensayado al menos una vez de principio a fin (< 10 min).
- [ ] Vídeo subido (YouTube/Drive) con **acceso público** y URL añadida al README y al
      formulario de entrega.
