// assert if a given condition is false
export const assert = (condition:unknown, message?:string): void =>{
  if(condition) throw new Error(message)
}

