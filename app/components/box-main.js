import Component from '@ember/component';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

import { intToChar } from 'romgerebox/misc/conv-int-char';

export default Component.extend({

  intl: service(),
  audioService: service('audio'),

  trackCount: Constants.TRACK_COUNT,

  playing: false,
  playStartTime : 0, //"audioContext.currentTime" when start playing for sync


  loopSideA: true,
  loopValue: 0,

  recording: false,
  recorder: null,
  recordedFileUri : null,
  recorderDestinationStream: null,
  recordStartTime: null,
  recorderInterval: null,
  recordingTime: 0,


  boxTracks: null,
  boxSamples: null,

  loopProgressInterval: null,


  micReady: false,
  micEnable: false,
  micStream: null,


  mixCode: null,
  showMixCode: false,

  init() {
    this._super(...arguments);

    this.set('boxTracks', []);
    this.set('boxSamples', []);

    this.set('loopProgressInterval', setInterval( this.loopProgress.bind(this), 50));
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
    this.set('playStartTime', this.get('audioService.audioContext').currentTime );
    this.sendActionToTracks('play', {
      isLoopSideA : this.get('loopSideA'),
      startTime : this._getCurrentLoopTime(),
      loopTime: this.get('loopTime'),
    });
  },


  stop: function(){

    if( this.get('recording')){
      this.stopRecord();
    }

    this.set('playStartTime', 0);

    this.sendActionToTracks('stop');
  },

  /**
   * @return integer current time elapsed in current loop
   */
  _getCurrentLoopTime: function( forDoubleLoop = false){
    if( ! this.get('playing') ){
      return 0;
    }

    let currentTime = this.get('audioService.audioContext').currentTime;
    let playingTime = currentTime - this.get('playStartTime');
    return playingTime % (this.get('loopTime') * (forDoubleLoop ? 2 : 1));
  },

  /**
   * Calculate loop percent and deal with loop changement
   */
  loopProgress: function(){

    //Current passed time for a set of loop (A & B )
    let loopA = this._getCurrentLoopTime( true) < this.get('loopTime');
    this.set('loopSideA', loopA);

    //Percent for current loop
    let loopPercent = Math.ceil( (this._getCurrentLoopTime() / this.get('loopTime')) * 100 );
    this.set('loopValue', loopPercent);
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

    //Pre-set sample for this box-track (from QP)
    let trackIdx = this.get('boxTracks.length')-1;
    if( parseInt(this.get('mixConf')[trackIdx]) >= 0 ){
      let sample = this.get('samples')[ this.get('mixConf')[trackIdx]];
      if( sample )
        boxTrack.setSample( sample);
    }
  },

  /**
   * Call by "box-track" component to ask for solo (mute other tracks)
   */
  askForSoloForTrack: function( soloSample){
    this.get('boxSamples').forEach(( sample) => {
      if( sample != soloSample){
        sample.set('mute', true);
      }
    });
  },

  /**
   * Call by "box-track" component to end solo (unmuted all tracks)
   */
  endSoloForTrack: function(){
    this.get('boxSamples').forEach(( sample) => {
      sample.set('mute', false);
    });
  },

  /**
   * Call by "box-track" component when sample change
   */
  sampleChangedForTrack: function( boxTrack, newSample ){

    let idxBox = this.get('boxTracks').indexOf( boxTrack);
    let idxSample = !newSample ? null : this.get('samples').indexOf( newSample);
    let currentSample = this.get('boxSamples')[ idxBox];
    this.get('boxSamples')[idxBox] = newSample;

    //Save to QP
    this.get('mixConf').replace(idxBox, 1, [idxSample]);



    //No recording : nothing to do.
    if( this.get('recording')){

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
    }

    //Play sample
    if( newSample && this.get('playing') ){
      boxTrack.send('play', {
          isLoopSideA : this.get('loopSideA'),
          startTime : this._getCurrentLoopTime(),
          loopTime: this.get('loopTime'),
      });
    }
  },


  stopRecord: function(){
    this.set('recordStartTime', null);
    clearInterval( this.get('recorderInterval'));

    this.set('recorderInterval', null);
    this.set('recordingTime', 0);

    this.get('recorder').finishRecording();
  },

  startRecord: function(){
    this.set('chunks', []);
    this.set('recordStartTime', new Date());
    this.set('recorderInterval', setInterval( this.recordProgress.bind(this), 100));

    let mediaStreams = this.getTracksMediaStreamArray();

    let audioContext = this.get('audioService.audioContext')

    //Create a stream for the recorder and connect all source audioMediaStream (from audio file)
    //previously use of "createMediaStreamDestination" method by not working with "WebAudioRecorder"
    let recorderDestinationStream = audioContext.createGain();
    this.set('recorderDestinationStream', recorderDestinationStream);

    mediaStreams.forEach(function(stream){
        stream.connect( recorderDestinationStream);
    });

    //Mic
    if( this.get('micEnable') ){
      this.get('micStream').connect( recorderDestinationStream);
    }

    let recorder = this.get('recorder');
    if( ! recorder ){

      /* global WebAudioRecorder */
      recorder = new WebAudioRecorder(recorderDestinationStream, {
        workerDir: "web-audio-recorder/",
        encoding: Constants.RECORDING_FORMAT,
        onComplete: this.recordOnComplete.bind(this),
        onEncoderLoaded: (recorder) => {

          // recorder.
          recorder.startRecording();
          //Start playing if not already playing
          if( ! this.get('playing')){
            this.play();
            this.set('playing', true);
          }
        }
      });

      this.set('recorder', recorder);
    }
    else{
      recorder.startRecording();
      if( ! this.get('playing')){
        this.play();
        this.set('playing', true);
      }
    }
  },

  recordOnComplete: function(rec, blob){
    var audioURL = window.URL.createObjectURL(blob);
    this.set('recordedFileUri', audioURL);
    this.downloadAudio();
  },

  downloadAudio: function(){

    //Download file
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = this.get('recordedFileUri');
    a.download = 'mix.'+Constants.RECORDING_FORMAT;
    a.target = '_blank';
    a.click();
  },

  getTracksMediaStreamArray: function(){
    return this.get('boxSamples').reduce(function(tab, sample){
      return sample ? tab.concat( sample.getMediaStreams()) : tab;
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

    toggleMic: async function(){

      let micStream = this.get('micStream');

      if( ! this.get('micReady') ){

        try{
          //Get mic access and create the MediaSourceStream
          let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          let audioContext = this.get('audioService.audioContext');
          micStream = audioContext.createMediaStreamSource( stream)

          this.set('micStream', micStream);
          this.set('micReady', true);
        }
        catch(e){
          alert( this.get('intl').t('box_main.error.mic_not_available'));
          return;
        }
      }

      //Recording => add mic stream to recorder
      if( this.get('recording') ){

        let recorderDestinationStream = this.get('recorderDestinationStream');

        if( this.get('micEnable') ){
          micStream.disconnect( recorderDestinationStream);
        }
        else{
          micStream.connect( recorderDestinationStream);
        }
      }


      this.toggleProperty('micEnable');
    },

    downloadAudioAction: function(){
      this.downloadAudio();
    },

    showMixCode: function(){
      let nbSample = this.get('boxSamples').filter(s => s != null).length;
      if( ! nbSample ){
        alert( this.get('intl').t('box_main.error.add_one_sample'));
      }
      else{

        let mixCode = intToChar( this.get('versionIdx'))+'-';
        let idx = 0;

        this.get('mixConf').forEach(function(idxSample){

          mixCode += intToChar( parseInt(idxSample));
          idx++;
          if( idx % 4 == 0 && idx < Constants.TRACK_COUNT ){
            mixCode += '-';
          }
        });

        this.set('mixCode', mixCode);
        this.set('showMixCode', true);
      }
    },

    willDestroyElement: function(){
      this.stop();
    }
  }
});
