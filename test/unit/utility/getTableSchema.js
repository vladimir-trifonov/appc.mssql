const test = require('tap').test
const server = require('./../../server.js')
const sinon = require('sinon')
const getTableSchemaMethod = require('../../../lib/utility/getTableSchema').getTableSchema
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

test('### getTableSchema ###', function (t) {
  const sandbox = sinon.sandbox.create()
  const Model = ARROW.getModel('Posts')

  const getTableNameStub = sandbox.stub(
    CONNECTOR,
    'getTableName',
    (Model) => {
      return Model.name
    }
  )

  CONNECTOR.metadata = {
    schema: {
      objects: {
        Posts: 'PostsMetadata'
      }
    }
  }

  var sth = getTableSchemaMethod.bind(CONNECTOR, Model)()

  t.ok(getTableNameStub.calledOnce)
  t.equal(sth, 'PostsMetadata')

  sandbox.restore()
  t.end()
})

test('### Stop Arrow ###', function (t) {
  ARROW.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
