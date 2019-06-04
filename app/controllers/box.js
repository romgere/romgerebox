import Controller from '@ember/controller';
import { A } from '@ember/array';

import Constants from 'romgerebox/constants';
import QueryParams from 'ember-parachute';


export const mixConfigParams = new QueryParams({

  mixConf: {
    defaultValue: Array(8).fill(null,0, 8),
    refresh: false,
    replace: true,
    serialize(value) {
      return value.join('|');
    },
    deserialize(value = '') {
      return A(value.split('|')).map((a) => parseInt(a));
    }
  }
});

export default Controller.extend(mixConfigParams.Mixin, {
  setupController(controller, model) {
    this._super(controller, model);
    debugger;
  },

});
