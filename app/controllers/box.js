import Controller from '@ember/controller'
import { tracked } from '@glimmer/tracking'
import { defaultMixConf } from 'romgerebox/helpers/default-mix-conf'

export default class BoxController extends Controller {
  
  @tracked mixConfString = defaultMixConf()
  
  queryParams = [{
    mixConfString: {
      type: 'string',
      as: 'mixConf'
    }
  }]

  get mixConf() {
    return this.mixConfString.split('|').map((v) =>  v ? parseInt(v) : undefined)
  }

  set mixConf(value) {
    this.mixConfString = value.join('|')
  }
}
