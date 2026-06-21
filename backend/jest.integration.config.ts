import type { Config } from 'jest';

// Integration tests run against a REAL Postgres (docker compose). They live
// under test/integration and are NOT part of the default `npm test` (whose
// rootDir is src/), so CI — which has no database — stays green. Run locally
// with `npm run test:integration` after `docker compose up -d postgres` and
// `npm run prisma:migrate:dev`.
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'test',
  moduleFileExtensions: ['ts', 'js'],
  testRegex: 'integration/.*\\.spec\\.ts$',
  setupFiles: ['<rootDir>/integration/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@domain/(.*)\\.js$': '<rootDir>/../src/domain/$1',
    '^@application/(.*)\\.js$': '<rootDir>/../src/application/$1',
    '^@infrastructure/(.*)\\.js$': '<rootDir>/../src/infrastructure/$1',
    '^@presentation/(.*)\\.js$': '<rootDir>/../src/presentation/$1',
    '^@domain/(.*)$': '<rootDir>/../src/domain/$1',
    '^@application/(.*)$': '<rootDir>/../src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/../src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/../src/presentation/$1',
  },
};

export default config;
