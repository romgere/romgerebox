import EmberObject from '@ember/object';

export default EmberObject.extend({

  file_a : null,
  file_b : null,

  mediaStreamInit: false,
  mediaStreamSource_a: null,
  mediaStreamSource_b: null,

  getMediaStreams: function(){
    let tab = [];
    tab.pushObject(this.get('mediaStreamSource_a'));
    if( this.get('mediaStreamSource_b') ){
      tab.pushObject(this.get('mediaStreamSource_b'));
    }
    return tab;
  },

  color : "#d1d1d1",

  icon : "music",

  isUsed: false,


});
