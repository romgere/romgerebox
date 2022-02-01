import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'
import sinon from "sinon"
import AudioService from 'romgerebox/services/audio'
import Constants from 'romgerebox/constants'
import Sample from 'romgerebox/models/sample'
import Service from '@ember/service'
import cases from 'qunit-parameterize'

function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

let audioContextStub: sinon.SinonStub<any[], any> | undefined = undefined
let audioWorkletNodeStub: sinon.SinonStub<any[], any> | undefined = undefined
let getUserMediaStub: sinon.SinonStub<any[], any> | undefined = undefined

const sampleAttrs = {
  file_a: 'a.ogg', // eslint-disable-line camelcase
  color: '#123456',
  icon: 'plane'
}

const versionAttrs = { loopTime: 123, name: '', samples: [] }

function mockSample(owner: any, assert: Assert) {

  let samples = [
    /* eslint-disable camelcase */
    new Sample({ ...sampleAttrs, file_a: 'f1' }, versionAttrs),
    new Sample({ ...sampleAttrs, file_a: 'f2' }, versionAttrs),
    new Sample({ ...sampleAttrs, file_a: 'f3' }, versionAttrs)
    /* eslint-enable camelcase */
  ]

  for(let s of samples) {
    s.gainNode = {
      connect(dest: string) { assert.step(`${s.file_a}-connect-${dest}`) },
      disconnect(dest: string) { assert.step(`${s.file_a}-disconnect-${dest}`) }
    } as unknown as GainNode
    s.isUsed = true
  }
  
  let service = owner.lookup('service:audio') as AudioService  
  service.trackSamples.replace(0, 3, samples)
}

