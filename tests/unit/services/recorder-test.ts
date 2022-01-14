import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'
import sinon from "sinon"
import RecorderService from 'romgerebox/services/recorder'
import Service from '@ember/service'

import * as mp3Recorder from 'mp3-mediarecorder'

let Mp3MediaRecorderAPIStub: sinon.SinonStub<any[], any> | undefined = undefined
let WorkerSub: sinon.SinonStub<any[], any> | undefined = undefined

function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

module('Unit | Service | recorder', function (hooks) {
  setupTest(hooks)

  hooks.afterEach(function () {
    Mp3MediaRecorderAPIStub?.restore()
    WorkerSub?.restore()
  })

  test('it instanciate a Mp3MediaRecorder & Worker instance', function (assert) {

    let mockAudioContext = {
      createMediaStreamDestination() {
        return {
          stream: 'mockMediaStream'
        }
      }
      
    }
    this.owner.register('service:audio', class extends Service {
      audioContext = mockAudioContext
    })

    let Mp3MediaRecorderMock = sinon.mock(mp3Recorder.Mp3MediaRecorder)
    Mp3MediaRecorderAPIStub = sinon.stub(mp3Recorder, 'Mp3MediaRecorder').returns(Mp3MediaRecorderMock)

    let WorkerMock = sinon.mock(Worker)
    WorkerSub = sinon.stub(window, 'Worker').returns(WorkerMock)

    this.owner.lookup('service:recorder') as RecorderService

    assert.ok(
      WorkerSub.calledWith('/assets/workers/mp3-media-encoder.js'),
      'It create a service worker with url of mp3-media-encoder.js'
    )

    assert.ok(
      Mp3MediaRecorderAPIStub.calledWith(
        'mockMediaStream',
        {
          worker : WorkerMock,
          audioContext: mockAudioContext
        }
      ),
      'It create an instance of Mp3MediaRecorder with correct args'
    )
  })

  test('it handle recording state & timer', async function (assert) {

    let mockAudioContext = {
      createMediaStreamDestination() {
        return {
          stream: 'mockMediaStream'
        }
      }
      
    }
    this.owner.register('service:audio', class extends Service {
      audioContext = mockAudioContext
    })

    let recorderMock = {
      onstart: undefined as undefined | ((e :Event) => any),
      ondataavailable: undefined as undefined | ((e :Event) => any),
      onstop: undefined as undefined | ((e :Event) => any),
      start: sinon.stub(),
      stop: sinon.stub()
    }
    Mp3MediaRecorderAPIStub = sinon.stub(mp3Recorder, 'Mp3MediaRecorder').returns(recorderMock)

    let WorkerMock = sinon.mock(Worker)
    WorkerSub = sinon.stub(window, 'Worker').returns(WorkerMock)

    let service = this.owner.lookup('service:recorder') as RecorderService

    assert.false(service.isRecording, 'isRecording is false')
    assert.equal(service.currentRecordTime, 0, 'currentRecordTime is 0')

    service.start()
    assert.true(
      recorderMock.start.calledOnce,
      'recorder.start was called once'
    )
    
    recorderMock.onstart?.(new Event('start'))

    assert.true(service.isRecording, 'isRecording is true')
    await delay(200)
    assert.ok(service.currentRecordTime, 'currentRecordTime is not 0')

    // Mock some recording datas
    for (let i of [1,2,3]) {
      let e = new Event('start');
      (e as any).data = `blob${i}`
      recorderMock.ondataavailable?.(e)  
    }   

    service.stop()
    assert.true(
      recorderMock.stop.calledOnce,
      'recorder.start was called once'
    )
    recorderMock.onstop?.(new Event('stop'))
    assert.false(service.isRecording, 'isRecording is false')
    assert.equal(service.currentRecordTime, 0, 'currentRecordTime is reset')

    assert.ok(service.recordedFileUri, 'service provide record as Uri')
    assert.strictEqual(
      service.mp3Blob?.size,
      15, // 3 x "blobX"
      'blob contains all record part'
    )
  })
})

