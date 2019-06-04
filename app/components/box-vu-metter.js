import Component from '@ember/component';
import { alias, notEmpty } from '@ember/object/computed';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

export default Component.extend({

  audioService : service('audio'),

  tagName : 'canvas',
  classNames : ['vueMeter'],


  classNameBindings: ['sampleColor'],
  sampleColor: alias('sample.color'),

  attributeBindings: ['width', 'height'],

  width: Constants.VUMETTER_CANVAS_WIDTH,
  height: Constants.VUMETTER_CANVAS_HEIGHT,

  meter: null,
  canvasContext: null,

  hasSample: notEmpty('sample'),

  //Keep ref to audio mediaStream to disconnect when sample change
  mediaStreamSource_a: null,
  mediaStreamSource_b: null,

  init() {
    this._super(...arguments);

    // grab the app audio context
    let audioContext = this.get('audioService.audioContext');

    // Create a new volume meter and connect it.
    /* global createAudioMeter */
    let meter = createAudioMeter(audioContext, Constants.VUMETTER_CLIPLVL, Constants.VUMETTER_AVG);
    this.set('meter', meter);
  },

  didUpdateAttrs() {
    this._super(...arguments);

    this.set('canvasContext', this.get('element').getContext("2d"));

    let meter = this.get('meter');

    if( this.get('hasSample') ){


      let mediaStreamSource_a = this.get('sample.mediaStreamSource_a');
      let mediaStreamSource_b = this.get('sample.mediaStreamSource_b');

      this.set('mediaStreamSource_a', mediaStreamSource_a);
      this.set('mediaStreamSource_b', mediaStreamSource_b);

      mediaStreamSource_a.connect(meter);
      //Reconnect to audio output
      if( this.get('userAgent.browser.isFirefox') ){        
        mediaStreamSource_a.connect(this.get('audioService.audioContext.destination'));
      }

      if( mediaStreamSource_b ){
        mediaStreamSource_b.connect(meter);
        //Reconnect to audio output
        if( this.get('userAgent.browser.isFirefox') ){
          mediaStreamSource_b.connect(this.get('audioService.audioContext.destination'));
        }
      }

      this.onLevelChange();
    }
    //Disconnect the sample from "meter"
    else{

      let mediaStreamSource_a = this.get('mediaStreamSource_a');
      let mediaStreamSource_b = this.get('mediaStreamSource_b');

      mediaStreamSource_a.disconnect(meter);
      if( mediaStreamSource_b ){
        mediaStreamSource_b.disconnect(meter);
      }


      this.set('mediaStreamSource_a', null);
      this.set('mediaStreamSource_b', null);
    }
  },

  onLevelChange: function(){

    let canvasContext = this.get('canvasContext');
    let meter = this.get('meter');

    canvasContext.clearRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT);

    if( this.get('hasSample') && meter ){

      canvasContext.fillStyle = "#FFF";
      canvasContext.fillRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT-(meter.volume * Constants.VUMETTER_CANVAS_HEIGHT * Constants.VUMETTER_RATIO));

      window.requestAnimationFrame( this.onLevelChange.bind(this));
    }

  },

});
