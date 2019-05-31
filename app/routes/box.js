import Route from '@ember/routing/route';
import { hash } from 'rsvp';

import SampleObject from 'romgerebox/models/sample';


export default Route.extend({

  model: function( params){

    let version = this.modelFor('application').versions[parseInt(params.version_idx)];

    return hash({
      //Load the "Audio" elements for all samples
      'samples' : this.loadSample(version.samples),
      //Load metronome
      'metronome' : this.loadMetronome(),
    });
  },


  loadSample: function(samples){

    return Promise.all(samples.map(function( sample){

      return new Promise((resolveA/*, reject*/) => {
        sample.file_a = new Audio('/samples/'+sample.file_a);
        sample.file_a.volume = 0;
        sample.file_a.loop = true;
        sample.file_a.addEventListener('loadeddata', () => {
            resolveA(sample);
        });
      }).then(function( sample){

        if( sample.file_b){
          return new Promise((resolveB/*, reject*/) => {
            sample.file_b = new Audio('/samples/'+sample.file_b);
            sample.file_b.volume = 0;
            sample.file_b.loop = true;
            sample.file_b.addEventListener('loadeddata', () => {
                resolveB(
                  SampleObject.create(sample)
                );
            });
          })
        }
        return SampleObject.create(sample);
      });
    }));
  },

  loadMetronome : function(){
    return new Promise((resolve/*, reject*/) => {
      let metronome = new Audio('/samples/metronome.wav');
      metronome.volume = 0;
      metronome.loop = true;
      metronome.addEventListener('loadeddata', () => {
          resolve(metronome);
      });
    });
  }

});
