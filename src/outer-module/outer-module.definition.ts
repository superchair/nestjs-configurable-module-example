import { ConfigurableModuleBuilder } from '@nestjs/common'

export class OuterModuleOptions {
  baseUrl: string
}

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  ASYNC_OPTIONS_TYPE,
  OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<OuterModuleOptions>().build()
