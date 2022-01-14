import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, settled, doubleClick } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import Sample from 'romgerebox/models/sample'
import { defer } from 'rsvp'

module('Integration | Component | box-main/sample', function (hooks) {
  setupRenderingTest(hooks)

  hooks.beforeEach(function () {
    let intl = this.owner.lookup('service:intl')
    intl.set('t', (msg: string) => `t_${msg}`)  
  })

  test('it renders', async function (assert) {

    let sample = new Sample({
      file_a: 'a.ogg', // eslint-disable-line camelcase
      color: 'red-color-class',
      icon: 'plane'
    }, { 
      loopTime: 123,
      name: '',
      samples: []
    })

    this.set('sample', sample)

    await render(hbs`<BoxMain::Sample data-test-a-sample @sample={{this.sample}} />`)

    assert
      .dom('[data-test-a-sample]')
      .hasAttribute('role', 'button', 'It has role=button')
      .hasClass('boxSample')
      .hasClass('red-color-class', 'color class is added to sample')
      .doesNotHaveClass('is-used', 'is-used class is not present when sample is not used or played')
      .hasAttribute('uk-tooltip', 't_box_sample.drag_tooltip', 'drag_tooltip is used')

    assert.dom('svg').hasClass('fa-plane', 'sample icon is displayed')

    sample.isUsed = true
    await settled()

    assert
      .dom('[data-test-a-sample]')
      .hasClass('is-used', 'is-used class is not present when sample is not used or played')
      .hasAttribute('uk-tooltip', 't_box_sample.used_tooltip', 'used_tooltip is used')
  })

  test('it can single play the sample', async function (assert) {
    assert.expect(3)

    let sample = new Sample({
      file_a: 'a.ogg', // eslint-disable-line camelcase
      color: 'red-color-class',
      icon: 'plane'
    }, { 
      loopTime: 123,
      name: '',
      samples: []
    })

    this.set('sample', sample)

    let defered = defer()
    this.owner.lookup('service:sample').playSampleOnce = function (sampleToPlay: Sample) {
      assert.strictEqual(sampleToPlay, sample, 'it ask sample to be single played')
      return defered.promise
    }

    await render(hbs`<BoxMain::Sample data-test-a-sample @sample={{this.sample}} />`)
    await doubleClick('[data-test-a-sample]')

    assert
      .dom('[data-test-a-sample]')
      .hasClass('is-used', 'is-used class is present when sample is playing')

    // These 2 double click should not trigger playSampleOnce (expect will fail otherwise)
    await doubleClick('[data-test-a-sample]')
    await doubleClick('[data-test-a-sample]')
    
    defered.resolve()
    await settled()
    assert
      .dom('[data-test-a-sample]')
      .doesNotHaveClass('is-used', 'is-used class is no longer present when sample stop playing')
  })

})
