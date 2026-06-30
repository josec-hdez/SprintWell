// Response DTOs for the public sprint reads (issue #71). They mirror the
// application SprintView/TaskView shapes and exist so the @nestjs/swagger
// plugin emits response schemas into the OpenAPI spec, which in turn types the
// frontend's generated client. The controllers keep returning the views — the
// shapes are structurally identical.

import { ApiProperty } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  effortDays!: number;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  domain!: string;

  @ApiProperty({ type: Number, nullable: true })
  deadlineDay!: number | null;

  @ApiProperty({ type: [String] })
  requiredSkills!: string[];

  @ApiProperty({ type: [String] })
  dependsOn!: string[];

  @ApiProperty()
  status!: string;
}

export class SprintResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  durationDays!: number;

  @ApiProperty({ type: [TaskResponseDto] })
  tasks!: TaskResponseDto[];
}
