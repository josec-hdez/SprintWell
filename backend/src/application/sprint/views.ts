// Application-layer read views for the Sprint context (issue #53).

import type { Sprint } from '../../domain/sprint/sprint.js';
import type { Task } from '../../domain/sprint/task.js';

export interface TaskView {
  id: string;
  name: string;
  effortDays: number;
  category: string;
  domain: string;
  deadlineDay: number | null;
  requiredSkills: readonly string[];
  dependsOn: readonly string[];
  status: string;
}

export interface SprintView {
  id: string;
  name: string;
  startDate: string;
  durationDays: number;
  tasks: TaskView[];
}

export function toTaskView(task: Task): TaskView {
  return {
    id: task.id,
    name: task.name,
    effortDays: task.effortDays,
    category: task.category,
    domain: task.domain,
    deadlineDay: task.deadlineDay,
    requiredSkills: task.requiredSkills,
    dependsOn: task.dependsOn,
    status: task.status.value,
  };
}

export function toSprintView(sprint: Sprint): SprintView {
  return {
    id: sprint.id,
    name: sprint.name,
    startDate: sprint.startDate.toISOString().slice(0, 10),
    durationDays: sprint.durationDays,
    tasks: sprint.tasks.map(toTaskView),
  };
}
