import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'
import Sample from 'romgerebox/models/sample'
import SampleService from 'romgerebox/services/sample'
import { defer } from 'rsvp'
import cases from 'qunit-parameterize'

const sampleAttrs = {
  file_a: 'a.ogg', // eslint-disable-line camelcase
  file_b: 'b.ogg', // eslint-disable-line camelcase
  color: '#123456',
  icon: 'plane'
}

const versionAttrs = { loopTime: 123, name: '', samples: [] }

module('Unit | Service | sample', function (hooks) {
  setupTest(hooks)

  cases([
    { doubleAudio: true, fileB: 'b.ogg', bufferSizeExpected: 20, title: 'with double audio file' },
    { doubleAudio: false, fileB: undefined, bufferSizeExpected: 10, title: 'with single audio file' }
  ]).test('initAudioSample load audio', async function ({ fileB, bufferSizeExpected, doubleAudio }, assert) {

    let a = new Uint8Array(10)
    a.set([2,3,0,7,2,3,0,7,2,3])

    let b = new Uint8Array(10)
    b.set([1,3,0,4,1,3,0,4,1,3])
    
    let buffers = {
      'a.ogg': a,
      'b.ogg': b
    } as Record<string, ArrayBuffer>

    let sample = new Sample(sampleAttrs, versionAttrs)    
    sample.file_b = fileB  // eslint-disable-line camelcase
    
    let mockedBufferSource = {
      connect: (destination: string) => assert.step(`buffer-source-connect-${destination}`)
    } as unknown as AudioBufferSourceNode

    this.owner.register('service:sample', class extends SampleService {

      async _loadAudioBufferFromFile(url: string): Promise<ArrayBuffer> {
        assert.step(`_loadAudioBufferFromFile-${url}`)
        return buffers[url]
      }

      _createBufferSource(buffer: ArrayBuffer, loopTime: number): Promise<AudioBufferSourceNode> {
        assert.step(`_createBufferSource-${buffer.byteLength}-${loopTime}`)
        return Promise.resolve(mockedBufferSource)
      }
    })

    let mockedGainNode = {
      toString: () => 'mocked-gain-node',
      connect: (destination: string) => assert.step(`gain-node-connect-${destination}`)
    }

    this.owner.lookup('service:audio').audioContext = {
      destination: 'audio-context-destination',

      createGain() {
        return mockedGainNode
      }
    }
  
    let service = this.owner.lookup('service:sample') as SampleService
    await service.initAudioSample(sample)

    let commonExpectedSteps = [      
      `_createBufferSource-${bufferSizeExpected}-${versionAttrs.loopTime}`,
      'buffer-source-connect-mocked-gain-node',
      'gain-node-connect-audio-context-destination'
    ]

    let expectedSteps = doubleAudio 
      ? ['_loadAudioBufferFromFile-a.ogg', '_loadAudioBufferFromFile-b.ogg', ...commonExpectedSteps]
      : ['_loadAudioBufferFromFile-a.ogg', ...commonExpectedSteps]
    assert.verifySteps(expectedSteps)

    assert.true(sample.sampleInit)
    assert.strictEqual(sample.gainNode, mockedGainNode as unknown)
    assert.strictEqual(sample.sampleMediaSource, mockedBufferSource as unknown)
  })

  test('_loadAudioBufferFromFile fetch & return audio as ArrayBuffer', async function (assert) {
    assert.expect(2)

    this.owner.lookup('service:fetch').getArrayBuffer = async (url: string) => {
      assert.equal(url, '/samples/tomster.ogg')
      return 'audio_file'
    }

    let service = this.owner.lookup('service:sample') as SampleService
    assert.strictEqual(
      await service._loadAudioBufferFromFile('tomster.ogg') as unknown,
      'audio_file'
    )
  })

  test('_createBufferSource return an AudioBuffer with decoded audio', async function (assert) {
    assert.expect(6)

    let a = new Uint8Array(10)
    a.set([2,3,0,7,2,3,0,7,2,3])
    let { buffer: sourceBuffer } = a

    this.owner.lookup('service:audio').audioContext = {
      decodeAudioData(buffer: ArrayBuffer, callback: (response: AudioBuffer) => void) {
        assert.step('decodeAudioData')
        assert.deepEqual(buffer, sourceBuffer, 'it decode a copy of the source buffer')
        assert.notStrictEqual(buffer, sourceBuffer, 'it use a copy of the source buffer')
        callback('decodedAudioBuffer' as unknown as AudioBuffer)
      },

      createBufferSource() {
        assert.step('createBufferSource')
        return {
          buffer: undefined,
          loop: undefined,
          loopEnd: undefined
        }
      }
    }

    
    let service = this.owner.lookup('service:sample') as SampleService
    assert.deepEqual(
      await service._createBufferSource(sourceBuffer, 123) as unknown,
      {
        buffer: 'decodedAudioBuffer',
        loop: true,
        loopEnd: 123
      },
      'it returns a valid audioBuffer'
    )

    assert.verifySteps(['decodeAudioData', 'createBufferSource'])
  })

  test('resetSampleBufferSource unset mediaSource', async function (assert) {
    let audioContext = new AudioContext()
    let initialContext = audioContext.createBufferSource()
    
    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.sampleMediaSource = initialContext

    let service = this.owner.lookup('service:sample') as SampleService
    service.resetSampleBufferSource(sample)

    assert.strictEqual(
      sample.sampleMediaSource,
      undefined,
      'it reset sampleMediaSource'
    )
  })

  test('resetSampleBufferSource re-init mediaSource', async function (assert) {
    assert.expect(6)

    let audioContext = new AudioContext()
    let initialContext = audioContext.createBufferSource()
    let sampleGainNode = audioContext.createGain()

    
    
    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.sampleMediaSource = initialContext
    sample.gainNode = sampleGainNode

    let a = new Uint8Array(10)
    a.set([2,3,0,7,2,3,0,7,2,3])
    let { buffer: sourceBuffer } = a
    sample.buffer = sourceBuffer

    let bufferSource = {
      connect(node: GainNode) {
        assert.strictEqual(node, sampleGainNode)
        assert.step('connect')
      }
    } as unknown as AudioBufferSourceNode

    this.owner.register('service:sample', class extends SampleService {

      _createBufferSource(buffer: ArrayBuffer, loopTime: number): Promise<AudioBufferSourceNode> {
        assert.deepEqual(buffer, sourceBuffer)
        assert.strictEqual(loopTime, versionAttrs.loopTime)

        return Promise.resolve(bufferSource)
      }
    })


    let service = this.owner.lookup('service:sample') as SampleService
    await service.resetSampleBufferSource(sample)

    assert.strictEqual(
      sample.sampleMediaSource,
      bufferSource,
      'sampleMediaSource was re-initialized'
    )
    assert.verifySteps(['connect'], 'mediaSource was connected to gainNode')
  })

  test('playSample start mediaSource', async function (assert) {
    assert.expect(4)

    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.sampleMediaSource = {
      start(when: number, offset: number) {
        assert.strictEqual(when, 0)
        assert.strictEqual(offset, 2307)
      }
    } as unknown as AudioBufferSourceNode

    let service = this.owner.lookup('service:sample') as SampleService

    assert.false(sample.isPlaying)
    service.playSample(sample, 2307)
    assert.true(sample.isPlaying)
  })

  test('stopSample stop mediaSource', async function (assert) {
    assert.expect(3)

    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.sampleMediaSource = {
      stop(when: number) {
        assert.strictEqual(when, 0)
      }
    } as unknown as AudioBufferSourceNode
    sample.isPlaying = true

    let service = this.owner.lookup('service:sample') as SampleService

    assert.true(sample.isPlaying)
    service.stopSample(sample)
    assert.false(sample.isPlaying)
  })

  test('releaseSample reset sample attrs', async function (assert) {
    
    let audioContext = new AudioContext()
    let sampleGainNode = audioContext.createGain()
    
    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.gainNode = sampleGainNode
    sample.isUsed = true
    sample.isPlaying = true
    sample.isMute = true
    sample.volume = 33

    let service = this.owner.lookup('service:sample') as SampleService

    service.releaseSample(sample)
    assert.false(sample.isUsed)
    assert.false(sample.isPlaying)
    assert.false(sample.isMute)
    assert.strictEqual(sample.volume, 100)
  })

  test('playSampleOnce failed if sample is already playing', async function (assert) {
    assert.expect(1)
    
    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.isPlaying = true
    
    let service = this.owner.lookup('service:sample') as SampleService

    try {
      await service.playSampleOnce(sample)
      assert.true(false, 'sample is played')
    } catch(e) {
      assert.true(true, 'error was raised')
    }
  })

  test('playSampleOnce failed if sample does not have sampleMediaSource', async function (assert) {
    assert.expect(1)
    
    let sample = new Sample(sampleAttrs, versionAttrs)
        
    let service = this.owner.lookup('service:sample') as SampleService

    try {
      await service.playSampleOnce(sample)
      assert.true(false, 'sample is played')
    } catch(e) {
      assert.true(true, 'error was raised')
    }
  })

  test('playSampleOnce play the sample once', async function (assert) {
    assert.expect(9)
    let playDefer = defer()
    let playPromise = playDefer.promise

    let mockedsampleMediaSource = {
      loop: true,

      start(when: number, offset: number) {
        assert.strictEqual(when, 0, 'it start playing sample')
        assert.strictEqual(offset, 0, 'it start playing without offset')
        assert.false(this.loop, 'sample is not a loop')
        playPromise.then(() => this.onended())        
      },

      onended: () => false
    }

    let sample = new Sample(sampleAttrs, versionAttrs)
    sample.sampleMediaSource = mockedsampleMediaSource as unknown as AudioBufferSourceNode
    
    this.owner.register('service:sample', class extends SampleService {

      async resetSampleBufferSource(s: Sample) {
        assert.strictEqual(s, sample, 'resetSampleBufferSource is called on sample')
        assert.step('resetSampleBufferSource')
      }
    })

    let service = this.owner.lookup('service:sample') as SampleService
    
    let playoncePromise = service.playSampleOnce(sample)
    assert.true(sample.isPlaying, 'sample is played')
    assert.verifySteps([])

    // end play
    playDefer.resolve(true)

    await playoncePromise
    assert.false(sample.isPlaying, 'sample is played')
    assert.verifySteps(['resetSampleBufferSource'])
  })  
})
