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
		logger: server && server.logger || APIBuilder.createLogger({}, { name: pkginfo.name }),logger: APIBuilder.createLogger({}, { name: pkginfo.name, useConsole: true }),

		/*
		 Lifecycle.
		 */
		connect: function(callback) {
			this.logger.debug('connecting');
			this.connection = new sql.Connection(this.config, function(err) {
				if (err) {
					callback(err);
				}
				else {
					this.logger.trace('connected');
					this.fetchSchema(function fetchedSchema(err, schema) {
						if (err) {
							callback(err);
						}
						else {
							this.schema = schema;
							if (!this.config.dontGenerateModelsFromSchema) {
								this.createModelsFromSchema();
							}
							callback();
						}
					}.bind(this));
				}
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
					database: this.config.database,
					primary_keys: {}
				},
				request = new sql.Request(connector.connection);

			request.input('catalog', sql.VarChar, connector.config.database);

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
		createModelsFromSchema: function() {
			var models = {};
			for (var modelName in this.schema.objects) {
				if (this.schema.objects.hasOwnProperty(modelName)) {
					var object = this.schema.objects[modelName],
						fields = {};

					for (var fieldName in object) {
						if (object.hasOwnProperty(fieldName)) {

							if (fieldName === 'id') {
								continue;
							}
							fields[fieldName] = {
								type: this.convertDataTypeToJSType(object[fieldName].DATA_TYPE),
								required: object.IS_NULLABLE === 'NO'
							};
						}
					}

					var Model = APIBuilder.Model.extend(pkginfo.name + '/' + modelName, {
						name: pkginfo.name + '/' + modelName,
						autogen: this.config.modelAutogen === undefined ? true : this.config.modelAutogen,
						fields: fields,
						connector: this
					});
					models[pkginfo.name + '/' + modelName] = Model;
					if (server) {
						server.addModel(Model);
					}
				}
			}
			this.models = _.defaults(this.models || {}, models);
			if (server) {
				server.registerModelsForConnector(this, this.models);
			}
		},

		/*
		 CRUD.
		 */
		create: function(Model, values, callback) {
			var payload = Model.instance(values, false).toPayload(),
				table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
				columns = Object.keys(payload),
				placeholders = columns.map(function(key) { return '@' + key; }),
				query = 'INSERT INTO ' + table + ' (' + columns.join(',') + ') OUTPUT INSERTED.* VALUES (' + placeholders.join(',') + ')';

			this.logger.debug('create query:', query);
			this.logger.debug('create query values:', payload);
			var request = new sql.Request(this.connection);
			this.addValuesToSQLRequest(Model, payload, request);
			request.query(query, function createQueryCallback(err, results) {
				if (err) {
					this.logger.trace('create error:', err);
					return callback(err);
				}
				var row = results && results[0];
				if (row) {
					var instance = Model.instance(row);
					if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
					this.logger.trace('create results:', instance);
					callback(null, instance);
				}
				else {
					callback();
				}
			}.bind(this));
		},
		findAll: function(Model, callback) {
			var table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
				query;

			if (primaryKeyColumn) {
				query = 'SELECT ' + primaryKeyColumn + ', ' + Model.payloadKeys().join(', ') + ' FROM ' + table;
			}
			else {
				query = 'SELECT ' + Model.payloadKeys().join(', ') + ' FROM ' + table;
			}
			this.logger.debug('findAll:', query);
			var request = new sql.Request(this.connection);
			request.query(query, function findAllQueryCallback(err, results) {
				if (err) {
					this.logger.trace('findAll error:', err);
					return callback(err);
				}
				var rows = [];
				results.forEach(function rowIterator(row) {
					var instance = Model.instance(row, true);
					if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
					rows.push(instance);
				});
				this.logger.trace('findAll results:', rows);
				return callback(null, new Collection(Model, rows));
			}.bind(this));
		},
		findOne: function(Model, id, callback) {
			var table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
				query = 'SELECT TOP 1 ';

			if (primaryKeyColumn) {
				query += primaryKeyColumn + ', ' + Model.payloadKeys().join(', ');
			}
			else {
				query += Model.payloadKeys().join(', ');
			}
			query += ' FROM ' + table + ' WHERE ' + primaryKeyColumn + ' = @id';
			this.logger.debug('findOne:', query);
			this.logger.debug('findOne values:', { id: id });
			var request = new sql.Request(this.connection);
			request.input('id', sql.VarChar, id);
			request.query(query, function findOneQueryCallback(err, results) {
				if (err) {
					this.logger.trace('findOne error:', err);
					return callback(err);
				}
				if (!results.length) { return callback(); }
				var row = results[0],
					instance = Model.instance(row, true);
				if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
				this.logger.trace('findOne result:', instance);
				callback(null, instance);
			}.bind(this));
		},
		query: function(Model, options, callback) {
			// TODO: Parse through this for potential SQL injection attacks.
			var key,
				table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
				keys = primaryKeyColumn,
				whereQuery = '',
				pagingQuery = '',
				orderQuery = '';

			var request = new sql.Request(this.connection);

			var sel = Model.translateKeysForPayload(options.sel),
				unsel = Model.translateKeysForPayload(options.unsel);
			if (sel) {
				keys += ', ' + _.keys(_.omit(sel, primaryKeyColumn)).join(', ');
			}
			else if (unsel) {
				keys += ', ' + _.keys(_.omit(_.omit(this.getTableSchema(Model), primaryKeyColumn), _.keys(unsel))).join(', ');
			}
			else {
				keys = '*';
			}

			var where = Model.translateKeysForPayload(options.where);
			if (where && Object.keys(where).length > 0) {
				whereQuery = ' WHERE';
				for (key in where) {
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

			var order = Model.translateKeysForPayload(options.order);
			if (order && Object.keys(order).length > 0) {
				orderQuery = ' ORDER BY';
				for (key in order) {
					if (order.hasOwnProperty(key)) {
						orderQuery += ' ' + key + ' ';
						if (order[key] == 1) {
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

			var query = 'SELECT';
			if (options.skip) {
				if (!orderQuery) {
					return callback(new Error('To skip or page, you must also specify a valid order.'));
				}
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
				if (err) {
					this.logger.trace('query error:', err);
					return callback(err);
				}
				if (results) {
					var rows = [];
					results.forEach(function rowIterator(row) {
						var instance = Model.instance(row, true);
						if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
						rows.push(instance);
					});
					this.logger.trace('query results:', rows);
					return callback(null, new Collection(Model, rows));
				}
				else {
					this.logger.trace('query results:', 'none');
					callback();
				}
			}.bind(this));
		},
		save: function(Model, instance, callback) {
			var table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
				payload = instance.toPayload(),
				placeholders = _.without(_.keys(payload), 'id').map(function(key) { return key + ' = @' + key; }),
				query = 'UPDATE ' + table + ' SET ' + placeholders.join(',') + ' OUTPUT INSERTED.* WHERE ' + primaryKeyColumn + ' = @primaryKeyID';

			this.logger.debug('save query:', query);
			this.logger.debug('save query values:', payload);
			var request = new sql.Request(this.connection);
			this.addValuesToSQLRequest(Model, payload, request);
			request.input('primaryKeyID', sql.VarChar, instance.getPrimaryKey());
			request.query(query, function saveQueryCallback(err, results) {
				if (err) { 
					this.logger.trace('save error:', err);
					return callback(err);
				}
				var row = results && results[0];
				if (row) {
					var instance = Model.instance(row);
					if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]); }
					this.logger.trace('save result:', instance);
					callback(null, instance);
				}
				else {
					this.logger.trace('save result:', 'none');
					callback();
				}
			}.bind(this));
		},
		'delete': function(Model, instance, callback) {
			var table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
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
					this.logger.trace('delete error:', err);
					return callback(err);
				}
				if (result && result.length) {
					this.logger.trace('delete result:', instance);
					return callback(null, instance);
				}
				this.logger.trace('delete result:', 'none');
				return callback();
			}.bind(this));
		},
		deleteAll: function(Model, callback) {
			var table = this.getTableName(Model),
				primaryKeyColumn = this.getPrimaryKeyColumn(Model),
				query = 'DELETE FROM ' + table + ' OUTPUT DELETED.' + primaryKeyColumn;
			if (!primaryKeyColumn) {
				return callback(new APIBuilder.ORMError("can't find primary key column for " + table));
			}
			this.logger.debug('deleteAll query:', query);
			var request = new sql.Request(this.connection);
			request.query(query, function deleteAllQueryCallback(err, result) {
				if (err) {
					this.logger.trace('deleteAll error:', err);
					return callback(err);
				}
				if (result && result.length) {
					this.logger.trace('deleteAll result:', result);
					return callback(null, result.length);
				}
				this.logger.trace('deleteAll result:', 'none');
				return callback();
			}.bind(this));
		},

		/*
		 Utilities only used for this connector.
		 */

		getTableName: function getTableName(Model) {
			var parent = Model;
			while (parent._parent && parent._parent.name) {
				parent = parent._parent;
			}
			var table = Model.getMeta('table') || parent.name || Model._supermodel || Model.name;
			if (table.indexOf(pkginfo.name + '/') >= 0) {
				table = table.replace(pkginfo.name + '/', '');
			}
			return table;
		},
		getPrimaryKeyColumn: function getPrimaryKeyColumn(Model) {
			var pk = Model.getMeta('primarykey');
			if (pk) {
				return pk;
			}
			var name = this.getTableName(Model),
				tableSchema = this.getTableSchema(Model),
				primaryKeyColumn = this.metadata.schema.primary_keys[name],
				column = primaryKeyColumn && tableSchema && tableSchema[primaryKeyColumn];

			return column && column.COLUMN_NAME;
		},
		addValuesToSQLRequest: function addValuesToSQLRequest(Model, values, request) {
			var tableSchema = this.getTableSchema(Model);
			for (var key in values) {
				if (values.hasOwnProperty(key)) {
					var schema = tableSchema[key],
						type = sql.VarChar(255);

					for (var dataType in sql) {
						if (sql.hasOwnProperty(dataType)) {
							if (dataType.toLowerCase() === schema.DATA_TYPE.toLowerCase()) {
								type = sql[dataType](schema.CHARACTER_MAXIMUM_LENGTH);
							}
						}
					}

					this.logger.trace('added request input:', key, values[key], '(', type, ')');
					request.input(key, type, values[key]);
				}
			}
		},
		getTableSchema: function getTableSchema(Model) {
			var name = this.getTableName(Model);
			return this.metadata.schema.objects[name];
		},
		convertDataTypeToJSType: function convertDataTypeToJSType(dataType) {
			switch (dataType) {
				case 'tinyint':
				case 'smallint':
				case 'mediumint':
				case 'bigint':
				case 'int':
				case 'integer':
				case 'float':
				case 'bit':
				case 'double':
				case 'binary':
					return Number;
				case 'date':
				case 'datetime':
				case 'time':
				case 'year':
					return Date;
				default:
					return String;
			}
		}

	});

};