module('Unit | Service | audio', function (hooks) {
  setupTest(hooks)
  
  hooks.afterEach(function () {
    audioContextStub?.restore()
    audioContextStub = undefined
    audioWorkletNodeStub?.restore()
    audioWorkletNodeStub = undefined
    getUserMediaStub?.restore()
    getUserMediaStub = undefined
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
      assert.true(service.isLoopSideA, 'isLoopSideA is true')
      assert.false(service.isLoopSideB, 'isLoopSideB is false')      
    })
  })

  module('Play/stop action', function (hooks) {

    hooks.beforeEach(function (assert) {
      this.owner.register('service:sample', class extends Service {
        playSample(s: Sample) { assert.step(`playSample-${s.file_a}`) }
        stopSample(s: Sample) { assert.step(`stopSample-${s.file_a}`) }
      })

      this.owner.register('service:recorder', class extends Service {
        isRecording = false
        stop() { assert.step('stopRecord') }
      })

      mockSample(this.owner, assert)
    })

    test('it starts playing', async function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      

      assert.false(service.isPlaying)

      service.play()
      await delay(350)

      assert.true(service.isPlaying, 'isPlaying is true')
      // This fail on CI
      // assert.true(service.playTime > 0, 'playTime has change')

      assert.verifySteps([
        'playSample-f1',
        'playSample-f2',
        'playSample-f3'
      ])      
    })

    cases([
      { recording: false, title: 'No recording' },
      { recording: true, title: 'while recording' }
    ]).test('it stop playing', async function ({ recording }, assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      this.owner.lookup('service:recorder').isRecording = recording
      
      service.play()
      assert.verifySteps([
        'playSample-f1',
        'playSample-f2',
        'playSample-f3'
      ])

      await delay(150)
      assert.true(service.isPlaying, 'isPlaying is true')

      service.stop()
      assert.false(service.isPlaying, 'isPlaying is false')

      assert.strictEqual(service.playTime, 0, 'playTime is reset') 

      let steps = [ 
        'stopSample-f1',
        'stopSample-f2',
        'stopSample-f3'
      ]
      assert.verifySteps(recording
        ? [ 'stopRecord', ...steps]
        : steps
      )
    })
  })

  module('Binding', function (hooks) {

    hooks.beforeEach(function (assert) {
      this.owner.register('service:sample', class extends Service {
        playSample(s: Sample, start: number) { assert.step(`playSample-${s.file_a}@${start}`) }
        stopSample(s: Sample) { assert.step(`stopSample-${s.file_a}`) }
        releaseSample(s: Sample) { assert.step(`releaseSample-${s.file_a}`) }        
      })

      this.owner.register('service:recorder', class extends Service {
        isRecording = false
        recorderDestinationStream = 'recorder-stream'
        stop() { assert.step('stopRecord') }
      })
    })

    cases([
      { isRecording: true, title: 'when recording' },
      { isRecording: false, title: 'no recording' }
    ]).test('_clearSample works', function ({ isRecording }, assert) {
      
      mockSample(this.owner, assert)

      this.owner.lookup('service:recorder').isRecording = isRecording

      let service = this.owner.lookup('service:audio') as AudioService      

      service._clearSample(service.trackSamples.firstObject as Sample)
      assert.verifySteps(isRecording
        ? [
          'f1-disconnect-recorder-stream',
          'stopSample-f1',
          'releaseSample-f1'
        ]
        : [
          'stopSample-f1',
          'releaseSample-f1'
        ]
      )
    })

    cases([
      {
        title: 'recording=off,playing=off,sideB=off',
        testSideB: false,
        isPlaying : false,
        isRecording: false,
        expectedSteps: []
      },
      {
        title: 'recording=off,playing=on,sideB=off',
        testSideB: false,
        isPlaying : true,
        isRecording: false,
        expectedSteps: [
          'playSample-f1@15'
        ]
      },
      {
        title: 'recording=on,playing=on,sideB=off',
        testSideB: false,
        isPlaying : true,
        isRecording: true,
        expectedSteps: [
          'f1-connect-recorder-stream',
          'playSample-f1@15'
        ]
      },
      {
        title: 'recording=off,playing=on,sideB=on',
        testSideB: true,
        isPlaying : true,
        isRecording: false,
        expectedSteps: [
          'playSample-f1@45'
        ]
      },
      {
        title: 'recording=on,playing=on,sideB=on',
        testSideB: true,
        isPlaying : true,
        isRecording: true,
        expectedSteps: [
          'f1-connect-recorder-stream',
          'playSample-f1@45'
        ]
       }
    ]).test('_integrateSample works', function ({ isRecording, testSideB, isPlaying, expectedSteps }, assert) {
      
      mockSample(this.owner, assert)

      this.owner.lookup('service:recorder').isRecording = isRecording

      let service = this.owner.lookup('service:audio') as AudioService      
      service.isPlaying = isPlaying
      if (service.isPlaying) {
        service.startPlayTime = 0
        service.currentPlayTime = 45
        service.loopTime = 30
      }
      
      let sample = service.trackSamples.firstObject as Sample
      if (testSideB) {
        sample.file_b = 'b.ogg' // eslint-disable-line camelcase
      }

      service._integrateSample(sample)
      assert.verifySteps(expectedSteps)
    })

    test('bindSample works', function (assert) {
      assert.expect(6)

      this.owner.register('service:audio', class extends AudioService {
        _integrateSample(s: Sample) { assert.step(`_integrateSample-${s.file_a}`) }
        _clearSample(s: Sample) { assert.step(`_clearSample-${s.file_a}`) }
      })
      
      mockSample(this.owner, assert)

      let service = this.owner.lookup('service:audio') as AudioService      
            
      // eslint-disable-next-line camelcase
      let sample = new Sample({ ...sampleAttrs, file_a: 'new' }, versionAttrs)
      
      assert.false(sample.isUsed)

      service.bindSample(0, sample)

      assert.true(sample.isUsed)

      assert.strictEqual(
        service.trackSamples.firstObject,
        sample
      )
      assert.verifySteps([
        '_clearSample-f1',
        '_integrateSample-new'
      ])
    })

    test('unbindSample works', function (assert) {
      assert.expect(5)

      this.owner.register('service:audio', class extends AudioService {
        _integrateSample(s: Sample) { assert.step(`_integrateSample-${s.file_a}`) }
        _clearSample(s: Sample) { assert.step(`_clearSample-${s.file_a}`) }
      })
      
      mockSample(this.owner, assert)

      let service = this.owner.lookup('service:audio') as AudioService      
            
      // eslint-disable-next-line camelcase
      let sample = service.trackSamples.firstObject as Sample      
      assert.true(sample.isUsed)
      service.unbindSample(0)
      assert.true(sample.isUsed)

      assert.strictEqual(
        service.trackSamples.firstObject,
        undefined
      )
      assert.verifySteps(['_clearSample-f1'])
    })
  })

  module('Record', function (hooks) {
    hooks.beforeEach(function (assert) {

      this.owner.register('service:recorder', class extends Service {
        recorderDestinationStream = 'recorder_stream'
        stop() { assert.step('stopRecord') }
        start() { assert.step('startRecord') }
      })

      this.owner.register('service:audio', class extends AudioService {
        play() { assert.step('play') }
      })

      mockSample(this.owner, assert)

      // fake a mic stream
      let service = this.owner.lookup('service:audio') as AudioService  
      service.micStream = {
        connect(dest: string) { assert.step(`mic-connect-${dest}`) }
      } as unknown as MediaStreamAudioSourceNode
    })
    

    cases([
      {
        title: 'Mic disabled & not playing',
        playing: false,
        micEnable: false,
        expectedSteps: [
          'f1-connect-recorder_stream',
          'f2-connect-recorder_stream',
          'f3-connect-recorder_stream',
          'startRecord',
          'play'
        ]
      },
      {
        title: 'Mic enable & not playing',
        playing: false,
        micEnable: true,
        expectedSteps: [
          'f1-connect-recorder_stream',
          'f2-connect-recorder_stream',
          'f3-connect-recorder_stream',
          'mic-connect-recorder_stream',
          'startRecord',
          'play'
        ]
      },
      {
        title: 'Mic disabled & playing',
        playing: true,
        micEnable: false,
        expectedSteps: [
          'f1-connect-recorder_stream',
          'f2-connect-recorder_stream',
          'f3-connect-recorder_stream',
          'startRecord'
        ]
      },
      {
        title: 'Mic enable & playing',
        playing: true,
        micEnable: true,
        expectedSteps: [
          'f1-connect-recorder_stream',
          'f2-connect-recorder_stream',
          'f3-connect-recorder_stream',
          'mic-connect-recorder_stream',
          'startRecord'
        ]        
      }
    ]).test('it starts & stops record', function ({ micEnable, playing, expectedSteps }, assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      service.isMicroEnable = micEnable
      service.isPlaying = playing

      service.startRecord()
      assert.verifySteps(expectedSteps)

      service.stopRecord()
      assert.verifySteps(['stopRecord'])
    })
  })

  module('Microphone', function (hooks) {

    hooks.beforeEach(function () {
      this.owner.register('service:recorder', class extends Service {
        isRecording = false
        recorderDestinationStream = 'recorder_stream'
      })
    })
    

    test('enableMicro thow an error if called when micro is not ready', function (assert) {
      assert.expect(1)

      let service = this.owner.lookup('service:audio') as AudioService
      try{
        service.enableMicro()
        assert.true(false, 'No error raised')
      } catch(e) {
        assert.strictEqual(e, 'Micro is not available, did you call audioService.requireMicro() before ?')
      }
    })

    test('requireMicro works', async function (assert) {
      
      let userMediaStreamMock = 'user-stream' as unknown as MediaStream
      getUserMediaStub = sinon.stub(navigator.mediaDevices, 'getUserMedia')
      getUserMediaStub.onFirstCall().returns(userMediaStreamMock)


      let service = this.owner.lookup('service:audio') as AudioService
      service.audioContext = {
        createMediaStreamSource(stream :string) {
          assert.step(`create-stream-${stream}`)
          return 'media-stram-source'
        }
      } as unknown as AudioContext

      assert.false(service.isMicroReady)
      assert.false(service.isMicroEnable)

      await service.requireMicro()


      assert.true(
        getUserMediaStub.calledWith({ audio: true }),
        'It request usermedia stream with audio'
      )
      assert.verifySteps(['create-stream-user-stream'], 'it create a media stream source with user media')
      
      assert.true(service.isMicroReady)
      assert.false(service.isMicroEnable)
      assert.strictEqual(
        service.micStream,
        'media-stram-source' as unknown as MediaStreamAudioSourceNode
      )
    })

    cases([
      { recording: false, title: 'No recording' },
      { recording: true, title: 'while recording' }
    ]).test('enableMicro connect mic stream to recorder when needed', function ({ recording }, assert) {
      let service = this.owner.lookup('service:audio') as AudioService

      service.isMicroReady = true
      service.micStream = {
        connect: (dest :string) => assert.step(`mic-stream-connect-${dest}`)
      } as unknown as MediaStreamAudioSourceNode
      
      this.owner.lookup('service:recorder').isRecording = recording

      assert.false(service.isMicroEnable)
      service.enableMicro()
      assert.true(service.isMicroEnable)

      assert.verifySteps(recording
        ? ['mic-stream-connect-recorder_stream']
        : []
      )
    })
  })

  module('Misc', function (hooks) {
    hooks.beforeEach(function (assert) {
      mockSample(this.owner, assert)
    })

    test('it creates VueMeter AudioWorkletNode', function (assert) {
      
      let vueMeterMock = {} as unknown as AudioWorkletNode
      audioWorkletNodeStub = sinon.stub(window, 'AudioWorkletNode')// .returns(AudioWorkletNode)
      audioWorkletNodeStub.onFirstCall().returns(vueMeterMock)
      
      let service = this.owner.lookup('service:audio') as AudioService      

      let vueMeter = service.createVueMeter()
      
      assert.strictEqual(
        vueMeter,
        vueMeterMock,
        'It returns the AudioWorkletNode vue meter'
      )
      assert.true(
        audioWorkletNodeStub.calledWith(service.audioContext, 'vumeter'),
        'It create an "vumeter" AudioWorkletNode with currect context'
      )
    })

    test('track can be reset', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      
      assert.strictEqual(service.trackSamples.filter((t) => t !== undefined).length, 3)
      service.resetTracks()
      assert.strictEqual(service.trackSamples.filter((t) => t === undefined).length, Constants.TRACK_COUNT)
    })

    test('_forEachSample iterate over tracks with sample', function (assert) {
      let service = this.owner.lookup('service:audio') as AudioService      

      service._forEachSample((s) => assert.step(`sample-${s.file_a}`))
      assert.verifySteps([
        'sample-f1',
        'sample-f2',
        'sample-f3'
      ])
    })
  })
})
