import { cloneBuffer } from 'romgerebox/misc/clone-buffer'
import { module, test } from 'qunit'

module('Unit | Utility | misc/clone-buffer', function () {

  test('it works', function (assert) {
    
    let a = new Uint8Array(10)
    a.set([2,3,0,7,2,3,0,7,2,3])
    let { buffer } = a
    let clone = cloneBuffer(buffer)

    assert.deepEqual(clone, buffer, 'buffer contents are equal')
    assert.notEqual(buffer, clone, 'array are not same object')
  })
})
