import Component from '@ember/component'

import { alias, notEmpty } from '@ember/object/computed'
import { isEmpty } from '@ember/utils'
import { inject as service } from '@ember/service'

import Constants from 'romgerebox/constants'
import { action } from '@ember/object'

export default class BoxTrackComponent extends Component {

  tagName = ''

  @service('audio') audioService

  get additionnalClasses() {
    let classes = []

    if (this.sampleColor) {
      classes.push('sampleColor')
    }

    if (this.dragPending) {
      classes.push('dragPending')
    }

    if (this.hasSample) {
      classes.push('hasSample')
    }

    return classes.join(' ')
  }

  @alias('sample.color') sampleColor
  @alias('sample.icon') sampleIcon
  @notEmpty('sample') hasSample


  //Sample to play
  sample = null

  dragPending = false

  @alias('sample.mute') mute
  solo = false

  @alias('sample.volume') volume
  maxVolume = Constants.MAX_TRACK_VOLUME

  //Register to parent
  didReceiveAttrs() {
    this.get('boxMain').registerBoxTrack( this);
  }


  clearCurrentSample(){
    let sample = this.get('sample')

    this.set('sample', null);
    this.get('boxMain').sampleChangedForTrack( this, null);

    sample.set('isUsed', false);
    sample.stop();

    this.get('boxMain').endSoloForTrack();
    this.set('solo', false);
    this.setMuteState( false);
  }

  setMuteState( mute ){
    if( isEmpty(this.get('sample'))){
      return;
    }

    this.get('sample').set('mute', mute);
    this.set('solo', false);
  }

  setSample( sample){

    if( this.get('sample') ){
      this.clearCurrentSample();
    }

    this.set('sample', sample);
    this.get('boxMain').sampleChangedForTrack( this, sample);

    sample.set('isUsed', true);
  }

  @action
  play( params ){

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
  }

  @action
  stop(){

    if( isEmpty(this.get('sample'))){
      return;
    }

    this.get('sample').stop();
  }

  @action
  onDragSample( sample ){
    this.setSample( sample);
  }

  @action
  onOverAction(){
    this.set('dragPending', true);
  }

  @action
  onDragOutAction(){
    this.set('dragPending', false);
  }

  @action
  muteToggle(){
    this.setMuteState( ! this.get('mute'));
  }

  @action
  soloAction(){

    if( this.get('solo') ){
      this.get('boxMain').endSoloForTrack();
      this.set('solo', false);
      this.setMuteState( false);
    }
    else{
      this.setMuteState( false);
      this.get('boxMain').askForSoloForTrack( this.get('sample'));
      this.set('solo', true);
    }
  }

  //Mute from parent (for other track solo)
  // Unused ??? 2021
  // @action
  // muteTrack(mute){
  //   this.setMuteState(mute);
  // }

  @action
  removeAction() {
    this.clearCurrentSample();
  }

  @action
  changeVolume({ target: { value } }) {
    console.log('volume', value)
    this.sample.set('volume', value)
  }
}
