import Route from '@ember/routing/route'
import { inject as service } from '@ember/service'
import { getOwner } from '@ember/application'
import type AudioService from 'romgerebox/services/audio'

import type { BoxVersionModels } from 'romgerebox/routes/application'
import type RouterService from '@ember/routing/router-service';
type Transition = ReturnType<RouterService['transitionTo']>;

// https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
export default class UnlockAudioRoute extends Route {

  @service declare audio: AudioService

  events = ['touchstart', 'touchend', 'mousedown', 'keydown']

  handleEvent() {
    this.unlock()
  }

  afterModel(model: BoxVersionModels, transition: Transition) {
    super.afterModel(model, transition)

    let { body } = document
    this.events.forEach((e) => {
      body.addEventListener(e, this, false)
    })
  }

  async unlock() {
    await this.audio.audioContext.resume()
    this.clean()
    this.replayInitialeTransition()
  }

  // Replay previous transition
  replayInitialeTransition() {
    getOwner(this).lookup('route:application').replayInitialeTransition()
  }

  clean() {
    let { body } = document
    this.events.forEach((e) => {
      body.removeEventListener(e, this, false)
    })
  }
}
