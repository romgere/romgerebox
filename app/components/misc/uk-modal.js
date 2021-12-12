import Component from '@glimmer/component'
import { action } from '@ember/object'

export default class MiscUkModalComponent extends Component {

  @action
  showModal (modalElement) {
    /* global UIkit */
    UIkit.modal(modalElement).show()
  }

  @action
  onClose() {
    this.args?.onClose(...arguments)
  }
}
