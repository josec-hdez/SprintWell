# El equipo Apollo

> Caso de estudio semi-realista (brief §13.3). El equipo es **ficticio**: el
> brief §3 cierra el proyecto a datos sintéticos, así que no hay personas
> reales. Las biografías existen para dar "textura humana" a los números del
> benchmark y permitir una discusión cualitativa de la utilidad práctica.

**Apollo** es un equipo de producto de 10 personas que mantiene una plataforma
SaaS de pagos. Trabajan en sprints de tres semanas (15 días hábiles). La
instancia está en [`benchmarks/instances/case-study.json`](../../benchmarks/instances/case-study.json):
10 usuarios, 24 tareas, 17 reglas blandas/duras, 8 skills.

Las reglas (`owner_id`) codifican preferencias y restricciones plausibles de cada
persona. El campo `weight` (10–60) gradúa cuánto pesa una preferencia blanda; las
reglas duras (p. ej. un día de ausencia) no se pueden violar.

## Miembros

| Persona | Rol | Skills (nivel) | Reglas |
|---|---|---|---|
| **Ana Restrepo** | Backend senior | backend 5, security 4, data 3 | Prefiere `feature` (40); máx. 4 tareas/sprint (50) |
| **Beto Salas** | Lead de frontend | frontend 5, design 3 | Prefiere el dominio `billing` (45); evita los viernes —congelación de despliegues— (30) |
| **Carla Méndez** | Mobile | mobile 5, frontend 3, design 3 | Prefiere el skill `mobile` (50); preferencia de foco/agrupamiento (35) |
| **Diego Fuentes** | DevOps / SRE | devops 5, security 4, backend 3 | Prefiere `infra` (50); **ausente el 2026-05-12** (regla dura) |
| **Elena Park** | Lead de QA | qa 5, backend 2 | Prefiere `bug` (55); máx. 5 tareas/sprint (40) |
| **Faruk Aydın** | Data engineer | data 5, backend 3, frontend 2 | Prefiere el dominio `data` (50) |
| **Gabi Torres** | Diseñadora | design 5, frontend 3 | Prefiere el skill `design` (50) |
| **Hugo Lima** | Junior fullstack | frontend 3, backend 2 | **Quiere aprender `devops`** (learn-skill, mín. 2 tareas, 45) |
| **Inés Ferrer** | Seguridad | security 5, devops 4 | Prefiere `sre` (45); descanso de 1 día tras `on_call` (30) |
| **Jon Okafor** | Backend mid | backend 4, data 3, qa 3 | Prefiere los lunes (35); evita `docs` (30) |

## Notas de diseño del equipo

- **Cobertura de skills con redundancia.** Cada skill lo dominan ≥ 2 personas, así
  que ningún área es un cuello de botella de una sola persona. `backend` es el más
  común (Ana, Diego, Elena, Faruk, Hugo, Jon); `mobile` el más escaso (solo
  Carla), por lo que el trabajo móvil gravita naturalmente hacia ella.
- **Cross-skills realistas.** Carla (mobile) también hace `design` para el pulido
  de UI; Faruk (data) toca `frontend` para los dashboards analíticos. Esto permite
  que tareas con dos skills requeridos (p. ej. *Analytics dashboard* = data +
  frontend) tengan al menos una persona capaz.
- **Tensiones deliberadas.** La regla dura de ausencia de Diego, el tope de Ana,
  el deseo de crecimiento de Hugo (`learn-skill` relaja la barrera de skill de
  R6) y el rechazo de Jon a la documentación crean los conflictos que hacen
  interesante la planificación: no todo el mundo puede obtener todo lo que quiere.
