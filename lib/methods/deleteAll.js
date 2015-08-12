var _ = require('lodash'),
	sql = require('mssql');

/**
 * Deletes all the data records.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful), and the deleted models.
 */
exports.deleteAll = function (Model, callback) {
	var self = this,
		table = this.getTableName(Model),
		primaryKeyColumn = this.getPrimaryKeyColumn(Model),
		query = 'DELETE FROM ' + table + ' OUTPUT DELETED.' + primaryKeyColumn;
	if (!primaryKeyColumn) {
		return callback(new Arrow.ORMError("can't find primary key column for " + table));
	}
	this.logger.debug('deleteAll query:', query);
	var request = new sql.Request(this.connection);
	request.query(query, function deleteAllQueryCallback(err, result) {
		if (err) {
			self.logger.trace('deleteAll error:', err);
			return callback(err);
		}
		if (result && result.length) {
			self.logger.trace('deleteAll result:', result);
			return callback(null, result.length);
		}
		self.logger.trace('deleteAll result:', 'none');
		return callback();
	});
};