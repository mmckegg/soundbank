var EventEmitter = require('events').EventEmitter

module.exports = function (object) {
  var proxyFuncs = ['emit', 'on', 'once', 'listeners', 'removeListener', 'addListener', 'removeAllListeners']
  object.events = new EventEmitter()

  for (var i=0;i<proxyFuncs.length;i++){
    object[proxyFuncs[i]] = object.events[proxyFuncs[i]].bind(object.events)
  }

  return object.events
}