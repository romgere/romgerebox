import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, click } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'

module('Integration | Component | misc/locale-link', function (hooks) {
  setupRenderingTest(hooks)

  test('it renders', async function (assert) {
    
    let intl = this.owner.lookup('service:intl')
    intl.locale = 'en'

    this.set('onChange', function (locale: string) {
      assert.step(`onChange-${locale}`)
    })

    await render(hbs`<Misc::LocaleLink
      @locale="fr"
      @onChange={{this.onChange}}
    />`)

    assert
      .dom('li')
      .exists('it render a li item')
      .doesNotHaveClass('uk-active', 'item is not active')

    assert.dom('li a').hasText('Français', 'link item has language as text')

    await click('li a')
    assert.verifySteps(['onChange-fr'], 'onChange was called with locale')    
    assert.equal(intl.primaryLocale, 'fr', 'locale has changed')
    assert
      .dom('li')
      .hasClass('uk-active', 'item is active')
  })
})
