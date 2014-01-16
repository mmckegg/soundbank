var Tuna = require('../vendor/tuna')

module.exports = Delay

function Delay(audioContext, descriptor){
  if (!(this instanceof Delay)){
    return new Delay(audioContext, descriptor)
  }

  var effects = new Tuna(audioContext)
  var delay = new effects.Delay()

  this.descriptor = descriptor
  this.output = delay.output
  this.input = delay.input
  this._delay = delay
}

Delay.prototype.update = function(descriptor){

}

Delay.prototype.destroy = function(){
  this.disconnect()
}

Delay.prototype.connect = function(to){
  this.output.connect(to)
}

Delay.prototype.disconnect = function(channel){
  this.output.disconnect(channel)
}