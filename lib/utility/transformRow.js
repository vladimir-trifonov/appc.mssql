exports.transformRow = function transformRow (Model, row) {
  for (var key in row) {
    if (row.hasOwnProperty(key) && row[key] instanceof Buffer) {
      row[key] = row[key].toString('hex')
    }
  }
  return row
}
