// Prisma-backed adapter for the domain `UserRepository` port (issue #44).
//
// §14.1: extends the abstract domain port (which doubles as the DI token) and
// keeps every Prisma detail inside infrastructure, translating rows to domain
// entities through `UserMapper`.

import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../../domain/identity/user.repository.js';
import { User } from '../../../domain/identity/user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserMapper } from '../mappers/user.mapper.js';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.deleteMany({ where: { id } });
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      create: UserMapper.toPersistence(user),
      update: UserMapper.toUpdate(user),
    });
  }
}
