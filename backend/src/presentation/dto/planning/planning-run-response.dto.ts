// Response DTOs for PlanningRun reads (issues #79, #81, #82, #88). Mirror
// PlanningRunView so the @nestjs/swagger plugin emits response schemas that type
// the frontend's generated client.

import { ApiProperty } from '@nestjs/swagger';

export class AssignmentResponseDto {
  @ApiProperty()
  taskId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  startDay!: number;
}

export class PerUserHappinessResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  happiness!: number;
}

export class PlanningRunResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sprintId!: string;

  @ApiProperty()
  strategy!: string;

  @ApiProperty()
  equityMode!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: Number, nullable: true })
  objectiveValue!: number | null;

  @ApiProperty({ type: [AssignmentResponseDto] })
  assignments!: AssignmentResponseDto[];

  @ApiProperty({ type: [PerUserHappinessResponseDto] })
  perUserHappiness!: PerUserHappinessResponseDto[];

  @ApiProperty()
  averageHappiness!: number;

  @ApiProperty()
  minHappiness!: number;

  @ApiProperty()
  createdAt!: string;
}
