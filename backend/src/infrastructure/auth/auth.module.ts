// Identity/auth composition (issue #45).
//
// Binds the domain ports to their concrete adapters and wires the JWT signer,
// exposing the login / change-password use cases. Marked @Global so the public
// AuthController (issue #67) can inject LoginUseCase without its presentation
// module importing infrastructure (§14.1). Imported by the composition root.

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChangePasswordUseCase } from '../../application/identity/change-password.use-case.js';
import { LoginUseCase } from '../../application/identity/login.use-case.js';
import { PasswordHasher } from '../../domain/identity/password-hasher.js';
import { TokenIssuer } from '../../domain/identity/token-issuer.js';
import { UserRepository } from '../../domain/identity/user.repository.js';
import { PrismaModule } from '../persistence/prisma/prisma.module.js';
import { PrismaUserRepository } from '../persistence/repositories/prisma-user.repository.js';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';
import { JwtTokenIssuer } from './jwt-token-issuer.js';

// Dev fallback only; production must supply JWT_SECRET via the environment.
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1d' } }),
  ],
  providers: [
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: TokenIssuer, useClass: JwtTokenIssuer },
    { provide: UserRepository, useClass: PrismaUserRepository },
    LoginUseCase,
    ChangePasswordUseCase,
  ],
  exports: [LoginUseCase, ChangePasswordUseCase],
})
export class AuthModule {}
