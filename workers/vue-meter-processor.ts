// inspired from https://cdmana.com/2021/08/20210804155608169b.html
const SMOOTHING_FACTOR = 0.98

export default class VueMeterProcessor extends AudioWorkletProcessor {

  _volume = 0

  process(inputs: Float32Array[][]) {
    let [input] = inputs

    if (input.length > 0) {
      let samples = input[0]
      let sum = 0
      let rms = 0

      // Calculated the squared-sum.
      for (let i = 0; i < samples.length; ++i) {
        sum += samples[i] * samples[i]
      }

      // Calculate the RMS level and update the volume.
      rms = Math.sqrt(sum / samples.length)
      this._volume = Math.max(rms, this._volume * SMOOTHING_FACTOR)

      this.port.postMessage({
        volume: this._volume
      })
    }

    return true
  }
}

registerProcessor('vumeter', VueMeterProcessor)
