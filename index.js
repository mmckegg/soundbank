var Slot = require('audio-slot')
var ActiveList = require('./lib/active_list')
var SlotReferences = require('./lib/slot_references')

var createMeddler = require('audio-meddle')

var applyProviders = require('./lib/apply_providers')
var applyEmitter = require('./lib/apply_emitter')
var IAC = require('inheritable-audio-context')

////////////////////////////////////////////////


module.exports = function(audioContext){

  var soundbank = audioContext.createGain()

  var output = audioContext.createGain()
  var meddler = createMeddler(audioContext)

  meddler.connect(output)
  output.connect(soundbank)

  // turn the AudioNode into an EventEmitter
  applyEmitter(soundbank)

  var activeGroups = ActiveList()

  var slots = {}
  var descriptors = {}
  var slotReferences = SlotReferences()

  soundbank.update = function(descriptor){
    descriptors[descriptor.id] = descriptor
    refreshSlot(descriptor.id)
    slotReferences.lookup(descriptor.id).forEach(refreshSlot)
    soundbank.emit('change', descriptors[descriptor.id])
  }

  soundbank.getDescriptor = function(id){
    return descriptors[id] || {id: String(id)}
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

      if (slot.chokeGroup){
        activeGroups.set(slot.chokeGroup, slot, at)
      }

      slot.triggerOn(at)

      if (slot.descriptor.inputMode === 'meddler'){
        meddler.start(slot.descriptor.id, at)
      }

    }
  }

  soundbank.triggerOff = function(id, at){
    var slot = slots[id]
    if (slot){
      slot.triggerOff(at)
      meddler.stop(slot.descriptor.id, at)
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

  function refreshSlot(id){
    var descriptor = descriptors[id]
    var slot = slots[id]

    var context = IAC(audioContext, true)
    context.params = descriptor
    context.descriptors = descriptors
    context.slotReferences = []

    descriptor = applyProviders(context, descriptor)
    slotReferences.update(id, context.slotReferences)

    if (slot){ // update slot
      var oldDescriptor = slot.descriptor
      slot.update(descriptor)

      if (oldDescriptor.output != descriptor.output || oldDescriptor.inputMode != descriptor.inputMode){
        setOutput(audioContext, output, meddler, slot, descriptor, slots)
      }

    } else { // create slot
      slot = slots[descriptor.id] = Slot(audioContext, descriptor)
      meddler.add(descriptor.id, slot)
      slot.connect(output)
      setOutput(audioContext, output, meddler, slot, descriptor, slots)
    }

    // emit with providers
    soundbank.emit('refresh', descriptor)
  }

  function getSlotDescriptor(id){
    return descriptors[id]
  }

  return soundbank
}

function setOutput(audioContext, output, meddler, slot, descriptor, slots){
  slot.disconnect()
  if (descriptor.inputMode === 'meddler'){
    // do nothing, output will be patched on trigger
  } else if (!('output' in descriptor) || descriptor.output === true || descriptor.output == ''){
    slot.connect(output)
  } else if (descriptor.output) {
    if (descriptor.output === 'meddler'){
      slot.connect(meddler)
    } else {
      var destinationSlot = slots[descriptor.output]
      if (!destinationSlot){ // create destination slot
        destinationSlot = slots[descriptor.output] = Slot(audioContext, {})
        meddler.add(descriptor.output, destinationSlot)
        setOutput(audioContext, output, meddler, destinationSlot, {}, slots)
      }
      slot.connect(destinationSlot)
    }

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