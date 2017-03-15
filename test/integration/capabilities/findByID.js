var should = require('should')

exports.findByID = {
  insert: {
    title: 'Jeff Haynie'
  },
  check: function (result) {
    should(result.id).be.ok
    should(result.title).equal('Jeff Haynie')
  }
}
