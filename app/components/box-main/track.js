import Component from '@glimmer/component'
import { tracked } from '@glimmer/tracking'
import Constants from 'romgerebox/constants'


export default class BoxTrackComponent extends Component {

  @tracked dragPending = false

  maxVolume = Constants.MAX_TRACK_VOLUME

  get additionnalClasses() {
    let classes = []

    if (this.args.sample?.color) {
      classes.push(this.args.sample.color)
    }

    if (this.dragPending) {
      classes.push('drag-pending')
    }

    if (this.args.sample) {
      classes.push('has-sample')
    }

    return classes.join(' ')
  }
}
