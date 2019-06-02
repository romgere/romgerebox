import Component from '@ember/component';

const TRACK_COUNT = 8;

export default Component.extend({

  trackCount: TRACK_COUNT,

  loopSideA: true,
  loopValue: 0,
  playing: false,

  recording: false,
  recorder: null,
  recordStartTime: null,
  recorderInterval: null,
  recordingTime: 0,


  boxTracks: null,
  boxSamples: null,

  metronomeInterval: null,
  metronomeStartTime: null,

  loopProgressInterval: null,


  micReady: false,
  micEnable: false,
  micStream: null,

  init() {
    this._super(...arguments);

    this.set('boxTracks', []);
    this.set('boxSamples', []);

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
  askForSoloForTrack: function( boxTrack){
    this.sendActionToTracks('mute', true, boxTrack);
  },

  /**
   * Call by "box-track" component to end solo (unmuted all tracks)
   */
  endSoloForTrack: function(){
    this.sendActionToTracks('mute', false);
  },

  /**
   * Call by "box-track" component when sample change
   */
  sampleChangedForTrack: function( boxTrack, newSample ){

    let idx = this.get('boxTracks').indexOf( boxTrack);
    let currentSample = this.get('boxSamples')[ idx];
    this.get('boxSamples')[idx] = newSample;

    //No recording : nothing to do.
    if( ! this.get('recording')){
      return;
    }

    if( currentSample ){
        //disconnecte sample
    }
debugger;
    //Connect new one
    this.get('recorder').addStream( newSample.getCaptureStreams());
  },


  stopRecord: function(){
    this.set('recordStartTime', null);
    clearInterval( this.get('recorderInterval'));
    this.set('recorderInterval', null);
    this.set('recordingTime', 0);


    this.get('recorder').stop();
    this.set('recorder', null);
  },

  startRecord: function(){
    this.set('recordStartTime', new Date());
    this.set('recorderInterval', setInterval( this.recordProgress.bind(this), 100));

    let streams = this.getTracksStreamArray();

    /* global MultiStreamRecorder */
    let recorder = new MultiStreamRecorder(streams);
    recorder.mimeType = 'audio/webm';
    recorder.ondataavailable = this.recordOnDataAvailable.bind(this);
    recorder.start();

    this.set('recorder', recorder);
  },

  recordOnDataAvailable: function( blob){
    var audioURL = URL.createObjectURL(blob);
    console.log(audioURL);
    // let a = Object.assign(document.createElement('a'), { target: '_blank', href: audioURL});
    // a.innerHTML = audioURL;
    // document.body.appendChild(a);
  },

  getTracksStreamArray: function(){
    return this.get('boxSamples').reduce(function(tab, sample){
      return tab.concat( sample.getCaptureStreams());
    },[]);
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
      alert('Non implémenté :)');
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

        this.toggleProperty('micEnable');
      }
      else{
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          debugger;
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
