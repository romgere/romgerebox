import Route from '@ember/routing/route'
import { hash } from 'rsvp'
import { inject as service } from '@ember/service'

import Constants from 'romgerebox/constants'

export default class BoxRoute extends Route {

  @service('audio') audio

  model(params) {
    let versionIdx = parseInt(params.version_idx)
    let version = this.modelFor('application').versions[versionIdx]

    return hash({
      // Load the "Audio" elements for all samples
      samples: this.loadSample(version.samples, version.loopTime),
      // Metronome timing
      loopTime: version.loopTime,
      // Version index
      versionIdx
    })
  }

  loadSample(samples, loopTime) {

    let loadSamplesPromises = samples.map(async (sample) => {
      if (!sample.mediaStreamInit) {
        await this.audio.initAudioSample(sample, loopTime)
      }

      // New mix "reset" old changes
      sample.isUsed = false
      sample.volume = Constants.INITIAL_TRACK_VOLUME

      return sample
    })

    return Promise.all(loadSamplesPromises)
  }
}
