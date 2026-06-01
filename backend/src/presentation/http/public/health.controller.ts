import { Controller, Get } from '@nestjs/common';

/**
 * Public health probe.
 *
 * Per brief §4.4, the `public` profile sees the health endpoint anonymously.
 * No guards are attached — this controller lives under `presentation/http/public/`
 * which is the anonymous-accessible sub-tree by convention.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
