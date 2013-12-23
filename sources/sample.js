var loadSample = require('../lib/load_sample')
var Envelope = require('../lib/envelope')

module.exports = Sample

function Sample(audioContext, descriptor, at){
  if (!(this instanceof Sample)) return new Sample(audioContext, descriptor, at)

  var sampleCache = audioContext.sampleCache || {}

  // load
  var player = audioContext.createBufferSource()
  if (sampleCache[descriptor.url] && sampleCache[descriptor.url] !== true){
    player.buffer = sampleCache[descriptor.url]
  }

  var baseRate = 1

  // sample trim
  var offset = descriptor.offset || [0,1]

  var start = offset[0] * player.buffer.duration
  var end = offset[1] * player.buffer.duration

  if (end < start){
    baseRate = -1
    start = offset[1] * player.buffer.duration
    end = offset[0] * player.buffer.duration
  }

  // loop
  if (descriptor.mode === 'loop'){
    player.loop = true
    player.loopStart = start
    player.loopEnd = end
  } else {
    player.maxLength = Math.min(player.buffer.duration, end - start) 
  }

  // transpose
  if (descriptor.transpose){
    var rateChange = Math.pow(2, descriptor.transpose / 12)
    player.playbackRate.value = rateChange * baseRate
    //player.maxLength = player.maxLength / rateChange
  }

  player.start(at, start, player.maxLength || player.buffer.duration)
  
  this.envelope = Envelope(audioContext, descriptor.envelope, at)
  player.connect(this.envelope)

  this.descriptor = descriptor
  this.player = player
  this.output = this.envelope
}

Sample.prototype.triggerOff = function(at){
  if (!this.stopped && this.descriptor.mode !== 'oneshot'){
    this.player.stop(at+this.envelope.release)
    this.envelope.stop(at)
    this.stopped = true
  }
}

Sample.prototype.choke = function(at){
  if (!this.stopped){
    this.player.stop(at+0.01)
    this.envelope.choke(at)
    this.stopped = true
  }
}

Sample.prototype.update = function(descriptor){
  this.envelope.update(descriptor.envelope)

  // update transpose
  if (descriptor.transpose !== this.descriptor.transpose){
    var rateChange = Math.pow(2, descriptor.transpose / 12)
    this.player.playbackRate.value = rateChange
  }

  var oldOffset = this.descriptor.offset || [0,1]
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
  this.output.connect(to)
}

Sample.prototype.disconnect = function(channel){
  this.output.disconnect(channel)
}

///
Sample.prime = function(audioContext, descriptor, cb){
  var sampleCache = audioContext.sampleCache = audioContext.sampleCache || {}
  if (sampleCache[descriptor.url]){
    cb&&cb()
  } else {
    sampleCache[descriptor.url] = true // mark to show loading
    loadSample(descriptor.url, audioContext, function(err, audioData){
      sampleCache[descriptor.url] = audioData
      cb&&cb()
    })
  }
}