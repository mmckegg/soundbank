module.exports = ADSR

function ADSR(audioContext, descriptor, target){
  if (!(this instanceof ADSR)){
    return new ADSR(audioContext, descriptor, target)
  }
  this.context = audioContext
  this.descriptor = descriptor
  this._sustainFrom = null
  this.target = target
}

ADSR.prototype.start = function(at){
  var multiplier = valueOrDefault(this.descriptor.value, 1)
  var attack = valueOrDefault(this.descriptor.attack, 0)
  var decay = valueOrDefault(this.descriptor.decay, 0)
  var sustain = valueOrDefault(this.descriptor.sustain, 1)
  this.target.setValueAtTime(0, at)
  this.target.linearRampToValueAtTime(multiplier, at+attack)
  this.target.linearRampToValueAtTime(sustain * multiplier, at+attack+decay)
  this._sustainFrom = at+attack+decay
}

ADSR.prototype.stop = function(at){
  var multiplier = valueOrDefault(this.descriptor.value, 1)
  var release = valueOrDefault(this.descriptor.release, 0)
  var sustain = valueOrDefault(this.descriptor.sustain, 1)
  if (this.target){
    if (at >= this._sustainFrom){
      this.target.setValueAtTime(sustain*multiplier, at)
    }
    this.target.linearRampToValueAtTime(0, at+release)
    this.target = null
    return at+release
  }
}

ADSR.prototype.disconnect = function(){
  if (this.target){
    this.target.cancelScheduledValues(0)
    this.target = null
  }
}

ADSR.prototype.update = function(descriptor){
  if (!this.descriptor || descriptor.sustain != this.descriptor.sustain){
    var multiplier = valueOrDefault(this.descriptor.value, 1)
    var sustain = valueOrDefault(descriptor.sustain, 1)

    if (this.target && this._sustainFrom && this.context.currentTime >= this._sustainFrom){
      this.target.setValueAtTime(sustain*multiplier, this.context.currentTime)
    }
  }
  this.descriptor = descriptor
}

function valueOrDefault(value, defaultValue){
  return value != null ? value : defaultValue
}