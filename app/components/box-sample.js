import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({
  classNames: ['boxSample'],
  classNameBindings: ['sampleColor', 'isUsed'],
  sampleColor: alias('sample.color'),
  isUsed: alias('sample.isUsed'),
});
