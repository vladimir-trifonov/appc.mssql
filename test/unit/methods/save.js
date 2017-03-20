const test = require('tap').test
const sinon = require('sinon')
const sql = require('mssql')
const _ = require('lodash')
const server = require('../../server')
const saveMethod = require('../../../lib/methods/save').save
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

test('### Save without result ###', function (t) {
  // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  Model.instance = function (values, skip) {
    return {
      title: 'test',
      content: 'test content',
      toPayload () {
        return ['test', 'test content']
      },
      setPrimaryKey (id) { },
      getPrimaryKey () { return 'id' }
    }
  }

  // Stubs & spies
  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })
  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  const _keysStub = sandbox.stub(_, 'keys', function (payload) { return ['0', '1'] })
  const _withoutStub = sandbox.stub(_, 'without', function (payload) { return ['0', '1'] })
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return 'id'
  })
  var instance = Model.instance({ title: test, content: 'test content' }, false)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, saveQueryCallback) {
          setImmediate(function () { saveQueryCallback(null, []) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  saveMethod.bind(CONNECTOR, Model, instance, cbSpy)()
  setImmediate(function () {
    t.ok(_keysStub.calledOnce)
    t.ok(_withoutStub.calledOnce)
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.calledWithExactly())
    sandbox.restore()
    t.end()
  })
})

test('### Save successfully ###', function (t) {
  // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  Model.instance = function (values, skip) {
    return {
      title: 'test',
      content: 'test content',
      toPayload () {
        return ['test', 'test content']
      },
      setPrimaryKey (id) { },
      getPrimaryKey () { return 'id' }
    }
  }

  // Stubs & spies
  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })
  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  const _keysStub = sandbox.stub(_, 'keys', function (payload) { return ['0', '1'] })
  const _withoutStub = sandbox.stub(_, 'without', function (payload) { return ['0', '1'] })

  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return 'id'
  })
  var instance = Model.instance({ title: test, content: 'test content' }, false)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, saveQueryCallback) {
          setImmediate(function () { saveQueryCallback(null, [{ title: 'test' }]) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  const transformRow = sandbox.stub(CONNECTOR, 'transformRow', function (Model, row) { return row })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  saveMethod.bind(CONNECTOR, Model, instance, cbSpy)()
  setImmediate(function () {
    t.ok(_keysStub.calledOnce)
    t.ok(_withoutStub.calledOnce)
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(transformRow.calledOnce)
    t.ok(cbSpy.called)
    sandbox.restore()
    t.end()
  })
})

test('### Save successfully without primary key ###', function (t) {
  // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  Model.instance = function (values, skip) {
    return {
      title: 'test',
      content: 'test content',
      toPayload () {
        return ['test', 'test content']
      },
      setPrimaryKey (id) { },
      getPrimaryKey () { return 'id' }
    }
  }

  // Stubs & spies
  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })
  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  const _keysStub = sandbox.stub(_, 'keys', function (payload) { return ['0', '1'] })
  const _withoutStub = sandbox.stub(_, 'without', function (payload) { return ['0', '1'] })

  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return undefined
  })
  var instance = Model.instance({ title: test, content: 'test content' }, false)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, saveQueryCallback) {
          setImmediate(function () { saveQueryCallback(null, [{ title: 'test' }]) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  const transformRow = sandbox.stub(CONNECTOR, 'transformRow', function (Model, row) { return row })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  saveMethod.bind(CONNECTOR, Model, instance, cbSpy)()
  setImmediate(function () {
    t.ok(_keysStub.calledOnce)
    t.ok(_withoutStub.calledOnce)
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(transformRow.calledOnce)
    t.ok(cbSpy.called)
    sandbox.restore()
    t.end()
  })
})

test('### Save error case###', function (t) {
  // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  Model.instance = function (values, skip) {
    return {
      title: 'test',
      content: 'test content',
      toPayload () {
        return ['test', 'test content']
      },
      setPrimaryKey (id) { },
      getPrimaryKey () { return 'id' }
    }
  }

  // Stubs & spies
  const loggerDebugStub = sandbox.stub(CONNECTOR.logger, 'debug', function (message) { })
  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace', function (message) { })

  const _keysStub = sandbox.stub(_, 'keys', function (payload) { return ['0', '1'] })
  const _withoutStub = sandbox.stub(_, 'without', function (payload) { return ['0', '1'] })

  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return 'id'
  })
  var instance = Model.instance({ title: test, content: 'test content' }, false)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, saveQueryCallback) {
          setImmediate(function () { saveQueryCallback('err', []) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  saveMethod.bind(CONNECTOR, Model, instance, cbSpy)()
  setImmediate(function () {
    t.ok(_keysStub.calledOnce)
    t.ok(_withoutStub.calledOnce)
    t.ok(loggerDebugStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.calledWith('err'))
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
