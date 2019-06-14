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
      'samples' : this.loadSample(version.samples, version.loopTime),
      //Metronome timing
      'loopTime' : version.loopTime,
      //Version index
      'versionIdx' : parseInt(params.version_idx),
    });
  },


  loadSample: function(samples, loopTime){

    return Promise.all(samples.map(async ( sample) => {

      if( ! sample.get('mediaStreamInit') ){
        await this.get('audioService').initAudioSample( sample, loopTime);
      }

      //New mix "reset" old changes
      sample.set('isUsed', false);
      sample.set('volume', Constants.INITIAL_TRACK_VOLUME );

      return sample;
    }));
  },

});
