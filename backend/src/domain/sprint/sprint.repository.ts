// Domain port for Sprint persistence (issue #51).
//
// Abstract class per the repository convention — TS contract + DI token.
// Concrete adapter lands in infrastructure (issue #52+).

import { Sprint } from './sprint.js';

export abstract class SprintRepository {
  abstract findById(id: string): Promise<Sprint | null>;

  /** Find the sprint that contains the task ``taskId`` (the member status route
   *  carries only a task id), or `null` if no sprint owns it. */
  abstract findByTaskId(taskId: string): Promise<Sprint | null>;

  abstract findAll(): Promise<Sprint[]>;

  abstract save(sprint: Sprint): Promise<void>;

  abstract delete(id: string): Promise<void>;
}
