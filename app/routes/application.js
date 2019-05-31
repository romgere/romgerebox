import Route from '@ember/routing/route';

import { inject } from '@ember/service'

export default Route.extend({

    ajaxService: inject('ajax'),

    model: function(){
        return this.get('ajaxService').request( './samples/samples.json');
    },
});
