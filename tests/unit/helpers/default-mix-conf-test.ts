import { defaultMixConf } from 'romgerebox/helpers/default-mix-conf'
import { module, test } from 'qunit'

module('Unit | Helper | default-mix-conf', function () {

  test('it return empty mix conf', function (assert) {
    assert.strictEqual(
      defaultMixConf(),
      '|||||||'
    )
  })
})
