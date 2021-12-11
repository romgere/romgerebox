import Route from '@ember/routing/route'
import { hash } from 'rsvp'
import { inject as service } from '@ember/service'

export default class BoxRoute extends Route {

  queryParams = {
    mixConfString: { replace: true }
  }

  @service audio
  @service sample

  model(params) {
    let versionIdx = parseInt(params.version_idx)
    
    // Get info about "version" (loop duration, name, samples)
    let version = this.modelFor('application').versions[versionIdx]

    // Init/reset audio service
    this.audio.resetTracks()
    this.audio.loopTime = version.loopTime

    return hash({
      // Load the "Audio" elements for all samples
      samples: this.initSample(version.samples),
      // Version index
      versionIdx
    })
  }

  initSample(samples) {

    let loadSamplesPromises = samples.map(async (sample) => {
      if (!sample.mediaStreamInit) {
        await this.sample.initAudioSample(sample)
      }

      // "reset" sample settings (from old mix)
      this.sample.releaseSample(sample)

      return sample
    })

    return Promise.all(loadSamplesPromises)
  }
}
