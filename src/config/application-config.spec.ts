import { validate, ValidationError } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { ApplicationConfig } from './application-config'

const expectConstraints = (
  errors: ValidationError[],
  expectedConstraints: string[],
) => {
  const actualConstraints = Object.keys(errors[0].constraints || {})
  expectedConstraints.forEach((constraint) => {
    expect(actualConstraints).toContain(constraint)
  })
}

describe('EnvironmentVariables', () => {
  describe('validations', () => {
    const environment = {
      APP_PORT: '3000',
      LOG_PATH: 'some/log/path',
      LOG_LEVEL: 'log',
      AUTH0_ENABLED: 'false',
      AUTH0_DOMAIN: 'test-domain',
      AUTH0_AUDIENCE: 'test-audience',
      BUGSNAG_API_KEY: 'test-api-key',
      BUGSNAG_RELEASE_STAGE: 'test',
    }

    describe('APP_PORT', () => {
      it.each([
        ['not a number', 'not-a-number', ['isInt']],
        ['undefined', undefined, ['isInt']],
      ])(
        'should fail validation when %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            APP_PORT: value,
          })
          const errors = await validate(invalidEnv)

          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('APP_PORT')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })

    describe('BUILD_NUMBER', () => {
      it.each([
        ['number', 123, ['isString']],
        ['boolean', false, ['isString']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            BUILD_NUMBER: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('BUILD_NUMBER')
          expectConstraints(errors, expectedConstraints)
        },
      )

      it('should default to `undefined` if not provided', async () => {
        const validEnv = plainToClass(ApplicationConfig, environment)
        const errors = await validate(validEnv)

        expect(errors).toHaveLength(0)
        expect(validEnv).toHaveProperty('BUILD_NUMBER')
        expect(validEnv.BUILD_NUMBER).toBeUndefined()
      })
    })

    describe('BUILD_VERSION', () => {
      it.each([
        ['number', 123, ['isString']],
        ['boolean', false, ['isString']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            BUILD_VERSION: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('BUILD_VERSION')
          expectConstraints(errors, expectedConstraints)
        },
      )

      it('should default to `undefined` if not provided', async () => {
        const validEnv = plainToClass(ApplicationConfig, environment)
        const errors = await validate(validEnv)

        expect(errors).toHaveLength(0)
        expect(validEnv).toHaveProperty('BUILD_VERSION')
        expect(validEnv.BUILD_VERSION).toBeUndefined()
      })
    })

    describe('LOG_PATH', () => {
      it.each([
        ['number', 123, ['isString']],
        ['boolean', false, ['isString']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            LOG_PATH: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('LOG_PATH')
          expectConstraints(errors, expectedConstraints)
        },
      )

      it('should be optional and allow undefined', async () => {
        const validEnv = plainToClass(ApplicationConfig, {
          ...environment,
          LOG_PATH: undefined,
        })
        const errors = await validate(validEnv)
        expect(errors).toHaveLength(0)
        expect(validEnv).toHaveProperty('LOG_PATH')
        expect(validEnv.LOG_PATH).toBeUndefined()
      })
    })

    describe('LOG_LEVEL', () => {
      it.each([
        ['undefined', undefined, ['isNotEmpty']],
        ['not a valid LogLevel', 'invalid-level', ['isEnum']],
      ])(
        'should fail validation when %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            LOG_LEVEL: value,
          })
          const errors = await validate(invalidEnv)

          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('LOG_LEVEL')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })

    describe('AUTH0_ENABLED', () => {
      it.each([
        ['undefined', undefined, ['isBoolean']],
        ['null', null, ['isBoolean']],
        ['number', 123, ['isBoolean']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            AUTH0_ENABLED: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('AUTH0_ENABLED')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })

    describe('AUTH0_DOMAIN', () => {
      it.each([
        ['undefined', undefined, ['isString']],
        ['null', null, ['isString']],
        ['number', 123, ['isString']],
        ['boolean', false, ['isString']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            AUTH0_DOMAIN: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('AUTH0_DOMAIN')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })

    describe('AUTH0_AUDIENCE', () => {
      it.each([
        ['undefined', undefined, ['isString']],
        ['null', null, ['isString']],
        ['number', 123, ['isString']],
        ['boolean', false, ['isString']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            AUTH0_AUDIENCE: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('AUTH0_AUDIENCE')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })

    describe('BUGSNAG_API_KEY', () => {
      it.each([
        ['undefined', undefined, ['isString']],
        ['null', null, ['isString']],
        ['number', 123, ['isString']],
        ['boolean', false, ['isString']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            BUGSNAG_API_KEY: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('BUGSNAG_API_KEY')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })

    describe('BUGSNAG_RELEASE_STAGE', () => {
      it.each([
        ['undefined', undefined, ['isNotEmpty', 'isIn']],
        ['null', null, ['isNotEmpty', 'isIn']],
        ['number', 123, ['isIn']],
        ['boolean', false, ['isIn']],
      ])(
        'should fail if provided as %s',
        async (description, value, expectedConstraints) => {
          const invalidEnv = plainToClass(ApplicationConfig, {
            ...environment,
            BUGSNAG_RELEASE_STAGE: value,
          })
          const errors = await validate(invalidEnv)
          expect(errors).toHaveLength(1)
          expect(errors[0].property).toBe('BUGSNAG_RELEASE_STAGE')
          expectConstraints(errors, expectedConstraints)
        },
      )
    })
  })
})
