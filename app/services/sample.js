import Service, { inject as service } from '@ember/service'
import Constants from 'romgerebox/constants'
import { cloneBuffer } from 'romgerebox/misc/clone-buffer'

export default class SampleService extends Service {

  @service audio
 
   /**
   * @public
   * Create and set mediaStreamSource on sample for audio file (A & B)
   * @param Sample sample     Sample to used (model)
   * @param integer loopTime  Time of loop in second
   */
   async initAudioSample(sample){

    let { audioContext } = this.audio
    
    // Load buffer and create BufferSource with buffer(s)s
    let buffer = await this._loadAudioBufferFromFile( sample.file_a)
    if (sample.isDoubleSample) {

      let bufferB = await this._loadAudioBufferFromFile( sample.file_b)

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
    sample.sampleMediaSource.connect( sample.gainNode)
    
    // Connect gainNode to output
    sample.gainNode.connect(audioContext.destination)

    sample.sampleInit = true
  }

  /**
   * @private
   * Load audio file and create audio buffer
   * @author mestresj
   * @param  string url             URL of audio file
   * @return Promise<ArrayBuffer>   Promise resolve with AudioBuffer if success
   */
  _loadAudioBufferFromFile(url) {

    let request = new XMLHttpRequest()
    request.open('GET', `/samples/${url}`, true)
    request.responseType = 'arraybuffer'
    return new Promise((resolve, reject) => {

      request.onload = function () {
        resolve(request.response)
      }

      request.onError = reject
      request.send()
    })
  }

  /**
   * @private
   * Create a bufferSource with buffer(s)
   * @author mestresj
   * @param  ArrayBuffer buffer         Sample Array buffer
   * @return AudioBuffer                 Buffer source for playing array(s) buffer(s)
   */
  _createBufferSource(buffer, loopTime) {

    let { audioContext }  = this.audio
    return new Promise((resolve, reject) => {

      // Clone buffer & keep it in sample.
      // Use to create again the audioBufferSource each time we stop it
      audioContext.decodeAudioData( cloneBuffer(buffer), function (response) {

        let audio = audioContext.createBufferSource()
        audio.buffer = response
        audio.loop = true
        audio.loopEnd = loopTime

        resolve( audio)
      }, reject)
    })
  }
  
  async resetSampleBufferSource(sample) {
    sample.sampleMediaSource = null

    // "An AudioBufferSourceNode can only be played once"
    // Prepare future play : create new AudioBufferSourceNode
    sample.sampleMediaSource = await this._createBufferSource( sample.buffer, sample.loopTime)
    sample.sampleMediaSource.connect(sample.gainNode)
  }

  playSample(sample, startTime = 0){
    if (!sample.isPlaying && sample.sampleMediaSource) {
      sample.sampleMediaSource.start(0, startTime)
      sample.isPlaying = true
    }
  }

  async playSampleOnce(sample){
    sample.isPlaying = true
    await new Promise((resolve) => {
      let { sampleMediaSource } = sample
      sampleMediaSource.loop = false
      sampleMediaSource.start(0, 0)
      sampleMediaSource.onended = () => {
        sample.isPlaying = false
        resolve()
      }
    })

    await this.resetSampleBufferSource(sample)
  }
  

  async stopSample(sample){
    if (sample.isPlaying) {
      sample.sampleMediaSource.stop(0)
      sample.isPlaying = false
      this.resetSampleBufferSource(sample)      
    }
  }
  
  // Reset "settings" when sample is "release" by track
  releaseSample(sample){
    sample.isUsed = false
    sample.isPlaying = false
    sample.isMute = false
    sample.volume = Constants.INITIAL_TRACK_VOLUME
  }
}
