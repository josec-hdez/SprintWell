// Ensure a DATABASE_URL is present for integration tests. Falls back to the
// local docker-compose Postgres (same value as backend/.env) when the env var
// is not already set, so `npm run test:integration` works out of the box.
process.env.DATABASE_URL ??=
  'postgresql://sprintwell:sprintwell@localhost:5432/sprintwell?schema=public';
