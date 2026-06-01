import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  moduleFileExtensions: ['ts', 'js'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.json',
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    // NodeNext requires `.js` extensions in TS imports — strip them for Jest resolution.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@domain/(.*)\\.js$': '<rootDir>/domain/$1',
    '^@application/(.*)\\.js$': '<rootDir>/application/$1',
    '^@infrastructure/(.*)\\.js$': '<rootDir>/infrastructure/$1',
    '^@presentation/(.*)\\.js$': '<rootDir>/presentation/$1',
    '^@domain/(.*)$': '<rootDir>/domain/$1',
    '^@application/(.*)$': '<rootDir>/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/presentation/$1',
  },
};

export default config;
