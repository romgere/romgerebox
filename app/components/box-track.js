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

    pause: function(){

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

    muteAction: function(){

      let vol = this.get('mute') ? 1 : 0;

      this.get('sample.file_a').volume = vol;
      let file_b = this.get('sample.file_b');
      if( file_b ){
        file_b.volume = vol;
      }

      this.toggleProperty('mute');
    },

    soloAction: function(){

    },


    removeAction: function(){
      this.clearCurrentSample();
    }

  }
});
