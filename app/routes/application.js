import Route from '@ember/routing/route'
import { isEmpty } from '@ember/utils'
import { inject as service } from '@ember/service'
import SampleObject from 'romgerebox/models/sample'
import fetch from 'fetch'

export default class ApplicationRoute extends Route {

    @service intl
    
    @service audio

    audioUnlockPreviousTransition = null

    beforeModel() {
      super.beforeModel(...arguments)
      let locale = localStorage.getItem('romgereBoxLocale')
      if (isEmpty(locale)){
        locale = window.navigator.language.substring(0,2)
      }
      
      this.intl.setLocale( locale === 'fr' ? 'fr' : 'en')
    }

    async model() {
      let samplesConf = await fetch('./samples/samples.json').then(function(response) {
        return response.json()
      })
        
      // Create Ember Object for sample
      samplesConf.versions.forEach(function (version){
        version.samples = version.samples.map(function (sample){
            return SampleObject.create(sample)
        })
      })

      return samplesConf
    }

    afterModel(model, transition) {
      super.afterModel(model, transition)

      let { audioContext } = this.audio
      if (audioContext.state !== 'suspended'){
        return
      }

      if (transition.targetName !== 'unlock-audio') {
        // Deal with "suspended" audio Context on Safari
        transition.abort()
        this.audioUnlockPreviousTransition = transition
        this.transitionTo('unlock-audio')
      }
    }

    replayInitialeTransition(){
      let transition = this.audioUnlockPreviousTransition
      if (transition) {
        this.audioUnlockPreviousTransition = null
        transition.retry()
      }
      else{
        this.transitionTo('index')
      }
    }
}
