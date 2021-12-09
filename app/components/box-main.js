import Component from '@ember/component'
import { inject as service } from '@ember/service'
import { computed } from '@ember/object'
import Constants from 'romgerebox/constants'
import { intToChar } from 'romgerebox/misc/conv-int-char'
import { action } from '@ember/object'

export default class BoxMainComponent extends Component {

  tagName = ''

  @service intl
  @service('audio') audioService

  trackCount = Constants.TRACK_COUNT

  playing = false
  playStartTime = 0 //"audioContext.currentTime" when start playing for sync


  loopSideA = true
  loopValue = 0
  loopCount = 1

  recording = false
  recorder = null
  recordedFileUri = null
  recorderDestinationStream = null
  recordStartTime = null
  recorderInterval = null
  recordingTime = 0


  boxTracks = null
  boxSamples = null

  loopProgressInterval = null


  micReady = false
  micEnable = false
  micStream = null


  mixCode = null
  showMixCode = false

  @computed('trackCount')
  get trackCountArray() {
    return new Array(this.trackCount).fill('')
  }

  init() {
    super.init(...arguments);

    this.set('boxTracks', []);
    this.set('boxSamples', []);

    this.set('loopProgressInterval', setInterval( this.loopProgress.bind(this), 50));

    let audioContext = this.get('audioService.audioContext')

    //Create, once for all, a stream for the recorder
    let recorderDestinationStream = audioContext.createGain();
    this.set('recorderDestinationStream', recorderDestinationStream);

    //Same for recorder
    /* global WebAudioRecorder */
    let recorder = new WebAudioRecorder(recorderDestinationStream, {
      workerDir: "web-audio-recorder/",
      encoding: Constants.RECORDING_FORMAT,
      options: {
        timeLimit: Constants.RECORDING_MAX_TIME,
      },
      onComplete: this.recordOnComplete.bind(this),
      onTimeout: () => { this.stopRecord(); } //Stop "recording" state on timeout
    });

    this.set('recorder', recorder);
  }

  willDestroy(){
    super.willDestroy(...arguments);

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
  }

  play(){
    this.set('playStartTime', this.get('audioService.audioContext').currentTime );
    this.sendActionToTracks('play', {
      isLoopSideA : this.get('loopSideA'),
      startTime : this._getCurrentLoopTime(),
      loopTime: this.get('loopTime'),
    });
  }


  stop(){

    if( this.get('recording')){
      this.stopRecord();
    }

    this.set('playStartTime', 0);

    this.sendActionToTracks('stop');
  }

  /**
   * @return integer current time elapsed in current loop
   */
  _getCurrentLoopTime( forDoubleLoop = false){
    if( ! this.get('playing') ){
      return 0;
    }

    let currentTime = this.get('audioService.audioContext').currentTime;
    let playingTime = currentTime - this.get('playStartTime');
    return playingTime % (this.get('loopTime') * (forDoubleLoop ? 2 : 1));
  }

  _getLoopCount(){

    let currentTime = this.get('audioService.audioContext').currentTime;
    let playingTime = currentTime - this.get('playStartTime');
    return Math.ceil(playingTime / this.get('loopTime'));
  }

  /**
   * Calculate loop percent and deal with loop changement
   */
  loopProgress(){

    if( this.get('playing')){
      //Current passed time for a set of loop (A & B )
      let loopA = this._getCurrentLoopTime( true) < this.get('loopTime');
      this.set('loopSideA', loopA);

      this.set('loopCount', this._getLoopCount());

      //Percent for current loop
      let loopPercent = Math.ceil( (this._getCurrentLoopTime() / this.get('loopTime')) * 100 );
      this.set('loopValue', loopPercent);
    }
  }

  sendActionToTracks(action, param = null, exclude = null){
    this.get('boxTracks').forEach(function( boxTrack){
      if( boxTrack != exclude )
        boxTrack.send(action, param);
    })
  }

