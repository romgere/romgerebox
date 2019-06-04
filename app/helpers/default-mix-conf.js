import { helper } from '@ember/component/helper';
import { A } from '@ember/array';
import Constants from 'romgerebox/constants';

export function defaultMixConf() {
  return Array(Constants.TRACK_COUNT).fill(null,0, Constants.TRACK_COUNT);
}

export default helper(defaultMixConf);
