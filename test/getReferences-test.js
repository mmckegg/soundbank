var test = require('tape')
var getReferences = require('../lib/get_references')

test(function(t){
  var obj = {
    test: {$: "get(1)"}, 
    ary: [ {$: "get(2)"} ]
  }

  t.deepEqual(getReferences(obj), [1, 2])
  t.end()
})