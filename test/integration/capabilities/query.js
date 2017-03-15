var should = require('should')

exports.query = {
  insert: [
    { title: 'Rick Blalock' },
    { title: 'Jeff Haynie' },
    { title: 'Chris Barber' },
    { title: 'Ingo Muschenetz' },
    { title: 'Nolan Wright' }
  ],
  query: [
    {
      where: { title: { $like: 'Chris%' } },
      sel: { title: 1 },
      order: { title: 1 }
    },
    {
      where: { title: { $like: 'Chris%' } },
      order: { title: '1' }
    },
    {
      title: 'Chris Barber'
    },
    {
      where: { title: 'Chris Barber' },
      unsel: { id: 1 }
    }
  ],
  check: function (results) {
    should(results.length).be.above(0)
    should(results[0].title).equal('Chris Barber')
  }
}
