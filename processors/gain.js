var Modulators = require('../lib/modulators')

module.exports = Gain

function Gain(audioContext, descriptor){
  if (!(this instanceof Gain)){
    return new Gain(audioContext, descriptor)
  }
  this.context = audioContext
  this._modulators = Modulators(audioContext)
  this._gain = audioContext.createGain()
  this.output = this._gain
  this.input = this._gain
  this.update(descriptor)
  this._modulators.start(0)
}

Gain.prototype.sync = function(at){
  this._modulators.sync(at)
}

Gain.prototype.connect = function(to){
  this.output.connect(to)
}

Gain.prototype.disconnect = function(){
  this.output.disconnect()
}

Gain.prototype.destroy = function(){
  this.disconnect()
  this._modulators.stop(0)
}

Gain.prototype.update = function(descriptor){
  if (!this.descriptor || descriptor.amp != this.descriptor.amp){
    this._modulators.apply(this._gain.gain, descriptor.amp, 1)
  }
  this.descriptor = descriptor
}