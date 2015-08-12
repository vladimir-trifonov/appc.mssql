var Arrow = require('arrow'),
	_ = require('lodash');

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function () {
	var models = {};
	for (var modelName in this.schema.objects) {
		if (this.schema.objects.hasOwnProperty(modelName)) {
			var object = this.schema.objects[modelName],
				pk = this.schema.primary_keys[modelName],
				fields = {};

			if (!pk) {
				this.logger.info('Skipping generation of model from table ' + modelName + ' because it has no primary key in the schema.');
				continue;
			}

			for (var fieldName in object) {
				if (object.hasOwnProperty(fieldName)) {
					if (fieldName === pk) {
						continue;
					}
					fields[fieldName] = {
						type: this.convertDataTypeToJSType(object[fieldName].DATA_TYPE),
						required: object.IS_NULLABLE === 'NO',
						readonly: object.DATA_TYPE === 'timestamp',
						custom: object.DATA_TYPE === 'timestamp'
					};
				}
			}

			var nsName = this.name + '/' + modelName;
			models[nsName] = Arrow.Model.extend(nsName, {
				name: nsName,
				autogen: !!this.config.modelAutogen,
				fields: fields,
				connector: this,
				generated: true
			});
		}
	}
	this.models = _.defaults(this.models || {}, models);
};
