import Service, { inject as service } from '@ember/service'
import { Mp3MediaRecorder } from 'mp3-mediarecorder'
import type AudioService from 'romgerebox/services/audio'
import { tracked } from '@glimmer/tracking'

export default class RecorderService extends Service {

  @service declare audio: AudioService

  @tracked isRecording = false
  startRecordTime = 0
  @tracked currentRecordTime = 0

  get recordTime():number {
    return this.currentRecordTime - this.startRecordTime
  }

  declare recorder :Mp3MediaRecorder
  declare recorderDestinationStream :MediaStreamAudioDestinationNode

  blobs: BlobPart[] = []
  mp3Blob ?: Blob
  @tracked recordedFileUri ?: string

  _recorderInterval ?:NodeJS.Timer 

  constructor() {
    super(...arguments)

    let { audioContext } = this.audio

    // Create, once for all, a media stream destination (for the recorder)
    this.recorderDestinationStream = audioContext.createMediaStreamDestination()
    
    this.recorder = new Mp3MediaRecorder(this.recorderDestinationStream.stream, {
      worker: new Worker('/assets/workers/mp3-media-encoder.js'),
      audioContext
    })

    this.recorder.onstart = this._onRecorderStart.bind(this)
    this.recorder.ondataavailable = this._onRecorderDataAvailable.bind(this)
    this.recorder.onstop = this._onRecorderStop.bind(this)
  }

  _onRecorderStart() {
    this.blobs = []
    this.startRecordTime = (new Date()).getTime()
    this._recorderInterval = setInterval( this._recordProgress.bind(this), 100)
    this.isRecording = true
  }

  _onRecorderDataAvailable(e: BlobEvent) {
    this.blobs.push(e.data)
  }

  _onRecorderStop() {
    if (this._recorderInterval) {
      clearInterval(this._recorderInterval)
    }

    this._recorderInterval = undefined

    this.startRecordTime = 0
    this.currentRecordTime = 0
    
    this.mp3Blob = new Blob(this.blobs, { type: 'audio/mpeg' })
    this.recordedFileUri = URL.createObjectURL(this.mp3Blob)    

    this.isRecording = false
  }

  stop(){
    this.recorder.stop()
  }

  start(){    
    this.recorder.start()
  }

  _recordProgress() {
    this.currentRecordTime = (new Date()).getTime()
  }
}

declare module '@ember/service' {
  interface Registry {
    'recorder': RecorderService
  }
}
