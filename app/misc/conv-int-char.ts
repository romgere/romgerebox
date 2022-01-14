export function intToChar(intValue: MixCodeValue): string{

  if( intValue === undefined ){
    return 'Z'
  }

  return String.fromCharCode(65 + intValue)
}

export function  charToInt(char: string): MixCodeValue {

  if( char === 'Z' ){
    return undefined
  }

  return char.charCodeAt(0) - 65
}
