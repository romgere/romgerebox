import Component from '@ember/component';

import Constants from 'romgerebox/constants';

export default Component.extend({
  playAction: function(){},
  homeAction: function(){},
  saveAction: function(){},

  loopInfo : Constants.LOOP_INFO_TYPE,
});
