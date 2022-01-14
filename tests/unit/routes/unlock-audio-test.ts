import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'

module('Unit | Route | unlock-audio', function (hooks) {
  setupTest(hooks)

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:unlock-audio')
    assert.ok(route)
  })
})
