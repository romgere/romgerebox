import Controller from '@ember/controller'
import { inject as service } from '@ember/service'

import { charToInt, intToChar } from 'romgerebox/misc/conv-int-char'
import Constants from 'romgerebox/constants'

import { action } from '@ember/object'
import { tracked } from '@glimmer/tracking'

import { Registry as Services } from '@ember/service'
import type IntlService from 'ember-intl/services/intl'

export default class IndexController extends Controller {

  @service declare router: Services['router']
  @service declare intl: IntlService

  @tracked mixCode = ''
  @tracked showValidationError = false

  get mixCodeRegExp() {
    let maxVersionChar = intToChar(this.model.length-1)
    let regExp = `[A-${maxVersionChar}]`
    regExp += `[A-Z]{${Constants.TRACK_COUNT}}`
    return new RegExp(regExp) 
  }

  get undashedMixCode() {
    return this.mixCode.toUpperCase().replace(/-/gi, '')
  }

  get mixCodeValid() {
    return this.mixCodeRegExp.test(this.undashedMixCode)
  }

  
  @action
  loadMixCode() {
    let mixCode = this.undashedMixCode

    let versionIdx = charToInt(mixCode.substring(0,1))
    if (!versionIdx) {
      alert(this.intl.t('index.mix_code_input.invalid'))
      return
    }
    let mixConf: Array<mixCodeValue> = []
    let usedSample: Array<string> = []
    mixCode.substring(1).split('').forEach((c, i) => {
      if (usedSample.indexOf(c) === -1 ) {
        mixConf[i] = charToInt(c)
        usedSample.pushObject(c)
      }
    })

    this.router.transitionTo('box', versionIdx, { queryParams: { mixConf: mixConf.join('|') } })
  }  
}
