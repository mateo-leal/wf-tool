export class FetchError extends Error {
  status: number
  constructor(status: number) {
    super()
    Object.setPrototypeOf(this, FetchError.prototype)
    this.name = 'FetchError'
    this.status = status
  }
}
