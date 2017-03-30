var _ = require('lodash')
var sql = require('mssql')

/**
 * Creates a new Model or Collection object.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Array<Object>/Object} [values] Attributes to set on the new model(s).
 * @param {Function} callback Callback passed an Error object (or null if successful), and the new model or collection.
 * @throws {Error}
 */
exports.create = function (Model, values, callback) {
  var self = this
  var payload = Model.instance(values, false).toPayload()
  var table = this.getTableName(Model)
  var primaryKeyColumn = this.getPrimaryKeyColumn(Model)
  var columns = _.without(_.keys(payload), 'id', 'timestamp')
  var placeholders = columns.map(function (key) { return '@' + key })
  var forcePrimaryKey = Model.getMeta('forcePrimaryKey') && primaryKeyColumn && values && values.id
  var query

  if (forcePrimaryKey) {
    query = 'INSERT INTO ' + table + ' (' + primaryKeyColumn + ',' + columns.join(',') + ') OUTPUT INSERTED.* VALUES (@' + primaryKeyColumn + ',' + placeholders.join(',') + ')'
    payload[primaryKeyColumn] = values.id
  } else {
    query = 'INSERT INTO ' + table + ' (' + columns.join(',') + ') OUTPUT INSERTED.* VALUES (' + placeholders.join(',') + ')'
  }

  this.logger.debug('create query:', query)
  this.logger.debug('create query values:', payload)
  var request = new sql.Request(this.connection)
  this.addValuesToSQLRequest(Model, payload, request, true)
  request.query(query, function createQueryCallback (err, results) {
    if (err) {
      self.logger.trace('create error:', err)
      return callback(err)
    }
    var row = results && results[0]
    if (row) {
      var instance = Model.instance(self.transformRow(Model, row), true)
      if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]) }
      self.logger.trace('create results:', instance)
      callback(null, instance)
    } else {
      callback()
    }
  })
}
