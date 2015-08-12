var _ = require('lodash'),
	sql = require('mssql');

/**
 * Deletes the model instance.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Arrow.Instance} instance Model instance.
 * @param {Function} callback Callback passed an Error object (or null if successful), and the deleted model.
 */
exports['delete'] = function (Model, instance, callback) {
	var self = this,
		table = this.getTableName(Model),
		primaryKeyColumn = this.getPrimaryKeyColumn(Model),
		query = 'DELETE FROM ' + table + ' OUTPUT DELETED.' + primaryKeyColumn + ' WHERE ' + primaryKeyColumn + ' = @id';
	if (!primaryKeyColumn) {
		return callback(new Arrow.ORMError("can't find primary key column for " + table));
	}
	this.logger.debug('delete query:', query);
	this.logger.debug('delete query value:', {id: instance.getPrimaryKey()});
	var request = new sql.Request(this.connection);
	request.input('id', sql.VarChar, instance.getPrimaryKey());
	request.query(query, function deleteQueryCallback(err, result) {
		if (err) {
			self.logger.trace('delete error:', err);
			return callback(err);
		}
		if (result && result.length) {
			self.logger.trace('delete result:', instance);
			return callback(null, instance);
		}
		self.logger.trace('delete result:', 'none');
		return callback();
	});
};
