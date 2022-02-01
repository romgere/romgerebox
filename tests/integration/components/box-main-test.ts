import { module, test, skip } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, settled, click } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import Constants from 'romgerebox/constants'
import Sample from 'romgerebox/models/sample'
import GlimmerComponent from '@glimmer/component'
import AudioService from 'romgerebox/services/audio'

const versionAttrs = { loopTime: 123, name: '', samples: [] }

const mockedSamples = (new Array(10).fill(0)).map((_, index) => {
  let s = new Sample({
    file_a: `file_${index}.ogg`, // eslint-disable-line camelcase
    color: 'red',
    icon: 'toto'
  }, versionAttrs)

  // fake gainNode to allow mute/unmute sample
  s.gainNode = {
    gain : {
      value: 100
    }
  } as unknown as GainNode

  return s
})

module('Integration | Component | box-main', function (hooks) {
  setupRenderingTest(hooks)

  hooks.beforeEach(function () {
    this.set('versionIdx', 2)
    this.set('samples', mockedSamples)
    this.set('onMixConfUpdate', () => false)
    this.set('mixConf', [])
    
    // Mock VuMeter component to prevent error due to mocked sample
    this.owner.register(
      'component:box-main/vu-meter',
      class extends GlimmerComponent {}
    )
    this.owner.register(
      'template:box-main/vu-meter',
      hbs`<span data-test-mocked-vu-meter></span>`
    )
  })

  hooks.afterEach(function () {
    this.owner.lookup('service:audio').resetTracks()
  })

  test('it renders tracks, sample & toolbar', async function (assert) {
    
    await render(hbs`<BoxMain
      @versionIdx={{this.versionIdx}}
      @samples={{this.samples}}
      @mixConf={{this.mixConf}}
      @onMixConfUpdate={{this.onMixConfUpdate}}
    />`)

    assert.dom('[data-test-boxmain-toolbar]').exists()
    assert.dom('[data-test-boxmain-track]').exists({ count: Constants.TRACK_COUNT })
    assert.dom('[data-test-boxmain-sample]').exists({ count: mockedSamples.length })
  })

  test('sample are draggable when not used', async function (assert) {
    
    await render(hbs`<BoxMain
      @versionIdx={{this.versionIdx}}
      @samples={{this.samples}}
      @mixConf={{this.mixConf}}
      @onMixConfUpdate={{this.onMixConfUpdate}}
    />`)

    assert.dom('[data-test-boxmain-sample][draggable]').exists({ count: mockedSamples.length})

    mockedSamples[2].isUsed = true
    await settled()
    assert.dom('[data-test-boxmain-sample="2"]').doesNotHaveAttribute('draggable')
  })

  test('tracks are init/updated from mixCode', async function (assert) {
    
    this.owner.register('service:audio', class extends AudioService {

      bindSample(trackIdx: number, sample: Sample) {
        assert.step(`bindSample-${trackIdx}-${sample.file_a}`)
      }

      unbindSample(trackIdx: number) {
        assert.step(`unbindSample-${trackIdx}`)
      }
    })

    this.set('mixConf', [
      undefined,
      2,
      undefined,
      3,
      1,
      undefined,
      5,
      undefined,
      undefined
    ])

    await render(hbs`<BoxMain
      @versionIdx={{this.versionIdx}}
      @samples={{this.samples}}
      @mixConf={{this.mixConf}}
      @onMixConfUpdate={{this.onMixConfUpdate}}
    />`)

    assert.verifySteps([
      'unbindSample-0',
      'bindSample-1-file_2.ogg',
      'unbindSample-2',
      'bindSample-3-file_3.ogg',
      'bindSample-4-file_1.ogg',
      'unbindSample-5',
      'bindSample-6-file_5.ogg',
      'unbindSample-7',
      'unbindSample-8'
    ])

    this.set('mixConf', [
      undefined,
      2,
      undefined,
      3,
      undefined,
      4,
      5,
      undefined,
      undefined
    ])

    assert.verifySteps([
      'unbindSample-0',
      'bindSample-1-file_2.ogg',
      'unbindSample-2',
      'bindSample-3-file_3.ogg',
      'unbindSample-4',
      'bindSample-5-file_4.ogg',
      'bindSample-6-file_5.ogg',
      'unbindSample-7',
      'unbindSample-8'
    ])
  })

  skip('it called onMixConfUpdate when tracks change', async function (assert) {
    
    assert.expect(1)

    this.set('onMixConfUpdate', function (mixConf: MixCodeArray) {
      assert.deepEqual(mixConf, [
        1,2,3,4,5,6,7,9
      ])
    })

    await render(hbs`<BoxMain
      @versionIdx={{this.versionIdx}}
      @samples={{this.samples}}
      @mixConf={{this.mixConf}}
      @onMixConfUpdate={{this.onMixConfUpdate}}
    />`)

    // Do some drag/drop to bind sample to track
  })

  test('It shows/hides mixCode modal', async function (assert) {
    

    this.set('mixConf', [1,2,3,4,5,6,7,8,9])

    await render(hbs`<BoxMain
      @versionIdx={{this.versionIdx}}
      @samples={{this.samples}}
      @mixConf={{this.mixConf}}
      @onMixConfUpdate={{this.onMixConfUpdate}}
    />`)

    await click('[data-test-box-toolbar-save]')    
    assert.dom('[data-test-boxmain-mix-code]').exists()
    assert.dom('[data-test-boxmain-mix-code] [data-test-mix-code]').hasText('C-BCDE-FGHI-J')
    
    await click('[data-test-close-modal]')
    assert.dom('[data-test-boxmain-mix-code]').doesNotExist()
  })

  module('Solo', function () {

    test('track toggle solo', async function (assert) {
    
      this.set('mixConf', [1,2,3,4,5,6,7,8])
  
      await render(hbs`<BoxMain
        @versionIdx={{this.versionIdx}}
        @samples={{this.samples}}
        @mixConf={{this.mixConf}}
        @onMixConfUpdate={{this.onMixConfUpdate}}
      />`)
      
      await click('[data-test-boxmain-track="3"] [data-test-solo]')
  
      assert
        .dom('[data-test-boxmain-track="3"]')
        .hasAttribute('is-solo', '')
        .doesNotHaveAttribute('is-mute')
  
      assert
        .dom('[data-test-boxmain-track][is-mute]')
        .exists({ count: Constants.TRACK_COUNT - 1 })    
  
      await click('[data-test-boxmain-track="3"] [data-test-solo]')
  
      assert
        .dom('[data-test-boxmain-track="3"]')
        .doesNotHaveAttribute('is-solo', '')
        .doesNotHaveAttribute('is-mute')
  
      assert
        .dom('[data-test-boxmain-track][is-mute]')
        .doesNotExist()    
    })

    test('mute/unmute other track enable/disable solo', async function (assert) {
    
      this.set('mixConf', [1,2,3,0,0,0,0,0])
  
      await render(hbs`<BoxMain
        @versionIdx={{this.versionIdx}}
        @samples={{this.samples}}
        @mixConf={{this.mixConf}}
        @onMixConfUpdate={{this.onMixConfUpdate}}
      />`)
      
      await click('[data-test-boxmain-track="1"] [data-test-mute]')
      await click('[data-test-boxmain-track="2"] [data-test-mute]')
  
      assert
        .dom('[data-test-boxmain-track="0"]')
        .hasAttribute('is-solo', '')
        .doesNotHaveAttribute('is-mute')
    

      await click('[data-test-boxmain-track="2"] [data-test-mute]')
    
      assert
        .dom('[data-test-boxmain-track="0"]')
        .doesNotHaveAttribute('is-solo', '')
        .doesNotHaveAttribute('is-mute')
    })
  })
  
})
