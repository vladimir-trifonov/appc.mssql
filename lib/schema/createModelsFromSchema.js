var Arrow = require('arrow')
var _ = require('lodash')

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function () {
  var models = {}
  for (var modelName in this.schema.objects) {
    if (this.schema.objects.hasOwnProperty(modelName)) {
      var object = this.schema.objects[modelName]
      var pk = this.schema.primary_keys[modelName]
      var ic = this.schema.identity_columns[modelName]
      var fields = {}

      if (!pk) {
        this.logger.info('Skipping generation of model from table ' + modelName + ' because it has no primary key in the schema.')
        continue
      }

      for (var fieldName in object) {
        if (object.hasOwnProperty(fieldName)) {
          if (!pk || fieldName !== pk) {
            fields[fieldName] = {
              type: this.convertDataTypeToJSType(object[fieldName].DATA_TYPE),
              required: object.IS_NULLABLE === 'NO',
              readonly: object.DATA_TYPE === 'timestamp',
              custom: object.DATA_TYPE === 'timestamp'
            }
          }
        }
      }

      var nsName = this.name + '/' + modelName
      models[nsName] = Arrow.Model.extend(nsName, {
        name: nsName,
        autogen: !!this.config.modelAutogen,
        fields: fields,
        connector: this,
        generated: true
      })

      if (pk) {
        models[nsName].metadata = {
          primarykey: pk
        }

        if (!ic || pk !== ic) {
          models[nsName].metadata.forcePrimaryKey = true
        }
      }
    }
  }
  this.models = _.defaults(this.models || {}, models)
}
