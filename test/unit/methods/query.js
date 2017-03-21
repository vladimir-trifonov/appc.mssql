const test = require('tap').test
const server = require('./../../server.js')
const sinon = require('sinon')
const sql = require('mssql')
const _ = require('lodash')
const arrow = require('arrow')
const queryMethod = require('../../../lib/methods/query').query
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

test('### Query Empty Response ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const options = {
    sel: 'sel',
    where: {
      title: { $like: 'HarryPotter%' },
      age: 3
    },
    order: { title: '1' }
  }

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
      return 'Posts'
    }
  )

  const getPrimaryKeyColumn = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(
    CONNECTOR,
    'addValuesToSQLRequest',
    (Model, where, request, bool) => {
      return null
    }
  )

  const _stub = sandbox.stub(
    _,
    'keys',
    (omit, primaryKey) => {
      return ['a', 'b']
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace')

  queryMethod.bind(CONNECTOR, Model, options, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(_stub.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)

    sandbox.restore()
    t.end()
  })
})

test('### Query Error Response ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const options = {
    unsel: 'unsel',
    where: {
      title: '35 May',
      age: 3
    },
    order: '',
    limit: 3,
    skip: 1
  }

  const getTableSchemaStub = sandbox.stub(
    CONNECTOR,
    'getTableSchema',
    (Model) => {
      return 'schema'
    }
  )

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
      return 'Posts'
    }
  )

  const getPrimaryKeyColumn = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(
    CONNECTOR,
    'addValuesToSQLRequest',
    (Model, where, request, bool) => {
      return null
    }
  )

  const loggerStub = sandbox.stub(CONNECTOR.logger, 'debug')

  const loggerTraceStub = sandbox.stub(CONNECTOR.logger, 'trace')

  queryMethod.bind(CONNECTOR, Model, options, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getTableSchemaStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(sqlStub.calledOnce)

    sandbox.restore()
    t.end()
  })
})

test('### Query Response With PrimaryKey ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const options = {
    where: {
      title: '35 May',
      age: 3
    },
    order: '{ title: 1 }',
    limit: 3,
    skip: 1
  }

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback(null, [data])
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'Posts'
    }
  )

  const getPrimaryKeyColumn = sandbox.stub(
    CONNECTOR,
    'getPrimaryKeyColumn',
    (Model) => {
      return 'PK'
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(
    CONNECTOR,
    'addValuesToSQLRequest',
    (Model, where, request, bool) => {
      return null
    }
  )

  const transformRowStub = sandbox.stub(
    CONNECTOR,
    'transformRow',
    (Model, row) => {
      return {}
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

  queryMethod.bind(CONNECTOR, Model, options, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(transformRowStub.calledOnce)
    t.ok(arrowCollectionStub.calledOnce)

    sandbox.restore()
    t.end()
  })
})

test('### Query Response Without PrimaryKey ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  const cb = function (errorMessage, data) { }
  const cbSpy = sandbox.spy(cb)

  const options = {
    limit: 3,
    skip: 1
  }

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, findByIDQueryCallback) {
          setImmediate(function () {
            findByIDQueryCallback(null, [data])
          })
        }
      }
    }
  )

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return 'Posts'
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
      return {}
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

  queryMethod.bind(CONNECTOR, Model, options, cbSpy)()

  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumn.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(loggerStub.calledTwice)
    t.ok(loggerTraceStub.calledOnce)
    t.ok(transformRowStub.calledOnce)
    t.ok(arrowCollectionStub.calledOnce)

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
