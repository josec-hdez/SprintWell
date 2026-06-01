import { Module } from '@nestjs/common';
import { HealthModule } from './presentation/http/public/health.module.js';

/**
 * Composition root (brief §14, §14.1).
 *
 * This is the ONLY place where Infrastructure implementations are wired to Domain ports.
 * Domain / Application / Infrastructure / Presentation modules MUST NOT import each other
 * across layer boundaries except via the contracts defined in inner layers — wiring lives here.
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
