import { LOG_LEVELS, LogLevel } from '@nestjs/common'
import { Transform } from 'class-transformer'
import { stringToNumber, stringToBoolean } from '@platform/rest-api-utils'
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
} from 'class-validator'

export class ApplicationConfig {
  @IsOptional()
  @IsString()
  BUILD_NUMBER: string

  @IsOptional()
  @IsString()
  BUILD_VERSION: string

  @Transform(stringToNumber)
  @IsInt()
  APP_PORT: number

  @IsEnum(LOG_LEVELS)
  @IsNotEmpty()
  LOG_LEVEL: LogLevel

  @IsOptional()
  @IsString()
  LOG_PATH: string

  @Transform(stringToBoolean)
  @IsBoolean()
  AUTH0_ENABLED: boolean

  @IsString()
  @IsNotEmpty()
  AUTH0_DOMAIN: string

  @IsString()
  @IsNotEmpty()
  AUTH0_AUDIENCE: string

  @IsNotEmpty()
  @IsString()
  BUGSNAG_API_KEY: string

  @IsNotEmpty()
  @IsIn([
    'dev-external-ecs',
    'staging-external-ecs',
    'production-external-ecs',
    'local',
    'test',
  ])
  BUGSNAG_RELEASE_STAGE: string

  @IsNotEmpty()
  @IsString()
  BASE_URL: string
}
