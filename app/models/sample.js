import EmberObject from '@ember/object'
import Constants from 'romgerebox/constants'
import { notEmpty } from '@ember/object/computed'

export default EmberObject.extend({

  // audioService: service('audio'),
  audioService: null, //Manually injected, see "audio" service

  file_a : null,
  file_b : null,

  loopSize: 0, //loop duration

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

  mute: false,
  volume : 0,

  //"Style" for this sample
  color : "s-color-0",
  icon : "music",

  isUsed: false, //Sample bind to track ?


  init() {
    this._super(...arguments);

    //Add oberservers to deal with volume & mute changes
    this.addObserver('volume', this, 'volumeChange');
    this.addObserver('mute', this, 'muteChange');
    this.addObserver('isUsed', this, 'usedChange');
  },


  volumeChange: function(){
    if( ! this.get('mute') ){
      this.get('gainNode').gain.value = this.get('volume') / 100;
    }
  },

  muteChange: function(){
    if( this.get('mute') ){
      this.get('gainNode').gain.value = 0;
    }
    else{
      this.get('gainNode').gain.value = this.get('volume') / 100;
    }
  },


  usedChange: function(){
    //Reset "settings" when sample is "release" by track
    if( ! this.get('isUsed') ){
      this.set('volume', Constants.INITIAL_TRACK_VOLUME)
      this.set('mute', false);
    }
  },

  /**
   * Return AudioNodes(s) for this sample
   */
  getMediaStreams: function(){
    return [
      this.get('gainNode')
    ];
  },

  stop: function(){
    if( this.get('isPlaying') ){
      this.get('sampleMediaSource').stop(0);
      this.set('isPlaying', false);

      this.set('sampleMediaSource', null);

      //"An AudioBufferSourceNode can only be played once"
      //Prepare future play : create new AudioBufferSourceNode
      this.get('audioService')._createBufferSource( this.get('buffer'), this.get('loopTime')).then( (sampleMediaSource) => {
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

  playOnce: function(){
    return new Promise((resolve, reject) => {

      let sampleMediaSource = this.get('sampleMediaSource');

      sampleMediaSource.loop = false;
      sampleMediaSource.start(0, 0);

      sampleMediaSource.onended = () => {

        this.set('sampleMediaSource', null);
        //"An AudioBufferSourceNode can only be played once"
        //Prepare future play : create new AudioBufferSourceNode
        this.get('audioService')._createBufferSource( this.get('buffer'), this.get('loopTime')).then( (sampleMediaSource) => {
          sampleMediaSource.connect( this.get('gainNode'));
          this.set('sampleMediaSource', sampleMediaSource);
          resolve();
        }, reject);
      }
    });
  }
});
