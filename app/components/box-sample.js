import Component from '@ember/component';
import { alias, or } from '@ember/object/computed';

export default Component.extend({
  classNames: ['boxSample'],
  classNameBindings: ['sampleColor', 'isUsed'],
  sampleColor: alias('sample.color'),

  isSinglePlaying: false,
  isUsed: or('isSinglePlaying','sample.isUsed'),

  doubleClick: function(){
    if( ! this.get('isUsed')){
      this.set('isSinglePlaying', true);
      this.get('sample').playOnce().then(() => {
        this.set('isSinglePlaying', false);
      });
    }
  },

});
