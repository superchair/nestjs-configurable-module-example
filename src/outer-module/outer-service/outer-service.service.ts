import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'

@Injectable()
export class OuterServiceService {
  constructor(private readonly httpService: HttpService) {}

  async fetchData() {
    const response = this.httpService.get('/objects')
    return new Promise((resolve, reject) => {
      response.subscribe({
        next: (data) => {
          console.log('Data received:', data)
          resolve(data.data)
        },
        error: (error) => {
          console.error('Error occurred:', error)
          if (error instanceof Error) {
            reject(error)
          }
          reject(new Error('Unknown error occurred'))
        },
      })
    })
  }
}
