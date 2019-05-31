import Component from '@ember/component';

import { alias } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';

export default Component.extend({

  classNames: ['boxTrack', 'layout-col', 'flex-nogrow'],

  classNameBindings: ['sampleColor', 'dragPending'],
  sampleColor: alias('sample.color'),
  sampleIcon: alias('sample.icon'),


  //Sample to play
  sample: null,

  dragPending: false,

  mute: false,
  solo: false,

  volume : 50,

  //Register to parent
  didReceiveAttrs() {
    this.get('boxMain').registerBoxTrack( this);
  },


  clearCurrentSample: function(){
    let sample = this.get('sample')
    this.set('sample', null);

    sample.set('isUsed', false);
    sample.get('file_a').pause();
    let file_b = sample.get('file_b');
    if( file_b ){
      file_b.pause();
    }

    this.get('boxMain').endSolo();
    this.set('solo', false);
    this.setMuteState( false);
  },

  setMuteState: function( mute ){
      if( isEmpty(this.get('sample'))){
        return;
      }

      this.get('sample.file_a').volume = mute ? 0 : this.get('volume')/100;
      let file_b = this.get('sample.file_b');
      if( file_b ){
        file_b.volume = mute ? 0 : this.get('volume')/100;
      }

      this.set('mute', mute ? true : false);
      this.set('solo', false);
  },

  actions:{
    play: function( params ){

      if( isEmpty(this.get('sample'))){
        return;
      }

      let file_a = this.get('sample.file_a');
      let file_b = this.get('sample.file_b');

      if( params.isLoopSideA || ! file_b ){
        file_a.play();
        if( file_b ){
          file_b.pause();
        }
      }
      else{
        file_b.play();
        file_a.pause();
      }
    },

    stop: function(){

      if( isEmpty(this.get('sample'))){
        return;
      }

      let file_a = this.get('sample.file_a');
      let file_b = this.get('sample.file_b');

      file_a.pause();
      if( file_b ){
        file_b.pause();
      }
    },

    sync: function( params ){

      if( isEmpty(this.get('sample'))){
        return;
      }

      let file_a = this.get('sample.file_a');
      let file_b = this.get('sample.file_b');
      file_a.currentTime = 0;
      if( file_b ){
        file_b.currentTime = 0;
      }


      if( params.isLoopSideA || ! file_b ){
        file_a.play();
        if( file_b ){
          file_b.pause();
        }
      }
      else{
        file_b.play();
        file_a.pause();
      }
    },

    onDragSample: function( sample ){

      if( this.get('sample') ){
        this.clearCurrentSample();
      }

      this.set('sample', sample);
      sample.set('isUsed', true);
    },

    onOverAction: function(){
      this.set('dragPending', true);
    },

    onDragOutAction: function(){
      this.set('dragPending', false);
    },

    muteToggle: function(){
      this.setMuteState( ! this.get('mute'));
    },

    soloAction: function(){

      if( this.get('solo') ){
        this.get('boxMain').endSolo();
        this.set('solo', false);
        this.setMuteState( false);
      }
      else{
        this.setMuteState( false);
        this.get('boxMain').askForSolo( this);
        this.set('solo', true);
      }
    },

    //Mute from parent (for other track solo)
    mute: function( mute){
      this.setMuteState( mute);
    },


    removeAction: function(){
      this.clearCurrentSample();
    },

    setVolume: function( volume ){
      this.set('volume', volume);

      let file_a = this.get('sample.file_a');
      let file_b = this.get('sample.file_b');

      file_a.volume = volume / 100;
      if( file_b ){
        file_b.volume = volume / 100;
      }
    },

  }
});
