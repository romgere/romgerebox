import Component from '@glimmer/component'
import { action } from '@ember/object'
import { inject as service } from '@ember/service'
import Constants from 'romgerebox/constants'
import { intToChar } from 'romgerebox/misc/conv-int-char'
import { tracked } from '@glimmer/tracking'

import type SampleModel from 'romgerebox/models/sample'
import type AudioService from 'romgerebox/services/audio'
import type IntlService from 'ember-intl/services/intl'

interface UiInputArgs {
  versionIdx: number;
  samples: Array<SampleModel>
  mixConf: MixCodeArray
  onMixConfUpdate: (mixCode :MixCodeArray) => void;
}

export default class BoxMainComponent extends Component<UiInputArgs> {

  @service declare intl: IntlService
  @service declare audio: AudioService

  @tracked showMixCode = false

  get trackCount() {
    return this.audio.trackSamples.filter((s) => s !== undefined).length
  }

  get soloTrack(): number | undefined {

    if (this.trackCount > 1) {
      let noMutedSamplesIdx = this.audio.trackSamples.reduce(function (a, sample, idx) {
        if (sample && !sample.isMute) {
          a.push(idx)
        }

        return a
      }, [] as Array<number>)
      return noMutedSamplesIdx.length === 1 ? noMutedSamplesIdx[0] : undefined
    }
    
    return undefined
  }

  get currentMixConf(): MixCodeArray {
    return this.audio.trackSamples.map((s) => {
      let i = this.args.samples.indexOf(s)
      return i >= 0 ? i : undefined
    })
  }

  get currentMixCode() {
    let mixCode = intToChar(this.args.versionIdx)

    this.currentMixConf.forEach((sampleIdx, idx) => {

      if( idx % 4 === 0 ){
        mixCode += '-'
      }

      mixCode += intToChar(sampleIdx)    
    })

    return mixCode
  }

  @action
  updateFromMixConf() {
    let { mixConf } = this.args
    if (this.currentMixConf.join() !== mixConf.join()) {
      mixConf.forEach((sampleIdx, trackIdx) => {
        if (sampleIdx && sampleIdx >= 0) {
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
  bindSample(trackIdx: number, sample: SampleModel) {
    this.audio.bindSample(trackIdx, sample)
    this.updateMixConf()
  }

  @action
  unbindSample(trackIdx: number) {
    this.audio.unbindSample(trackIdx)
    this.updateMixConf()
  }
  

  @action
  changeVolume(trackIdx: number, value: number) {
    let sample = this.audio.trackSamples.objectAt(trackIdx)
    if (sample) {
      sample.volume = value
    }
  }
  
  @action
  muteToggle(trackIdx: number) {
    let sample = this.audio.trackSamples.objectAt(trackIdx)
    if (sample) {
      sample.isMute = !sample.isMute
    }
  }

  @action
  soloToggle(trackIdx: number) {
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
    if (!this.audio.recordedFileUri) {
      return
    }

    // Download file
    let a = document.createElement("a")
    document.body.appendChild(a)
    a.setAttribute('style', 'display: none')
    a.href = this.audio.recordedFileUri
    a.download = `mix.${Constants.RECORDING_FORMAT}`
    a.target = '_blank'
    a.click()
  }

  willDestroy(){
    super.willDestroy()
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
