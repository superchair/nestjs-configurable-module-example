import { Controller, Get, InternalServerErrorException } from '@nestjs/common'
import { OuterServiceService } from '../outer-module/outer-service/outer-service.service'

@Controller()
export class UserOuterServiceController {
  constructor(private readonly outerService: OuterServiceService) {}

  @Get()
  async getUserData() {
    try {
      return await this.outerService.fetchData()
    } catch {
      // You can customize the error response as needed
      throw new InternalServerErrorException()
    }
  }
}
