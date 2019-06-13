import Controller from '@ember/controller';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';

import { charToInt, intToChar } from 'romgerebox/misc/conv-int-char';
import Constants from 'romgerebox/constants';

export default Controller.extend({

  intl: service(),

  /* eslint-disable ember/avoid-leaking-state-in-ember-objects */
  availableLocales : ['fr', 'en'],
  currentLocale: alias('intl.locale.firstObject'),

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

    this.updateMixCodeValidation();
  },

  /**
   * Call when locale change to change validation message translation
   */
  updateMixCodeValidation: function(){
    let mixCodeValidation = [{
      message: this.get('intl').t('index.mix_code_input.invalid'),
      validate: (inputValue) => {
        return this.get('mixCodeValidationRegexp').test(inputValue);
      }
    }];
    this.set('mixCodeValidation', mixCodeValidation );

  },

  actions: {

    localeChangeAction: function( locale){
      this.updateMixCodeValidation();
      localStorage.setItem('romgereBoxLocale', locale);
    },

    loadMixCode: function(){
      let mixCode = this.get('mixCode');

      let versionIdx = charToInt(mixCode.substring(0,1));
      let mixConf = [];
      let usedSample = [];
      mixCode.substring(1).split('').forEach((c, i) => {
        if( usedSample.indexOf(c) == -1 ){
          mixConf[i] = charToInt(c);
          usedSample.pushObject(c);
        }
      });

      this.transitionToRoute('box', versionIdx, {queryParams:{mixConf}});
    },
  }
});
