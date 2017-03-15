var sql = require('mssql')

/**
 * Finds a model instance using the primary key.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {String} id ID of the model to find.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the found model.
 */
exports.findByID = function (Model, id, callback) {
  var self = this
  var table = this.getTableName(Model)
  var primaryKeyColumn = this.getPrimaryKeyColumn(Model)
  var query = 'SELECT TOP 1 '

  if (primaryKeyColumn) {
    query += primaryKeyColumn + ', ' + Model.payloadKeys().join(', ')
  } else {
    query += Model.payloadKeys().join(', ')
  }
  query += ' FROM ' + table + ' WHERE ' + primaryKeyColumn + ' = @id'
  this.logger.debug('findByID:', query)
  this.logger.debug('findByID values:', { id: id })
  var request = new sql.Request(this.connection)
  request.input('id', sql.VarChar, id)
  request.query(query, function findByIDQueryCallback (err, results) {
    if (err) {
      self.logger.trace('findByID error:', err)
      return callback(err)
    }
    if (!results.length) { return callback() }
    var row = results[0]
    var instance = Model.instance(self.transformRow(Model, row), true)
    if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]) }
    self.logger.trace('findByID result:', instance)
    callback(null, instance)
  })
}
