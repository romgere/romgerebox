import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'
import sinon from "sinon"
import AudioService from 'romgerebox/services/audio'
import Constants from 'romgerebox/constants'

let audioContextStub: sinon.SinonStub<any[], any> | undefined = undefined

module('Unit | Service | audio', function (hooks) {
  setupTest(hooks)
  
  hooks.afterEach(function () {
    audioContextStub?.restore()
    audioContextStub = undefined
  })

  module('Initialization', function () {

    test('it instanciate an audio context, create audioWorklet & empty track array', function (assert) {

      audioContextStub = sinon.stub(window, 'AudioContext').returns({
        audioWorklet: {
          addModule: (path: string) => assert.step(`audioWorklet.addModule:${path}`)
        }
      })

      let service = this.owner.lookup('service:audio') as AudioService
      
      assert.true(audioContextStub?.calledOnce)
      assert.true(Boolean(service.audioContext))
      assert.verifySteps(['audioWorklet.addModule:/assets/workers/vue-meter-processor.js'])
      assert.strictEqual(
        service.trackSamples.filter((v) => v === undefined).length,
        Constants.TRACK_COUNT
      )
    })
  })
  
  module('Loop', function () {
    test('Loop values works', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      service.loopTime = 1000

      assert.strictEqual(service.playTime, 0, 'playTime is correct')
      assert.strictEqual(service.currentLoopTime, 0, 'currentLoopTime is correct')
      assert.strictEqual(service.currentLoopValue, 0, 'currentLoopValue is correct')
      assert.strictEqual(service.loopCount, 0, 'loopCount is correct')

      service.isPlaying = true

      // fake play since 100 ms
      service.startPlayTime = 10
      service.currentPlayTime = 110

      assert.strictEqual(service.playTime, 100, 'playTime is correct')
      assert.strictEqual(service.currentLoopTime, 100, 'currentLoopTime is correct')
      assert.strictEqual(service.currentLoopValue, 10, 'currentLoopValue is correct')
      assert.strictEqual(service.loopCount, 1, 'loopCount is correct')
      assert.true(service.isLoopSideA, 'isLoopSideA is true')
      assert.false(service.isLoopSideB, 'isLoopSideB is false')

      // fake play since 550 ms
      service.startPlayTime = 10
      service.currentPlayTime = 560
      assert.strictEqual(service.playTime, 550, 'playTime is correct')
      assert.strictEqual(service.currentLoopTime, 550, 'currentLoopTime is correct')
      assert.strictEqual(service.currentLoopValue, 56, 'currentLoopValue is correct')
      assert.strictEqual(service.loopCount, 1, 'loopCount is correct')
      assert.true(service.isLoopSideA, 'isLoopSideA is true')
      assert.false(service.isLoopSideB, 'isLoopSideB is false')

      // fake play since 1550 ms
      service.startPlayTime = 10
      service.currentPlayTime = 1560
      assert.strictEqual(service.playTime, 1550, 'playTime is correct')
      assert.strictEqual(service.currentLoopTime, 550, 'currentLoopTime is correct')
      assert.strictEqual(service.currentLoopValue, 56, 'currentLoopValue is correct')
      assert.strictEqual(service.loopCount, 2, 'loopCount is correct')
      assert.false(service.isLoopSideA, 'isLoopSideA is false')
      assert.true(service.isLoopSideB, 'isLoopSideB is true')

      // fake play since 150505 ms
      service.startPlayTime = 10
      service.currentPlayTime = 150515
      assert.strictEqual(service.playTime, 150505, 'playTime is correct')
      assert.strictEqual(service.currentLoopTime, 505, 'currentLoopTime is correct')
      assert.strictEqual(service.currentLoopValue, 51, 'currentLoopValue is correct')
      assert.strictEqual(service.loopCount, 151, 'loopCount is correct')
      assert.false(service.isLoopSideA, 'isLoopSideA is false')
      assert.true(service.isLoopSideB, 'isLoopSideB is true')      
    })
  })

  module('track array', function () {
    test('toto', function (assert) {

      // bindSample
      // unbindSample

      let service = this.owner.lookup('service:audio') as AudioService      
      assert.true(Boolean(service))
    })
  })

  module('Basic action', function () {
    // play
    // stop
    test('toto', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      assert.true(Boolean(service))
    })
  })

  module('Binding', function () {
    test('toto', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      assert.true(Boolean(service))
    })
    
  })

  module('Record', function () {
    test('toto', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      assert.true(Boolean(service))
    })
    
  })

  module('Mic', function () {
    test('toto', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService
      assert.true(Boolean(service))
    })
    
  })

  module('Misc', function () {
    // createVueMeter
    test('toto', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      assert.true(Boolean(service))
    })
  })
})
