var safeEval = require('notevil')

module.exports = function xval(object, context){
  if (Array.isArray(object)){
    return object.map(function(x){
      return xval(x, context)
    })
  } else if (object && typeof object === 'object') {
    if (object.$){
      return xval(safeEval(object.$, context), context)
    } else {
      var res = {}
      Object.keys(object).forEach(function(key){
        res[key] = xval(object[key], context)
      })
      return res
    }
  } else {
    return object
  }
}