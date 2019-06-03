import Component from '@ember/component';
import { alias } from '@ember/object/computed';


import Constants from 'romgerebox/constants';

export default Component.extend({
  tagName : 'canvas',
  classNames : ['vueMeter'],


  classNameBindings: ['sampleColor'],
  sampleColor: alias('sample.color'),

  attributeBindings: ['width', 'height'],

  width: Constants.VUMETTER_CANVAS_WIDTH,
  height: Constants.VUMETTER_CANVAS_HEIGHT,

  meter: null,
  canvasContext: null,


  didUpdateAttrs() {
    this._super(...arguments);

    this.set('canvasContext', this.get('element').getContext("2d"));

    if( this.get('sample') ){

      // grab an audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      let audioContext = new AudioContext();

      // Create a new volume meter and connect it.
      /* global createAudioMeter */
      let meter = createAudioMeter(audioContext, Constants.VUMETTER_CLIPLVL, Constants.VUMETTER_AVG);
      this.set('meter', meter);

      let file_a = this.get('sample.file_a');
      let file_b = this.get('sample.file_b');


      let stream_a = file_a.captureStream ? file_a.captureStream() : file_a.mozCaptureStream();
      let mediaStreamSource_a = audioContext.createMediaStreamSource(stream_a);
      mediaStreamSource_a.connect(meter);
      //Reconnect to audio output
      if( this.get('userAgent.browser.isFirefox') ){
        mediaStreamSource_a.connect(audioContext.destination);
      }

      if( file_b ){
        let stream_b = file_b.captureStream ? file_b.captureStream() : file_b.mozCaptureStream();
        let mediaStreamSource_b = audioContext.createMediaStreamSource(stream_b);
        mediaStreamSource_b.connect(meter);
        //Reconnect to audio output
        if( this.get('userAgent.browser.isFirefox') ){
          mediaStreamSource_b.connect(audioContext.destination);
        }
      }



      this.onLevelChange();
    }
  },

  onLevelChange: function(){

    let canvasContext = this.get('canvasContext');
    let meter = this.get('meter');

    canvasContext.clearRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT);

    if( meter ){
      canvasContext.fillStyle = "#FFF";
      canvasContext.fillRect(0, 0, Constants.VUMETTER_CANVAS_WIDTH, Constants.VUMETTER_CANVAS_HEIGHT-(meter.volume * Constants.VUMETTER_CANVAS_HEIGHT * Constants.VUMETTER_RATIO));
    }

    window.requestAnimationFrame( this.onLevelChange.bind(this));
  },

});
