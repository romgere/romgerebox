import Component from '@ember/component';

import { alias, notEmpty } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

export default Component.extend({

  audioService : service('audio'),

  classNames: ['boxTrack', 'layout-col', 'flex-nogrow'],

  classNameBindings: ['sampleColor', 'dragPending','hasSample'],
  sampleColor: alias('sample.color'),
  sampleIcon: alias('sample.icon'),
  hasSample: notEmpty('sample'),


  //Sample to play
  sample: null,

  dragPending: false,

  mute: false,
  solo: false,

  volume : Constants.INITIAL_TRACK_VOLUME,
  maxVolume: Constants.MAX_TRACK_VOLUME,

  //Register to parent
  didReceiveAttrs() {
    this.get('boxMain').registerBoxTrack( this);
  },


  clearCurrentSample: function(){
    let sample = this.get('sample')

    this.set('sample', null);
    this.get('boxMain').sampleChangedForTrack( this, null);

    sample.set('isUsed', false);
    sample.stop();

    this.get('boxMain').endSoloForTrack();
    this.set('solo', false);
    this.setMuteState( false);
  },

  setMuteState: function( mute ){
      if( isEmpty(this.get('sample'))){
        return;
      }

      this.get('sample').setVolume( mute ? 0 : (this.get('volume') / Constants.MAX_TRACK_VOLUME));

      this.set('mute', mute ? true : false);
      this.set('solo', false);
  },

  setSample: function( sample){

    if( this.get('sample') ){
      this.clearCurrentSample();
    }

    this.set('sample', sample);
    this.get('boxMain').sampleChangedForTrack( this, sample);

    sample.set('isUsed', true);
  },

  actions:{
    play: function( params ){

      if( isEmpty(this.get('sample'))){
        return;
      }

      if( params.isLoopSideA || ! this.get('sample.doubleSample')){
        this.get('sample').play( params.startTime);
      }
      //deal with loopB on double sample
      else{
        this.get('sample').play( params.startTime + params.loopTime);
      }
    },

    stop: function(){

      if( isEmpty(this.get('sample'))){
        return;
      }

      this.get('sample').stop();
    },


    onDragSample: function( sample ){
      this.setSample( sample);
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
        this.get('boxMain').endSoloForTrack();
        this.set('solo', false);
        this.setMuteState( false);
      }
      else{
        this.setMuteState( false);
        this.get('boxMain').askForSoloForTrack( this);
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
      this.get('sample').setVolume( volume / Constants.MAX_TRACK_VOLUME);
    },

  }
});
