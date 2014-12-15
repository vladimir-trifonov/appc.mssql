var should = require('should'),
	async = require('async'),
	url = require('url'),
	sql = require('mssql'),
	APIBuilder = require('appcelerator').apibuilder,
	server = new APIBuilder(),
	connector = server.getConnector('appc.mssql'),
	log = APIBuilder.createLogger({}, { name: 'api-connector-mssql TEST', useConsole: true, level: 'info' }),
	Model;


describe('Connector', function() {

	var testTableName = 'TEST_Post';

	before(function(callback) {
		// define your model
		Model = APIBuilder.Model.extend(testTableName, {
			fields: {
				title: { type: String },
				content: { type: String }
			},
			connector: 'appc.mssql'
		});

		should(Model).be.an.Object;

		server.start(function(err) {
			should(err).be.not.ok;

			// Set up our testing table.
			var connection = connector.connection;
			async.series([
				function(next) {
					var request = new sql.Request(connection);
					request.query('DROP TABLE ' + testTableName, function(err) {
						if (!err || String(err).indexOf('because it does not exist') >= 0) {
							next();
						}
						else {
							callback(err);
						}
					});
				},
				function(next) {
					var request = new sql.Request(connection);
					request.query('CREATE TABLE ' + testTableName + ' (id INT IDENTITY, title VARCHAR(255), content VARCHAR(255))',
						function(err) {
							if (!err || String(err).indexOf('There is already an object named') >= 0) {
								next();
							}
							else {
								callback(err);
							}
						});
				},
				function(next) {
					var request = new sql.Request(connection);
					request.query('CREATE UNIQUE CLUSTERED INDEX Idx_' + testTableName + ' ON ' + testTableName + '(id)', function(err) {
						if (!err || String(err).indexOf('already exists on table') >= 0) {
							next();
						}
						else {
							callback(err);
						}
					});
				},
				function(next) {
					var request = new sql.Request(connection);
					request.query('ALTER TABLE ' + testTableName + ' ADD CONSTRAINT PK_' + testTableName + ' PRIMARY KEY(id)', function(err) {
						if (!err || String(err).indexOf('already exists on table') >= 0) {
							next();
						}
						else {
							callback(err);
						}
					});
				}
			], callback);

		});
	});

	after(function(next) {
		Model.deleteAll(function(err) {
			if (err) {
				log.error(err.message);
			}
			server.stop(next);
		});
	});

	it('should be able to fetch config', function(next) {
		connector.fetchConfig(function(err, config) {
			should(err).be.not.ok;
			should(config).be.an.Object;
			should(Object.keys(config)).containEql('mssql');
			next();
		});
	});

	it('should be able to fetch schema', function(next) {
		connector.fetchSchema(function(err, schema) {
			should(err).be.not.ok;
			should(schema).be.an.Object;
			next();
		});
	});

	it('should be able to fetch schema with post table', function(next) {
		connector.fetchSchema(function(err, schema) {
			should(err).be.not.ok;
			should(schema).be.an.Object;
			should(schema.objects[testTableName].id).be.ok;
			should(schema.objects[testTableName].title).be.ok;
			should(schema.objects[testTableName].content).be.ok;
			should(schema.primary_keys[testTableName]).be.ok;
			next();
		});
	});


	it('should be able to create instance', function(next) {

		var title = 'Test',
			content = 'Hello world',
			object = {
				title: title,
				content: content
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.Object;
			should(instance.getPrimaryKey()).be.a.Number;
			should(instance.title).equal(title);
			should(instance.content).equal(content);
			instance.delete(next);
		});

	});

	it('should be able to find an instance by ID', function(next) {

		var title = 'Test',
			content = 'Hello world',
			object = {
				title: title,
				content: content
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.Object;

			var id = instance.getPrimaryKey();
			Model.find(id, function(err, instance2) {
				should(err).be.not.ok;
				should(instance2).be.an.Object;
				should(instance2.getPrimaryKey()).equal(id);
				should(instance2.title).equal(title);
				should(instance2.content).equal(content);
				instance.delete(next);
			});

		});

	});

	it('should be able to find all instances', function(next) {

		var posts = [
			{
				title: 'Test1',
				content: 'Hello world'
			},
			{
				title: 'Test2',
				content: 'Goodbye world'
			}];

		Model.create(posts, function(err, coll) {
			should(err).be.not.ok;
			should(coll.length).equal(posts.length);

			var keys = [];
			coll.forEach(function(post) {
				keys.push(post.getPrimaryKey());
			});

			Model.find(function(err, coll2) {
				should(err).be.not.ok;
				should(coll2.length).equal(coll.length);

				var array = [];

				coll2.forEach(function(post, i) {
					should(post.getPrimaryKey()).equal(keys[i]);
					array.push(post);
				});

				async.eachSeries(array, function(post, next_) {
					should(post).be.an.Object;
					post.delete(next_);
				}, function(err) {
					next(err);
				});
			});

		});

	});

	it('should be able to find an instance by field value', function(next) {

		var title = 'Test',
			content = 'Hello world',
			object = {
				title: title,
				content: content
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.Object;

			var query = { title: title };
			Model.find(query, function(err, coll) {
				should(err).be.not.ok;
				var instance2 = coll[0];
				should(instance2).be.an.Object;
				should(instance2.title).equal(title);
				instance.delete(next);
			});

		});

	});

	it('should be able to update an instance', function(next) {

		var title = 'Test',
			content = 'Hello world',
			object = {
				title: title,
				content: content
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.Object;

			var id = instance.getPrimaryKey();
			Model.find(id, function(err, instance2) {
				should(err).be.not.ok;

				instance2.set('content', 'Goodbye world');
				instance2.save(function(err, result) {
					should(err).be.not.ok;

					should(result).be.an.Object;
					should(result.getPrimaryKey()).equal(id);
					should(result.title).equal(title);
					should(result.content).equal('Goodbye world');
					instance.delete(next);
				});

			});

		});

	});

	it('should be able to query', function(callback) {

		var title = 'Test',
			content = 'Hello world',
			object = {
				title: title,
				content: content
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.Object;

			var options = {
				where: { content: { $like: 'Hello%' } },
				sel: { content: 1 },
				order: { title: -1, content: 1 },
				limit: 3,
				skip: 0
			};
			Model.query(options, function(err, coll) {
				should(err).be.not.ok;

				async.eachSeries(coll, function(obj, next) {
					should(obj.getPrimaryKey()).be.a.Number;
					should(obj.title).be.not.ok;
					should(obj.content).be.a.String;
					obj.remove(next);
				}, callback);
			});
		});

	});

});