  /**
   * Call by "box-track" component to register
   */
  registerBoxTrack( boxTrack){
    this.get('boxTracks').pushObject(boxTrack);

    //Pre-set sample for this box-track (from QP)
    let trackIdx = this.get('boxTracks.length')-1;
    if( parseInt(this.get('mixConf')[trackIdx]) >= 0 ){
      let sample = this.get('samples')[ this.get('mixConf')[trackIdx]];
      if( sample )
        boxTrack.setSample( sample);
    }
  }

  /**
   * Call by "box-track" component to ask for solo (mute other tracks)
   */
  askForSoloForTrack( soloSample){
    this.get('boxSamples').forEach(( sample) => {
      if( sample && sample != soloSample){
        sample.set('mute', true);
      }
    });
  }

  /**
   * Call by "box-track" component to end solo (unmuted all tracks)
   */
  endSoloForTrack(){
    this.get('boxSamples').forEach(( sample) => {
      if( sample )
        sample.set('mute', false);
    });
  }

  /**
   * Call by "box-track" component when sample change
   */
  sampleChangedForTrack( boxTrack, newSample ){

    let idxBox = this.get('boxTracks').indexOf( boxTrack);
    let idxSample = !newSample ? null : this.get('samples').indexOf( newSample);
    let currentSample = this.get('boxSamples')[ idxBox];
    this.get('boxSamples')[idxBox] = newSample;

    //Save to QP
    this.onMixCodeUpdate(this.get('mixConf').replace(idxBox, 1, [idxSample]))
    
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
  }


  stopRecord(){
    this.set('recordStartTime', null);
    clearInterval( this.get('recorderInterval'));

    this.set('recorderInterval', null);
    this.set('recordingTime', 0);

    this.get('recorder').finishRecording();
  }

  startRecord(){
    this.set('chunks', []);
    this.set('recordStartTime', new Date());
    this.set('recorderInterval', setInterval( this.recordProgress.bind(this), 100));

    let mediaStreams = this.getTracksMediaStreamArray();


    //connect all source audioMediaStream (from audio file)
    let recorderDestinationStream = this.get('recorderDestinationStream');

    mediaStreams.forEach(function(stream){
        stream.connect( recorderDestinationStream);
    });

    //Mic
    if( this.get('micEnable') ){
      this.get('micStream').connect( recorderDestinationStream);
    }

    //Start recording
    let recorder = this.get('recorder');
    recorder.startRecording();
    if( ! this.get('playing')){
      this.play();
      this.set('playing', true);
    }
  }

  recordOnComplete(rec, blob){
    var audioURL = window.URL.createObjectURL(blob);
    this.set('recordedFileUri', audioURL);
    this.downloadAudio();
  }

  downloadAudio(){

    //Download file
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = this.get('recordedFileUri');
    a.download = 'mix.'+Constants.RECORDING_FORMAT;
    a.target = '_blank';
    a.click();
  }

  getTracksMediaStreamArray(){
    return this.get('boxSamples').reduce(function(tab, sample){
      return sample ? tab.concat( sample.getMediaStreams()) : tab;
    },[]);
  }

  recordProgress(){
    let recordStartTime = this.get('recordStartTime');
    this.set('recordingTime', (new Date()).getTime() - recordStartTime.getTime());
  }

  @action
  togglePlay(){
    if( this.get('playing')){
      this.stop();
      this.set('playing', false);
    }
    else{
      this.play();
      this.set('playing', true);
    }
  }

  @action
  toggleRecord(){

    if( this.get('recording')){
      this.stopRecord();
    }
    else{
      this.startRecord();
    }
    this.toggleProperty('recording');
  }

  @action
  async toggleMic(){

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
  }

  @action
  downloadAudioAction(){
    this.downloadAudio();
  }

  @action
  showMixCodeModal(){
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

      this.onMixCodeUpdate(mixCode)
      this.set('showMixCode', true);
    }
  }

  willDestroyElement(){
    this.stop();
  }
}
