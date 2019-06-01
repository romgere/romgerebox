import Component from '@ember/component';

export default Component.extend({

  loopSideA: true,
  loopValue: 0,
  playing: false,

  recording: false,
  recordStartTime: null,
  recorderInterval: null,
  recordingTime: 0,


  boxTracks: null,

  metronomeInterval: null,
  metronomeStartTime: null,

  loopProgressInterval: null,


  micReady: false,
  micEnable: false,
  micStream: null,

  init() {
    this._super(...arguments);
    this.set('boxTracks', []);
    this.set('loopProgressInterval', setInterval( this.loopProgress.bind(this), 100));
  },

  willDestroy(){
    this._super(...arguments);

    this.stop();

    let metronomeInterval = this.get('metronomeInterval');
    if( metronomeInterval ){
      clearInterval(metronomeInterval);
    }
    let loopProgressInterval = this.get('loopProgressInterval');
    if( loopProgressInterval ){
      clearInterval(loopProgressInterval);
    }

    this.set('boxTracks', []);
  },

  play: function(){
    let metronomeInterval = setInterval( this.metronomeSync.bind(this), this.get('metronome'));

    this.set('metronomeInterval', metronomeInterval);
    this.set('metronomeStartTime', new Date());

    this.sendActionToTracks('play', {
        isLoopSideA : this.get('loopSideA')
    });
  },


  stop: function(){

    if( this.get('recording')){
      this.stopRecord();
    }

    let metronomeInterval = this.get('metronomeInterval');
    if( metronomeInterval ){
      clearInterval(metronomeInterval);
    }

    this.set('loopValue', 0);
    this.set('metronomeStartTime', null);

    this.sendActionToTracks('stop');
  },

  /**
   * Call every 1ms, toc check metronome time and go to 0 if needed
   * (prevent BIG blank when use "loop=true" for audio element )
   */
  loopProgress: function(){
    let loopDuration = this.get('metronome');
    let metronomeStartTime = this.get('metronomeStartTime');
    let loopPercent = 0;
    if( metronomeStartTime ){
      let loopCurrentTime = (new Date()).getTime() - metronomeStartTime.getTime();
      loopPercent = Math.round((loopCurrentTime / loopDuration ) * 100);
    }

    this.set('loopValue', loopPercent);
  },

  metronomeSync: function(){

    this.toggleProperty('loopSideA');
    this.set('loopValue', 0);
    this.set('metronomeStartTime', new Date());

    //Sync child track
    this.sendActionToTracks('sync', {
        isLoopSideA : this.get('loopSideA')
    });
  },

  sendActionToTracks : function(action, param = null, exclude = null){
    this.get('boxTracks').forEach(function( boxTrack){
      if( boxTrack != exclude )
        boxTrack.send(action, param);
    })
  },

  /**
   * Call by "box-track" component to register
   */
  registerBoxTrack: function( boxTrack){
    this.get('boxTracks').pushObject(boxTrack);
  },

  /**
   * Call by "box-track" component to ask for solo (mute other tracks)
   */
  askForSolo: function( boxTrack){
    this.sendActionToTracks('mute', true, boxTrack);
  },

  /**
   * Call by "box-track" component to end solo (unmuted all tracks)
   */
  endSolo: function(){
    this.sendActionToTracks('mute', false);
  },



  stopRecord: function(){
    this.set('recordStartTime', null);
    clearInterval( this.get('recorderInterval'));
    this.set('recorderInterval', null);
    this.set('recordingTime', 0);
  },

  startRecord: function(){
    this.set('recordStartTime', new Date());
    this.set('recorderInterval', setInterval( this.recordProgress.bind(this), 100));
  },

  recordProgress: function(){
    let recordStartTime = this.get('recordStartTime');
    this.set('recordingTime', (new Date()).getTime() - recordStartTime.getTime());
  },


  actions: {

    togglePlay: function(){
      if( this.get('playing')){
        this.stop();
        this.set('playing', false);
      }
      else{
        this.play();
        this.set('playing', true);
      }
    },

    toggleRecord: function(){
      if( this.get('recording')){
        this.stopRecord();
      }
      else{
        this.startRecord();
      }
      this.toggleProperty('recording');
    },

    toggleMic: function(){
      if( this.get('micReady') ){

        //If recording, add/remove mic stream to/from recorder@
        if( this.get('recording') ){

          if( this.get('micEnable')){
            //TODO....
          }
          else{
            //TODO...
          }

        }

        ///MultiStreamRecorder
        this.toggleProperty('micEnable');
      }
      else{
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          this.set('micStream', stream);
          this.set('micReady', true);
          this.set('micEnable', true);
        })
        .catch(() => {
          alert("Impossible d'accèder au micro, veuillez essayer de nouveau")
        });
      }

    },

    willDestroyElement: function(){
      this.stop();
    }
  }
});
