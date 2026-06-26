// Authorization helper for rule management (issue #58, brief §4.4).
//
// A member may manage only their own rules; an admin may manage anyone's.

import { RuleAuthorizationError } from './rules.errors.js';

export interface Actor {
  userId: string;
  role: 'MEMBER' | 'ADMIN';
}

export function assertCanManageRules(actor: Actor, ownerId: string): void {
  if (actor.role !== 'ADMIN' && actor.userId !== ownerId) {
    throw new RuleAuthorizationError(ownerId);
  }
}
