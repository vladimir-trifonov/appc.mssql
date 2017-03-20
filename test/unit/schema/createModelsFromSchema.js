const test = require('tap').test
const sinon = require('sinon')
const Arrow = require('arrow')

const createModelsFromSchema = require('../../../lib/schema/createModelsFromSchema').createModelsFromSchema

test('### Should create models from schema ###', function (t) {
  var mockConnector = {
    schema: {
      objects: require('../../schemaJSON.js'),
      primary_keys: {
        post: 'id'
      }
    },
    name: 'Test',
    models: [],
    config: {

    },
    convertDataTypeToJSType: sinon.spy()
  }
  const arrowModelExtendStub = sinon.stub(Arrow.Model, 'extend', sinon.spy())

    // Test call
  createModelsFromSchema.call(mockConnector)
  t.ok(arrowModelExtendStub.calledOnce)
  t.ok(mockConnector.convertDataTypeToJSType.called)
  arrowModelExtendStub.restore()
  t.end()
})

test('### Should not create models from schema ###', function (t) {
  var mockConnector = {
    logger: {
      info: sinon.spy()

    },
    schema: {
      objects: require('../../schemaJSON.js'),
      primary_keys: {
        post: undefined
      }
    },
    name: 'Test',
    models: [],
    config: {

    },
    convertDataTypeToJSType: sinon.spy()
  }

    // Test call
  createModelsFromSchema.call(mockConnector)
  t.ok(mockConnector.logger.info.calledOnce)
  t.end()
})
