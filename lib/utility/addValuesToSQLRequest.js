var sql = require('mssql')

exports.addValuesToSQLRequest = function addValuesToSQLRequest (Model, values, request, excludeTimestamp) {
  var tableSchema = this.getTableSchema(Model)
  for (var key in values) {
    if (values.hasOwnProperty(key)) {
      var schema = tableSchema[key]
      var type = sql.VarChar(255)
      var stringType = schema.DATA_TYPE.toLowerCase()

      if (stringType === 'timestamp') {
        if (excludeTimestamp) {
          delete values[key]
          continue
        } else {
          type = sql.VarBinary(8)
          values[key] = new Buffer(values[key], 'hex')
        }
      } else {
        for (var dataType in sql) {
          if (sql.hasOwnProperty(dataType)) {
            if (dataType.toLowerCase() === stringType) {
              type = sql[dataType](schema.CHARACTER_MAXIMUM_LENGTH)
            }
          }
        }
      }

      this.logger.trace('added request input:', key, values[key], '(', type, ')')
      request.input(key, type, values[key])
    }
  }
}
