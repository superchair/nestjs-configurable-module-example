jest.mock('@platform/rest-api-utils', () => {
  const originalModule: Record<string, unknown> = jest.requireActual(
    '@platform/rest-api-utils',
  )
  return {
    ...originalModule,
    buildValidator: jest.fn(() => {
      return (): any => ({
        APP_PORT: '3000',
        LOG_PATH: 'some/log/path',
        LOG_LEVEL: 'log',
        AUTH0_DOMAIN: 'test-domain',
        AUTH0_AUDIENCE: 'test-audience',
        BUGSNAG_API_KEY: 'test-api-key',
        BUGSNAG_RELEASE_STAGE: 'development',
        BUILD_NUMBER: 'unknown',
        BUILD_VERSION: 'unknown',
      })
    }),
  }
})

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AppModule, APPLICATION_NAME } from './../src/app.module'
import { ConfigService } from '@nestjs/config'
import { BugsnagService } from 'nestjs-bugsnag'
import { LoggerModule } from '@platform/logging'

describe('Service Utilities (e2e)', () => {
  let app: INestApplication<App>
  let configService: ConfigService

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BugsnagService)
      .useValue({
        notify: jest.fn(),
      })
      .overrideModule(LoggerModule)
      .useModule(
        LoggerModule.forRoot({
          appName: 'test-service-test-app',
          logLevel: 'log',
          filePath: undefined, // Disable file logging in tests
        }),
      )
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    configService = app.get(ConfigService)
  })

  describe('/healthz', () => {
    describe('GET', () => {
      it('should return 200 OK', () => {
        const expectedResponse = {
          status: 'ok',
        }
        return request(app.getHttpServer())
          .get('/healthz')
          .expect(200)
          .expect(expectedResponse)
      })
    })
  })

  describe('/info', () => {
    describe('GET', () => {
      it('should return 200 OK', () => {
        const expectedResponse = {
          service: APPLICATION_NAME,
          build: configService.get<string>('BUILD_NUMBER'),
          version: configService.get<string>('BUILD_VERSION'),
        }

        return request(app.getHttpServer())
          .get('/info')
          .expect(200)
          .expect(expectedResponse)
      })
    })
  })
})
