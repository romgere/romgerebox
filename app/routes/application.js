import Route from '@ember/routing/route';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import SampleObject from 'romgerebox/models/sample';
import fetch from 'fetch';

export default Route.extend({

    intl: service(),
    
    audioService: service('audio'),

    audioUnlockPreviousTransition: null,

    beforeModel() {
      this._super(...arguments);
      let locale = localStorage.getItem('romgereBoxLocale');
      if(  isEmpty(locale) ){
        locale = window.navigator.language.substring(0,2);
      }
      if( locale == "fr"){
        this.get('intl').setLocale('fr');
      }
      else{
        this.get('intl').setLocale('en');
      }
    },

    model: async function(){
        let samplesConf = await fetch('./samples/samples.json').then(function(response) {
          return response.json();
        })
        
        //Create Ember Object for sample
        samplesConf.versions.forEach(function( version){
          version.samples = version.samples.map(function(sample){
              return SampleObject.create(sample);
          });
        });

        return samplesConf;
    },

    afterModel(model, transition) {
      this._super(model, transition);
      let audioContext = this.get('audioService.audioContext');
      if (audioContext.state !== 'suspended'){
        return;
      }

      if( transition.targetName != 'unlock-audio'){
        //Deal with "suspended" audio Context on Safari
        transition.abort();
        this.set('audioUnlockPreviousTransition', transition);
        this.transitionTo('unlock-audio');
      }
    },

    replayInitialeTransition: function(){
      let transition = this.get('audioUnlockPreviousTransition');
      if( transition){
        this.set('audioUnlockPreviousTransition', null);
        transition.retry();
      }
      else{
        this.transitionTo('index');
      }
    },

    actions: {
      replayInitialeTransition() {
        this.replayInitialeTransition()
      }
    }

});
