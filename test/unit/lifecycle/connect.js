const test = require('tap').test
const sinon = require('sinon')
const connectMethod = require('../../../lib/lifecycle/connect')['connect']

test('### Test Connect method success case ###', sinon.test(function (t) {
    // Data
  const context = {}
  context.config = {}

    // Stubs & spies
  const sql = require('mssql')
  const sqlConnectionStub = this.stub(sql, 'Connection', function (config, cb) { cb() })

  function next () { }
  const nextSpy = this.spy(next)

    // Execution
  connectMethod.bind(context, nextSpy)()

    // Test
  t.ok(sqlConnectionStub.calledOnce)
  t.ok(sqlConnectionStub.calledWith(context.config))
  t.ok(nextSpy.calledOnce)
  t.ok(nextSpy.args[0].length === 0)

  t.end()
}))

test('### Test Connect method error case ###', sinon.test(function (t) {
    // Data
  const context = {}
  context.config = {}

    // Stubs & spies
  function next () { };
  const nextSpy = this.spy(next)

  const err = new Error()
  const sql = require('mssql')
  const sqlConnectionStub = this.stub(sql, 'Connection', function (config, cb) { cb(err) })

    // Execution
  connectMethod.bind(context, nextSpy)()

    // Test
  t.ok(sqlConnectionStub.calledOnce)
  t.ok(sqlConnectionStub.calledWith(context.config))
  t.ok(nextSpy.calledOnce)
  t.ok(nextSpy.calledWithExactly(err))

  t.end()
}))
