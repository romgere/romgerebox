import EmberObject from '@ember/object';

export default EmberObject.extend({

  file_a : null,
  file_b : null,

  color : "#d1d1d1",

  icon : "music",

  isUsed: false,

    getCaptureStreams: function(){
    let tab = [];

    let file_a = this.get('file_a');
    let file_b = this.get('file_b');

    tab.pushObject( file_a.captureStream ? file_a.captureStream() : file_a.mozCaptureStream());
    if( file_b ){
      tab.pushObject( file_b.captureStream ? file_b.captureStream() : file_b.mozCaptureStream());
    }

    return tab;
  },
});
