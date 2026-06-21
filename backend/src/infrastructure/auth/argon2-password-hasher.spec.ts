import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('hashes a password to an argon2 digest and verifies it', async () => {
    const digest = await hasher.hash('s3cret');
    expect(digest.startsWith('$argon2')).toBe(true);
    expect(await hasher.verify(digest, 's3cret')).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const digest = await hasher.hash('s3cret');
    expect(await hasher.verify(digest, 'wrong')).toBe(false);
  });
});
