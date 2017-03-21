const test = require('tap').test
const sinon = require('sinon')
const server = require('../../server')
const getPrimaryKeyColumnMethod = require('../../../lib/utility/getPrimaryKeyColumn').getPrimaryKeyColumn
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

test('### Get primary key column from model`s metadata###', function (t) {
    // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')

    // Stubs & spies
  const getMetaStub = sandbox.stub(Model, 'getMeta', function (tableName) {
    return 'id'
  })

    // Execution
  const pk = getPrimaryKeyColumnMethod.bind(CONNECTOR, Model)()
  t.ok(getMetaStub.calledOnce)
  t.equals(pk, 'id')
  sandbox.restore()
  t.end()
})

test('### Get primary key column successfully###', function (t) {
    // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')

    // Stubs & spies
  const getMetaStub = sandbox.stub(Model, 'getMeta', function (tableName) {
    return undefined
  })
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getTableSchemaStub = sandbox.stub(CONNECTOR, 'getTableSchema', function (Model) {
    return {
      id: {
        type: String,
        COLUMN_NAME: 'id'
      }
    }
  })

  CONNECTOR.metadata = {
    schema: {
      primary_keys: {
        Posts: 'id'
      }
    }
  }

    // Execution
  const pk = getPrimaryKeyColumnMethod.bind(CONNECTOR, Model)()
  t.equals(pk, 'id')
  t.ok(getMetaStub.calledOnce)
  t.ok(getTableNameStub.calledOnce)
  t.ok(getTableNameStub.calledWith(Model))
  t.ok(getTableSchemaStub.calledOnce)
  t.ok(getTableSchemaStub.calledWith(Model))
  sandbox.restore()
  t.end()
})

test('### Get primary key column when the model has no primary key###', function (t) {
    // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')

    // Stubs & spies
  const getMetaStub = sandbox.stub(Model, 'getMeta', function (tableName) {
    return undefined
  })
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getTableSchemaStub = sandbox.stub(CONNECTOR, 'getTableSchema', function (Model) {
    return {
      id: {
        type: String
      }
    }
  })

  CONNECTOR.metadata = {
    schema: {
      primary_keys: {
        Posts: 'id'
      }
    }
  }

    // Execution
  t.throws(getPrimaryKeyColumnMethod.bind(CONNECTOR, Model),
        'Posts does not have a primary key column!')
  t.ok(getMetaStub.calledOnce)
  t.ok(getTableNameStub.calledOnce)
  t.ok(getTableSchemaStub.calledOnce)
  sandbox.restore()
  t.end()
})

test('### Stop Arrow ###', function (t) {
  ARROW.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
