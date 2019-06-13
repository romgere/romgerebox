import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  intl: service(),
  tagName : 'a',
  classNames: ['flagBtn'],
  classNameBindings: ['selected'],
  selected: false,

  onChange: function(){},

  click: function(){
    this.get('intl').setLocale(this.get('locale'));
    this.get('onChange')( this.get('locale'));
  }
});
