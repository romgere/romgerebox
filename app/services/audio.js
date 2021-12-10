import Service, { inject as service } from '@ember/service'
import Constants from 'romgerebox/constants'
import { tracked } from '@glimmer/tracking'
import { A } from '@ember/array'
import { action } from '@ember/object'

// Handle all the logic of sync playing somes tracks made of sample
export default class AudioService extends Service {

  @service('sample') sampleService

  // Audio Context for application (one instance)
  audioContext = null

  // Array of samples used on tracks
  @tracked trackSamples = undefined
    
  // Play stuff
  @tracked isPlaying = false
  loopTime = 0 // Duration of a loop
  @tracked currentPlayTime = 0
  startPlayTime = 0 // "audioContext.currentTime" when start playing for sync

  get playTime(){
    if (!this.isPlaying) {
      return 0
    }
  
    return this.currentPlayTime - this.startPlayTime
  }

  get currentLoopTime(){
    return this.playTime % this.loopTime
  }

  get currentLoopValue(){
    return parseInt(this.currentLoopTime / this.loopTime * 100)
  }

  get loopCount() {
    return Math.ceil(this.playTime / this.loopTime)
  }

  get isLoopSideA() {
    return (this.playTime / this.currentLoopTime) % 2 > 1
  }

  get isLoopSideB() {
    return !this.isLoopSideA
  }

  // Recorder stuff
  recorder = undefined
  recorderDestinationStream = undefined
  @tracked recordedFileUri = undefined

  @tracked isRecording = false
  startRecordTime = 0
  @tracked currentRecordTime = 0

  get recordTime(){
    return this.currentRecordTime - this.startRecordTime
  }  

  // Mic stuff
  micStream = null
  isMicroReady = false
  @tracked isMicroEnable = false

  constructor() {
    super(...arguments)

    window.AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioContext = new AudioContext()
    
    this.initRecorder()

    this.trackSamples = A(new Array(Constants.TRACK_COUNT).fill(undefined))
  }

  _forEachSample(callback) {
    this.trackSamples.forEach(function (value, idx) {
      if (value) {
        callback(value, idx)
      }
    })
  }

  _clearSample(sample) {
    let { sampleService } = this

    // remove sample from recording if needed
    if (this.isRecording) {
      sampleService.mediaStream.disconnect(this.recorderDestinationStream)      
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
  _integrateSample(sample) {

    // recording: Add new track to recordStream
    if (this.isRecording) {
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
    if (this.recording) {
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
  bindSample(trackIdx, sample) {
    let oldSample = this.trackSamples.objectAt(trackIdx)

    if (oldSample) {
      this._clearSample(sample)
    }

    this.trackSamples.replace(trackIdx, 1, [sample])
    this._integrateSample(sample)
  }

  @action
  unbindSample(trackIdx) {
    let sample = this.trackSamples.objectAt(trackIdx)
    this._clearSample(sample)

    this.trackSamples.replace(trackIdx, 1, [undefined])
  }


  _loopProgressInterval = undefined
  _startLoopInterval() {
    this._loopProgressInterval = setInterval(this._loopProgress.bind(this), 100)
  }

  _loopProgress() {
    this.currentPlayTime = this.audioContext.currentTime
  }

  _stopLoopInterval() {
    clearInterval(this._loopProgressInterval)
  }

  initRecorder() {
    let { audioContext } = this

    // Create, once for all, a stream (for the recorder)
    let recorderDestinationStream = audioContext.createGain()
    this.recorderDestinationStream = recorderDestinationStream

    // Same for web audio recorder
    /* global WebAudioRecorder */
    this.recorder = new WebAudioRecorder(recorderDestinationStream, {
      workerDir: "web-audio-recorder/",
      encoding: Constants.RECORDING_FORMAT,
      
      onComplete: this._recordOnComplete.bind(this),
      onTimeout: this.stopRecord.bind(this),
      options: {
        timeLimit: Constants.RECORDING_MAX_TIME
      }
    })
  }

  _recorderInterval = undefined 

  _getTracksMediaStreamArray(){
    return this.trackSamples.reduce(function (a, sample){
      if (sample) {
        a.push(sample.mediaStream)
      }

      return a
    }, [])
  }

  _recordOnComplete(rec, blob) {
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
    if (this.isMicroEnable){
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
    clearInterval(this._recorderInterval)
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
      if (this.isRecording) {
        this.micStream.connect( this.recorderDestinationStream)
      }
  
      this.isMicroEnable = true
    } else {
      throw 'Micro is not available, did you call audioService.requireMicro() before ?'
    }
  }

  disableMicro() {
    if (this.isRecording) {
      this.micStream.disconnect( this.recorderDestinationStream)
    }

    this.isMicroEnable = false
  }
}
