import Controller from '@ember/controller'
import { inject as service } from '@ember/service'
import { action } from '@ember/object'
import { htmlSafe } from '@ember/template'

import type IntlService from 'ember-intl/services/intl'

export default class ApplicationController extends Controller {

  @service declare intl: IntlService

  availableLocales = ['fr-fr', 'en-us']
  get currentLocale() {
    return this.intl.primaryLocale
  }

  get authorLink() {
    return htmlSafe('<a href="https://github.com/romgere" target="_blank" rel="noopener noreferrer">Romgere</a>')
  }

  get emberLink() {
    return htmlSafe('<a href="https://emberjs.com/" target="_blank" rel="noopener noreferrer">Ember.js</a>')
  }

  @action
  localeChangeAction(locale: string) {
    localStorage.setItem('romgereBoxLocale', locale)
  }
}
