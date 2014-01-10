var Through = require('through')

module.exports = function (object, handler) {
  var proxyFuncs = ['emit', 'pipe', 'write', 'on', 'removeListener']
  object.stream = Through(handler)

  object.writable = object.stream.writable
  object.readable = object.stream.readable

  proxyFuncs.forEach(function(func){
    object[func] = function(){
      return object.stream[func].apply(object.stream, arguments)
    }
  })
}