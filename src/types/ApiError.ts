export class HttpError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly body?: any,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class NetworkError extends Error {
  constructor(public readonly originalError: Error) {
    super('Network error occurred.')
    this.name = 'NetworkError'
    this.message = originalError.message
  }
}

export type ApiError = HttpError | NetworkError | Error
