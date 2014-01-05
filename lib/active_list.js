module.exports = ActiveList

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
    this.activeSounds[id] = active.slice(trimAt+1)
  }

}

ActiveList.prototype.get = function(id, at){
  var res = get(this.activeSounds, id, at)
  return res && res.sound || null
}


ActiveList.prototype.getAll = function(id, at){
  var res = get(this.activeSounds, id, at)
  return res && res.sound || null
}

ActiveList.prototype.getAll = function(id, at){
  var res = getAll(this.activeSounds, id, at)
  return res.map(getSound)
}

ActiveList.prototype.remove = function(id, at){
  var res = getAll(this.activeSounds, id, at)
  var items = res.map(getSound)
  for (var i=0;i<items.length;i++){
    var index = this.activeSounds[id].indexOf(items[i])
    if (~index){
      this.activeSounds[id].splice(index, 1)
    }
  }
}

function get(sounds, id, at){
  var active = sounds[id] = (sounds[id] || [])
  for (var i=0;i<active.length;i++){
    if (at > active[i].at && (!active[i+1] || at <= active[i+1].at) ){
      return active[i]
    }
  }
  return null
}

function getAll(sounds, id, at){
  var active = sounds[id] = (sounds[id] || [])
  var result = []
  for (var i=0;i<active.length;i++){
    if (at > active[i].at){
      result.push(active[i])
    }
  }
  return result
}

function getSound(thing){
  return thing && thing.sound
}