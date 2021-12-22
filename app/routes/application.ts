import Route from '@ember/routing/route'
import { isEmpty } from '@ember/utils'
import { inject as service } from '@ember/service'
import SampleModel from 'romgerebox/models/sample'

import type AudioService from 'romgerebox/services/audio'
import type IntlService from 'ember-intl/services/intl'
import { Registry as Services } from '@ember/service'

import type RouterService from '@ember/routing/router-service';
type Transition = ReturnType<RouterService['transitionTo']>;

interface BoxVersionModel {
  name: string;
  loopTime: number;
  samples: Array<SampleModel>;
}

export type BoxVersionModels = Array<BoxVersionModel>

export default class ApplicationRoute extends Route {

  @service declare intl: IntlService
  @service declare router: Services['router']
  @service declare audio: AudioService

  audioUnlockPreviousTransition ?:Transition

  beforeModel(transition: Transition) {
    super.beforeModel(transition)
    let locale = localStorage.getItem('romgereBoxLocale')
    if (isEmpty(locale)){
      locale = window.navigator.language.substring(0,2)
    }
    
    this.intl.setLocale( locale === 'fr' ? 'fr' : 'en')
  }

  async model(): Promise<BoxVersionModels> {
    let samplesConf: VersionsDef = await fetch('./samples/samples.json').then(function (response: Response) {
      return response.json()
    })
      
    let versions :BoxVersionModels = []

    // Create Model for sample
    for(let version of samplesConf.versions) {

      versions.push({
        name: version.name,
        loopTime: version.loopTime,
        samples: version.samples.map(function (sample){
          return new SampleModel(sample, version)
        })
      })

    }

    return versions
  }

  afterModel(model: VersionsDef, transition: Transition) {
    super.afterModel(model, transition)

    let { audioContext } = this.audio
    if (audioContext.state !== 'suspended'){
      return
    }

    if (transition.to.name !== 'unlock-audio') {
      // Deal with "suspended" audio Context on Safari
      transition.abort()
      this.audioUnlockPreviousTransition = transition
      this.router.transitionTo('unlock-audio')
    }
  }

  replayInitialeTransition(){
    let transition = this.audioUnlockPreviousTransition
    if (transition) {
      this.audioUnlockPreviousTransition = undefined
      transition.retry()
    }
    else{
      this.router.transitionTo('index')
    }
  }
}
