import { DynamicModule, Module } from '@nestjs/common'
import {
  ASYNC_OPTIONS_TYPE,
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
} from './outer-module.definition'
import { OuterServiceService } from './outer-service/outer-service.service'
import { HttpModule } from '@nestjs/axios'

@Module({
  providers: [OuterServiceService],
  exports: [OuterServiceService],
})
export class OuterModuleModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    const { imports, providers, exports } = super.register(options)
    return {
      module: OuterModuleModule,
      imports: [
        ...(imports || []),
        HttpModule.register({
          baseURL: options.baseUrl,
        }),
      ],
      providers,
      exports,
    }
  }

  static registerAsync(
    moduleOptions: typeof ASYNC_OPTIONS_TYPE,
  ): DynamicModule {
    const { imports, providers, exports } = super.registerAsync(moduleOptions)
    return {
      module: OuterModuleModule,
      imports: [
        ...(imports || []),
        HttpModule.registerAsync({
          imports: [...(imports || [])],
          inject: [MODULE_OPTIONS_TOKEN],
          extraProviders: providers,
          useFactory: (options: typeof OPTIONS_TYPE) => {
            return {
              baseURL: options?.baseUrl,
            }
          },
        }),
      ],
      providers,
      exports,
    }
  }
}
