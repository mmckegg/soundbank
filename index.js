var Slot = require('./slot')
var ChangeStream = require('./lib/change_stream')
var ActiveList = require('./lib/active_list')
var SlotReferences = require('./lib/slot_references')

var applyStream = require('./lib/apply_stream')
var applyProviders = require('./lib/apply_providers')

////////////////////////////////////////////////


module.exports = function(audioContext){

  if (!audioContext.sources){
    audioContext.sources = {}
  }

  if (!audioContext.processors){
    audioContext.processors = {}
  }

  if (!audioContext.modulators){
    audioContext.modulators = {}
  }

  if (!audioContext.providers){
    audioContext.providers = {}
  }

  audioContext.sources['oscillator'] = require('./sources/oscillator')
  audioContext.sources['sample'] = require('./sources/sample')
  audioContext.processors['overdrive'] = require('./processors/overdrive')
  audioContext.processors['delay'] = require('./processors/delay')
  audioContext.processors['filter'] = require('./processors/filter')

  audioContext.modulators['adsr'] = require('./modulators/adsr')
  audioContext.modulators['lfo'] = require('./modulators/lfo')

  audioContext.providers['scale'] = require('./providers/scale')
  audioContext.providers['inherit'] = require('./providers/inherit')
  audioContext.providers['chord'] = require('./providers/chord')
  audioContext.providers['multi'] = require('./providers/multi')
  audioContext.providers['param'] = require('./providers/param')
  audioContext.providers['slice'] = require('./providers/slice')

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

  function refreshSlot(id){
    var descriptor = descriptors[id]
    var slot = slots[id]

    var context = Object.create(audioContext)
    context.params = descriptor
    context.descriptors = descriptors
    context.slotReferences = []

    descriptor = applyProviders(context, descriptor)
    slotReferences.update(id, context.slotReferences)

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