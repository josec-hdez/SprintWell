// Validates a rule's `params` against the shared JSON Schema (issue #56).
//
// Compiles the schemas in /shared/rule-schemas (the single source of truth, also
// consumed by the optimizer) with ajv at construction, then validates by type.
// This is what keeps the backend's view of the DSL from diverging from the
// optimizer's (brief §6.1, §15).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Injectable } from '@nestjs/common';
import { Ajv, type AnySchema, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

// /shared/rule-schemas relative to this file (same depth in src/ and dist/).
const SCHEMAS_DIR = resolve(__dirname, '../../../../shared/rule-schemas');

interface SchemaIndex {
  schemaVersion: number;
  types: Record<string, string>;
}

@Injectable()
export class RuleParamsValidator {
  readonly schemaVersion: number;
  private readonly validators = new Map<string, ValidateFunction>();

  constructor() {
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const index = JSON.parse(readFileSync(join(SCHEMAS_DIR, 'index.json'), 'utf-8')) as SchemaIndex;
    this.schemaVersion = index.schemaVersion;
    for (const [type, file] of Object.entries(index.types)) {
      const schema = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf-8')) as AnySchema;
      this.validators.set(type, ajv.compile(schema));
    }
  }

  /** Whether ``params`` is valid for the given rule ``type``. */
  isValid(type: string, params: unknown): boolean {
    return this.validatorFor(type)(params) === true;
  }

  /** Human-readable validation errors for ``params`` (empty when valid). */
  errorsFor(type: string, params: unknown): string[] {
    const validate = this.validatorFor(type);
    if (validate(params) === true) {
      return [];
    }
    return (validate.errors ?? []).map(
      (error) => `${error.instancePath || '(root)'} ${error.message ?? 'is invalid'}`,
    );
  }

  private validatorFor(type: string): ValidateFunction {
    const validate = this.validators.get(type);
    if (validate === undefined) {
      throw new Error(`Unknown rule type: ${type}.`);
    }
    return validate;
  }
}
