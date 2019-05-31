import Component from '@ember/component';

const METRONOME_TOLERANCE = 0.17;

export default Component.extend({

  loopSideA: true,
  loopValue: 0,
  playing: false,

  boxTracks: null,

  init() {
    this._super(...arguments);
    this.set('boxTracks', []);
    setInterval( this.metronomeCheck.bind(this), 1)
  },

  play: function(){
    this.get('metronome').play();
    this.sendActionToTracks('play', {
        isLoopSideA : this.get('loopSideA')
    });
  },


  pause: function(){
    this.get('metronome').pause();
    this.sendActionToTracks('pause');
  },

  /**
   * Call every 1ms, toc check metronome time and go to 0 if needed
   * (prevent BIG blank when use "loop=true" for audio element )
   */
  metronomeCheck: function(){
    let metronome = this.get('metronome');

    if( metronome.duration - metronome.currentTime < METRONOME_TOLERANCE ){

      this.toggleProperty('loopSideA');

      metronome.currentTime = 0;
      this.set('loopValue', 0);

      //Sync child track
      this.sendActionToTracks('sync', {
          isLoopSideA : this.get('loopSideA')
      });
    }

    let loopPercent = Math.round((metronome.currentTime / (metronome.duration - METRONOME_TOLERANCE) ) * 100);
    this.set('loopValue', loopPercent);
  },

  sendActionToTracks : function(action, param = null){
    this.get('boxTracks').forEach(function( boxTrack){
      boxTrack.send(action, param);
    })
  },

  registerBoxTrack: function( boxTrack){
    this.get('boxTracks').pushObject(boxTrack);
  },

  actions: {

    togglePlay: function(){
      if( this.get('playing')){
        this.pause();
        this.set('playing', false);
      }
      else{
        this.play();
        this.set('playing', true);
      }
    },
  }
});
