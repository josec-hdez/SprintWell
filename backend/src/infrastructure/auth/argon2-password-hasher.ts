// argon2 adapter for the PasswordHasher domain port (issue #45).
//
// §4.4 mandates robust hashing; argon2id (the library default) is the current
// OWASP recommendation. The algorithm choice is fully contained here.

import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import { PasswordHasher } from '../../domain/identity/password-hasher.js';

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword);
  }

  verify(hash: string, plainPassword: string): Promise<boolean> {
    return argon2.verify(hash, plainPassword);
  }
}
