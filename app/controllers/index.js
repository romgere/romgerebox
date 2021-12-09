import Controller from '@ember/controller'
import { inject as service } from '@ember/service'

import { charToInt, intToChar } from 'romgerebox/misc/conv-int-char'
import Constants from 'romgerebox/constants'

import { action } from '@ember/object'
import { tracked } from '@glimmer/tracking'

export default class IndexController extends Controller {

  @service intl
  @service router

  availableLocales = ['fr', 'en']
  get currentLocale() {
    return intl.locale.firstObject
  }

  @tracked mixCode = ''
  @tracked showValidationError = false

  get mixCodeRegExp() {
    let maxVersionChar = intToChar(this.model.versions.length-1);
    let regExp = `[A-${maxVersionChar}]`;
    regExp += '[A-Z]{'+Constants.TRACK_COUNT+'}'
    return new RegExp(regExp) 
  }

  get undashedMixCode() {
    return this.mixCode.toUpperCase().replace(/-/gi, '')
  }

  get mixCodeValid() {
    return this.mixCodeRegExp.test(this.undashedMixCode)
  }
   

  @action
  localeChangeAction(locale) {
    localStorage.setItem('romgereBoxLocale', locale)
  }

  @action
  loadMixCode() {
    let mixCode = this.undashedMixCode

    let versionIdx = charToInt(mixCode.substring(0,1))
    let mixConf = []
    let usedSample = []
    mixCode.substring(1).split('').forEach((c, i) => {
      if (usedSample.indexOf(c) == -1 ) {
        mixConf[i] = charToInt(c)
        usedSample.pushObject(c)
      }
    })

    this.router.transitionTo('box', versionIdx, { queryParams: { mixConf } })
  }  
}
