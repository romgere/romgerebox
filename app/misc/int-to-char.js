export function intToChar(intValue) {

  if( Number.isNaN(intValue) || intValue == null || intValue == undefined ){
    return 'Z';
  }

  return String.fromCharCode(65 + intValue);
}
