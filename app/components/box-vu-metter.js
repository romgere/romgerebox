import Component from '@ember/component';
import { alias } from '@ember/object/computed';

const WIDTH = 50;
const HEIGHT = 300;
const VUMETTER_RATIO = 3;
const VUMETTER_CLIPLVL = 0.98;
const VUMETTER_AVG = 0.8;

export default Component.extend({
  tagName : 'canvas',
  classNames : ['vueMeter'],


  classNameBindings: ['sampleColor'],
  sampleColor: alias('sample.color'),

  attributeBindings: ['width', 'height'],

  width: WIDTH,
  height: HEIGHT,

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
      let meter = createAudioMeter(audioContext, VUMETTER_CLIPLVL, VUMETTER_AVG);
      this.set('meter', meter);

      let file_a = this.get('sample.file_a');
      let file_b = this.get('sample.file_b');


      let stream_a = file_a.captureStream ? file_a.captureStream() : file_a.mozCaptureStream();
      let mediaStreamSource_a = audioContext.createMediaStreamSource(stream_a);
      mediaStreamSource_a.connect(meter);

      if( file_b ){
        let stream_b = file_b.captureStream ? file_b.captureStream() : file_b.mozCaptureStream();
        let mediaStreamSource_b = audioContext.createMediaStreamSource(stream_b);
        mediaStreamSource_b.connect(meter);
      }


      this.onLevelChange();
    }
  },

  onLevelChange: function(){

    let canvasContext = this.get('canvasContext');
    let meter = this.get('meter');

    canvasContext.clearRect(0,0,WIDTH,HEIGHT);

    if( meter ){
      canvasContext.fillStyle = "#FFF";
      canvasContext.fillRect(0, 0, WIDTH, HEIGHT-(meter.volume * HEIGHT * VUMETTER_RATIO));
    }

    window.requestAnimationFrame( this.onLevelChange.bind(this));
  },

});
