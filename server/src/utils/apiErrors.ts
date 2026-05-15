import { IApiCode } from "./constants";

export default class APIError extends Error {
  statusCode: number;

  constructor(apiCode: IApiCode, customMessage?: string) {
    super(customMessage || apiCode.message);

    this.statusCode = apiCode.code;

    Object.setPrototypeOf(this, APIError.prototype);
  }
}
