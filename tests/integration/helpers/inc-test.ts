import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'

module('Integration | Helper | inc', function (hooks) {
  setupRenderingTest(hooks)

  test('it increment by 1 when used with one arg', async function (assert) {
    await render(hbs`{{inc 1233}}`)
    assert.dom().hasText('1234')
  })

  test('it increment by second arg when specified', async function (assert) {
    await render(hbs`{{inc 1233 100}}`)
    assert.dom().hasText('1333')
  })
})
