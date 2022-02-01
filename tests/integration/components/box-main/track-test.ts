import { module, test, skip } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, click, fillIn } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import GlimmerComponent from '@glimmer/component'
import Sample from 'romgerebox/models/sample'
import { drag } from 'romgerebox/tests/helpers/ember-drag-drop'

const sampleAttrs = {
  file_a: 'a.ogg', // eslint-disable-line camelcase
  file_b: 'b.ogg', // eslint-disable-line camelcase
  color: 'cool-sample-color-class',
  icon: 'plane'
}
const versionAttrs = { loopTime: 123, name: '', samples: [] }

module('Integration | Component | box-main/track', function (hooks) {
  setupRenderingTest(hooks)

  hooks.beforeEach(function () {

    // Mock VuMeter component to prevent error due to mocked sample
    this.owner.register(
      'component:box-main/vu-meter',
      class extends GlimmerComponent {}
    )
    this.owner.register(
      'template:box-main/vu-meter',
      hbs`<span data-test-mocked-vu-meter></span>`
    )

    this.set('noop', () => false)
  })

  test('it renders', async function (assert) {
    
    this.set('isSolo', false)
    await render(hbs`<BoxMain::Track
      @sample={{this.sample}}
      @onVolumeChange={{this.noop}}
      @onMuteToggle={{this.noop}}
      @onSoloToggle={{this.noop}}
      @onDropSample={{this.noop}}
      @onClearSample={{this.noop}}
      @isSolo={{this.isSolo}}
    />`)

    assert
      .dom('.boxTrack')
      .hasAttribute('uk-tooltip', 'Drop a sample in this area')
      .doesNotHaveClass('drag-pending')
      .doesNotHaveClass('has-sample')

      assert
      .dom('.track-icon svg')
      .hasClass('fa-question-circle')
      .hasClass('s-color-0')
    
    assert
      .dom('[data-test-mute]')
      .hasClass('uk-button-default')

    assert
      .dom('[data-test-solo]')
      .hasClass('uk-button-default')

    assert
      .dom('[data-test-delete]')
      .isDisabled()

    let sample = new Sample(sampleAttrs, versionAttrs)

    // Set a gainNode to allow to mute sample
    let audioContext = new AudioContext()
    sample.gainNode = audioContext.createGain()

    this.set('sample', sample)

    assert
      .dom('.boxTrack')
      .doesNotHaveAttribute('uk-tooltip')
      .doesNotHaveClass('drag-pending')
      .hasClass('has-sample')

    assert
      .dom('.track-icon svg')
      .hasClass('fa-plane')
      .hasClass('cool-sample-color-class')

    assert
      .dom('[data-test-delete]')
      .isEnabled()
    
    sample.isMute = true
    assert
      .dom('[data-test-mute]')
      .hasClass('uk-button-default')

    this.set('isSolo', true)
    assert
      .dom('[data-test-solo]')
      .hasClass('uk-button-primary')
  })

  test('it handles actions', async function (assert) {
    
    this.set('sample', new Sample(sampleAttrs, versionAttrs))

    this.set('onVolumeChange', (v: string) => assert.step(`onVolumeChange-${v}`))
    this.set('onMuteToggle', () => assert.step('onMuteToggle'))
    this.set('onSoloToggle', () => assert.step('onSoloToggle'))
    this.set('onClearSample', () => assert.step('onClearSample'))

    await render(hbs`<BoxMain::Track
      @sample={{this.sample}}
      @onVolumeChange={{this.onVolumeChange}}
      @onMuteToggle={{this.onMuteToggle}}
      @onSoloToggle={{this.onSoloToggle}}
      @onDropSample={{this.noop}}
      @onClearSample={{this.onClearSample}}
    />`)

    await fillIn('[type="range"]', '50')
    await fillIn('[type="range"]', '33')

    assert.verifySteps([
      'onVolumeChange-50',
      'onVolumeChange-50',
      'onVolumeChange-33',
      'onVolumeChange-33'
    ])

    await click('[data-test-mute]')
    assert.verifySteps(['onMuteToggle'])

    await click('[data-test-solo]')
    assert.verifySteps(['onSoloToggle'])

    await click('[data-test-delete]')
    assert.verifySteps(['onClearSample'])
  })

  skip('it handles drag/drop', async function (assert) {
    assert.expect(1)

    let sample = new Sample(sampleAttrs, versionAttrs)
    this.set('sample', sample)

    this.set('onDropSample', (s: Sample) => {
      assert.strictEqual(s, sample)
    })

    await render(hbs`<BoxMain::Track
      @onVolumeChange={{this.noop}}
      @onMuteToggle={{this.noop}}
      @onSoloToggle={{this.noop}}
      @onDropSample={{this.noop}}
      @onClearSample={{this.onDropSample}}
    />
    <DraggableObject @content={{this.sample}} data-test-draggable-sample>
      Coucou
    </DraggableObject>
    `)

    drag('data-test-draggable-sample', { drop: '.boxTrack' })
  })
})
