import Service, { inject as service } from '@ember/service'
import Constants from 'romgerebox/constants'
import { tracked } from '@glimmer/tracking'
import { A } from '@ember/array'
import { action } from '@ember/object'
import type SampleService from 'romgerebox/services/sample'
import type SampleModel from 'romgerebox/models/sample'

// Handle all the logic of sync playing somes tracks made of sample
export default class AudioService extends Service {

  @service('sample') declare sampleService: SampleService

  // Audio Context for application (one instance)
  audioContext :AudioContext

  // Array of samples used on tracks
  @tracked trackSamples :Array<SampleModel>
    
  // Play stuff
  @tracked isPlaying = false
  loopTime = 0 // Duration of a loop
  @tracked currentPlayTime = 0
  startPlayTime = 0 // "audioContext.currentTime" when start playing for sync

  get playTime():number {
    if (!this.isPlaying) {
      return 0
    }
  
    return this.currentPlayTime - this.startPlayTime
  }

  get currentLoopTime():number {
    return this.playTime % this.loopTime
  }

  get currentLoopValue():number {    
    return Math.ceil(this.currentLoopTime / this.loopTime * 100)
  }

  get loopCount():number {
    return Math.ceil(this.playTime / this.loopTime)
  }

  get isLoopSideA():boolean {
    return (this.playTime / this.currentLoopTime) % 2 > 1
  }

  get isLoopSideB():boolean {
    return !this.isLoopSideA
  }

  // Recorder stuff
  declare recorder :WebAudioRecorder
  declare recorderDestinationStream :GainNode
  @tracked recordedFileUri ?: string

  @tracked isRecording = false
  startRecordTime = 0
  @tracked currentRecordTime = 0

  get recordTime():number {
    return this.currentRecordTime - this.startRecordTime
  }  

  // Mic stuff
  micStream ?:MediaStreamAudioSourceNode
  isMicroReady = false
  @tracked isMicroEnable = false

  constructor() {
    super(...arguments)

    window.AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContext()
    
    this._initRecorder()

    this.trackSamples = A(new Array(Constants.TRACK_COUNT).fill(undefined))
  }

  resetTracks() {
    this.stop()
    this.trackSamples.replace(0, Constants.TRACK_COUNT, new Array(Constants.TRACK_COUNT).fill(undefined))
  }

  _forEachSample(callback: (s:SampleModel, i: number) => void) {
    this.trackSamples.forEach(function (value, idx) {
      if (value) {
        callback(value, idx)
      }
    })
  }

  _clearSample(sample: SampleModel) {
    let { sampleService } = this

    // remove sample from recording if needed
    if (this.isRecording && sample.mediaStream) {
      sample.mediaStream.disconnect(this.recorderDestinationStream)      
    }

    sampleService.stopSample(sample)
    sampleService.releaseSample(sample)
  }
  
  @action
  play(){
    this.isPlaying = true
    this.startPlayTime = this.audioContext.currentTime

    this._forEachSample((sample) => {
      this.sampleService.playSample(sample)
    })

    this._startLoopInterval()
  }

  // Start playing (+ recording) a sample at the correct start time when added during playing
  _integrateSample(sample: SampleModel) {

    // recording: Add new track to recordStream
    if (this.isRecording && sample.mediaStream) {
      sample.mediaStream.connect(this.recorderDestinationStream)
    }

    if (this.isPlaying) {
      if( this.isLoopSideB && sample.isDoubleSample){
        this.sampleService.playSample(sample, this.currentLoopTime + this.loopTime)
      } else {      
        this.sampleService.playSample(sample, this.currentLoopTime)
      }
    }
  }

  @action
  stop(){
    if (this.isRecording) {
      this.stopRecord()
    }

    this._stopLoopInterval()

    this._forEachSample((sample) => {
      this.sampleService.stopSample(sample)
    })

    this.isPlaying = false
    this.startPlayTime = 0
  }

