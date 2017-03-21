const test = require('tap').test
const server = require('./../../server.js')
const deleteMethod = require('../../../lib/methods/delete').delete
const sinon = require('sinon')
const sql = require('mssql')
var ARROW
var CONNECTOR

test('### Start Arrow ###', function (t) {
  server()
        .then((inst) => {
          ARROW = inst
          CONNECTOR = ARROW.getConnector('appc.mssql')
          t.ok(ARROW, 'Arrow has been started')
          t.end()
        })
        .catch((err) => {
          t.threw(err)
        })
})

test('Delete method test - no primary key error case', sinon.test(function (t) {
    // Data
  const model = ARROW.getModel('Posts')
  const test = {
    title: 'Test post',
    content: 'Test content'
  }
  const instance = model.instance(test, false)

    // Stubs & spies
  const getTableNameStub = this.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = this.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return undefined
  })

  function cb () { }
  const cbSpy = this.spy(cb)

    // Execution
  deleteMethod.bind(CONNECTOR, model, instance, cbSpy)()

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

test('Delete method test - query error case', function (t) {
  var sandbox = sinon.sandbox.create()
    // Data
  const model = ARROW.getModel('Posts')
  const test = {
    title: 'Test post',
    content: 'Test content'
  }
  const instance = model.instance(test, false)
  instance.getPrimaryKey = function () { return '7' }

    // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return 'id'
  })

  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  function input (name, type, value) { }
  const inputSpy = sandbox.spy(input)

  const error = new Error()
  function query (query, callback) {
    setImmediate(() => {
      callback(error)
    })
  }
  const querySpy = sandbox.spy(query)

  const sqlRequestStub = sandbox.stub(sql, 'Request', function (connection) {
    return {
      input: inputSpy,
      query: querySpy
    }
  })

  function cb () { }
  const cbSpy = sandbox.spy(cb)

    // Execution
  deleteMethod.bind(CONNECTOR, model, instance, cbSpy)()

    // Test
  setImmediate(() => {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getTableNameStub.calledWithExactly(model))
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledWithExactly(model))
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(sqlRequestStub.calledOnce)
    t.ok(inputSpy.calledOnce)
    t.ok(querySpy.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.args[0] !== null)
    t.ok(cbSpy.calledWithExactly(error))

    sandbox.restore()
    t.end()
  })
})

test('Delete method test - success case', function (t) {
  var sandbox = sinon.sandbox.create()

    // Data
  const model = ARROW.getModel('Posts')
  const test = {
    title: 'Test post',
    content: 'Test content'
  }
  const instance = model.instance(test, false)
  instance.getPrimaryKey = function () { return '7' }

    // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return 'id'
  })

  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  function input (name, type, value) { }
  const inputSpy = sandbox.spy(input)

  function query (query, callback) {
    setImmediate(() => {
      callback(null, {
        length: 1
      })
    })
  }
  const querySpy = sandbox.spy(query)

  const sqlRequestStub = sandbox.stub(sql, 'Request', function (connection) {
    return {
      input: inputSpy,
      query: querySpy
    }
  })

  function cb () { }
  const cbSpy = sandbox.spy(cb)

    // Execution
  deleteMethod.bind(CONNECTOR, model, instance, cbSpy)()

    // Test
  setImmediate(() => {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getTableNameStub.calledWithExactly(model))
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledWithExactly(model))
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(sqlRequestStub.calledOnce)
    t.ok(inputSpy.calledOnce)
    t.ok(querySpy.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.calledWithExactly(null, instance))

    sandbox.restore()
    t.end()
  })
})

test('Delete method test - nothing to delete', function (t) {
  var sandbox = sinon.sandbox.create()

    // Data
  const model = ARROW.getModel('Posts')
  const test = {
    title: 'Test post',
    content: 'Test content'
  }
  const instance = model.instance(test, false)
  instance.getPrimaryKey = function () { return '7' }

    // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (model) { return 'posts' })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (model) {
    return 'id'
  })

  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  function input (name, type, value) { }
  const inputSpy = sandbox.spy(input)

  function query (query, callback) {
    setImmediate(() => {
      callback()
    })
  }
  const querySpy = sandbox.spy(query)

  const sqlRequestStub = sandbox.stub(sql, 'Request', function (connection) {
    return {
      input: inputSpy,
      query: querySpy
    }
  })

  function cb () { }
  const cbSpy = sandbox.spy(cb)

    // Execution
  deleteMethod.bind(CONNECTOR, model, instance, cbSpy)()

    // Test
  setImmediate(() => {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getTableNameStub.calledWithExactly(model))
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledWithExactly(model))
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(sqlRequestStub.calledOnce)
    t.ok(inputSpy.calledOnce)
    t.ok(querySpy.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.args[0].length === 0)

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
