import Component from '@glimmer/component'
import { tracked } from '@glimmer/tracking'
import { action } from '@ember/object'
import { inject as service } from '@ember/service'

import type SampleModel from 'romgerebox/models/sample'
import type SampleService from 'romgerebox/services/sample'

interface UiInputArgs {
  sample: SampleModel;
}

export default class BoxSampleComponent extends Component<UiInputArgs>{
  
  @service('sample') declare sampleSerice: SampleService

  @tracked isSinglePlaying = false

  get additionnalClasses() {
    let classes = [ this.args.sample.color ]
    if (this.isSinglePlaying || this.args.sample.isUsed) {
      classes.push('is-used')
    }

    return classes.join(' ')
  }
  
  @action
  play() {
    let { sample } = this.args
    if (!sample.isUsed) {
      this.isSinglePlaying = true
      this.sampleSerice.playSampleOnce(sample).finally(() => {
        this.isSinglePlaying = false
      })
    }
  }
}
