const test = require('tap').test
const sinon = require('sinon')
var sql = require('mssql')
const server = require('../../server')
const fetchSchema = require('../../../lib/schema/fetchSchema').fetchSchema
var ARROW
var CONNECTOR

test('### Start Arrow ###', function (t) {
  server()
    .then((inst) => {
      ARROW = inst
      CONNECTOR = ARROW.getConnector('appc.mssql')
      CONNECTOR.config.database = 'database'
      t.ok(ARROW, 'Arrow has been started')
      t.end()
    })
    .catch((err) => {
      t.threw(err)
    })
})

test('### Fetch Schema error ###', function (t) {
  const nextSpy = sinon.spy()

  var test1 = {
    COLUMN_NAME: 'id',
    TABLE_NAME: 'Posts'
  }

  const sqlStub = sinon.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, callback) {
          callback('err', [test1])
        }
      }
    }
  )

  const loggerStub = sinon.stub(CONNECTOR.logger,
    'error',
    (CONNECTOR) => { }
  )

  fetchSchema.bind(CONNECTOR, nextSpy)()
  t.ok(nextSpy.calledOnce)
  t.ok(nextSpy.calledWith(null, {}))
  t.ok(sqlStub.calledOnce)
  sqlStub.restore()
  loggerStub.restore()
  t.end()
})

test('### Fetch Schema without error###', function (t) {
  const nextSpy = sinon.spy()
  var test1 = {
    COLUMN_NAME: 'id',
    TABLE_NAME: 'Posts'
  }

  var schema =
    {
      objects: { Posts: { id: { COLUMN_NAME: 'id', TABLE_NAME: 'Posts' } } },
      database: 'database',
      primary_keys: { Posts: 'id' }
    }

  const sqlStub = sinon.stub(
    sql,
    'Request',
    (connection) => {
      return {
        input: function (param, varChar, id) { },
        query: function (query, callback) {
          callback(null, [test1])
        }
      }
    }
  )
  fetchSchema.bind(CONNECTOR, nextSpy)()
  t.ok(nextSpy.calledOnce)
  t.ok(nextSpy.calledWith(null, schema))
  t.ok(sqlStub.calledOnce)
  sqlStub.restore()
  t.end()
})

test('### Stop Arrow ###', function (t) {
  ARROW.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
