import { helper } from '@ember/component/helper';

export function msToTime(params/*, hash*/) {
  let duration = params[0];

  let milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  let str = "";
  if( hours > 0 ){
    hours = (hours < 10) ? ("0" + hours) : hours;
    str += hours+"h "
  }

  if( minutes > 0 ){
    minutes = (minutes < 10) ? ("0" + minutes) : minutes;
    str += minutes+"m "
  }

  seconds = (seconds < 10) ? ("0" + seconds) : seconds;

  return str + seconds+"."+milliseconds+"s";
}

export default helper(msToTime);
