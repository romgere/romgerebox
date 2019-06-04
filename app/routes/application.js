import Route from '@ember/routing/route';

import { inject } from '@ember/service'

import SampleObject from 'romgerebox/models/sample';

export default Route.extend({

    ajaxService: inject('ajax'),

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
