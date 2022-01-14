import Sample from 'romgerebox/models/sample'
import { module, test } from 'qunit'

const sampleAttrs = {
  file_a: 'a.ogg', // eslint-disable-line camelcase
  file_b: 'b.ogg', // eslint-disable-line camelcase
  color: '#123456',
  icon: 'plane'
}

const versionAttrs = { loopTime: 123, name: '', samples: [] }

module('Unit | Model | sample', function () {

  test('model can initialize', function (assert) {
    let sample = new Sample(sampleAttrs, versionAttrs)

    assert.equal(sample.file_a, sampleAttrs.file_a)
    assert.equal(sample.file_b, sampleAttrs.file_b)
    assert.equal(sample.color, sampleAttrs.color)
    assert.equal(sample.icon, sampleAttrs.icon)

    assert.true(sample.isDoubleSample, 'model is double sample if file_b')
    sample.file_b = undefined // eslint-disable-line camelcase
    assert.false(sample.isDoubleSample, 'model is not double sample if file_b is empty')

    assert.false(sample.isUsed, 'isUsed is false by default')
    assert.false(sample.isPlaying, 'isPlaying is false by default')
  })

  test('model handles mute & volume state correcly', function (assert) {
    let sample = new Sample(sampleAttrs, versionAttrs)

    let gainNode = {
      gain : {
        value: 100
      }
    } 

    sample.gainNode = gainNode as GainNode

    assert.false(sample.isMute, 'isMute is false by default')
    assert.equal(sample.volume, 0, 'volume is 0')

    sample.volume = 100
    assert.equal(gainNode.gain.value, 1, 'volume is set on gainNode')

    sample.isMute =  true
    assert.equal(gainNode.gain.value, 0, 'volume is to 0 on gainNode when sample is muted')


    sample.volume = 50
    assert.equal(gainNode.gain.value, 0.5, 'volume is set on gainNode')
    assert.false(sample.isMute, 'sample is not longer muted')


    sample.isMute =  true
    assert.equal(gainNode.gain.value, 0, 'volume is to 0 on gainNode when sample is muted')

    sample.isMute =  false
    assert.equal(gainNode.gain.value, 0.5, 'volume is restored on gainNode when sample is unmuted')
  })

  test('mediaStream return gainNode', function (assert) {
    let sample = new Sample(sampleAttrs, versionAttrs)

    let gainNode = {
      gain : {
        value: 100
      }
    } 

    sample.gainNode = gainNode as GainNode
    assert.equal(sample.mediaStream, gainNode, 'mediaStream return gainNode')
  })
})
