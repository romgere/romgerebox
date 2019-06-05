export function intToChar(intValue){

  if( Number.isNaN(intValue) || intValue == null || intValue == undefined ){
    return 'Z';
  }

  return String.fromCharCode(65 + intValue);
}

export function  charToInt(char){

  if( char == 'Z' ){
    return null;
  }

  return char.charCodeAt(0);
}
