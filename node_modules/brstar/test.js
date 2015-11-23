var brstar = require('./')
var test   = require('tape')
var path   = require('path')
var bl     = require('bl')
var fs     = require('fs')

var fixtures = {
    basic: __dirname + '/fixtures/basic.js'
  , dirname: __dirname + '/fixtures/dirname.js'
  , uppercase: __dirname + '/fixtures/uppercase.js'
}

test('brstar', function(t) {
  t.plan(4)

  fs.createReadStream(fixtures.basic)
    .pipe(brstar(fixtures.basic, {
      brstar: [ fixtures.uppercase ]
    }))
    .pipe(bl(function(err, contents) {
      t.ifError(err, 'no error')
      contents = String(contents)
      t.notEqual(
          contents.indexOf('HELLO WORLD')
        , -1
        , 'replaced with uppercase'
      )
    }))

  fs.createReadStream(fixtures.basic)
    .pipe(brstar(fixtures.basic))
    .pipe(bl(function(err, contents) {
      t.ifError(err, 'no error')
      contents = String(contents)
      t.equal(
          contents.indexOf('HELLO WORLD')
        , -1
        , 'did not replace when not specified in config'
      )
    }))
})

test('__dirname', function(t) {
  t.plan(3)

  fs.createReadStream(fixtures.dirname)
    .pipe(brstar(fixtures.dirname, {
      brstar: [ fixtures.uppercase ]
    }))
    .pipe(bl(function(err, contents) {
      t.ifError(err, 'no error')
      contents = String(contents)
      contents = contents.split(/\r\n|\n|\r/g)
        .slice(1)

      ucf = fixtures.dirname.toUpperCase()
      t.equal(contents[0], "'"+path.dirname(ucf)+"';")
      t.equal(contents[1], "'"+ucf+"';")
    }))
})
