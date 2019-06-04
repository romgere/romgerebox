import Service from '@ember/service';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

export default Service.extend({

  userAgent : service(),

  //Audio Context for application (one instance)
  audioContext: null,

  init() {
    this._super(...arguments);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext = new AudioContext();

    this.set('audioContext', audioContext);
  },

  /**
   * Create and set mediaStreamSource on sample for audio file (A & B)
   * @param  {sample} sample Sample to used (model)
   */
  createAudioStreamForSample: function( sample ){

    let audioContext = this.get('audioContext');

    let file_a = sample.get('file_a');

    let mediaStreamSource_a = audioContext.createMediaElementSource(file_a);
    sample.set('mediaStreamSource_a', mediaStreamSource_a);

    //Disconnect "main <audio> stream" from default output (speaker)
    mediaStreamSource_a.disconnect();

    //Create GainNode to control volume
    let gainNode_a = audioContext.createGain();
    mediaStreamSource_a.connect( gainNode_a);
    sample.set('gainNode_a', gainNode_a);

    //Connecte gainNode to output
    gainNode_a.connect(audioContext.destination);


    let file_b = sample.get('file_b');
    if( file_b ){

      let mediaStreamSource_b = audioContext.createMediaElementSource(file_b);
      sample.set('mediaStreamSource_b', mediaStreamSource_b);
      mediaStreamSource_b.disconnect();

      let gainNode_b = audioContext.createGain();
      mediaStreamSource_b.connect( gainNode_b);
      sample.set('gainNode_b', gainNode_b);

      gainNode_b.connect(audioContext.destination);
    }

    sample.setVolume( Constants.INITIAL_TRACK_VOLUME / 100);

    sample.set('mediaStreamInit', true);
  },

});
