module.exports = function(context, descriptor){
  var template = descriptor.template || {}
  var values = descriptor.values
  if (Array.isArray(values)){
    return values.map(function(value){
      return replacePlaceholder(template, value)
    })
  }
}

function replacePlaceholder(descriptor, value){
  if (Array.isArray(descriptor)){
    return descriptor.map(function(x){
      return replacePlaceholder(x, value)
    })
  } else if (descriptor && typeof descriptor === 'object') {
    if (descriptor.$value){
      if (descriptor.$value === true){
        return value
      } else {
        return value[descriptor.$value]
      }
    } else {
      var res = {}
      Object.keys(descriptor).forEach(function(key){
        res[key] = replacePlaceholder(descriptor[key], value)
      })
      return res
    }
  } else {
    return descriptor
  }
}