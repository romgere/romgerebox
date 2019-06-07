import EmberObject from '@ember/object';
import { notEmpty } from '@ember/object/computed';

export default EmberObject.extend({

  // audioService: service('audio'),
  audioService: null, //Manually injected, see "audio" service

  file_a : null,
  file_b : null,

  doubleSample: notEmpty('file_b'),

  //Sample already init ? (bufferSource & gainNode created)
  sampleInit: false,

  //ArrayBuffer (contains sound)
  buffer: null,

  //AudioBufferSourceNode
  sampleMediaSource: null,

  //Gain Node to control output volume of the sample
  gainNode: null,


  isPlaying: false,

  getMediaStreams: function(){
    return [
      this.get('gainNode')
    ];
  },


  setVolume: function( gain){
    this.get('gainNode').gain.value = gain;
  },


  stop: function(){
    if( this.get('isPlaying') ){
      this.get('sampleMediaSource').stop(0);
      this.set('isPlaying', false);

      this.set('sampleMediaSource', null);

      //"An AudioBufferSourceNode can only be played once"
      //Prepare future play : create new AudioBufferSourceNode
      this.get('audioService')._createBufferSource( this.get('buffer')).then( (sampleMediaSource) => {
        sampleMediaSource.connect( this.get('gainNode'));
        this.set('sampleMediaSource', sampleMediaSource);
      });
    }
  },

  play: function( startTime = 0){
    if( ! this.get('isPlaying') && this.get('sampleMediaSource') ){
      this.get('sampleMediaSource').start(0, startTime);
      this.set('isPlaying', true);
    }
  },

  color : "#d1d1d1",

  icon : "music",

  isUsed: false,
});
