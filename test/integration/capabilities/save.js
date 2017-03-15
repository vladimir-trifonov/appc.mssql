var should = require('should')

exports.save = {
  insert: {
    title: 'Dawson Toth'
  },
  update: {
    title: 'Dawson R Toth'
  },
  check: function (result) {
    should(result.id).be.ok
    should(result.title).equal('Dawson R Toth')
  }
}
