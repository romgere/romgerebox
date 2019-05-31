import Component from '@ember/component';

import { alias } from '@ember/object/computed';

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

      debugger;
    },

    pause: function(){
      debugger;
    },

    sync: function( params ){
      debugger;
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
