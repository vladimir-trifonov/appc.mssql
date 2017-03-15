var sql = require('mssql')
var Arrow = require('arrow')

/**
 * Finds all model instances.  A maximum of 1000 models are returned.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the models.
 */
exports.findAll = function (Model, callback) {
  var self = this
  var table = this.getTableName(Model)
  var primaryKeyColumn = this.getPrimaryKeyColumn(Model)

  var query = 'SELECT TOP 1000 '
  if (primaryKeyColumn) {
    query += table + '.' + primaryKeyColumn + ', '
  }
  query += table + '.' + Model.payloadKeys().join(', ' + table + '.')
  query += ' FROM ' + table + ' ORDER BY ' + table + '.' + primaryKeyColumn

  this.logger.debug('findAll:', query)
  var request = new sql.Request(this.connection)
  request.query(query, function findAllQueryCallback (err, results) {
    if (err) {
      self.logger.trace('findAll error:', err)
      return callback(err)
    }
    var rows = []
    for (var i = 0; i < results.length; i++) {
      var row = results[i]
      var instance = Model.instance(self.transformRow(Model, row), true)
      if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]) }
      rows.push(instance)
    }
    self.logger.trace('findAll results:', rows)
    return callback(null, new Arrow.Collection(Model, rows))
  })
}
