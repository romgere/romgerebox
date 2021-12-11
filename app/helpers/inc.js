import { helper } from '@ember/component/helper'

export function inc(params) {
  return params[0] + (params[1] ? params[1] : 1)
}

export default helper(inc)
