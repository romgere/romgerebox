import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
/**
 * https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos
 */
export default Route.extend({

  audioService: service('audio'),

  /* eslint-disable ember/avoid-leaking-state-in-ember-objects */
  events : ['touchstart','touchend', 'mousedown','keydown'],

  handleEvent: function(){
      this.unlock();
  },

  afterModel(model, transition) {
    this._super(model, transition);

    const b = document.body;
    this.get('events').forEach((e) => {
      b.addEventListener(e, this, false);
    });
  },

  unlock: function(){

    this.get('audioService.audioContext').resume().then(() => {

      //Remove touch/click event
      this.clean();

      //Replay previous transition
      this.send('replayInitialeTransition');
    });
  },

  clean: function(){
    const b = document.body;
    this.get('events').forEach((e) => {
      b.removeEventListener(e, this, false);
    });
  },
});
