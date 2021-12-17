import Component from '@glimmer/component'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'
import Constants from 'romgerebox/constants'
import { audioStreamProcessor } from 'audio-stream-meter'

export default class VuMetterComponent extends Component {


  @service audio

  width = Constants.VUMETTER_CANVAS_WIDTH
  height = Constants.VUMETTER_CANVAS_HEIGHT

  canvas = null
  meter = null

  // Keep ref to connected Stream and disconnect when sample change
  connectedStreams = undefined

  constructor() {
    super(...arguments)

    // Create a new volume meter and connect it.
    this.meter = audioStreamProcessor(this.audio.audioContext, function () {})
  }

  @action
  registerCanvas(canvasElement) {
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
      this.connectedStreams = undefined
    }
  }

  onLevelChange(){
    let { canvas, meter, args: { sample } } = this
    if (canvas && meter) {

      let canvasContext = canvas.getContext("2d")
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
