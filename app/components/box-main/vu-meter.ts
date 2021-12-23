import Component from '@glimmer/component'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'
import Constants from 'romgerebox/constants'
import { AudioStreamProcessor, audioStreamProcessor } from 'audio-stream-meter'

import type SampleModel from 'romgerebox/models/sample'
import type AudioService from 'romgerebox/services/audio'

interface UiInputArgs {
  sample: SampleModel;
}

export default class VuMetterComponent extends Component<UiInputArgs> {

  @service declare audio: AudioService

  width = Constants.VUMETTER_CANVAS_WIDTH
  height = Constants.VUMETTER_CANVAS_HEIGHT

  canvas ?:HTMLCanvasElement
  meter:AudioStreamProcessor

  // Keep ref to connected Stream and disconnect when sample change
  connectedStream?:AudioNode

  constructor(owner: unknown, args: UiInputArgs) {
    super(owner, args)

    // Create a new volume meter and connect it.
    this.meter = audioStreamProcessor(this.audio.audioContext, function () {})
  }

  @action
  registerCanvas(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement
  }

  @action
  updateSample(){

    let { meter } = this
    let { sample } = this.args

    // Connect sample stream to meter
    if (sample){
      let stream = sample.mediaStream
      stream.connect(meter)
      this.connectedStream = stream
      this.onLevelChange()
    } else {
      // Disconnect the "old sample" (stream) from "meter"
      this.connectedStream?.disconnect(meter)
      this.connectedStream = undefined
    }
  }

  onLevelChange(){
    let { canvas, meter, args: { sample } } = this
    if (canvas && meter) {

      let canvasContext = canvas.getContext("2d")
      if (!canvasContext) {
        return
      }

      canvasContext.clearRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT)

      if (sample) {
        canvasContext.fillStyle = "#FFF"
        canvasContext.fillRect(
          0,
          0,
          Constants.VUMETTER_CANVAS_WIDTH,
          Constants.VUMETTER_CANVAS_HEIGHT - (meter.volume * Constants.VUMETTER_CANVAS_HEIGHT * Constants.VUMETTER_RATIO)
        )

        window.requestAnimationFrame( this.onLevelChange.bind(this))
      }
    }
  }

}
