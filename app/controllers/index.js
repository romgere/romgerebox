import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { charToInt, intToChar } from 'romgerebox/misc/conv-int-char';
import Constants from 'romgerebox/constants';



export default Controller.extend({

  mixCode: '',
  mixCodeValid: computed('mixCode', 'mixCodeValidationRegexp', function(){
    return this.get('mixCodeValidationRegexp').test(this.get('mixCode'));
  }),

  mixCodeinputMask : null,
  mixCodeValidation : null,
  mixCodeValidationRegexp : null,


  init() {
    this._super(...arguments);
    this.addObserver('model', this, 'modelChange')
  },

  modelChange: function(){

    //mixCode Input mask
    let mask = 'A-';
    for( let i = 1 ; i <= Constants.TRACK_COUNT; i++ ){
      mask += 'A';
      if( i % 4 == 0 && i < Constants.TRACK_COUNT ){
        mask += '-';
      }
    }
    this.set('mixCodeinputMask', mask);

    //mixCode validation constraint
    let maxVersionChar = intToChar(this.get('model.versions.length')-1);
    let regExp = `[A-${maxVersionChar}]`;
    regExp += '[A-Z]{'+Constants.TRACK_COUNT+'}'

    this.set('mixCodeValidationRegexp', new RegExp(regExp));

    let mixCodeValidation = [{
      message: 'Mix code non valide, vérifies ton code',
      validate: (inputValue) => {
        return this.get('mixCodeValidationRegexp').test(inputValue);
      }
    }];
    this.set('mixCodeValidation', mixCodeValidation );
  },

  actions: {
    loadMixCode: function(){

    },
  }
});
