var jsonQuery = require('json-query')

module.exports = function(context, descriptor){
  var source = {}

  if (descriptor.from != null && context.descriptors && descriptor.from != context.params.id){
    var parts = descriptor.from.split('/')
    var query = parts[1]

    source = context.descriptors[parts[0]] || {}
    context.slotReferences.push(parts[0])

    if (query){
      source = jsonQuery(query, {rootContext: source}).value
    }
  }

  return inheritClone(source, descriptor)
}

function inheritClone(){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      for (var key in obj){
        if (key in obj){
          if (i<1 || (key !== 'type' && key !== 'from')){
            result[key] = obj[key]
          }
        }
      }
    }
  }
  return result
}