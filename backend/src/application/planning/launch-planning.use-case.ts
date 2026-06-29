// Central use case: plan a sprint end to end (issue #62).
//
// Reads the sprint, the team members and their skills, the skill catalog and
// every member's rules; invokes the optimizer via the PlanningSolver port; and
// persists the resulting PlanningRun. Ties together the Sprint, Team, Rules and
// Planning contexts plus the optimizer integration.

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { RuleSetRepository } from '../../domain/rules/rule-set.repository.js';
import { MemberDirectory } from '../../domain/planning/member-directory.js';
import { PlanningRun, type EquityModeValue } from '../../domain/planning/planning-run.js';
import { PlanningRunRepository } from '../../domain/planning/planning-run.repository.js';
import { PlanningSolver } from '../../domain/planning/planning-solver.js';
import {
  PlanningStrategy,
  type PlanningStrategyValue,
} from '../../domain/planning/planning-strategy.js';
import { SprintRepository } from '../../domain/sprint/sprint.repository.js';
import { TeamRepository } from '../../domain/team/team.repository.js';
import { SprintNotFoundError } from '../sprint/sprint.errors.js';

export interface LaunchPlanningCommand {
  sprintId: string;
  strategy: PlanningStrategyValue;
  equityMode: EquityModeValue;
  timeBudgetSeconds?: number;
}

@Injectable()
export class LaunchPlanningUseCase {
  constructor(
    private readonly sprints: SprintRepository,
    private readonly members: MemberDirectory,
    private readonly team: TeamRepository,
    private readonly ruleSets: RuleSetRepository,
    private readonly solver: PlanningSolver,
    private readonly planningRuns: PlanningRunRepository,
  ) {}

  async execute(command: LaunchPlanningCommand): Promise<PlanningRun> {
    const sprint = await this.sprints.findById(command.sprintId);
    if (sprint === null) {
      throw new SprintNotFoundError(command.sprintId);
    }

    const members = await this.members.findAllWithSkills();
    const catalog = await this.team.getCatalog();
    const ruleSets = await Promise.all(
      members.map((member) => this.ruleSets.findByOwner(member.id)),
    );
    const rules = ruleSets.flatMap((ruleSet) => ruleSet.rules);

    const result = await this.solver.solve({
      sprint,
      members,
      skills: catalog.skills.map((skill) => ({ id: skill.id, name: skill.name })),
      rules,
      equityMode: command.equityMode,
      strategy: command.strategy,
      ...(command.timeBudgetSeconds !== undefined
        ? { timeBudgetSeconds: command.timeBudgetSeconds }
        : {}),
    });

    const run = PlanningRun.create({
      id: randomUUID(),
      sprintId: command.sprintId,
      strategy: PlanningStrategy.of(command.strategy),
      equityMode: command.equityMode,
      status: result.status,
      objectiveValue: result.objectiveValue,
      assignments: result.assignments,
      perUserHappiness: result.perUserHappiness,
      createdAt: new Date(),
    });
    await this.planningRuns.save(run);
    return run;
  }
}
