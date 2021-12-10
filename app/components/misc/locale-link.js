import Component from '@glimmer/component'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'

export default class FlagLinkComponent extends Component {
  @service intl

  @action
  changeLocale() {
    let { locale } =this.args
    this.intl.setLocale(locale)
    this.args.onChange(locale)
  }
}
