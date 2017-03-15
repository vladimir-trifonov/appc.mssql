const test = require('tap').test
const sinon = require('sinon')
const disconnectMethod = require('../../../lib/lifecycle/disconnect')['disconnect']

test('### Test Disconnect method with connection ###', sinon.test(function (t) {
    // Data
  const context = {}
  context.connection = {
    close: function () { }
  }

    // Stubs & spies
  function next () { };
  const nextSpy = this.spy(next)

    // Execution
  disconnectMethod.bind(context, nextSpy)()

    // Test
  t.ok(nextSpy.calledOnce)
  t.ok(nextSpy.args[0].length === 0)
  t.ok(context.connection === null)

  t.end()
}))

test('### Test Disconnect method no connection ###', sinon.test(function (t) {
    // Data
  const context = {}

    // Stubs & spies
  function next () { }
  const nextSpy = this.spy(next)

    // Execution
  disconnectMethod.bind(context, nextSpy)()

    // Test
  t.ok(nextSpy.calledOnce)
  t.ok(nextSpy.args[0].length === 0)

  t.end()
}))
