import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'

import type IntlService from 'ember-intl/services/intl'

export default class ApplicationController extends Controller {

  @service declare intl: IntlService

  availableLocales = ['fr-fr', 'en-us']
  get currentLocale() {
    return this.intl.primaryLocale
  }

  @action
  localeChangeAction(locale: string) {
    localStorage.setItem('romgereBoxLocale', locale)
  }
}
