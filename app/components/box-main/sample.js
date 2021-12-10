import Component from '@glimmer/component'
import { tracked } from '@glimmer/tracking'
import { action } from '@ember/object'
import { inject as service } from '@ember/service'

export default class BoxSampleComponent extends Component{
  
  @service audio

  @tracked isSinglePlaying = false

  get additionnalClasses() {
    let classes = [ this.args.sample.color ]
    if (this.isSinglePlaying || this.args.sample.isUsed) {
      classes.push('is-used')
    }

    return classes
  }
  
  @action
  play() {
    if (!this.isUsed) {
      this.isSinglePlaying = true
      this.audio.playSampleOnce().finally(() => {
        this.isSinglePlaying = false
      })
    }
  }
}
