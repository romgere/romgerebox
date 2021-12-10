import Component from '@glimmer/component'
import { action } from '@ember/object'
import { debounce } from '@ember/runloop'


export default class UkInput extends Component {
  get type() {
    return this.args?.type ?? 'text'
  }

  onChange(value) {
    this.args.onChange(value)
  }

  @action
  onInput({ target }) {
    if (this.args.debounce) {
      debounce(this, this.onChange, target.value, this.args.debounce)
    } else {
      this.onChange(target.value)
    }
  }
}
