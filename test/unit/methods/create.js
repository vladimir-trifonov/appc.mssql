const test = require('tap').test
const sinon = require('sinon')
const sql = require('mssql')
const server = require('../../server')
const createMethod = require('../../../lib/methods/create').create
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

test('### Create without result ###', function (t) {
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
      setPrimaryKey (id) { }
    }
  }

  const values = 'someValues'

  // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return 'id'
  })

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        query: function (query, createQueryCallback) {
          setImmediate(function () { createQueryCallback(null, []) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  createMethod.bind(CONNECTOR, Model, values, cbSpy)()
  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(sqlStub.calledOnce)
// t.ok(transformRow.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    t.ok(cbSpy.calledWithExactly())
    sandbox.restore()
    t.end()
  })
})

test('### Create no error ###', function (t) {
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
      setPrimaryKey (id) { }
    }
  }

  const values = 'someValues'

  // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return 'id'
  })

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        query: function (query, createQueryCallback) {
          setImmediate(function () { createQueryCallback(null, [{ title: 'Test' }]) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  const transformRow = sandbox.stub(CONNECTOR, 'transformRow', function (Model, row) { return row })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  createMethod.bind(CONNECTOR, Model, values, cbSpy)()
  setImmediate(function () {
    t.ok(getTableNameStub.calledOnce)
    t.ok(getPrimaryKeyColumnStub.calledOnce)
    t.ok(sqlStub.calledOnce)
    t.ok(transformRow.calledOnce)
    t.ok(addValuesToSQLRequestStub.calledOnce)
    t.ok(cbSpy.calledOnce)
    sandbox.restore()
    t.end()
  })
})

test('### Create error case ###', function (t) {
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
      setPrimaryKey (id) { }
    }
  }
  const values = 'someValues'
  // Stubs & spies
  const getTableNameStub = sandbox.stub(CONNECTOR, 'getTableName', function (Model) {
    return 'Posts'
  })

  const getPrimaryKeyColumnStub = sandbox.stub(CONNECTOR, 'getPrimaryKeyColumn', function (Model) {
    return 'id'
  })

  const sqlStub = sandbox.stub(
    sql,
    'Request',
    (connection) => {
      return {
        query: function (query, createQueryCallback) {
          setImmediate(function () { createQueryCallback('err', [{ title: 'Test' }]) })
        }
      }
    }
  )

  const addValuesToSQLRequestStub = sandbox.stub(CONNECTOR, 'addValuesToSQLRequest', function (Model, values, request, excludeTimeStamp) { })
  function cb (errParameter, instance) { }
  const cbSpy = sandbox.spy(cb)

  // Execution
  createMethod.bind(CONNECTOR, Model, values, cbSpy)()
  setImmediate(function () {
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
