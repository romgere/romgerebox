import Service from '@ember/service';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

import { cloneBuffer } from 'romgerebox/misc/clone-buffer';

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
   * @param Sample sample     Sample to used (model)
   * @param integer loopTime  Time of loop in second
   */
  initAudioSample: async function( sample, loopTime){

    sample.set('loopTime', loopTime);

    let audioContext = this.get('audioContext');
    let sampleMediaSource = null;

    //Load buffer and create BufferSource with buffer(s)s
    let buffer = await this._loadAudioBufferFromFile( sample.get('file_a'));
    if( sample.get('doubleSample') ){

      let buffer_b = await this._loadAudioBufferFromFile( sample.get('file_b'));

      //Concat buffers
      let tmp = new Uint8Array(buffer.byteLength + buffer_b.byteLength);
      tmp.set(new Uint8Array(buffer), 0);
      tmp.set(new Uint8Array(buffer_b), buffer.byteLength);

      buffer = tmp.buffer;
    }
    sample.set('buffer', buffer);

    sampleMediaSource = await this._createBufferSource( buffer, loopTime);
    sample.set('sampleMediaSource', sampleMediaSource);


    //Create GainNode to control volume
    let gainNode = audioContext.createGain();
    sampleMediaSource.connect( gainNode);
    sample.set('gainNode', gainNode);

    //Connecte gainNode to output
    gainNode.connect(audioContext.destination);

    sample.setVolume( Constants.INITIAL_TRACK_VOLUME / Constants.MAX_TRACK_VOLUME);
    sample.set('audioService', this);
    sample.set('sampleInit', true);
  },

  /**
   * Load audio file and create audio buffer
   * @author mestresj
   * @param  string url             URL of audio file
   * @return Promise<ArrayBuffer>   Promise resolve with AudioBuffer if success
   */
  _loadAudioBufferFromFile: function( url ){

    let request = new XMLHttpRequest();
    request.open('GET', '/samples/'+url, true);
    request.responseType = 'arraybuffer';
    return new Promise((resolve, reject) => {

      request.onload = function(){
          resolve(request.response);
      };

      request.onError = reject;

      request.send();
    });
  },

  /**
   * Create a bufferSource with buffer(s)
   * @author mestresj
   * @param  ArrayBuffer buffer         Sample Array buffer
   * @return AudioBuffer                 Buffer source for playing array(s) buffer(s)
   */
  _createBufferSource: function( buffer, loopTime){

    let audioContext = this.get('audioContext');
    return new Promise((resolve, reject) => {

      //Clone buffer to keep it in sample to create again an audioBufferSource each time we stop it
      audioContext.decodeAudioData( cloneBuffer(buffer), function(response) {

          let audio = audioContext.createBufferSource();
          audio.buffer = response;
          audio.loop = true;
          audio.loopEnd = loopTime;

          resolve( audio);
      }, reject);
    });
  }

});
