var _ = require('lodash'),
	async = require('async'),
	sql = require('mssql'),
	defaultConfig = require('fs').readFileSync(__dirname + '/../conf/example.config.js', 'utf8'),
	pkginfo = require('pkginfo')(module) && module.exports;

// --------- MSSQL DB Connector -------

exports.create = function(APIBuilder, server) {
	var Connector = APIBuilder.Connector,
		Collection = APIBuilder.Collection;

	return Connector.extend({
		
		/*
		 Configuration.
		 */
		pkginfo: _.pick(pkginfo, 'name', 'version', 'description', 'author', 'license', 'keywords', 'repository'),
		logger: APIBuilder.createLogger({}, { name: pkginfo.name, useConsole: true, level: 'debug' }),

		/*
		 Lifecycle.
		 */
		connect: function(callback) {
			this.logger.debug('connecting');
			this.connection = new sql.Connection(this.config.mssql, function(err) {
				this.logger.debug('connected');
				callback(err);
			}.bind(this));
		},
		disconnect: function(callback) {
			this.logger.debug('disconnecting');
			this.connection.close();
			this.logger.debug('disconnected');
			callback();
		},
		
		/*
		 Metadata.
		 */
		defaultConfig: defaultConfig,
		fetchSchema: function(callback) {
			var connector = this;
			this.logger.debug('fetchSchema');

			var schema = {
					objects: {},
					database: this.config.mssql.database,
					primary_keys: {}
				},
				request = new sql.Request(connector.connection);

			request.input('catalog', sql.VarChar, connector.config.mssql.database);

			async.series([
				function fetchPrimaryKeys(next) {
					var query = 'SELECT DISTINCT Col.TABLE_NAME, Col.COLUMN_NAME ' +
						'FROM' +
						' INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, ' +
						' INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col ' +
						'WHERE ' +
						' Col.CONSTRAINT_NAME = Tab.CONSTRAINT_NAME' +
						' AND Col.TABLE_NAME = Tab.TABLE_NAME' +
						' AND Tab.CONSTRAINT_TYPE = \'PRIMARY KEY\'' +
						' AND Col.CONSTRAINT_CATALOG = @catalog';
					request.query(query, function(err, results) {
						if (err) { return callback(err); }
						results.forEach(function(result) {
							schema.primary_keys[result.TABLE_NAME] = result.COLUMN_NAME;
						});
						next();
					});
				},
				function fetchColumns(next) {
					var query = 'SELECT' +
						' c.TABLE_NAME, c.COLUMN_NAME, c.IS_NULLABLE, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,' +
						' c.NUMERIC_PRECISION, c.NUMERIC_PRECISION_RADIX, c.NUMERIC_SCALE, c.DATETIME_PRECISION ' +
						'FROM' +
						' INFORMATION_SCHEMA.COLUMNS c ' +
						'WHERE' +
						' c.table_catalog = @catalog';
					request.query(query, function(err, results) {
						if (err) { return callback(err); }
						results.forEach(function resultCallback(result) {
							var entry = schema.objects[result.TABLE_NAME];
							if (!entry) {
								entry = schema.objects[result.TABLE_NAME] = {};
							}
							entry[result.COLUMN_NAME] = result;
						});
						next();
					});
				}
			], function() {
				callback(null, schema);
			});
		},

		/*
		 CRUD.
		 */
		create: function(Model, values, callback) {
			var payload = Model.instance(values, false).toPayload(),
				table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				columns = Object.keys(payload),
				placeholders = columns.map(function(key) { return '@' + key; }),
				query = 'INSERT INTO ' + table + ' (' + columns.join(',') + ') OUTPUT INSERTED.* VALUES (' + placeholders.join(',') + ')';

			this.logger.debug('create query:', query);
			this.logger.debug('create query values:', payload);
			var request = new sql.Request(this.connection);
			addValuesToSQLRequest(payload, request);
			request.query(query, function createQueryCallback(err, results) {
				if (err) { return callback(err); }
				var row = results && results[0];
				if (row) {
					var instance = Model.instance(row);
					if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
					callback(null, instance);
				}
				else {
					callback();
				}
			});
		},
		findAll: function(Model, callback) {
			var table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				query;

			if (primaryKeyColumn) {
				query = 'SELECT ' + primaryKeyColumn + ', ' + Model.payloadKeys().join(', ') + ' FROM ' + table;
			}
			else {
				query = 'SELECT ' + Model.payloadKeys().join(', ') + ' FROM ' + table;
			}
			this.logger.debug('findAll query:', query);
			var request = new sql.Request(this.connection);
			request.query(query, function findAllQueryCallback(err, results) {
				if (err) { return callback(err); }
				var rows = [];
				results.forEach(function rowIterator(row) {
					var instance = Model.instance(row, true);
					if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
					rows.push(instance);
				});
				return callback(null, new Collection(Model, rows));
			});
		},
		findOne: function(Model, id, callback) {
			var table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				query = 'SELECT TOP 1 ';

			if (primaryKeyColumn) {
				query += primaryKeyColumn + ', ' + Model.payloadKeys().join(', ');
			}
			else {
				query += Model.payloadKeys().join(', ');
			}
			query += ' FROM ' + table + ' WHERE ' + primaryKeyColumn + ' = @id';
			this.logger.debug('findOne query:', query);
			this.logger.debug('findOne query values:', { id: id });
			var request = new sql.Request(this.connection);
			request.input('id', sql.VarChar, id);
			request.query(query, function findOneQueryCallback(err, results) {
				if (err) { return callback(err); }
				if (!results.length) { return callback(); }
				var row = results[0],
					instance = Model.instance(row, true);
				if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
				callback(null, instance);
			});
		},
		query: function(Model, options, callback) {
			// TODO: Parse through this for potential SQL injection attacks.
			var key,
				table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				keys = primaryKeyColumn,
				whereQuery = '',
				pagingQuery = '',
				orderQuery = '';

			var request = new sql.Request(this.connection);

			if (options.sel) {
				keys += ', ' + _.keys(_.omit(options.sel, primaryKeyColumn)).join(', ');
			}
			else if (options.unsel) {
				keys += ', ' + _.keys(_.omit(_.omit(getTableSchema(this, Model), primaryKeyColumn), _.keys(options.unsel))).join(', ');
			}
			else {
				keys += ', ' + _.keys(_.omit(getTableSchema(this, Model), primaryKeyColumn)).join(', ');
			}

			var where = options.where;
			if (where) {
				where = Model.instance(where, true).toPayload();
				whereQuery = ' WHERE';
				for (key in  where) {
					if (where.hasOwnProperty(key)) {
						whereQuery += ' ' + key;
						if (where[key] && where[key].$like) {
							whereQuery += ' LIKE';
							request.input(key, sql.VarChar, where[key].$like);
						}
						else {
							whereQuery += ' =';
							request.input(key, sql.VarChar, where[key]);
						}
						whereQuery += ' @' + key;
					}
				}
			}

			if (options.order) {
				orderQuery = ' ORDER BY';
				for (key in options.order) {
					if (options.order.hasOwnProperty(key)) {
						orderQuery += ' ' + key + ' ';
						if (options.order[key] === 1) {
							orderQuery += 'ASC';
						}
						else {
							orderQuery += 'DESC';
						}
						orderQuery += ',';
					}
				}
				if (orderQuery[orderQuery.length - 1] === ',') {
					orderQuery = orderQuery.slice(0, -1);
				}
			}

			if (options.page && options.per_page) {
				// Translate page/per_page to skip/limit, because that's what we can handle.
				options.skip = (options.page - 1) * options.per_page;
				options.limit = options.per_page;
			}
			if (!options.limit) {
				options.limit = 10;
			}

			var query = 'SELECT';
			if (options.skip) {
				pagingQuery += ' OFFSET ' + (+options.skip) + ' ROWS';
				pagingQuery += ' FETCH NEXT ' + (+options.limit) + ' ROWS ONLY';
			}
			else {
				query += ' TOP ' + (+options.limit);
			}

			query += ' ' + keys + ' FROM ' + table + whereQuery + orderQuery + pagingQuery;
			this.logger.debug('query query:', query);
			this.logger.debug('query query values:', where);
			request.query(query, function queryQueryCallback(err, results) {
				if (err) {return callback(err); }
				if (results) {
					var rows = [];
					results.forEach(function rowIterator(row) {
						var instance = Model.instance(row, true);
						if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
						rows.push(instance);
					});
					return callback(null, new Collection(Model, rows));
				}
				else {
					callback();
				}
			});
		},
		save: function(Model, instance, callback) {
			var table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				payload = instance.toPayload(),
				placeholders = _.without(_.keys(payload), 'id').map(function(key) { return key + ' = @' + key; }),
				query = 'UPDATE ' + table + ' SET ' + placeholders.join(',') + ' OUTPUT INSERTED.* WHERE ' + primaryKeyColumn + ' = @primaryKeyID';

			this.logger.debug('save query:', query);
			this.logger.debug('save query values:', payload);
			var request = new sql.Request(this.connection);
			addValuesToSQLRequest(payload, request);
			request.input('primaryKeyID', sql.VarChar, instance.getPrimaryKey());
			request.query(query, function saveQueryCallback(err, results) {
				if (err) { return callback(err); }
				var row = results && results[0];
				if (row) {
					var instance = Model.instance(row);
					if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
					callback(null, instance);
				}
				else {
					callback();
				}
			});
		},
		'delete': function(Model, instance, callback) {
			var table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				query = 'DELETE FROM ' + table + ' OUTPUT DELETED.' + primaryKeyColumn + ' WHERE ' + primaryKeyColumn + ' = @id';
			if (!primaryKeyColumn) {
				return callback(new APIBuilder.ORMError("can't find primary key column for " + table));
			}
			this.logger.debug('delete query:', query);
			this.logger.debug('delete query value:', { id: instance.getPrimaryKey() });
			var request = new sql.Request(this.connection);
			request.input('id', sql.VarChar, instance.getPrimaryKey());
			request.query(query, function deleteQueryCallback(err, result) {
				if (err) {
					return callback(err);
				}
				if (result && result.length) {
					return callback(null, instance);
				}
				return callback();
			});
		},
		deleteAll: function(Model, callback) {
			var table = getTableName(Model),
				primaryKeyColumn = getPrimaryKeyColumn(this, Model),
				query = 'DELETE FROM ' + table + ' OUTPUT DELETED.' + primaryKeyColumn;
			if (!primaryKeyColumn) {
				return callback(new APIBuilder.ORMError("can't find primary key column for " + table));
			}
			this.logger.debug('deleteAll query:', query);
			var request = new sql.Request(this.connection);
			request.query(query, function deleteAllQueryCallback(err, result) {
				if (err) {
					return callback(err);
				}
				if (result && result.length) {
					return callback(null, result.length);
				}
				return callback();
			});
		}
	});

};


/*
Utilities only used for this connector.
 */

// TODO: Expose these through the connector so that devs can override them.

function getTableName(Model) {
	return Model.getMeta('table') || Model.name;
}

function getPrimaryKeyColumn(connector, Model) {
	var pk = Model.getMeta('primarykey');
	if (pk) {
		return pk;
	}
	var name = getTableName(Model),
		tableSchema = getTableSchema(connector, Model),
		primaryKeyColumn = connector.metadata.schema.primary_keys[name],
		column = primaryKeyColumn && tableSchema && tableSchema[primaryKeyColumn];

	return column && column.COLUMN_NAME;
}


function addValuesToSQLRequest(values, request) {
	for (var key in values) {
		if (values.hasOwnProperty(key)) {
			// TODO: Map types.
			request.input(key, sql.VarChar, values[key]);
		}
	}
}

function getTableSchema(connector, Model) {
	var name = getTableName(Model);
	return connector.metadata.schema.objects[name];
}
