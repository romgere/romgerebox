import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ms-to-time', 'helper:ms-to-time', {
  integration: true
});

// Replace this with your real tests.
test('it renders', function(assert) {
  this.set('inputValue', '1234');

  this.render(hbs`{{ms-to-time inputValue}}`);

  assert.equal(this.$().text().trim(), '1234');
});
