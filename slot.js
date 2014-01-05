var ActiveList = require('./lib/active_list')

module.exports = Slot

function Slot(audioContext, descriptor){
  if (!(this instanceof Slot)) return new Slot(audioContext, descriptor)

  this.input = audioContext.createGain()
  this.output = audioContext.createGain()

  this.context = audioContext
  this.descriptor = {}

  var _ = this._private = {
    pre: audioContext.createGain(),
    post: audioContext.createGain(),
    flow: audioContext.createGain(),
    bypass: audioContext.createGain(),
    processors: [],
    isOn: false,
    active: ActiveList()
  }

  this.input.connect(_.flow)
  this.input.connect(_.bypass)

  // passthru effect
  _.pre.connect(_.post)
  _.post.connect(this.output)

  _.flow.gain.value = 1
  _.bypass.gain.value = 0

  _.flow.connect(_.pre)
  _.bypass.connect(this.output)

  this.update(descriptor)
}

Slot.prototype.update = function(descriptor){
  var sources = this.context.sources
  var active = this._private.active.get(0, this.context.currentTime)
  if (active){
    for (var i=0;i<active.length;i++){
      var type = descriptor.sources && descriptor.sources[i] && descriptor.sources[i].type
      var ctor = type && sources && sources[type]
      if (ctor && active[i] instanceof ctor){
        active[i].update(descriptor.sources[i])
      }
    }
  }

  this.chokeGroup = descriptor.chokeGroup

  if (descriptor.gain != this.descriptor.gain){
    this._private.pre.gain.value = descriptor.gain
  }

  if (descriptor.volume != this.descriptor.volume){
    this._private.post.gain.value = descriptor.volume
  }

  if (descriptor.sources && descriptor.sources.length){
    for (var i=0;i<descriptor.sources.length;i++){
      var type = descriptor.sources && descriptor.sources[i] && descriptor.sources[i].type
      var ctor = type && sources && sources[type]
      if (ctor && ctor.prime){
        ctor.prime(this.context, descriptor.sources[i])
      }
    }
  }

  updateProcessors(this, descriptor.processors || [], this.descriptor.processors || [])
  updateInput(this, descriptor)

  this.descriptor = descriptor
}

Slot.prototype.triggerOn = function(at){

  var players = []
  var descriptors = this.descriptor.sources || []
  var sources = this.context.sources || []
  for (var i=0;i<descriptors.length;i++){
    var descriptor = descriptors[i]
    if (sources[descriptor.type]){
      var player = sources[descriptor.type](this.context, descriptor, at)
      player.connect(this._private.pre)
      players.push(player)
    }
  }

  this._private.active.set(0, players, at)

  triggerInput(this, at, true)
}

Slot.prototype.triggerOff = function(at){
  var active = this._private.active.get(0, at)
  if (active){
    for (var i=0;i<active.length;i++){
      active[i].triggerOff(at)
    }
  }
  triggerInput(this, at, false)
}

Slot.prototype.choke = function(at){
  var active = this._private.active.get(0, at)
  if (active){
    for (var i=0;i<active.length;i++){
      active[i].choke(at)
    }
  }
}

Slot.prototype.connect = function(to){
  this.output.connect(to)
}

Slot.prototype.disconnect = function(channel){
  this.output.disconnect(channel)
}

//////// INPUT CONTROL ////////////

function triggerInput(slot, at, value){
  var _ = slot._private
  _.isOn = value

  var mode = slot.descriptor.inputMode

  var onValue = value ? 1 : 0
  var offValue = value ? 0 : 1

  if (mode === 'holdOn'){
    _.flow.gain.setValueAtTime(onValue, at)
  } else if (mode === 'holdOff'){
    _.flow.gain.setValueAtTime(offValue, at)
  } else if (mode === 'bypassOn'){
    _.flow.gain.setValueAtTime(onValue, at)
    _.bypass.gain.setValueAtTime(offValue, at)
  } else if (mode === 'bypassOff'){
    _.flow.gain.setValueAtTime(offValue, at)
    _.bypass.gain.setValueAtTime(onValue, at)
  }
}

function updateInput(slot, descriptor){
  var _ = slot._private

  var oldMode = 'inputMode' in slot.descriptor ? slot.descriptor.inputMode : 'on'
  var newMode = 'inputMode' in descriptor ? descriptor.inputMode : 'on'

  if (oldMode != newMode){
    _.flow.gain.cancelScheduledValues(slot.context.currentTime)
    _.bypass.gain.cancelScheduledValues(slot.context.currentTime)

    if (newMode === 'on'){
      _.flow.gain.value = 1
      _.bypass.gain.value = 0
    } else if (newMode === 'bypass'){
      _.flow.gain.value = 0
      _.bypass.gain.value = 1
    } else if (newMode === 'holdOn'){
      _.flow.gain.value = _.isOn ? 1 : 0
      _.bypass.gain.value = 0
    } else if (newMode === 'holdOff'){
      _.flow.gain.value = _.isOn ? 0 : 1
      _.bypass.gain.value = 0
    } else if (newMode === 'bypassOn'){
      _.flow.gain.value = _.isOn ? 1 : 0
      _.bypass.gain.value = _.isOn ? 0 : 1
    } else if (newMode === 'bypassOff'){
      _.flow.gain.value = _.isOn ? 0 : 1
      _.bypass.gain.value = _.isOn ? 1 : 0
    } else {
      _.flow.gain.value = 0
      _.bypass.gain.value = 0
    }

  }
}

///// PROCESSORS /////

function updateProcessors(slot, descriptors){
  var processors = slot._private.processors
  var length = Math.max(descriptors.length, processors.length)
  var reconnect = []

  var pre = slot._private.pre
  var post = slot._private.post

  for (var i=0;i<length;i++){
    var processor = processors[i]
    var descriptor = descriptors[i]
    var ctor = descriptor && slot.context.processors && slot.context.processors[descriptor.type]

    if (processor && descriptor && processor instanceof ctor){ // update
      processor.update(descriptor)
    } else if (processor && !descriptor){ // remove
      reconnect.push(i)
      processor.disconnect()
    } else if (ctor) { // add / replace
      reconnect.push(i)
      if (processor) processor.disconnect()
      processors[i] = ctor(slot.context, descriptor)
    }
  }

  for (var p=0;p<reconnect.length;p++){
    var i = reconnect[p]
    var processor = processors[i]
    var prevProcessor = processors[i-1] || pre
    var nextProcessor = processors[i+1] || post

    var reconnectingNext = ~reconnect.indexOf(i+1)

    prevProcessor.disconnect()
    prevProcessor.connect(processor.input)

    if (!reconnectingNext){
      processor.disconnect()
      processor.connect(nextProcessor.input || nextProcessor)
    }
  }

  if (!descriptors.length && processors.length){
    pre.disconnect()
    pre.connect(post)
  }

}