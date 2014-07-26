soundbank
===

A collection of triggerable [Web Audio API](https://developer.mozilla.org/en-US/docs/Web_Audio_API) [audio slots](https://github.com/mmckegg/audio-slot), supporting audio routing, midi input and value providers.

For helping create grid based (launchpad/monome) sound launchers.

Used as the sound engine in [Loop Drop](https://github.com/mmckegg/loop-drop-app).

## Install

```bash
$ npm install soundbank
```

## API

```js
var Soundbank = require('soundbank')
```

### Soundbank(audioContext)

Returns a soundbank [AudioNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode) instance that can be connected to other AudioNodes.

### soundbank.update(descriptor)

Update the slot with the specified `descriptor.id` to match the specified params. Use this to add or update slots (to remove slot, just wipe out all of its attributes with `soundbank.update({id: 'SLOT_ID'})`)

### soundbank.triggerOn(id, at)

### soundbank.triggerOff(id, at)

### soundbank.choke(id, at)

### soundbank.getDescriptor(id)

Return the slot descriptor at specified `id`.

### soundbank.getDescriptors(

Returns an array of all slot descriptors.

## Example

```js
var Soundbank = require('soundbank')
var Bopper = require('bopper')

var audioContext = new AudioContext()

// choose your nodes:

audioContext.providers = {
  inherit: require('soundbank-inherit'),
  scale: require('soundbank-scale')
}

audioContext.sources = {
  oscillator: require('soundbank-oscillator'),
  sample: require('soundbank-sample')
}

audioContext.processors = {
  gain: audioContext.createGain.bind(audioContext),
  filter: audioContext.createBiquadFilter.bind(audioContext),
  delay: require('soundbank-delay'),
  dipper: require('soundbank-dipper'),
  overdrive: require('soundbank-overdrive')
}

audioContext.modulators = {
  lfo: require('lfo'),
  adsr: require('adsr')
}

// add a scheduler - required for 'lfo'
audioContext.scheduler = Bopper(audioContext)

// initialize soundbank
var soundbank = Soundbank(audioContext)
soundbank.connect(audioContext.destination)


// add some sounds to the slots
soundbank.update({
  id: "0",
  sources: [
    { node: "sample",
      mode: "oneshot",
      url: "kick.wav"
    },
    { node: "sample",
      mode: "oneshot",
      url: "kick.wav",
      transpose: -12,
      amp: {
        node: 'adsr',
        decay: 0.1,
        sustain: 0.3
      }
    },
  ],
  processors: [ 
    { node: "overdrive" } 
  ]
  gain: 1,
  output: "A",
})

// distribute an oscillator across a musical scale
soundbank.update({
  id: '5',
  offset: 0,
  sources: [
    { node: 'oscillator',
      shape: 'sawtooth',
      note: {
        node: 'scale',
        scale: 'major'
      }
    }
  ],
  processors: [
    { node: 'filter',
      type: 'lowpass',
      frequency: { 
        node: 'lfo',
        rate: 2, // synced to audioContext.scheduler
        shape: 'sine',
        sync: true,
        value: 1000,
        amp: 500
      }
    }
  ]
})
soundbank.update({
  id: '6',
  node: 'inherit',
  from: '5',
  offset: 1
})
soundbank.update({
  id: '7',
  node: 'inherit',
  from: '5',
  offset: 2
})

// now if any changes are made to the original slot, they will 
// also be applied to any slots that inherit from it
```