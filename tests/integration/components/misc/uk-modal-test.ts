import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, find } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import UIkit from 'uikit'

module('Integration | Component | misc/uk-modal', function (hooks) {
  setupRenderingTest(hooks)

  test('it renders', async function (assert) {
    
    this.set('onClose', () => assert.step('onClose'))
    await render(hbs`<Misc::UkModal
      @dialogClass="some_class"
      @onClose={{this.onClose}}
      class="customClass"
    ><span data-test-modal-content>Hello</span></Misc::UkModal>`)

    assert
      .dom('[uk-modal]')
      .exists('It render a UIKit modal')
      .hasClass('customClass', 'it applies attributes to modal')
      .hasClass('uk-open', 'modal is shown by default')
      .hasAttribute('container', 'false', 'container option is disabled on modal')

    assert
      .dom('.uk-modal-body')
      .hasClass('some_class', '@dialogClass add class to modal body')
    assert
      .dom('.uk-modal-body > [data-test-modal-content]')
      .exists('Modal content is rendered')

    let modal = find('[uk-modal]')
    if (modal) {
      UIkit.modal(modal).hide()
    }

    assert.verifySteps(['onClose'], 'onClose is called when modal is closed')
  })
})
