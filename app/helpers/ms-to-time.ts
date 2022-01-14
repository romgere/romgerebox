import { helper } from '@ember/component/helper'

export function msToTime(params: [number]): string {
  let duration = params[0]

  let milliseconds = Math.floor((duration % 1000) / 100)
  let seconds = Math.floor((duration / 1000) % 60)
  let minutes = Math.floor((duration / (1000 * 60)) % 60)
  let hours = Math.floor((duration / (1000 * 60 * 60)))

  let str = ""
  if( hours > 0 ){
    let hoursStr = (hours < 10) ? (`0${hours}`) : hours
    str += `${hoursStr}h `
  }

  if( minutes > 0 ){
    let minutesStr = (minutes < 10) ? (`0${minutes}`) : minutes
    str += `${minutesStr}m `
  }

  let secondsStr = (seconds < 10) ? (`0${seconds}`) : seconds

  return `${str}${secondsStr}.${milliseconds}s`
}

export default helper(msToTime)
