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