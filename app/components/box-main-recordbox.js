import Component from '@ember/component';
import { inject as service } from '@ember/service';

import Constants from 'romgerebox/constants';

export default Component.extend({

  audioService: service('audio'),

  classNames: ['flex','layout-row','layout-align-center-center'],
  recordAction: function(){},
  micAction: function(){},
  downloadAction: function(){},
  showDownload: false,

  meter: null,
  micStream: null,
  micStreamConnected: false,

  canvasWidth: Constants.MIC_VUMETTER_CANVAS_WIDTH,
  canvasHeigth: Constants.MIC_VUMETTER_CANVAS_HEIGHT,

  init() {
    this._super(...arguments);

    // grab the app audio context
    let audioContext = this.get('audioService.audioContext');

    // Create a new volume meter and connect it.
    /* global createAudioMeter */
    let meter = createAudioMeter(audioContext, Constants.VUMETTER_CLIPLVL, Constants.VUMETTER_AVG);
    this.set('meter', meter);

    this.onLevelChange();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this.updateMicStream();
  },

  didReceiveAttrs() {
    this._super(...arguments);
    this.updateMicStream();
  },

  updateMicStream: function(){

    let meter = this.get('meter');

    //Connect mic stream to meter if not already done
    if( this.get('micStream') && ! this.get('micStreamConnected') ){
      this.get('micStream').connect( meter);
    }

  },

  onLevelChange: function(){

    if( this.get('element') ){
      let canvasContext = this.$('#micVuMeter')[0].getContext("2d");
      let meter = this.get('meter');

      canvasContext.clearRect(0, 0, Constants.MIC_VUMETTER_CANVAS_WIDTH, Constants.MIC_VUMETTER_CANVAS_HEIGHT);
      canvasContext.fillStyle = "#FFF";

      if( this.get('micEnable') && meter ){
        canvasContext.fillRect( (meter.volume * Constants.MIC_VUMETTER_CANVAS_WIDTH), 0, Constants.MIC_VUMETTER_CANVAS_WIDTH, Constants.MIC_VUMETTER_CANVAS_HEIGHT);
      }
      else{
        canvasContext.fillRect(0, 0, Constants.MIC_VUMETTER_CANVAS_WIDTH,Constants.MIC_VUMETTER_CANVAS_HEIGHT);
      }
    }

    window.requestAnimationFrame( this.onLevelChange.bind(this));
  },

});
