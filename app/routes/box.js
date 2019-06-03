import Route from '@ember/routing/route';
import { hash } from 'rsvp';
import { inject as service } from '@ember/service';

import SampleObject from 'romgerebox/models/sample';
import Constants from 'romgerebox/constants';

export default Route.extend({

  audioService : service('audio'),

  model: function( params){

    let version = this.modelFor('application').versions[parseInt(params.version_idx)];

    return hash({
      //Load the "Audio" elements for all samples
      'samples' : this.loadSample(version.samples),
      //Load metronome
      'metronome' : version.metronome,
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
          sample.file_a.volume = Constants.INITIAL_TRACK_VOLUME / 100;
          sample.file_a.loop = true;
          sample.file_a.addEventListener('loadeddata', () => {
              resolveA(sample);
          });
        }
      }).then(( sample) => {

        if( sample.file_b && typeof sample.file_b != 'object'){
          return new Promise((resolveB/*, reject*/) => {
            sample.file_b = new Audio('/samples/'+sample.file_b);
            sample.file_b.volume = Constants.INITIAL_TRACK_VOLUME / 100;
            sample.file_b.loop = true;
            sample.file_b.addEventListener('loadeddata', () => {
                resolveB(
                  SampleObject.create(sample)
                );
            });
          })
        }

        return SampleObject.create(sample);
      }).then(( sample) => {
        //Create audioStream for our samples
        if( ! sample.get('mediaStreamInit') ){
          this.get('audioService').createAudioStreamForSample( sample);
        }

        return sample;
      });
    }));
  },

});
