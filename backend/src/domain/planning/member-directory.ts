// Domain port providing the team members and their skill levels (issue #62).
//
// LaunchPlanning needs every participant with their proficiencies to build the
// solver request; this read port keeps that projection out of the use case.

import type { SolverMember } from './planning-solver.js';

export abstract class MemberDirectory {
  abstract findAllWithSkills(): Promise<SolverMember[]>;
}
