// List the tasks assigned to a given member across sprints (issue #75).
//
// Assignments live on the Sprint aggregate (produced by planning runs). There
// is no separate "active sprint" flag, so this returns every task currently
// assigned to the member, carrying its sprint context and scheduled start day.

import { Injectable } from '@nestjs/common';

import { SprintRepository } from '../../domain/sprint/sprint.repository.js';

export interface MyTaskView {
  sprintId: string;
  sprintName: string;
  taskId: string;
  taskName: string;
  category: string;
  effortDays: number;
  startDay: number;
  status: string;
}

@Injectable()
export class ListMyTasksUseCase {
  constructor(private readonly sprints: SprintRepository) {}

  async execute(userId: string): Promise<MyTaskView[]> {
    const sprints = await this.sprints.findAll();
    const result: MyTaskView[] = [];
    for (const sprint of sprints) {
      for (const assignment of sprint.assignments) {
        if (assignment.userId !== userId) {
          continue;
        }
        const task = sprint.findTask(assignment.taskId);
        if (task === undefined) {
          continue;
        }
        result.push({
          sprintId: sprint.id,
          sprintName: sprint.name,
          taskId: task.id,
          taskName: task.name,
          category: task.category,
          effortDays: task.effortDays,
          startDay: assignment.startDay,
          status: task.status.value,
        });
      }
    }
    return result;
  }
}
