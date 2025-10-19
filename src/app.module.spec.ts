jest.mock('@platform/rest-api-utils', () => {
  const originalModule: Record<string, unknown> = jest.requireActual(
    '@platform/rest-api-utils',
  )
  return {
    ...originalModule,
    buildValidator: jest.fn(() => {
      return (): any => ({
        APP_PORT: 3000,
        LOG_PATH: 'some/log/path',
        LOG_LEVEL: 'log',
        AUTH0_ENABLED: false,
        AUTH0_DOMAIN: 'test-domain',
        AUTH0_AUDIENCE: 'test-audience',
        BUGSNAG_API_KEY: 'test-api-key',
        BUGSNAG_RELEASE_STAGE: 'development',
      })
    }),
  }
})

import { Test, TestingModule } from '@nestjs/testing'
import { AppModule, loggerModuleImpl } from './app.module'
import { ConfigService } from '@nestjs/config'
import { PlatformLogger, LoggerModule } from '@platform/logging'
import { Auth0Guard } from '@platform/authentication'
import { BugsnagService } from 'nestjs-bugsnag'

describe('AppModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BugsnagService)
      .useValue({
        notify: jest.fn(),
      })
      .overrideModule(loggerModuleImpl)
      .useModule(
        LoggerModule.forRoot({
          appName: 'test-service-test-app',
          logLevel: 'log',
          filePath: undefined, // Disable file logging in tests
        }),
      )
      .compile()
  })

  afterEach(async () => {
    if (module) {
      await module.close()
    }
    jest.clearAllMocks()
  })

  it('should be properly defined and instantiated', () => {
    expect(module).toBeDefined()
  })

  it('should provide the ConfigService', () => {
    const configService = module.get<ConfigService>(ConfigService)
    expect(configService).toBeDefined()
  })

  it('should provide the BugSnagService', () => {
    const bugsnagService = module.get<BugsnagService>(BugsnagService)
    expect(bugsnagService).toBeDefined()
  })

  it('should provide the LoggerService', async () => {
    const logger = await module.resolve(PlatformLogger)
    expect(logger).toBeDefined()
    expect(logger).toBeInstanceOf(PlatformLogger)
  })

  it('should provide the PlatformAuthentication guards', () => {
    const jwtAuthGuard = module.get(Auth0Guard)
    expect(jwtAuthGuard).toBeDefined()
  })
})
