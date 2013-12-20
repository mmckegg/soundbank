var Sound = require('./sound')
var ChangeStream = require('./lib/change_stream')

var applyStream = require('./lib/apply_stream')
var mergeInto = require('./lib/merge_into')

var loadSample = require('./lib/load_sample')

////////////////////////////////////////////////


module.exports = function(audioContext){

  var soundbank = audioContext.createGain()

  var activeSounds = ActiveList()
  var activeGroups = ActiveList()

  var sounds = {}

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

  soundbank.update = function(sound){
    Sound.prime(audioContext, sound)
    var currentSound = sounds[sound.id]
    if (currentSound){
      mergeInto(currentSound, sound)
    } else {
      sounds[sound.id] = sound
    }
    soundbank.emit('change', sounds[sound.id])
  }

  soundbank.getSounds = function(){
    return Object.keys(sounds).map(function(id){
      return sounds[id]
    })
  }

  soundbank.triggerOn = function(id, at){
    soundbank.choke(id, at)

    var sound = sounds[id]
    if (sound){
      var player = Sound(audioContext, sound, at)
      player.connect(soundbank)
      activeSounds.set(id, player, at)

      if (sound.chokeGroup){
        activeGroups.set(sound.chokeGroup, player, at)
      }
    }
  }

  soundbank.triggerOff = function(id, at){
    var player = activeSounds.get(id, at)
    if (player){
      player.stop(at)
    }
  }

  soundbank.choke = function(id, at){
    var player = activeSounds.get(id, at)
    if (player){
      player.choke(at)
    }

    // choke group
    var sound = sounds[id]
    var groupPlayer = sound && sound.chokeGroup && activeGroups.get(sound.chokeGroup, at)
    if (groupPlayer){
      groupPlayer.choke(at)
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

function ActiveList(){
  if (!(this instanceof ActiveList)) return new ActiveList()
  this.activeSounds = {}
}

ActiveList.prototype.set = function(id, sound, at) {
  var active = this.activeSounds[id] = (this.activeSounds[id] || [])
  var removeBefore = at - 4
  var trimAt = null

  if (active.length){
    for (var i=0;i<active.length;i++){

      if (active[i].at < removeBefore){
        trimAt = i
      }

      if (at > active[i].at && (!active[i+1] || at <= active[i+1].at) ){
        active.splice(i+1, 0, {at: at, sound: sound})
        break
      }
    }
  } else {
    active.push({at: at, sound: sound})
  }

  if (trimAt != null){
    console.log('trimming', id, trimAt)
    this.activeSounds[id] = active.slice(trimAt+1)
  }

  console.log(active)
}

ActiveList.prototype.get = function(id, at){
  var active = this.activeSounds[id] = (this.activeSounds[id] || [])
  for (var i=0;i<active.length;i++){
    if (at > active[i].at && (!active[i+1] || at <= active[i+1].at) ){
      return active[i].sound
    }
  }
  return null
}