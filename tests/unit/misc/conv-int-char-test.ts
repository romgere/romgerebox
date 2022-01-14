import { intToChar, charToInt } from 'romgerebox/misc/conv-int-char'
import { module } from 'qunit'
import cases from 'qunit-parameterize'

module('Unit | Utility | misc/conv-int-char', function () {
  cases([
    { int: 0, char: 'A' },
    { int: 1, char: 'B' },
    { int: 10, char: 'K' },
    { int: 5, char: 'F' },
    { int: undefined, char: 'Z' }
  ]).test('intToChar & charToInt works', function ({ int, char }, assert) {
    let result = intToChar(int)
    assert.equal(result, char, 'intToChar return expected result')

    let resultb = charToInt(char)
    assert.equal(resultb, int, 'charToInt return expected result')
  })
})
