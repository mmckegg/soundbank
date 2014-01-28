module.exports = ADSR

function ADSR(audioContext, descriptor, target){
  if (!(this instanceof ADSR)){
    return new ADSR(audioContext, descriptor, target)
  }
  this.context = audioContext

  this.update(descriptor)
  this._sustainFrom = null
  this.target = target
}

ADSR.prototype.sync = function(at){
  this.target.cancelScheduledValues(at)
  this.start(at)
}

ADSR.prototype.start = function(at){
  var multiplier = valueOrDefault(this.descriptor.value, 1)
  var attack = valueOrDefault(this.descriptor.attack, 0)
  var decay = valueOrDefault(this.descriptor.decay, 0)
  var sustain = valueOrDefault(this.descriptor.sustain, 1)
  this.target.setValueAtTime(this._start, at)
  this.target.linearRampToValueAtTime(multiplier, at+attack)
  this.target.linearRampToValueAtTime(sustain * multiplier, at+attack+decay)
  this._sustainFrom = at+attack+decay
}

ADSR.prototype.stop = function(at){
  var multiplier = valueOrDefault(this.descriptor.value, 1)
  var release = valueOrDefault(this.descriptor.release, 0)
  var sustain = valueOrDefault(this.descriptor.sustain, 1)
  if (this.target){
    if (release){
      if (at >= this._sustainFrom){
        this.target.setValueAtTime(sustain*multiplier, at)
      }
      this.target.linearRampToValueAtTime(this._end, at+release)
    }
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

  if (!this.descriptor || descriptor.start != this.descriptor.start){
    this._start = descriptor.start || 0
  }

  if (!this.descriptor || descriptor.end != this.descriptor.end){
    this._end = descriptor.end || 0
  }

  if (!this.descriptor || descriptor.sustain != this.descriptor.sustain){
    var multiplier = valueOrDefault(descriptor.value, 1)
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