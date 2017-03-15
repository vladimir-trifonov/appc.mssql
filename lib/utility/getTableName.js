exports.getTableName = function getTableName (Model) {
  var parent = Model
  while (parent._parent && parent._parent.name) {
    parent = parent._parent
  }
  var table = Model.getMeta('table') || parent.name || Model._supermodel || Model.name
  if (table.indexOf(this.name + '/') >= 0) {
    table = table.replace(this.name + '/', '')
  }
  return table
}
