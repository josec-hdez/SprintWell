// Pure-TypeScript value object for a rule's budget weight (issue #55).
//
// §14.1: framework-agnostic. A weight is an integer share of the 100-point
// budget (brief §6.2).

export class Weight {
  static readonly MIN = 0;
  static readonly MAX = 100;

  private constructor(public readonly value: number) {
    Object.freeze(this);
  }

  static of(value: number): Weight {
    if (!Number.isInteger(value) || value < Weight.MIN || value > Weight.MAX) {
      throw new Error(`Weight must be an integer in [${Weight.MIN}, ${Weight.MAX}], got ${value}.`);
    }
    return new Weight(value);
  }

  static zero(): Weight {
    return new Weight(0);
  }
}
