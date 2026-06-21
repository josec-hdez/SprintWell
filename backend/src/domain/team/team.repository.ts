// Domain port for the Team (skill catalog) persistence (issue #48).
//
// Abstract class per the repository convention — doubles as TS contract and
// NestJS DI token. Concrete adapter lands in infrastructure (issue #49+).

import { Team } from './team.js';

export abstract class TeamRepository {
  /** Load the current skill catalog. */
  abstract getCatalog(): Promise<Team>;

  /** Persist the catalog (the aggregate is the unit of consistency). */
  abstract save(team: Team): Promise<void>;
}
