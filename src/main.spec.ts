// Mock external dependencies BEFORE importing anything
const mockNestFactoryCreate = jest.fn()
const mockSwaggerSetup = jest.fn()
const mockSwaggerCreateDocument = jest.fn()
const mockDocumentBuilder = jest.fn()
const mockLogger = jest.fn()
const mockConfigService = jest.fn()
const mockHttpAdapterHost = jest.fn()
const mockBugsnagService = jest.fn()

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: mockNestFactoryCreate,
  },
  HttpAdapterHost: mockHttpAdapterHost,
}))

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: mockDocumentBuilder,
  SwaggerModule: {
    setup: mockSwaggerSetup,
    createDocument: mockSwaggerCreateDocument,
  },
}))

jest.mock('@nestjs/common', () => ({
  Logger: mockLogger,
}))

jest.mock('@nestjs/config', () => ({
  ConfigService: mockConfigService,
}))

jest.mock('@platform/logging', () => ({
  PlatformLogger: jest.fn(),
}))

jest.mock('nestjs-bugsnag', () => ({
  BugsnagService: mockBugsnagService,
}))

jest.mock('./app.module', () => ({
  AppModule: class MockAppModule {},
}))

import { ConfigService } from '@nestjs/config'
// Now we can safely import the mocked modules
import { AppModule } from './app.module'

describe('Bootstrap Function', () => {
  const mockApp = {
    resolve: jest.fn(),
    useLogger: jest.fn(),
    get: jest.fn(),
    listen: jest.fn(),
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock NestFactory.create
    mockNestFactoryCreate.mockResolvedValue(mockApp)

    // Mock DocumentBuilder
    const mockDocumentBuilderInstance = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    }
    mockDocumentBuilder.mockImplementation(() => mockDocumentBuilderInstance)

    // Mock SwaggerModule methods
    mockSwaggerSetup.mockImplementation(() => {})
    mockSwaggerCreateDocument.mockReturnValue({})

    // Mock Logger
    const mockLoggerInstance = { log: jest.fn() }
    mockLogger.mockImplementation(() => mockLoggerInstance)

    // Mock app methods - ConfigService, HttpAdapterHost, and BugsnagService
    mockApp.get.mockImplementation((token) => {
      // Handle direct class references (ConfigService, HttpAdapterHost, BugsnagService)
      if (token === ConfigService) {
        return { get: jest.fn().mockReturnValue(3000) }
      }
      if (token === mockHttpAdapterHost) {
        return { httpAdapter: {} }
      }
      if (token === mockBugsnagService) {
        return { notify: jest.fn() }
      }
      // Fallback for other tokens
      return { get: jest.fn().mockReturnValue(3000) }
    })
    mockApp.listen.mockResolvedValue(undefined)
    mockApp.resolve.mockResolvedValue({ log: jest.fn() })
  })

  it('should execute bootstrap function completely', async () => {
    // Clear module cache to ensure fresh import
    delete require.cache[require.resolve('./main')]

    // Mock the app.resolve to return a proper PlatformLogger mock
    mockApp.resolve.mockResolvedValue({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })

    // Import the main module which will execute bootstrap
    await import('./main')

    // Add a small delay to ensure async operations complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Verify all expected calls were made
    expect(mockNestFactoryCreate).toHaveBeenCalledWith(AppModule, {
      bufferLogs: true,
    })

    expect(mockSwaggerSetup).toHaveBeenCalledWith(
      'swagger',
      mockApp, // The specific app instance we mocked
      expect.any(Function), // The documentFactory function
    )

    // Call the documentFactory function to ensure it's covered
    const setupCalls = mockSwaggerSetup.mock.calls
    expect(setupCalls).toHaveLength(1)
    const [, , documentFactory] = setupCalls[0] as [string, unknown, () => unknown]
    documentFactory() // Execute the factory function

    expect(mockSwaggerCreateDocument).toHaveBeenCalledWith(
      mockApp, // The specific app instance we mocked
      {}, // The swagger config object returned by DocumentBuilder.build()
    )

    expect(mockApp.listen).toHaveBeenCalledWith(3000)
    expect(mockApp.resolve).toHaveBeenCalled()
    expect(mockApp.useLogger).toHaveBeenCalled()
  })
})
