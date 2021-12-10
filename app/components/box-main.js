import Component from '@glimmer/component'
import { action } from '@ember/object'
import { inject as service } from '@ember/service'
import Constants from 'romgerebox/constants'
import { intToChar } from 'romgerebox/misc/conv-int-char'
import { tracked } from '@glimmer/tracking'

export default class BoxMainComponent extends Component {

  @service intl

  @service('audio') audio

  @tracked showMixCode = false

  get trackCount() {
    return this.audio.trackSamples.filter((s) => s !== undefined).length
  }

  get soloTrack() {

    if (this.trackCount > 1) {
      let noMutedSamplesIdx = this.audio.trackSamples.reduce(function (a, sample, idx) {
        if (sample && !sample.isMute) {
          a.push(idx)
        }

        return a
      }, [])
      return noMutedSamplesIdx.length === 1 ? noMutedSamplesIdx[0] : undefined
    }
    
    return undefined
  }

  get currentMixConf() {
    return this.audio.trackSamples.map((s) => {
      let i = this.args.samples.indexOf(s)
      return i >= 0 ? i : undefined
    })
  }

  get currentMixCode() {
    let mixCode = intToChar( this.args.versionIdx)

    this.currentMixConf.forEach((sampleIdx, idx) => {

      if( idx % 4 === 0 ){
        mixCode += '-'
      }

      mixCode += intToChar( parseInt(sampleIdx))    
    })

    return mixCode
  }

  @action
  updateFromMixConf() {
    let { mixConf } = this.args
    if (this.currentMixConf.join() !== mixConf.join()) {
      mixConf.forEach((sampleIdx, trackIdx) => {
        if (sampleIdx >= 0) {
          this.audio.bindSample(trackIdx, this.args.samples[sampleIdx])
        } else {
          this.audio.unbindSample(trackIdx)
        }
      })
    }
  }

  @action
  updateMixConf() {
    this.args.onMixConfUpdate(this.currentMixConf)
  }

  @action
  bindSample(trackIdx, sample) {
    this.audio.bindSample(trackIdx, sample)
    this.updateMixConf()
  }

  @action
  unbindSample(trackIdx) {
    this.audio.unbindSample(trackIdx)
    this.updateMixConf()
  }
  

  @action
  changeVolume(trackIdx, value) {
    this.audio.trackSamples.objectAt(trackIdx).volume = value
  }
  
  @action
  muteToggle(trackIdx) {
    let sample = this.audio.trackSamples.objectAt(trackIdx)
    sample.isMute = !sample.isMute
  }

  @action
  soloToggle(trackIdx) {
    let trackIsSolo = this.soloTrack === trackIdx

    this.audio.trackSamples.forEach((sample, idx) => {
      if(sample) {
        sample.isMute = trackIsSolo
          ? false
          : trackIdx !== idx
      }
    })
  }

  @action
  togglePlay(){
    let { audio } = this
    if (audio.isPlaying) {
      audio.stop()
    } else {
      audio.play()
    }
  }

  @action
  toggleRecord(){
    let { audio } = this
    if( audio.isRecording){
      audio.stopRecord()
    } else{
      audio.startRecord()
    }
  }

  @action
  async toggleMic(){
    if (this.audio.isMicroEnable) {
      this.audio.disableMicro()
    } else {
      if (!this.audio.isMicroReady) {
        try {
          await this.audio.requireMicro()
        } catch(e) {
          alert( this.intl.t('box_main.error.mic_not_available'))
        }
      }

      this.audio.enableMicro()
    }
  }

  
  @action
  downloadRecord(){
    // Download file
    let a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none"
    a.href = this.audio.recordedFileUri
    a.download = `mix.${Constants.RECORDING_FORMAT}`
    a.target = '_blank'
    a.click()
  }

  willDestroy(){
    super.willDestroy(...arguments)
    this.audio.stop()
  }
  
  @action
  showMixCodeModal(){
    if( !this.trackCount ){
      alert(this.intl.t('box_main.error.add_one_sample'))
    }
    else{
      this.showMixCode = true
    }
  }
}
