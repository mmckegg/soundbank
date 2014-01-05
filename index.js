var Slot = require('./slot')
var ChangeStream = require('./lib/change_stream')
var ActiveList = require('./lib/active_list')
var SlotReferences = require('./lib/slot_references')

var applyStream = require('./lib/apply_stream')
var mergeInto = require('./lib/merge_into')
var xval = require('./lib/xval')
var scale = require('./lib/scale')
var chord = require('./lib/chord')

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
  var descriptors = {}
  var slotReferences = SlotReferences()

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
    descriptors[descriptor.id] = descriptor
    slotReferences.update(descriptor)
    refreshSlot(descriptor.id)
    soundbank.emit('change', descriptors[descriptor.id])
  }

  soundbank.getDescriptors = function(){
    return Object.keys(descriptors).map(function(id){
      return descriptors[id]
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
      activeGroups.remove(slot.chokeGroup, at)
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

  function refreshSlot(id, skip){
    var skip = skip || {}
    var descriptor = descriptors[id]
    var slot = slots[id]

    var context = Object.create(descriptor)
    context.int = parseInt
    context.get = getSlotDescriptor
    context.scale = scale
    context.chord = chord
    context.merge = merge
    context.write = soundbank.update

    try {
      descriptor = xval(descriptor, context)
    } catch (ex) {
      process.nextTick(function(){
        throw ex
      })
      return false
    }

    if (slot){ // update slot
      var oldDescriptor = slot.descriptor
      slot.update(descriptor)

      if (oldDescriptor.output != descriptor.output){
        setOutput(audioContext, slot, descriptor, slots)
      }

    } else { // create slot
      slot = slots[descriptor.id] = Slot(audioContext, descriptor)
      slot.connect(audioContext.destination)
      setOutput(audioContext, slot, descriptor, slots)
    }

    skip[id] = true

    slotReferences.lookup(id).forEach(function(sid){
      if (!skip[sid]){
        refreshSlot(sid, skip)
      }
    })

  }

  function getSlotDescriptor(id){
    return descriptors[id]
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

function merge(){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      Object.keys(obj).forEach(function(key){
        result[key] = obj[key]
      })
    }
  }
  return result
}