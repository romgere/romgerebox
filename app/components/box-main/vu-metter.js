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

  hasSample: notEmpty('sample'),
  currentSample: null,

  //Keep ref to connected Stream and disconnect when sample change
  connectedStreams: null,

  init() {
    this._super(...arguments);

    this.set('connectedStreams', []);

    // grab the app audio context
    let audioContext = this.get('audioService.audioContext');

    // Create a new volume meter and connect it.
    /* global createAudioMeter */
    let meter = createAudioMeter(audioContext, Constants.VUMETTER_CLIPLVL, Constants.VUMETTER_AVG);
    this.set('meter', meter);
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this.updateSample();
  },

  didReceiveAttrs() {
    this._super(...arguments);
    this.updateSample();
  },

  updateSample: function(){

    let meter = this.get('meter');

    //Connect sample stream to meter
    if( this.get('hasSample') ){

      if( this.get('currentSample') != this.get('sample') ){

          this.set('currentSample', this.get('sample'));
          let stream = this.get('sample').mediaStream
          stream.connect( meter);
          this.get('connectedStreams').pushObject(stream)

          this.onLevelChange();
      }
    }
    //Disconnect the "old sample" (stream) from "meter"
    else{
      this.get('connectedStreams').forEach(( stream) => {
        stream.disconnect( meter);
      });

      this.set('connectedStreams', []);

      this.set('currentSample', null);
    }
  },

  onLevelChange: function(){
    if( this.get('element') ){

      let canvasContext = this.get('element').getContext("2d");
      let meter = this.get('meter');

      canvasContext.clearRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT);

      if( this.get('hasSample') && meter ){

        canvasContext.fillStyle = "#FFF";
        canvasContext.fillRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT-(meter.volume * Constants.VUMETTER_CANVAS_HEIGHT * Constants.VUMETTER_RATIO));
      }
    }

    window.requestAnimationFrame( this.onLevelChange.bind(this));

  },

});
