import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'

export default class ApplicationController extends Controller {

  @service intl

  availableLocales = ['fr', 'en']
  get currentLocale() {
    return this.intl.locale.firstObject
  }

  @action
  localeChangeAction(locale) {
    localStorage.setItem('romgereBoxLocale', locale)
  }
}
