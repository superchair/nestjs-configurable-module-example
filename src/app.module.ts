import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import {
  buildValidator,
  ExceptionsFilter,
  RestAPIUtilities,
  StaticFileModule,
} from '@platform/rest-api-utils'
import { LoggerModule } from '@platform/logging'
import { ApplicationConfig } from './config/application-config'
import {
  AuthenticationModule,
  AuthenticationModuleConfig,
} from '@platform/authentication'
import { APP_FILTER } from '@nestjs/core'
import { BugsnagModule } from 'nestjs-bugsnag'

export const APPLICATION_NAME = 'configurable-module-example-rest-api'

export const loggerModuleImpl = LoggerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<ApplicationConfig, true>) => ({
    appName: APPLICATION_NAME,
    logLevel: configService.get('LOG_LEVEL'),
    filePath: configService.get('LOG_PATH'),
  }),
})

@Module({
  imports: [
    StaticFileModule,

    ConfigModule.forRoot({
      envFilePath: ['.env'],
      validate: buildValidator(ApplicationConfig),
    }),

    BugsnagModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get<string>('BUGSNAG_API_KEY')!,
        releaseStage: configService.get<string>('BUGSNAG_RELEASE_STAGE'),
        enabledReleaseStages: [
          'staging-external-ecs',
          'production-external-ecs',
        ],
        appVersion: configService.get<string>('BUILD_VERSION', 'unknown'),
        autoDetectErrors: true,
        autoTrackSessions: true,
      }),
    }),

    RestAPIUtilities.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApplicationConfig, true>) => ({
        appName: APPLICATION_NAME,
        buildNumber: configService.get('BUILD_NUMBER'),
        buildVersion: configService.get('BUILD_VERSION'),
      }),
    }),

    AuthenticationModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<ApplicationConfig, true>,
      ): AuthenticationModuleConfig => ({
        domain: configService.get('AUTH0_DOMAIN'),
        audience: configService.get('AUTH0_AUDIENCE'),
        auth0Enabled: configService.get('AUTH0_ENABLED'),
      }),
    }),

    loggerModuleImpl,
  ],

  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionsFilter,
    },
  ],
})
export class AppModule {}
