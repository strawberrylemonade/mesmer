export class CustomError extends Error {
  type: string
  code: Number

  toJSON() {
    return {
      message: this.message,
      type: this.type
    }
  }
}

export class MissingParameterError extends CustomError {
  param: string

  constructor(missingParam: string) {

    super('Required parameters not supplied.')
    this.param = missingParam
    this.type = 'MissingParameterError';
    this.code = 400;
  }

  toJSON() {
    return {
      message: this.message,
      type: this.type,
      param: this.param
    }
  }
}

export class ProcessError extends CustomError {
  constructor(message: string) {
    super(message)
    this.type = 'ProcessError';
    this.code = 500;
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string) {
    super(message)
    this.type = 'NotFoundError';
    this.code = 404;
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string) {
    super(message)
    this.type = 'DatabaseError';
    this.code = 500;
  }
}