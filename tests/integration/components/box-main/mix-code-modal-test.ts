import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, click, find } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import UIkit from 'uikit'

module('Integration | Component | box-main/mix-code-modal', function (hooks) {
  setupRenderingTest(hooks)

  test('it renders', async function (assert) {
    
    this.set('onHide', () => assert.step('onHide'))
    await render(hbs`<BoxMain::MixCodeModal
      @onHide={{this.onHide}}
      @mixCode="The mixxxx !!"
    />`)

    assert.dom('[uk-modal].uk-open').exists('it display a UIKit modal')
    assert.dom('[data-test-mix-code]').hasText('The mixxxx !!', 'miw code is displayed')
    
    await click('[data-test-close-modal]')
    assert.verifySteps(['onHide'])

    let modal = find('[uk-modal]')
    if (modal) {
      UIkit.modal(modal).hide()
      assert.verifySteps(['onHide'])
    }
  })
})
