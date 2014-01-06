module.exports = LFO

function LFO(audioContext, descriptor, target){
  if (!(this instanceof LFO)){
    return new LFO(audioContext, descriptor, target)
  }
  this.context = audioContext
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
    var rate = descriptor.rate != null ? descriptor.rate : 1
    this._osc.frequency.value = rate
  }

  if (!this.descriptor || this.descriptor.amp != descriptor.amp){
    var amp = descriptor.amp != null ? descriptor.amp : 1
    this._amp.gain.value = amp
  }

  this.descriptor = descriptor
}