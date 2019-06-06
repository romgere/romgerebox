import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

export default Route.extend({

  audioService : service('audio'),

  model: function( params){

    let version = this.modelFor('application').versions[parseInt(params.version_idx)];

    return hash({
      //Load the "Audio" elements for all samples
      'samples' : this.loadSample(version.samples),
      //Metronome timing
      'metronome' : version.metronome,
      //Version index
      'versionIdx' : parseInt(params.version_idx),
    });
  },


  loadSample: function(samples){

    return Promise.all(samples.map(( sample) => {

      return new Promise((resolveA/*, reject*/) => {

        //Déjà chargé
        if( typeof sample.file_a == 'object'){
          resolveA(sample);
        }
        else{
          sample.file_a = new Audio('/samples/'+sample.file_a);
          sample.file_a.loop = true;
          sample.file_a.addEventListener('loadeddata', () => {
              resolveA(sample);
          });
        }
      }).then(( sample) => {

        if( sample.file_b && typeof sample.file_b != 'object'){
          return new Promise((resolveB/*, reject*/) => {
            sample.file_b = new Audio('/samples/'+sample.file_b);
            sample.file_b.loop = true;
            sample.file_b.addEventListener('loadeddata', () => {
                resolveB(
                  sample
                );
            });
          })
        }

        return sample;
      }).then(( sample) => {
        //Create audioStream for our samples
        if( ! sample.get('mediaStreamInit') ){
          this.get('audioService').createAudioStreamForSample( sample);
        }

        sample.set('isUsed', false);
        sample.setVolume( Constants.INITIAL_TRACK_VOLUME / Constants.MAX_TRACK_VOLUME);

        return sample;
      });
    }));
  },

});
