import Component from '@glimmer/component'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'
import type IntlService from 'ember-intl/services/intl'

interface UiInputArgs {
  locale: string;
  onChange: (value: string) => void;
}

export default class FlagLinkComponent extends Component<UiInputArgs> {

  @service declare intl: IntlService

  @action
  changeLocale(e: MouseEvent) {
    e.preventDefault()
    let { locale } = this.args
    this.intl.setLocale(locale)
    this.args.onChange(locale)
  }
}
