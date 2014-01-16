var Modulators = require('../lib/modulators')

module.exports = Filter

function Filter(audioContext, descriptor){
  if (!(this instanceof Filter)){
    return new Filter(audioContext, descriptor)
  }
  this.context = audioContext
  this._modulators = Modulators(audioContext)
  this._filter = audioContext.createBiquadFilter()
  this.output = this._filter
  this.input = this._filter
  this.update(descriptor)
  this._modulators.start(0)
}

Filter.prototype.sync = function(at){
  this._modulators.sync(at)
}

Filter.prototype.connect = function(to){
  this.output.connect(to)
}

Filter.prototype.disconnect = function(){
  this.output.disconnect()
}

Filter.prototype.destroy = function(){
  this.disconnect()
  this._modulators.stop(0)
}

Filter.prototype.update = function(descriptor){
  if (!this.descriptor || descriptor.kind != this.descriptor.kind){
    this._filter.type = descriptor.kind || 'lowpass'
  }

  if (!this.descriptor || descriptor.frequency != this.descriptor.frequency){
    this._modulators.apply(this._filter.frequency, descriptor.frequency, 350)
  }

  if (!this.descriptor || descriptor.Q != this.descriptor.Q){
    this._modulators.apply(this._filter.Q, descriptor.Q, 0)
  }

  this.descriptor = descriptor
}