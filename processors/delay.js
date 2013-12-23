var Tuna = require('../vendor/tuna')

module.exports = function(audioContext, descriptor){

  var effects = new Tuna(audioContext)

  var delay = new effects.Delay()

  return {
    descriptor: descriptor,
    output: delay.output,
    input: delay.input,
    effect: delay,
    connect: connect,
    disconnect: disconnect,
    update: update
  }
}

function update(descriptor){

}

function connect(to){
  this.output.connect(to)
}

function disconnect(channel){
  this.output.disconnect(channel)
}