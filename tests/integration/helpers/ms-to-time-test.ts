import { module } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import cases from 'qunit-parameterize'

module('Integration | Helper | ms-to-time', function (hooks) {
  setupRenderingTest(hooks)

  cases([
    { value: 0, expected: '00.0s' },
    { value: 2307, expected: '02.3s' },
    { value: 230786, expected: '03m 50.7s' },
    { value: 23078612, expected: '06h 24m 38.6s' },
    { value: 230786121, expected: '64h 06m 26.1s' }
  ]).test('it renders', async function ({value, expected }, assert) {

    this.set('inputValue', value)
    await render(hbs`{{ms-to-time this.inputValue}}`)

    assert.dom().hasText(expected)
  })
})
