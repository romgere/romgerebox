import Route from '@ember/routing/route';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import SampleObject from 'romgerebox/models/sample';

export default Route.extend({

    intl: service(),
    ajaxService: service('ajax'),

    beforeModel() {
      this._super(...arguments);
      let locale = localStorage.getItem('romgereBoxLocale');
      if(  isEmpty(locale) ){
        locale = window.navigator.language.substring(0,2);
      }
      if( locale == "fr"){
        this.get('intl').setLocale('fr');
      }
      else{
        this.get('intl').setLocale('en');
      }
    },

    model: async function(){
        let samplesConf = await this.get('ajaxService').request( './samples/samples.json');
        //Create Ember Object for sample
        samplesConf.versions.forEach(function( version){
          version.samples = version.samples.map(function(sample){
              return SampleObject.create(sample);
          });
        });

        return samplesConf;
    },
});
