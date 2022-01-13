import Component from '@glimmer/component'
import { action } from '@ember/object'
import UIkit from 'uikit'

interface UiInputArgs {
  dialogClass?: string;
  onClose: () => void;
}

export default class MiscUkModalComponent extends Component<UiInputArgs> {

  @action
  showModal(modalElement: HTMLDivElement) {
    UIkit.modal(modalElement).show()
  }

  @action
  onClose() {
    this.args?.onClose()
  }
}
