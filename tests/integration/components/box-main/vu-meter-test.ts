import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, find } from '@ember/test-helpers'
import { hbs } from 'ember-cli-htmlbars'
import Sample from 'romgerebox/models/sample'
import Constants from 'romgerebox/constants'

const gap = Constants.VUMETTER_CANVAS_HEIGHT / 10

// return an array of 10 booleans as convas representation 
function getCanvasArray(canvas: HTMLCanvasElement): Array<boolean> {
  
  let ctx = canvas.getContext('2d')
  if (!ctx) {
    return []
  }

  let values = []
  for (let i = 0; i < Constants.VUMETTER_CANVAS_HEIGHT; i += gap) {
    
    values.push(
      // Array of [r,g,b, a]
      ctx.getImageData(0, i, 1, 1).data.reduce((a, v) => a && Boolean(v), true)
    )
  }

  return values
}

module('Integration | Component | box-main/vu-meter', function (hooks) {
  setupRenderingTest(hooks)

  // eslint-disable-next-line qunit/require-expect
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

    let mockedMeterEvent = { data : { volume: 0 } }

    let mockedMeter = {
      port: { 
        onmessage: (e: typeof mockedMeterEvent) => e
      }
    }

    this.owner.lookup('service:audio').createVueMeter = function () {
      assert.step('createVueMeter')
      return mockedMeter 
    }

    sample.gainNode = {
      connect(dest: typeof mockedMeter) {
        assert.step('gainNode-connect')
        assert.strictEqual(dest, mockedMeter, 'gainNode is connected to meter')
      },
      
      disconnect(dest: typeof mockedMeter) {
        assert.step('gainNode-disconnect')
        assert.strictEqual(dest, mockedMeter, 'gainNode is disconnect to meter')
      }
    } as unknown as GainNode
  
    await render(hbs`<BoxMain::VuMeter @sample={{this.sample}} />`)
    
    assert
      .dom('canvas')
      .hasClass('vueMeter', 'it renders a canvas with vueMeter class')
      .hasAttribute('width', `${Constants.VUMETTER_CANVAS_WIDTH}`)
      .hasAttribute('height', `${Constants.VUMETTER_CANVAS_HEIGHT}`)

    let canvas = find('canvas') as HTMLCanvasElement
    
    assert.deepEqual(
      getCanvasArray(canvas),
      [false,false,false,false,false,false,false,false,false,false],
      'Canvas is full blank by default'
    )

    // A vue meter is created, not yet connected
    assert.verifySteps(['createVueMeter'])

    this.set('sample', sample)
    assert.verifySteps(['gainNode-connect'], 'sample was connected to meter')
    assert
      .dom('canvas')
      .hasClass('red-color-class', 'sample color class is added to canvas')

    // fake a meter change
    mockedMeterEvent.data.volume = 0.1
    mockedMeter.port.onmessage(mockedMeterEvent)
    assert.deepEqual(
      getCanvasArray(canvas),
      [true,true,true,true,true,true,false,false,false,false],
      'Canvas is updated when meter post message'
    )

    this.set('sample', undefined)
    
    assert.verifySteps(['gainNode-disconnect'], 'sample was disconnected from meter')
    assert.deepEqual(
      getCanvasArray(canvas),
      [false,false,false,false,false,false,false,false,false,false],
      'Canvas is full blank after sample removed'
    )
  })
})
