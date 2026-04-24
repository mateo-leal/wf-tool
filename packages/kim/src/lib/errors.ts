export class NodeNotFound extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, NodeNotFound.prototype)
    this.name = 'NodeNotFound'
  }
}

export class NodeInvalidType extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, NodeInvalidType.prototype)
    this.name = 'NodeInvalidType'
  }
}

export class UnsupportedOperation extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, UnsupportedOperation.prototype)
    this.name = 'UnsupportedOperation'
  }
}
