import Component from '@ember/component';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

export default Component.extend({

  audioService: service('audio'),

  trackCount: Constants.TRACK_COUNT,

  loopSideA: true,
  loopValue: 0,
  playing: false,

  recording: false,
  recorder: null,
  chunks : null,
  recorderDestinationStream: null,
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

    let recorderDestinationStream = this.get('recorderDestinationStream');

    //disconnect old sample
    if( currentSample ){
        currentSample.getMediaStreams().forEach(function( stream){
          stream.disconnect(recorderDestinationStream);
        });
    }

    //Connect new one
    if( newSample ){
      newSample.getMediaStreams().forEach(function( stream){
        stream.connect(recorderDestinationStream);
      });
    }
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
    this.set('chunks', []);
    this.set('recordStartTime', new Date());
    this.set('recorderInterval', setInterval( this.recordProgress.bind(this), 100));

    let mediaStreams = this.getTracksMediaStreamArray();

    let audioContext = this.get('audioService.audioContext')

    //Create a destination stream for the recorder and connect all source audioMediaStream (from audio file)
    let recorderDestinationStream = audioContext.createMediaStreamDestination();
    this.set('recorderDestinationStream', recorderDestinationStream);
    mediaStreams.forEach(function(stream){
        stream.connect( recorderDestinationStream);
    });

    if( this.get('micEnable') ){
      //TODO....
    }

    let recorder = new MediaRecorder(recorderDestinationStream.stream);
    recorder.ondataavailable = this.recordOnDataAvailable.bind(this);
    recorder.onstop = this.downloadAudio.bind(this);
    recorder.start();

    this.set('recorder', recorder);
  },

  recordOnDataAvailable: function( e){
    this.get('chunks').pushObject(e.data);
  },

  downloadAudio: function(){
    let chunks = this.get('chunks');

    var blob = new Blob(chunks, { 'type' : 'audio/webm' });
    var audioURL = window.URL.createObjectURL(blob);

    //Download file
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = audioURL;
    a.download = 'audio.webm';
    a.target = '_blank';
    a.click();

    console.log(audioURL);
  },

  getTracksMediaStreamArray: function(){
    return this.get('boxSamples').reduce(function(tab, sample){
      return tab.concat( sample.getMediaStreams());
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

          if( this.get('micEnable') ){
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
          this.set('micStream', stream);

          //Recording, add mic to source
          if( this.get('recording') ){
            //TODO...
          }

          this.set('micReady', true);
          this.set('micEnable', true);
        })
        .catch(() => {
          alert("Impossible d'accèder au micro, veuillez essayer de nouveau")
        });
      }

    },

    downloadAudioAction: function(){
      this.downloadAudio();
    },

    willDestroyElement: function(){
      this.stop();
    }
  }
});
