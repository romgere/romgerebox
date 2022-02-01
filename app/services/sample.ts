import Service, { inject as service } from '@ember/service'
import Constants from 'romgerebox/constants'
import { cloneBuffer } from 'romgerebox/misc/clone-buffer'
import type SampleModel from 'romgerebox/models/sample'
import type AudioService from 'romgerebox/services/audio'
import type FetchService from 'romgerebox/services/fetch'

export default class SampleService extends Service {
 
  @service declare audio: AudioService
  @service declare fetch: FetchService
 
   /**
   * @public
   * Create and set sampleMediaSource on sample for audio file (A & B)
   * @param Sample sample     Sample to used (model)
   * @param integer loopTime  Time of loop in second
   */
   async initAudioSample(sample: SampleModel){

    let { audioContext } = this.audio
    
    // Load buffer and create BufferSource with buffer(s)s
    let buffer = await this._loadAudioBufferFromFile( sample.file_a)
    if (sample.file_b) {
      let bufferB = await this._loadAudioBufferFromFile(sample.file_b)

      // Concat buffers
      let tmp = new Uint8Array(buffer.byteLength + bufferB.byteLength)
      tmp.set(new Uint8Array(buffer), 0)
      tmp.set(new Uint8Array(bufferB), buffer.byteLength)

      buffer = tmp.buffer // eslint-disable-line prefer-destructuring
    }

    sample.buffer = buffer

    sample.sampleMediaSource = await this._createBufferSource( buffer, sample.loopTime)
    
    // Create GainNode to control volume
    sample.gainNode = audioContext.createGain()
    sample.sampleMediaSource.connect(sample.gainNode)
    
    // Connect gainNode to output
    sample.gainNode.connect(audioContext.destination)

    sample.sampleInit = true
  }

  async _loadAudioBufferFromFile(url: string): Promise<ArrayBuffer> {
    return this.fetch.getArrayBuffer(`/samples/${url}`)
  }

  _createBufferSource(buffer: ArrayBuffer, loopTime: number): Promise<AudioBufferSourceNode> {

    let { audioContext }  = this.audio
    return new Promise((resolve, reject) => {

      // Clone buffer & keep it in sample.
      // Use to create again the audioBufferSource each time we stop it
      audioContext.decodeAudioData( cloneBuffer(buffer), function (response: AudioBuffer) {

        let audio = audioContext.createBufferSource()
        audio.buffer = response
        audio.loop = true
        audio.loopEnd = loopTime

        resolve( audio)
      }, reject)
    })
  }
  
  async resetSampleBufferSource(sample: SampleModel) {
    sample.sampleMediaSource = undefined

    if (!sample.buffer || !sample.gainNode) {
      return
    }

    // "An AudioBufferSourceNode can only be played once"
    // Prepare future play : create new AudioBufferSourceNode
    sample.sampleMediaSource = await this._createBufferSource( sample.buffer, sample.loopTime)
    sample.sampleMediaSource.connect(sample.gainNode)
  }

  playSample(sample: SampleModel, startTime = 0){
    if (!sample.isPlaying && sample.sampleMediaSource) {
      sample.sampleMediaSource.start(0, startTime)
      sample.isPlaying = true
    }
  }

  async playSampleOnce(sample: SampleModel): Promise<void> {
    
    if (sample.isPlaying) {
      return Promise.reject()
    }

    sample.isPlaying = true
    await new Promise((resolve, reject) => {
      
      if (!sample.sampleMediaSource) {
        return reject()
      }

      let { sampleMediaSource } = sample
      sampleMediaSource.loop = false
      sampleMediaSource.start(0, 0)
      sampleMediaSource.onended = () => {
        sample.isPlaying = false
        resolve(null)
      }
    })

    await this.resetSampleBufferSource(sample)
  }
  

  async stopSample(sample: SampleModel){
    if (sample.isPlaying && sample.sampleMediaSource) {
      sample.sampleMediaSource.stop(0)
      sample.isPlaying = false
      this.resetSampleBufferSource(sample)      
    }
  }
  
  // Reset "settings" when sample is "release" by track
  releaseSample(sample: SampleModel){
    sample.isUsed = false
    sample.isPlaying = false
    sample.isMute = false
    sample.volume = Constants.INITIAL_TRACK_VOLUME
  }
}

declare module '@ember/service' {
  interface Registry {
    'sample': SampleService
  }
}
