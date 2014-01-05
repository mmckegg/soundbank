var test = require('tape')
var SlotReferences = require('../lib/slot_references')

test(function(t){
  var refs = SlotReferences()
  refs.update({id: 1, sources: {$: 'get(2).sources'}})
  t.deepEqual(refs.lookup(2), ["1"])

  refs.update({id: 1, sources: {$: 'get(3).sources'}})
  t.deepEqual(refs.lookup(2), [])
  t.deepEqual(refs.lookup(3), ["1"])

  refs.update({id: 2, sources: {$: 'get(3).sources'}})
  t.deepEqual(refs.lookup(3), ["1", "2"])

  refs.update({id: 1, sources: []})
  t.deepEqual(refs.lookup(3), ["2"])

  t.end()
})