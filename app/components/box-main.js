import Component from '@ember/component';

const METRONOME_TOLERANCE = 0.17;

export default Component.extend({

  loopSideA: true,
  loopValue: 0,
  playing: false,

  boxTracks: null,

  metronomeInterval: null,
  metronomeStartTime: null,

  loopProgressInterval: null,

  init() {
    this._super(...arguments);
    this.set('boxTracks', []);
    this.set('loopProgressInterval', setInterval( this.loopProgress.bind(this), 100));
  },

  willDestroy(){
    this._super(...arguments);

    this.stop();

    let metronomeInterval = this.get('metronomeInterval');
    if( metronomeInterval ){
      clearInterval(metronomeInterval);
    }
    let loopProgressInterval = this.get('loopProgressInterval');
    if( loopProgressInterval ){
      clearInterval(loopProgressInterval);
    }

    this.set('boxTracks', []);
  },

  play: function(){
    let metronomeInterval = setInterval( this.metronomeSync.bind(this), this.get('metronome'));

    this.set('metronomeInterval', metronomeInterval);
    this.set('metronomeStartTime', new Date());

    this.sendActionToTracks('play', {
        isLoopSideA : this.get('loopSideA')
    });
  },


  stop: function(){
    let metronomeInterval = this.get('metronomeInterval');
    if( metronomeInterval ){
      clearInterval(metronomeInterval);
    }

    this.set('loopValue', 0);
    this.set('metronomeStartTime', null);

    this.sendActionToTracks('stop');
  },

  /**
   * Call every 1ms, toc check metronome time and go to 0 if needed
   * (prevent BIG blank when use "loop=true" for audio element )
   */
  loopProgress: function(){
    let loopDuration = this.get('metronome');
    let metronomeStartTime = this.get('metronomeStartTime');
    let loopPercent = 0;
    if( metronomeStartTime ){
      let loopCurrentTime = (new Date()).getTime() - metronomeStartTime.getTime();
      loopPercent = Math.round((loopCurrentTime / loopDuration ) * 100);
    }

    this.set('loopValue', loopPercent);
  },

  metronomeSync: function(){

    let metronome = this.get('metronome');
    this.toggleProperty('loopSideA');

    this.set('loopValue', 0);
    this.set('metronomeStartTime', new Date());

    //Sync child track
    this.sendActionToTracks('sync', {
        isLoopSideA : this.get('loopSideA')
    });
  },

  sendActionToTracks : function(action, param = null, exclude = null){
    this.get('boxTracks').forEach(function( boxTrack){
      if( boxTrack != exclude )
        boxTrack.send(action, param);
    })
  },

  registerBoxTrack: function( boxTrack){
    this.get('boxTracks').pushObject(boxTrack);
  },

  askForSolo: function( boxTrack){
    this.sendActionToTracks('mute', true, boxTrack);
  },

  endSolo: function(){
    this.sendActionToTracks('mute', false);
  },

  actions: {

    togglePlay: function(){
      if( this.get('playing')){
        this.stop();
        this.set('playing', false);
      }
      else{
        this.play();
        this.set('playing', true);
      }
    },

    willDestroyElement: function(){
      this.stop();
    }
  }
});
