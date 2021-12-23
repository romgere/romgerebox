import { tracked } from '@glimmer/tracking'

export default class SampleModel {


  // name of audio file(s)
  file_a : string // eslint-disable-line camelcase
  file_b ?: string = undefined // eslint-disable-line camelcase

  // "Style" for this sample
  color = "s-color-0"
  icon = "music"

  get isDoubleSample(): boolean {
    return Boolean(this.file_b)
  }

  // Sample already init ? (bufferSource & gainNode created)
  sampleInit = false

  // Audio stuff
  buffer ?:ArrayBuffer //  (contains sound)  
  sampleMediaSource ?:AudioBufferSourceNode // AudioBufferSourceNode  
  declare gainNode:GainNode // Gain Node to control output volume of the sample
  loopTime = 0
  
  get mediaStream() {
    return this.gainNode
  }

  @tracked isUsed = false // Sample bind to track ?
  @tracked isPlaying = false
  @tracked _isMute = false
  @tracked _volume = 0

  set volume(value) {
    this._volume = value
    this._isMute = false
    this.gainNode.gain.value = value / 100
  }

  get volume() {
    return this._isMute ? 0 : this._volume
  }

  set isMute(value) {
    this._isMute = Boolean(value)
    this.gainNode.gain.value = this._isMute ? 0 : (this._volume / 100)
  }

  get isMute() {
    return this._isMute
  }

  constructor(attrs: BoxSample, version: BoxVersion) {
    this.file_a = attrs.file_a // eslint-disable-line camelcase
    this.file_b = attrs.file_b // eslint-disable-line camelcase
    this.color = attrs.color
    this.icon = attrs.icon

    this.loopTime = version.loopTime
  } 
}
