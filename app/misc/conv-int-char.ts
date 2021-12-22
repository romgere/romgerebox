export function intToChar(intValue: mixCodeValue): string{

  if( Number.isNaN(intValue) || intValue == null || intValue === undefined ){
    return 'Z'
  }

  return String.fromCharCode(65 + intValue)
}

export function  charToInt(char: string): mixCodeValue {

  if( char === 'Z' ){
    return undefined
  }

  return char.charCodeAt(0) - 65
}
