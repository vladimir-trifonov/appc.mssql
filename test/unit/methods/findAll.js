const test = require('tap').test
const server = require('./../../server.js')
const sinon = require('sinon')
const sql = require('mssql')
const arrow = require('arrow')
const findAllMethod = require('../../../lib/methods/findAll').findAll
const data = {
  title: 'Catch-22',
  content: 'Catch-22 is "a problematic situation for which the only solution is denied.'
}
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

test('### FindAll Response With PrimaryKey ###', function (t) {
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
        query: function (query, findAllQueryCallback) {
          setImmediate(function () {
            findAllQueryCallback(null, [data])
          })
        }
      }
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

  const arrowCollectionStub = sandbox.stub(
    arrow,
    'Collection',
    (Model, rows) => {
      return data
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace')

  findAllMethod.bind(CONNECTOR, Model, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(transformRowStub.calledOnce)
    t.ok(loggerStub.calledOnce)
    t.ok(arrowCollectionStub.calledOnce)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(cbSpy.calledWith(null, data))

    sandbox.restore()
    t.end()
  })
})

test('### FindByAll Response Without PrimaryKey ###', function (t) {
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
        query: function (query, findAllQueryCallback) {
          setImmediate(function () {
            findAllQueryCallback(null, [data])
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

  const arrowCollectionStub = sandbox.stub(
    arrow,
    'Collection',
    (Model, rows) => {
      return data
    }
  )

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace')

  findAllMethod.bind(CONNECTOR, Model, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(transformRowStub.calledOnce)
    t.ok(loggerStub.calledOnce)
    t.ok(arrowCollectionStub.calledOnce)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(cbSpy.calledWith(null, data))

    sandbox.restore()
    t.end()
  })
})

test('### FindAll Error ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'Posts'
    }
  )

  const getPrimaryKeyColumnStub = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findAllQueryCallback) {
          setImmediate(function () {
            findAllQueryCallback('Error')
          })
        }
      }
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  findAllMethod.bind(CONNECTOR, Model, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledWith('Error'))

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
