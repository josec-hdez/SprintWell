import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'test',
  moduleFileExtensions: ['ts', 'js'],
  testRegex: '.*\\.e2e-spec\\.ts$',
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
