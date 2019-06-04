import EmberObject from '@ember/object';

export default EmberObject.extend({

  file_a : null,
  file_b : null,

  //Sample already init ? (gainNode & stream created)
  mediaStreamInit: false,

  //Not used by app (use to create gainNode, to delete ?)
  mediaStreamSource_a: null,
  mediaStreamSource_b: null,

  //Gain Node to control output volume of the sample
  gainNode_a: null,
  gainNode_b: null,

  getMediaStreams: function(){
    let tab = [];
    tab.pushObject(this.get('gainNode_a'));
    if( this.get('gainNode_b') ){
      tab.pushObject(this.get('gainNode_b'));
    }
    return tab;
  },


  setVolume: function( gain){
    this.get('gainNode_a').gain.value = gain;
    if( this.get('gainNode_b') ){
      this.get('gainNode_b').gain.value = gain;
    }
  },

  color : "#d1d1d1",

  icon : "music",

  isUsed: false,


});
