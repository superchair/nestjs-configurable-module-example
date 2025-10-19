import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PlatformLogger } from '@platform/logging'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  // logger configuration
  const platformLogger = await app.resolve(PlatformLogger)
  app.useLogger(platformLogger)

  // swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Configurable Module Example')
    .setDescription('')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      scheme: 'bearer',
      description: "Enter your bearer token in the format 'Bearer <token>'",
    })
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('swagger', app, documentFactory)

  // determine port from config
  const configService = app.get(ConfigService)
  const port = configService.get<number>('APP_PORT') as number
  await app.listen(port)

  const logger = new Logger('NestApplication')
  logger.log(`Application is running on: ${port}`)
}

void bootstrap()
