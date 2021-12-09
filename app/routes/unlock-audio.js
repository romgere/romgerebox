import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { action } from '@ember/object'
import { getOwner } from '@ember/application'

/**
 * https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
 */
export default class UnlockAudioRoute extends Route {

  @service audio

  /* eslint-disable ember/avoid-leaking-state-in-ember-objects */
  events = ['touchstart','touchend', 'mousedown','keydown']

  handleEvent(){
    this.unlock()
  }

  afterModel(model, transition) {
    super.afterModel(model, transition)

    let { body } = document
    this.events.forEach((e) => {
      body.addEventListener(e, this, false)
    })
  }

  async unlock(){
    await this.audio.audioContext.resume()    
    this.clean()
    this.replayInitialeTransition()
  }
  
  //Replay previous transition
  replayInitialeTransition() {
    getOwner(this).lookup('route:application').replayInitialeTransition()
  }

  clean(){
    let { body } = document
    this.events.forEach((e) => {
      body.removeEventListener(e, this, false)
    })
  }
}
