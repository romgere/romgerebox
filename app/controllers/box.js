import Controller from '@ember/controller';
import { A } from '@ember/array';

import Constants from 'romgerebox/constants';
import QueryParams from 'ember-parachute';


export const mixConfigParams = new QueryParams({

  mixConf: {
    defaultValue: Array(Constants.TRACK_COUNT).fill(null,0, Constants.TRACK_COUNT),
    refresh: false,
    replace: true,
    serialize(value) {
      return value.join('|');
    },
    deserialize(value = '') {
      return A(value.split('|'));
    }
  }
});

export default Controller.extend(mixConfigParams.Mixin, {
  setupController(controller, model) {
    this._super(controller, model);
    debugger;
  },

});
