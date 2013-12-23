var Through = require('through')

module.exports = function(soundbank){
  var stream = Through(function(data){
    if (data === true){
      emitAll()
    } else {
      soundbank.update(data)
    }
  })

  function emitAll(){
    soundbank.getDescriptors().forEach(function(slot){
      stream.queue(slot)
    })
  }

  soundbank.on('change', function(data){
    stream.queue(data)
  })

  process.nextTick(emitAll)
  return stream
}