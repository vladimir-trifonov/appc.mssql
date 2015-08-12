var should = require('should');

exports.findOne = {
	insert: {
		title: 'Jeff Haynie'
	},
	check: function (result) {
		should(result.id).be.ok;
		should(result.title).equal('Jeff Haynie');
	}
};
