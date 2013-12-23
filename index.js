var Slot = require('./slot')
var ChangeStream = require('./lib/change_stream')
var ActiveList = require('./lib/active_list')

var applyStream = require('./lib/apply_stream')
var mergeInto = require('./lib/merge_into')

var loadSample = require('./lib/load_sample')

////////////////////////////////////////////////


module.exports = function(audioContext){

  if (!audioContext.sources){
    audioContext.sources = {}
  }

  if (!audioContext.processors){
    audioContext.processors = {}
  }

  audioContext.sources['oscillator'] = require('./sources/oscillator')
  audioContext.sources['sample'] = require('./sources/sample')
  audioContext.processors['overdrive'] = require('./processors/overdrive')
  audioContext.processors['delay'] = require('./processors/delay')


  var soundbank = audioContext.createGain()

  var activeGroups = ActiveList()

  var slots = {}

  applyStream(soundbank, function(event){

    if (Array.isArray(event)){
      event = { // schedule event for immediate playback if not already scheduled
        time: audioContext.currentTime,
        data: event
      }
    }

    if (event.data[2]){
      soundbank.triggerOn(event.data[1], event.time)
    } else {
      soundbank.triggerOff(event.data[1], event.time)
    }

    this.queue(event)
  })

  soundbank.getChangeStream = function(){
    return ChangeStream(soundbank)
  }

  soundbank.update = function(descriptor){
    var oldDescriptor = {}
    var slot = slots[descriptor.id]

    if (slot){ // update slot
      oldDescriptor = slot.descriptor
      slot.update(descriptor)

      if (oldDescriptor.output != descriptor.output){
        setOutput(audioContext, slot, descriptor, slots)
      }

    } else { // create slot
      slot = slots[descriptor.id] = Slot(audioContext, descriptor)
      slot.connect(audioContext.destination)
      setOutput(audioContext, slot, descriptor, slots)
    }

    soundbank.emit('change', descriptor)
  }

  soundbank.getDescriptors = function(){
    return Object.keys(slots).map(function(id){
      return slots[id].descriptor
    })
  }

  soundbank.triggerOn = function(id, at){
    soundbank.choke(id, at)

    var slot = slots[id]
    if (slot){
      slot.triggerOn(at)

      if (slot.chokeGroup){
        activeGroups.set(slot.chokeGroup, slot, at)
      }
    }
  }

  soundbank.triggerOff = function(id, at){
    var slot = slots[id]
    if (slot){
      slot.triggerOff(at)
    }
  }

  soundbank.choke = function(id, at){
    var slot = slots[id]
    if (slot){
      slot.choke(at)
    }
    // choke group
    var groupSlot = slot && slot.chokeGroup && activeGroups.get(slot.chokeGroup, at)
    if (groupSlot){
      groupSlot.choke(at)
    }
  }

  soundbank.loadSample = function(url, cb){
    var sampleCache = audioContext.sampleCache = audioContext.sampleCache || {}
    loadSample(url, audioContext, function(err, audioData){
      sampleCache[url] = audioData
      cb&&cb(err, audioData)
    })
  }

  return soundbank
}

function setOutput(audioContext, slot, descriptor, slots){
  slot.disconnect()
  if (!('output' in descriptor) || descriptor.output === true){
    slot.connect(audioContext.destination)
  } else if (descriptor.output) {
    var destinationSlot = slots[descriptor.output]
    if (!destinationSlot){ // create destination slot
      destinationSlot = slots[descriptor.output] = Slot(audioContext, {})
      setOutput(audioContext, destinationSlot, {}, slots)
    }
    slot.connect(destinationSlot.input)
  }
}