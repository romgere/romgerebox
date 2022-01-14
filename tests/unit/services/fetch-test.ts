import { module, test } from 'qunit'
import { setupTest } from 'ember-qunit'
import sinon from "sinon"
import type FetchService from 'romgerebox/services/fetch'

let fetchStub: sinon.SinonStub<[input: RequestInfo, init?: RequestInit | undefined], Promise<Response>>

module('Unit | Service | fetch', function (hooks) {
  setupTest(hooks)

  hooks.beforeEach(function (){
    fetchStub = sinon.stub(window, 'fetch')
  })
  
  hooks.afterEach(function () {
    fetchStub.restore()
  })
  
  test('it can fetch Json', async function (assert) {

    let json = { some: 'value'}
    let response = new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      }
    })
    
    fetchStub.onCall(0).returns(Promise.resolve(response))
    
    let service = this.owner.lookup('service:fetch') as FetchService
    assert.deepEqual(
      await service.getJson('some/url'),
      json,
      'it return json'
    )

    assert.strictEqual(
      fetchStub.args[0][0],
      'some/url',
      'fetch was called with url'
    )
  })

  test('it can fetch buffer array', async function (assert) {

    let a = new Uint8Array(10)
    a.set([2,3,0,7,2,3,0,7,2,3])
    let { buffer } = a

    let response = new Response(buffer, {
      status: 200,
      headers: {
        'Content-type': 'arraybuffer'
      }
    })
    
    fetchStub.onCall(0).returns(Promise.resolve(response))
    
    let service = this.owner.lookup('service:fetch') as FetchService
    assert.deepEqual(
      await service.getArrayBuffer('some/binary/url'),
      buffer,
      'it return buffer array'
    )

    assert.strictEqual(
      fetchStub.args[0][0],
      'some/binary/url',
      'fetch was called with url'
    )
  })
})

