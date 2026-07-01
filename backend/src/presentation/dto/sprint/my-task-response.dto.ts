// Response DTO for the member "my tasks" read (issue #75). Mirrors MyTaskView
// so the @nestjs/swagger plugin emits a response schema for the typed client.

import { ApiProperty } from '@nestjs/swagger';

export class MyTaskResponseDto {
  @ApiProperty()
  sprintId!: string;

  @ApiProperty()
  sprintName!: string;

  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  taskName!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  effortDays!: number;

  @ApiProperty()
  startDay!: number;

  @ApiProperty()
  status!: string;
}
