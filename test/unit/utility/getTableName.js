const test = require('tap').test
const sinon = require('sinon')
const server = require('../../server')
const getTableNameMethod = require('../../../lib/utility/getTableName').getTableName
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

test('### Get table name when the model is generated ###', function (t) {
    // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')

    // Stubs & spies
  const getMetaStub = sandbox.stub(Model, 'getMeta', function (tableName) {
    return 'appc.mssql/Posts'
  })

    // Execution
  const name = getTableNameMethod.bind(CONNECTOR, Model)()
  t.ok(getMetaStub.calledOnce)
  t.equals(name, 'Posts')
  sandbox.restore()
  t.end()
})

test('### Get table name when the model is manually created ###', function (t) {
    // Data
  var sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')
  Model.name = 'Posts'

    // Execution
  const name = getTableNameMethod.bind(CONNECTOR, Model)()
  t.equals(name, 'Posts')
  sandbox.restore()
  t.end()
})

test('### Get table name when the model is extended ###', function (t) {
    // Data
  var sandbox = sinon.sandbox.create()
  const model = ARROW.getModel('Posts')
  const extendedModel = model.extend('extendedModel', {data: 'test'})
  model.name = 'Posts'

    // Execution
  const name = getTableNameMethod.bind(CONNECTOR, extendedModel)()
  t.equals(name, 'Posts')
  sandbox.restore()
  t.end()
})

test('### Stop Arrow ###', function (t) {
  ARROW.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
