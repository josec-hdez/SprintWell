# shared/rule-schemas

Single source of truth for the preference-rule DSL `params` shapes (brief §6.1,
§6.5). One JSON Schema (draft-07) per rule type, consumed by **both** sides so
the dual validation cannot diverge (risk mitigation, §15):

- **backend** — `RuleParamsValidator` compiles these with ajv to validate a
  rule's `params` against its declared `type`.
- **optimizer** — a parity test asserts each schema's `required`/`properties`
  match the corresponding Pydantic `*Params` model.

`index.json` maps every `RuleType` to its schema file and pins
`schemaVersion: 1` (frozen per §6.5).

## Wire shape

The schemas describe the **payload** sent to the optimizer, so enum values are
the lower-case wire values (`feature`, `monday`, …) used by `ProblemInput`, not
the backend's Prisma enum casing.

## Catalog (12 types)

| Type | Params |
| --- | --- |
| `PREFER_SKILL` / `AVOID_SKILL` | `{ skill_id }` |
| `PREFER_CATEGORY` / `AVOID_CATEGORY` | `{ category }` |
| `PREFER_DOMAIN` | `{ domain }` |
| `PREFER_WEEKDAY` / `AVOID_WEEKDAY` | `{ weekday }` |
| `BLACKOUT_DATE` | `{ dates[] }` |
| `MAX_TASKS_PER_SPRINT` | `{ max_tasks }` |
| `FOCUS_PREFERENCE` | `{}` |
| `COOLDOWN_AFTER` | `{ after_category, rest_days }` |
| `LEARN_SKILL` | `{ skill_id, min_tasks }` |
