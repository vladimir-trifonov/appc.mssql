var should = require('should')

exports.create = {
  insert: {
    title: 'Jon Alter'
  },
  check: function (result) {
    should(result.id).be.ok
    should(result.title).be.ok
  }
}
