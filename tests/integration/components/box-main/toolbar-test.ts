import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, click } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'

module('Integration | Component | box-main/toolbar', function (hooks) {
  setupRenderingTest(hooks)

  test('it renders buttons & triggers action', async function (assert) {
    this.set('playing', false)
    this.set('recording', false)
    this.set('micEnable', false)
    this.set('canDownload', false)

    this.set('playAction', () => assert.step('playAction'))
    this.set('recordAction', () => assert.step('recordAction'))
    this.set('micAction', () => assert.step('micAction'))
    this.set('downloadAction', () => assert.step('downloadAction'))
    this.set('saveAction', () => assert.step('saveAction'))

    await render(hbs`
    <BoxMain::Toolbar
      class="my-super-toolbar"
      @playing={{this.playing}}

      @recording={{this.recording}}
      @micEnable={{this.micEnable}}
      @canDownload={{this.canDownload}}

      @playAction={{this.playAction}}
      @recordAction={{this.recordAction}}
      @micAction={{this.micAction}}
      @downloadAction={{this.downloadAction}}
      @saveAction={{this.saveAction}}
    />
    `)

    assert
      .dom('[data-test-box-toolbar]')
      .hasClass('my-super-toolbar', 'it handles dom attribute')

    // Play button
    assert
      .dom('[data-test-box-toolbar-play]')
      .hasAttribute('uk-tooltip', 'Play')
    assert
      .dom('[data-test-box-toolbar-play] svg')
      .hasClass('fa-play')

    this.set('playing', true)

    assert
      .dom('[data-test-box-toolbar-play]')
      .hasAttribute('uk-tooltip', 'Stop')
    assert
      .dom('[data-test-box-toolbar-play] svg')
      .hasClass('fa-stop')
    
    await click('[data-test-box-toolbar-play]')
    assert.verifySteps(['playAction'])

    // Save button
    assert
      .dom('[data-test-box-toolbar-save]')
      .hasAttribute('uk-tooltip', 'Save the mix')
    assert
      .dom('[data-test-box-toolbar-save] svg')
      .hasClass('fa-save')
    
    await click('[data-test-box-toolbar-save]')
    assert.verifySteps(['saveAction'])

    // Record button
    assert
      .dom('[data-test-box-toolbar-record]')
      .hasAttribute('uk-tooltip', 'Start recording')
      .hasClass('uk-button-default')
      .doesNotHaveClass('uk-button-danger')
    assert
      .dom('[data-test-box-toolbar-record] svg')
      .hasClass('fa-circle')

    this.set('recording', true)

    assert
      .dom('[data-test-box-toolbar-record]')
      .hasAttribute('uk-tooltip', 'Stop recording')
      .hasClass('uk-button-danger')
      .doesNotHaveClass('uk-button-default')
          
    await click('[data-test-box-toolbar-record]')
    assert.verifySteps(['recordAction'])

    // Mic button
    assert
      .dom('[data-test-box-toolbar-mic]')
      .hasAttribute('uk-tooltip', 'Enable microphone')
      .hasClass('uk-button-default')
      .doesNotHaveClass('uk-button-danger')
    assert
      .dom('[data-test-box-toolbar-mic] svg')
      .hasClass('fa-microphone-alt-slash')

    this.set('micEnable', true)

    assert
      .dom('[data-test-box-toolbar-mic]')
      .hasAttribute('uk-tooltip', 'Disable microphone')
      .hasClass('uk-button-danger')
      .doesNotHaveClass('uk-button-default')
    assert
      .dom('[data-test-box-toolbar-mic] svg')
      .hasClass('fa-microphone-alt')
    
    await click('[data-test-box-toolbar-mic]')
    assert.verifySteps(['micAction'])

    // Download button
    assert
      .dom('[data-test-box-toolbar-download]')
      .hasAttribute('uk-tooltip', 'Download your last recorded mix')
      .isDisabled()
    this.set('canDownload', true)

    assert
      .dom('[data-test-box-toolbar-mic]')
      .isNotDisabled()    
    await click('[data-test-box-toolbar-mic]')
    assert.verifySteps(['micAction'])
  })


  test('it renders loop-info & recording time', async function (assert) {
    
    this.set('loopSideA', false)
    this.set('loopCount', 123)
    this.set('loopValue', 50)
    this.set('recordingTime', 0)

    this.set('loopType', 'count')

    this.set('noop', () => false)

    await render(hbs`
    <BoxMain::Toolbar
      class="my-super-toolbar"

      @recordingTime={{this.recordingTime}}
      @loopType={{this.loopType}}
      @loopSideA={{this.loopSideA}}
      @loopCount={{this.loopCount}}
      @loopValue={{this.loopValue}}

      @playAction={{this.noop}}
      @recordAction={{this.noop}}
      @micAction={{this.noop}}
      @downloadAction={{this.noop}}
      @saveAction={{this.noop}}
    />
    `)

    assert
      .dom('[data-test-box-toolbar-loop-info]')
      .hasText('#123', 'it render loop count')

    this.set('loopType', 'side')
    
    assert
      .dom('[data-test-box-toolbar-loop-info]')
      .hasText('B', 'it render loop side')

    this.set('loopSideA', true)

    assert
      .dom('[data-test-box-toolbar-loop-info]')
      .hasText('A', 'it render loop side')

    assert
      .dom('[data-test-box-toolbar-loop-info] .progress')
      .hasAttribute('style', 'width: 50%', 'progress bar width depends on @loopValue')
    this.set('loopValue', 33)
    assert
      .dom('[data-test-box-toolbar-loop-info] .progress')
      .hasAttribute('style', 'width: 33%', 'progress bar width depends on @loopValue #2')

    assert
      .dom('[data-test-box-toolbar-record-time]')
      .isDisabled()
      .hasText('00.0s', '@recordingTime is displayed as readable time')
    this.set('recordingTime', 230786)
    assert
      .dom('[data-test-box-toolbar-record-time]')
      .hasText('03m 50.7s', '@recordingTime is displayed as readable time')
  })
})
