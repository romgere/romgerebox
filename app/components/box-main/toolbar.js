import Component from '@glimmer/component'
import Constants from 'romgerebox/constants'
import { htmlSafe } from '@ember/template'

export default class BoxToolbarComponent extends Component {
  loopInfo = Constants.LOOP_INFO_TYPE

  get progressStyle() {
    return htmlSafe(`width: ${this.args.loopValue}%`)
  }
}
