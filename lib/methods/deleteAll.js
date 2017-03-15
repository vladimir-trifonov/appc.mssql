var Arrow = require('arrow')
var sql = require('mssql')

/**
 * Deletes all the data records.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful), and the deleted models.
 */
exports.deleteAll = function (Model, callback) {
  var table = this.getTableName(Model)
  var primaryKeyColumn = this.getPrimaryKeyColumn(Model)
  var query = 'DELETE FROM ' + table + ' OUTPUT DELETED.' + primaryKeyColumn
  if (!primaryKeyColumn) {
    return callback(new Arrow.ORMError("can't find primary key column for " + table))
  }
  this.logger.debug('deleteAll query:', query)
  var request = new sql.Request(this.connection)
  request.query(query, function deleteAllQueryCallback (err, result) {
    if (err) {
      return callback(err)
    }
    return callback(null, result && result.length)
  })
}
