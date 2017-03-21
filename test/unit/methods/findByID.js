const test = require('tap').test
const server = require('./../../server.js')
const sinon = require('sinon')
const sql = require('mssql')
const findByIdMethod = require('../../../lib/methods/findByID').findByID
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

test('### FindByID Empty Response With PrimaryKey ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback(null, '')
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'name'
    }
  )

  const getPrimaryKeyColumn = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  findByIdMethod.bind(CONNECTOR, Model, '3', cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(cbSpy.calledWith())

    sandbox.restore()
    t.end()
  })
})

test('### FindByID Empty Response Without PrimaryKey ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback(null, '')
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'name'
    }
  )

  const getPrimaryKeyColumn = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return false
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  findByIdMethod.bind(CONNECTOR, Model, '3', cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(cbSpy.calledWith())

    sandbox.restore()
    t.end()
  })
})

test('### FindByID Error Response ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback('error')
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'name'
    }
  )

  const getPrimaryKeyColumn = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  findByIdMethod.bind(CONNECTOR, Model, '3', cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(cbSpy.calledWith('error'))

    sandbox.restore()
    t.end()
  })
})

test('### FindByID Non Empty Response With PrimaryKey ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback(null, 'Data')
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'name'
    }
  )

  const getPrimaryKeyColumnStub = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const transformRowStub = sandbox.stub(
    CONNECTOR,
    'transformRow',
    (Model, row) => {
      return {
        title: 'Catch-22'
      }
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace')

  findByIdMethod.bind(CONNECTOR, Model, '3', cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(transformRowStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)

    sandbox.restore()
    t.end()
  })
})

test('### FindByID Non Empty Response Without PrimaryKey ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback(null, 'Data')
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'name'
    }
  )

  const getPrimaryKeyColumnStub = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return false
    }
  )

  const transformRowStub = sandbox.stub(
    CONNECTOR,
    'transformRow',
    (Model, row) => {
      return {}
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace')
  
  findByIdMethod.bind(CONNECTOR, Model, '3', cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(transformRowStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)

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
