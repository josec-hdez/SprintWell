import { Credentials } from './credentials.js';
import { Role } from './role.js';
import { User } from './user.js';

describe('Role', () => {
  it('builds MEMBER and ADMIN from valid strings', () => {
    expect(Role.of('MEMBER').value).toBe('MEMBER');
    expect(Role.of('ADMIN').value).toBe('ADMIN');
  });

  it('rejects an invalid role', () => {
    expect(() => Role.of('SUPERUSER')).toThrow(/Invalid role/);
  });

  it('exposes isAdmin and equality', () => {
    expect(Role.admin().isAdmin()).toBe(true);
    expect(Role.member().isAdmin()).toBe(false);
    expect(Role.member().equals(Role.member())).toBe(true);
    expect(Role.member().equals(Role.admin())).toBe(false);
  });
});

describe('Credentials', () => {
  it('normalizes the email (trim + lowercase)', () => {
    const credentials = Credentials.create('  Admin@Example.COM ', 'hash');
    expect(credentials.email).toBe('admin@example.com');
  });

  it('rejects an empty email', () => {
    expect(() => Credentials.create('   ', 'hash')).toThrow(/non-empty email/);
  });

  it('rejects an email without @', () => {
    expect(() => Credentials.create('not-an-email', 'hash')).toThrow(/valid email/);
  });

  it('rejects an empty password hash', () => {
    expect(() => Credentials.create('a@b.com', '   ')).toThrow(/non-empty password/);
  });
});

describe('User', () => {
  const credentials = Credentials.create('a@b.com', 'hash');

  it('creates a valid user and exposes its email and role', () => {
    const user = User.create({ id: 'u1', name: 'Alice', credentials, role: Role.admin() });
    expect(user.email).toBe('a@b.com');
    expect(user.isAdmin()).toBe(true);
  });

  it('rejects an empty id', () => {
    expect(() =>
      User.create({ id: '  ', name: 'Alice', credentials, role: Role.member() }),
    ).toThrow(/non-empty id/);
  });

  it('rejects an empty name', () => {
    expect(() => User.create({ id: 'u1', name: '', credentials, role: Role.member() })).toThrow(
      /non-empty name/,
    );
  });

  it('is immutable', () => {
    const user = User.create({ id: 'u1', name: 'Alice', credentials, role: Role.member() });
    expect(() => {
      (user as unknown as { name: string }).name = 'Bob';
    }).toThrow();
  });
});
