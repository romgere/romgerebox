import { moduleForComponent, test } from 'ember-qunit'
import hbs from 'htmlbars-inline-precompile'

moduleForComponent('box-main-recordbox', 'Integration | Component | box main recordbox', {
  integration: true
})

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{box-main-recordbox}}`)

  assert.equal(this.$().text().trim(), '')

  // Template block usage:
  this.render(hbs`
    {{#box-main-recordbox}}
      template block text
    {{/box-main-recordbox}}
  `)

  assert.equal(this.$().text().trim(), 'template block text')
})
