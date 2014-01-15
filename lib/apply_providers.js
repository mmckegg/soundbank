module.exports = function applyProviders(context, descriptor){
  var currentContext = context
  var providers = context.providers || {}
  if (Array.isArray(descriptor)){
    return descriptor.map(function(x, i){
      return applyProviders(getWorkingContext(currentContext, i), x)
    })
  } else if (descriptor && typeof descriptor === 'object') {

    if (descriptor === context.params){
      currentContext = Object.create(context)
      currentContext.workingParams = Object.create(descriptor)
      currentContext.workingDescriptor = currentContext.workingParams
    }

    var res = {}
    Object.keys(descriptor).forEach(function(key){

      var result = applyProviders(getWorkingContext(currentContext, key), descriptor[key])
      res[key] = result

      // save into working params
      currentContext.workingDescriptor[key] = result
    })

    if (res.type && typeof providers[res.type] === 'function'){
      var provider = providers[res.type]
      var result = provider(currentContext, res)

      if (currentContext.parentWorkingDescriptor){
        currentContext.parentWorkingDescriptor[currentContext.workingKey] = currentContext.workingDescriptor = inherit(result)
      } else {
        currentContext.workingDescriptor = currentContext.workingParams = inherit(result)
      }

      res = applyProviders(currentContext, result)
    }

    return res
  } else {
    return descriptor
  }
}

function getWorkingContext(original, key){
  var workingContext = Object.create(original)
  workingContext.workingDescriptor = workingContext.workingDescriptor || {}
  workingContext.parentWorkingDescriptor = workingContext.workingDescriptor
  workingContext.workingKey = key
  workingContext.workingDescriptor = workingContext.workingDescriptor[key] = inherit(workingContext.workingDescriptor[key])
  return workingContext
}

function inherit(object){
  if (object instanceof Object){
    return Object.create(object)
  } else {
    return object
  }
}