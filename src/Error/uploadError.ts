import { ErrorMessage } from "./errorMessage"

export class UploadError extends Error {
  constructor(message: string){
    super(message)
    this.name = 'Upload Error:'
  }
}