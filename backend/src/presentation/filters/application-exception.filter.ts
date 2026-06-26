// Maps known application-layer errors to HTTP status codes (issue #50).
//
// §14.1: presentation → application is allowed, so the filter can recognise the
// application error types and translate them. Unknown errors are not caught
// here and fall through to Nest's default handler (500).

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';

import {
  InvalidCredentialsError,
  UserNotFoundError,
} from '../../application/identity/identity.errors.js';
import {
  InvalidTransitionError,
  SprintNotFoundError,
  TaskNotFoundError,
  TaskOwnershipError,
} from '../../application/sprint/sprint.errors.js';
import {
  RuleAuthorizationError,
  RuleConflictError,
  RuleNotFoundError,
} from '../../application/rules/rules.errors.js';
import {
  EmailAlreadyInUseError,
  MemberNotFoundError,
  SkillNotInCatalogError,
} from '../../application/team/team.errors.js';

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

@Catch(
  EmailAlreadyInUseError,
  MemberNotFoundError,
  SkillNotInCatalogError,
  UserNotFoundError,
  InvalidCredentialsError,
  SprintNotFoundError,
  TaskNotFoundError,
  InvalidTransitionError,
  TaskOwnershipError,
  RuleAuthorizationError,
  RuleConflictError,
  RuleNotFoundError,
)
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const status = ApplicationExceptionFilter.statusFor(exception);
    const body: Record<string, unknown> = { statusCode: status, message: exception.message };
    if (exception instanceof RuleConflictError) {
      body.conflicts = exception.conflicts;
    }
    host.switchToHttp().getResponse<HttpResponse>().status(status).json(body);
  }

  private static statusFor(exception: Error): number {
    if (exception instanceof EmailAlreadyInUseError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof InvalidTransitionError || exception instanceof RuleConflictError) {
      return HttpStatus.CONFLICT;
    }
    if (exception instanceof InvalidCredentialsError) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (exception instanceof TaskOwnershipError || exception instanceof RuleAuthorizationError) {
      return HttpStatus.FORBIDDEN;
    }
    return HttpStatus.NOT_FOUND;
  }
}
