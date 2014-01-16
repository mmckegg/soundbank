var loadSample = require('../lib/load_sample')
var Modulators = require('../lib/modulators')

module.exports = Sample

function Sample(audioContext, descriptor, at){
  if (!(this instanceof Sample)) return new Sample(audioContext, descriptor, at)


  var sampleCache = audioContext.sampleCache || {}
  if (!sampleCache[descriptor.url] || Array.isArray(sampleCache[descriptor.url])){
    this.descriptor = descriptor
    this.stopped = true
    return false
  }

  // load
  this.player = audioContext.createBufferSource()
  this.player.buffer = sampleCache[descriptor.url]

  this._modulators = Modulators(audioContext)
  this._amp = audioContext.createGain()
  this.player.connect(this._amp)
  this.output = this._amp

  this.update(descriptor)

  // sample trim
  var offset = descriptor.offset || [0,1]
  var start = offset[0] * this.player.buffer.duration
  var end = offset[1] * this.player.buffer.duration

  var baseRate = 1
  if (end < start){
    baseRate = -1
    start = offset[1] * this.player.buffer.duration
    end = offset[0] * this.player.buffer.duration
  }

  if (descriptor.mode === 'loop'){
    this.player.loop = true
    this.player.loopStart = start
    this.player.loopEnd = end
  } else {
    this.player.maxLength = Math.min(this.player.buffer.duration, end - start) 
    this.player.loop = false
  }

  this.player.start(at, start, this.player.maxLength || this.player.buffer.duration)
  this._modulators.start(at)
}

Sample.prototype.triggerOff = function(at){
  if (!this.stopped && this.descriptor.mode !== 'oneshot'){
    if (!this.stopped){
      this.player.stop(this._modulators.stop(at))
      this.stopped = true
      return true
    }
  }
}

Sample.prototype.choke = function(at){
  if (!this.stopped){
    this.player.stop(this._modulators.choke(at))
    this.stopped = true
    return true
  }
}

Sample.prototype.update = function(descriptor){
  if (!this.player){
    return false
  }

  if (!this.descriptor || descriptor.speed !== this.descriptor.speed || descriptor.transpose !== this.descriptor.transpose){
    var rateChange = Math.pow(2, descriptor.transpose / 12)
    this._modulators.apply(this.player.playbackRate, descriptor.speed, rateChange)
  }

  if (!this.descriptor || descriptor.amp !== this.descriptor.amp){
    this._modulators.apply(this._amp.gain, descriptor.amp, 0.6)
  }

  var oldOffset = this.descriptor && this.descriptor.offset || [0,1]
  var newOffset = descriptor.offset || [0,1]

  if (oldOffset[0] != newOffset[0] && descriptor.mode === 'loop'){
    this.player.loopStart = newOffset[0] * this.player.buffer.duration
  }

  if (oldOffset[1] != newOffset[1] && descriptor.mode === 'loop'){
    this.player.loopEnd = newOffset[1] * this.player.buffer.duration
  }

  this.descriptor = descriptor
}

Sample.prototype.connect = function(to){
  this.output && this.output.connect(to)
}

Sample.prototype.disconnect = function(channel){
  this.output && this.output.disconnect(channel)
}

///
Sample.prime = function(audioContext, descriptor, cb){
  audioContext.loadSample(descriptor.url, cb)
}