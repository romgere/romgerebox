import Route from '@ember/routing/route'
import { hash } from 'rsvp'
import { inject as service } from '@ember/service'

import type AudioService from 'romgerebox/services/audio'
import type SampleService from 'romgerebox/services/sample'
import type { BoxVersionModels } from 'romgerebox/routes/application'
import SampleModel from 'romgerebox/models/sample'

interface QP {
  version_idx: string
}

type ASampleModel = Array<SampleModel>

export default class BoxRoute extends Route {

  queryParams = {
    mixConfString: { replace: true }
  }

  @service declare audio: AudioService
  @service declare sample: SampleService

  model(params: QP) {
    let versionIdx = parseInt(params.version_idx)
    
    // Get info about "version" (loop duration, name, samples)
    let version = (this.modelFor('application') as BoxVersionModels)[versionIdx]

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

  initSample(samples: ASampleModel): Promise<ASampleModel> {

    let loadSamplesPromises = samples.map(async (sample) => {
      if (!sample.sampleInit) {
        await this.sample.initAudioSample(sample)
      }

      // "reset" sample settings (from old mix)
      this.sample.releaseSample(sample)

      return sample
    })

    return Promise.all(loadSamplesPromises)
  }
}
