import { moduleForComponent, test } from 'ember-qunit'
import hbs from 'htmlbars-inline-precompile'

moduleForComponent('box-main-toolbar', 'Integration | Component | box main toolbar', {
  integration: true
})

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{box-main-toolbar}}`)

  assert.equal(this.$().text().trim(), '')

  // Template block usage:
  this.render(hbs`
    {{#box-main-toolbar}}
      template block text
    {{/box-main-toolbar}}
  `)

  assert.equal(this.$().text().trim(), 'template block text')
})