  @action
  bindSample(trackIdx: number, sample: SampleModel) {
    let oldSample = this.trackSamples.objectAt(trackIdx)

    if (oldSample) {
      this._clearSample(oldSample)
    }

    this.trackSamples.replace(trackIdx, 1, [sample])
    sample.isUsed = true
    this._integrateSample(sample)
  }

  @action
  unbindSample(trackIdx: number) {
    let sample = this.trackSamples.objectAt(trackIdx)
    if (sample) {
      this._clearSample(sample)
    }
  

    this.trackSamples.replace(trackIdx, 1, [undefined])
  }


  _loopProgressInterval ?:NodeJS.Timer
  _startLoopInterval() {
    this._loopProgressInterval = setInterval(this._loopProgress.bind(this), 100)
  }

  _loopProgress() {
    this.currentPlayTime = this.audioContext.currentTime
  }

  _stopLoopInterval() {
    if (this._loopProgressInterval) {
      clearInterval(this._loopProgressInterval)
    }
  }

  _initRecorder() {
    // Create, once for all, a stream (for the recorder)
    this.recorderDestinationStream = this.audioContext.createGain()

    // Same for web audio recorder
    /* global WebAudioRecorder */
    this.recorder = new WebAudioRecorder(this.recorderDestinationStream, {
      workerDir: "web-audio-recorder/",
      encoding: Constants.RECORDING_FORMAT,
      
      onComplete: this._recordOnComplete.bind(this),
      onTimeout: this.stopRecord.bind(this),
      options: {
        timeLimit: Constants.RECORDING_MAX_TIME
      }
    })
  }

  _recorderInterval ?:NodeJS.Timer 

  _getTracksMediaStreamArray() :Array<AudioNode>{
    return this.trackSamples.reduce(function (a, sample){
      if (sample?.mediaStream) {
        a.push(sample.mediaStream)
      }

      return a
    }, [] as Array<AudioNode>)
  }

  _recordOnComplete(_ :WebAudioRecorder, blob: Blob) {
    let audioURL = window.URL.createObjectURL(blob)
    this.recordedFileUri = audioURL
  }

  _recordProgress() {
    this.currentRecordTime = (new Date()).getTime()
  }

  @action
  startRecord(){
    this.startRecordTime = (new Date()).getTime()
    this._recorderInterval = setInterval( this._recordProgress.bind(this), 100)

    let mediaStreams = this._getTracksMediaStreamArray()

    // connect all source audioMediaStream (from audio file)
    for (let stream of mediaStreams) {
      stream.connect(this.recorderDestinationStream)
    }

    // Mic
    if (this.isMicroEnable && this.micStream){
      this.micStream.connect( this.recorderDestinationStream)
    }

    // Start recording
    this.recorder.startRecording()
    if (!this.isPlaying){
      this.play()
    }

    this.isRecording = true
  }

  @action
  stopRecord(){
    if (this._recorderInterval) {
      clearInterval(this._recorderInterval)
    }

    this._recorderInterval = undefined

    this.startRecordTime = 0
    this.currentRecordTime = 0

    this.recorder.finishRecording()

    this.isRecording = false
  }

  async requireMicro() {
    // Get mic access and create the MediaSourceStream
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.micStream = this.audioContext.createMediaStreamSource( stream)
    this.isMicroReady = true
  }

  enableMicro() {
    if(this.isMicroReady) {
      if (this.isRecording && this.micStream) {
        this.micStream.connect( this.recorderDestinationStream)
      }
  
      this.isMicroEnable = true
    } else {
      throw 'Micro is not available, did you call audioService.requireMicro() before ?'
    }
  }

  disableMicro() {
    if (this.isRecording && this.micStream) {
      this.micStream.disconnect( this.recorderDestinationStream)
    }

    this.isMicroEnable = false
  }
}

declare module '@ember/service' {
  interface Registry {
    'audio': AudioService
  }
}