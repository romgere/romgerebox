import Service from '@ember/service';

export default Service.extend({

  //Audio Context for application (one instance)
  audioContext: null,

  init() {
    this._super(...arguments);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext = new AudioContext();

    this.set('audioContext', audioContext);
  },

  /**
   * Create and set mediaStreamSource on sample for audio file (A & B)
   * @param  {sample} sample Sample to used (model)
   */
  createAudioStreamForSample: function( sample ){
    let tab = [];

    let audioContext = this.get('audioContext');

    let file_a = sample.get('file_a');
    let file_b = sample.get('file_b');

    let stream_a = file_a.captureStream ? file_a.captureStream() : file_a.mozCaptureStream();
    let mediaStreamSource_a = audioContext.createMediaStreamSource(stream_a);
    sample.set('mediaStreamSource_a', mediaStreamSource_a);

    if( file_b ){
      let stream_b = file_b.captureStream ? file_b.captureStream() : file_b.mozCaptureStream();
      let mediaStreamSource_b = audioContext.createMediaStreamSource(stream_b);
      sample.set('mediaStreamSource_b', mediaStreamSource_b);
    }

    sample.set('mediaStreamInit', true);
  },

});
