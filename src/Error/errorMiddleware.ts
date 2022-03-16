import { UploadError } from "./uploadError"

export function handleError<T extends Error>(error: T){
  if(error.message.toLocaleLowerCase() == 'daily upload limit reached') throw new UploadError('daily upload limit reached')
}