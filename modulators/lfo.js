var Modulators = require('../lib/modulators')

module.exports = LFO

function LFO(audioContext, descriptor, target){
  if (!(this instanceof LFO)){
    return new LFO(audioContext, descriptor, target)
  }
  this.context = audioContext
  this._modulators = Modulators(audioContext)
  this._osc = audioContext.createOscillator()
  this._amp = audioContext.createGain()
  this._osc.connect(this._amp)
  this._amp.connect(target)

  this.target = target

  this.update(descriptor)
}

LFO.prototype.start = function(at){
  this._osc.start(at)
}

LFO.prototype.sync = function(at){
  var descriptor = this.descriptor
  this._osc.stop(at)
  this._osc = this.context.createOscillator()
  
  this.descriptor = null
  this.update(descriptor)

  this._osc.connect(this._amp)
  this._osc.start(at)
}

LFO.prototype.disconnect = function(){
  this._amp.disconnect()
  this.target = null
}

LFO.prototype.stop = function(at){
  if (this._osc){
    this._osc.stop(at)
  }
}

LFO.prototype.update = function(descriptor){
  if (!this.descriptor || this.descriptor.rate != descriptor.rate){
    this._modulators.apply(this._osc.frequency, descriptor.rate, 1)
  }

  if (!this.descriptor || this.descriptor.amp != descriptor.amp){
    this._modulators.apply(this._amp.gain, descriptor.amp, 1)
  }

  if (!this.descriptor || this.descriptor.shape != descriptor.shape){
    this._osc.type = descriptor.shape || 'sine'
  }

  this.descriptor = descriptor
}