import { helper } from '@ember/component/helper'
import Constants from 'romgerebox/constants'

export function defaultMixConf() {
  return Array(Constants.TRACK_COUNT).fill(undefined,0, Constants.TRACK_COUNT).join('|')
}

export default helper(defaultMixConf)
