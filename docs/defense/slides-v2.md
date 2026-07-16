---
marp: true
title: SprintWell — TFM (v2)
author: José Carlos Hernández
paginate: true
math: katex
style: |
  :root {
    --bg: #0f172a;
    --bg2: #1e293b;
    --fg: #e2e8f0;
    --muted: #94a3b8;
    --accent: #34d399;
    --accent2: #38bdf8;
    --danger: #f87171;
  }
  section {
    background: var(--bg);
    color: var(--fg);
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    font-size: 30px;
    padding: 60px 70px;
  }
  section h1 { color: #fff; font-size: 1.9em; line-height: 1.1; }
  section h2 { color: var(--accent); font-size: 1.25em; margin-bottom: 0.4em; }
  section h3 { color: var(--accent2); font-weight: 600; }
  strong { color: #fff; }
  em { color: var(--muted); font-style: normal; }
  a { color: var(--accent2); }
  code { background: var(--bg2); color: var(--accent); padding: 2px 8px; border-radius: 6px; }
  table { font-size: 0.85em; border-collapse: collapse; background: transparent; }
  /* Kill the default theme's zebra striping (a light band that hides text on dark). */
  section tr, section tbody tr:nth-child(2n) { background: transparent !important; }
  th { color: var(--accent); border-bottom: 2px solid var(--accent); }
  td { color: var(--fg); }
  td, th { padding: 8px 16px; }
  tr:not(:last-child) td { border-bottom: 1px solid #334155; }
  /* First data row = CP-SAT: subtle accent highlight so the winner pops. */
  tbody tr:first-child td { background: rgba(52,211,153,0.10) !important; }
  section::after { color: var(--muted); font-size: 0.6em; }
  .muted { color: var(--muted); }
  .badge {
    display: inline-block; background: var(--accent); color: #052e1a;
    font-weight: 700; padding: 4px 16px; border-radius: 999px; font-size: 0.7em;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .big { font-size: 3.2em; font-weight: 800; color: #fff; line-height: 1; }
  .kpi { color: var(--accent); }
  /* Title / section slides */
  section.lead { justify-content: center; text-align: center; }
  section.lead h1 { font-size: 2.6em; }
  section.hero {
    background: radial-gradient(1200px 500px at 30% 20%, #134e4a 0%, var(--bg) 55%);
    justify-content: center; text-align: center;
  }
  section.np {
    background: radial-gradient(1200px 600px at 70% 30%, #4c1d24 0%, var(--bg) 55%);
    justify-content: center; text-align: center;
  }
  section.np h1 { font-size: 3.4em; letter-spacing: -0.02em; }
  section.np .big { color: var(--danger); }
---

<!-- _paginate: false -->
<!-- _class: hero lead -->

<span class="badge">TFM · Máster de Desarrollo con IA</span>

# **SprintWell**

### Planificación de sprints que optimiza el **bienestar del equipo**

<br>

*José Carlos Hernández*

---

<!-- _class: lead -->

## El problema

# Las tareas se asignan por **capacidad y deadlines**.
# Las **personas** quedan fuera del modelo.

<br>

*Jira, Linear, Asana… no modelan las preferencias del trabajador.*
*Cuando se atienden, es ad-hoc — y nadie mide la equidad.*

---

## Qué cambia SprintWell

Las **preferencias** pasan a ser un **objetivo de primer orden**, junto a las restricciones operativas y a la **equidad** entre personas.

| Antes | Con SprintWell |
|---|---|
| Capacidad, deadlines, skills | + **preferencias declaradas** (DSL de reglas) |
| Criterio de reparto implícito | **Equidad explícita y elegible** |
| Decisión opaca del _lead_ | Plan **auditable y explicable** |

---

<!-- _class: np lead -->

<span class="badge" style="background:var(--danger);color:#3b0a0a">Aporte central</span>

# NP-hard

### No es un tablero que se ordena a mano:
### es **optimización combinatoria multiobjetivo**.

---

<!-- _class: np -->

## Por qué es NP-hard

Asignar $n$ tareas a $m$ personas **y** decidir el día de inicio de cada una, respetando skills, dependencias, deadlines y capacidad, mientras se maximiza la equidad.

<div class="big">≈ mⁿ</div>

combinaciones — el espacio **explota**. No hay fuerza bruta viable.

---

<!-- _class: np -->

## NP-hard, formalmente

Se demuestra por **reducción desde el _Generalized Assignment Problem_** (GAP), que es NP-hard [Fisher et al.].

> **Consecuencia:** salvo que **P = NP**, **no existe** un algoritmo exacto en tiempo polinómico.

Esto **no es un tecnicismo**: es lo que **justifica** todo el enfoque algorítmico — hay que usar un solver, no una fórmula.

---

## La respuesta: CP-SAT

Un solver **heurístico-completo** (Google OR-Tools):

- Prueba **optimalidad** si dispone de tiempo…
- …y devuelve **soluciones de calidad** dentro de un presupuesto acotado (uso interactivo).

<br>

*Las preferencias (DSL de 12 reglas) se compilan a restricciones; la equidad se agrega en **3 modos**: utilitarista · max-min · Nash.*

---

## Arquitectura — 3 servicios

| Servicio | Rol | Stack |
|---|---|---|
| **Backend** | dominio + API | NestJS · DDD 4 capas · Prisma · PostgreSQL |
| **Optimizer** | resuelve el NP-hard | Python · FastAPI · OR-Tools **CP-SAT** |
| **Frontend** | UI · 3 perfiles | React · Vite · Tailwind · cliente **tipado desde OpenAPI** |

---

<!-- _class: hero lead -->

<span class="badge">Demo en vivo</span>

# 🖥️ Verlo funcionando

login → sprint + tareas → **editor de reglas**
→ **planificar (Nash)** → Gantt + bienestar
→ **comparar Nash vs Utilitario** → explicabilidad

<br>

*<span class="muted">(vídeo de respaldo por si falla el directo)</span>*

---

## Resultados — vale la pena resolver el NP-hard

Frente a los _baselines_ que sustituyen a la herramienta:

| Algoritmo | Felicidad media | Mín | Reglas ✔ |
|---|---|---|---|
| **CP-SAT** | **0.81** | **0.50** | **82 %** |
| greedy | 0.49 | 0.00 | 55 % |
| aleatorio | 0.44 | 0.00 | 51 % |

**El piso importa:** los baselines dejan a alguien en `0.0`; CP-SAT **nunca**.

---

## La equidad, en acción

Caso **Apollo** — mismo sprint, distinto modo:

- **Nash** → mejor equilibrio (media <span class="kpi">0.87</span>, piso <span class="kpi">0.60</span>).
- **Hugo**, junior con regla _learn-skill_: **0.50 → 1.00** al activar la equidad.
- Escalabilidad **honesta**: resuelve hasta ~150 tareas / 20 personas; hay techo en el tamaño XL.

---

## Cómo se construyó

<span class="badge">Metodología con IA</span>

<div class="big"><span class="kpi">85</span> PRs · <span class="kpi">419</span> commits</div>

- CI en verde por PR · cobertura de test por capa.
- Protocolo **delegar / revisar / rechazar** — huecos detectados y corregidos.
- Proceso **auditable**, no _vibe coding_.

---

## Conclusiones

- **H1** (modelado) validada · **H2** (algorítmica) validada con matices · **H3** (metodológica) validada con reservas.
- Un problema **NP-hard** formalizado, resuelto y **hecho usable**.
- Lo más duradero: las decisiones de equidad quedan **explícitas y explicables**, ya no ocultas.

---

<!-- _class: hero lead -->
<!-- _paginate: false -->

# Gracias

### **Preferencias dentro del modelo,**
### **decisiones de equidad a la vista.**

<br>

`github.com/josec-hdez/SprintWell`

*¿Preguntas?*
