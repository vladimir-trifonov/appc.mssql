var _ = require('lodash')
var sql = require('mssql')

/**
 * Updates a Model instance.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Arrow.Instance} instance Model instance to update.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the updated model.
 */
exports.save = function (Model, instance, callback) {
  var self = this
  var table = this.getTableName(Model)
  var primaryKeyColumn = this.getPrimaryKeyColumn(Model)
  var payload = instance.toPayload()
  var placeholders = _.without(_.keys(payload), 'id', 'timestamp').map(function (key) { return key + ' = @' + key })
  var query = 'UPDATE ' + table + ' SET ' + placeholders.join(',') + ' OUTPUT INSERTED.* WHERE ' + primaryKeyColumn + ' = @primaryKeyID'

  this.logger.debug('save query:', query)
  this.logger.debug('save query values:', payload)
  var request = new sql.Request(this.connection)
  this.addValuesToSQLRequest(Model, payload, request, true)
  request.input('primaryKeyID', sql.VarChar, instance.getPrimaryKey())
  request.query(query, function saveQueryCallback (err, results) {
    if (err) {
      self.logger.trace('save error:', err)
      return callback(err)
    }
    var row = results && results[0]
    if (row) {
      var instance = Model.instance(self.transformRow(Model, row), true)
      if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]) }
      self.logger.trace('save result:', instance)
      callback(null, instance)
    } else {
      self.logger.trace('save result:', 'none')
      callback()
    }
  })
}
