const test = require('tap').test
const server = require('./../../server.js')
const deleteAllMethod = require('../../../lib/methods/deleteAll').deleteAll
const sinon = require('sinon')
const sql = require('mssql')
var ARROW
var CONNECTOR

test('### Start Arrow ###', function (t) {
  server()
        .then((inst) => {
          ARROW = inst
          CONNECTOR = ARROW.getConnector('appc.mysql')
          t.ok(ARROW, 'Arrow has been started')
          t.end()
        })
        .catch((err) => {
          t.threw(err)
        })
})

test('DeleteAll method test - no primaryKey column error case', sinon.test(function (t) {
    // Data
  const model = ARROW.getModel('Posts')

    // Stubs & spies
  const getTableNameStub = this.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = this.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return undefined
  })

  function cb () { }
  const cbSpy = this.spy(cb)

    // Execution
  deleteAllMethod.bind(CONNECTOR, model, cbSpy)()

    // Test
  t.ok(getTableNameStub.calledOnce)
  t.ok(getTableNameStub.calledWithExactly(model))
  t.ok(getPrimaryKeyColumnStub.calledOnce)
  t.ok(getPrimaryKeyColumnStub.calledWithExactly(model))
  t.ok(cbSpy.calledOnce)
  t.ok(cbSpy.args[0] !== null)
  const error = cbSpy.args[0][0]
  t.ok(error.message === "can't find primary key column for posts")

  t.end()
}))

test('DeleteAll method test - query error case', function (t) {
  var sandbox = sinon.sandbox.create()
    // Data
  const model = ARROW.getModel('Posts')

    // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return 'id'
  })

  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })

  const error = new Error()
  function query (query, callback) {
    setImmediate(() => {
      callback(error)
    })
  }
  const querySpy = sandbox.spy(query)

  const sqlRequestStub = sandbox.stub(sql, 'Request', function (connection) {
    return {
      query: querySpy
    }
  })

  function cb () { }
  const cbSpy = sandbox.spy(cb)

    // Execution
  deleteAllMethod.bind(CONNECTOR, model, cbSpy)()

    // Test
  setImmediate(() => {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledWithExactly(model))
    t.ok(loggerDebugStub.calledOnce)
    t.ok(sqlRequestStub.calledOnce)
    t.ok(querySpy.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.args[0] !== null)
    t.ok(cbSpy.calledWithExactly(error))

    sandbox.restore()
    t.end()
  })
})

test('DeleteAll method test -  success case', function (t) {
  var sandbox = sinon.sandbox.create()
    // Data
  const model = ARROW.getModel('Posts')

    // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return 'id'
  })

  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })

  function query (query, callback) {
    setImmediate(() => {
      callback(null, true)
    })
  }
  const querySpy = sandbox.spy(query)

  const sqlRequestStub = sandbox.stub(sql, 'Request', function (connection) {
    return {
      query: querySpy
    }
  })

  function cb () { }
  const cbSpy = sandbox.spy(cb)

    // Execution
  deleteAllMethod.bind(CONNECTOR, model, cbSpy)()

    // Test
  setImmediate(() => {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledWithExactly(model))
    t.ok(loggerDebugStub.calledOnce)
    t.ok(sqlRequestStub)
    t.ok(querySpy.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.args[0] !== null)
    t.ok(cbSpy.calledWith(null))

    sandbox.restore()
    t.end()
  })
})

test('### Stop Arrow ###', function (t) {
  ARROW.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
