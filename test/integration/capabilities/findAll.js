var should = require('should')

exports.findAll = {
  insert: {
    title: 'Nolan Wright'
  },
  check: function (results) {
    should(results.length).be.above(0)
    for (var i = 0; i < results.length; i++) {
      var result = results[i]
      should(result.id).be.ok
      should(result.title).be.ok
    }
  }
}
