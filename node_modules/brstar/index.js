var debug     = require('debug')('brstar')
var escodegen = require('escodegen')
var sEval     = require('static-eval')
var replace   = require('replace-method')
var parents   = require('ast-parents')
var through   = require('through')
var esprima   = require('esprima')
var resolve   = require('resolve')
var Emitter   = require('events/')
var findup    = require('findup')
var sleuth    = require('sleuth')
var astw      = require('astw')
var path      = require('path')
var fs        = require('fs')

var dirnameData = '__dirname_data__'
var brstarData = '__brstar_data__'
var pkgPending = {}
var pkgCache = {}
var parseOpt = {
    comment: true
  , range: true
  , loc: true
}

module.exports = function(file, config) {
  var pkgDir = path.dirname(file)
  var replaceCount = 0
  var dirname = pkgDir
  var buffer = []

  var extras = [].concat(
    config && config.brstar || []
  ).map(function(file) {
    return resolve.sync(file, {
      basedir: dirname
    })
  })

  debug('creating transform: %s', file)

  return through(function(d) {
    buffer.push(d)
  }, function() {
    var stream = this
    var src = buffer.join('')

    if (!/require/.test(src)) {
      stream.queue(src)
      stream.queue(null)
      return
    }

    var ast = esprima.parse(src, parseOpt)
    var fns = sleuth(ast)
    var walker = astw(ast)

    parents(ast)

    debug('getting package.json: %s', file)
    getPkg(pkgDir, function(err, pkg) {
      if (err) return stream.emit('error', err)

      debug('found package.json: ' + !!pkg)
      pkgDir = pkg[dirnameData]

      if (!pkg[brstarData]) {
        pkg[brstarData] = [].concat(pkg.brstar || [])
        pkg[brstarData] = pkg[brstarData].map(function(file) {
          return resolve.sync(file, {
            basedir: dirname
          })
        })
      }

      var brstars = pkg[brstarData].concat(extras)
      var replacer = replace(ast)

      replaceDirect(brstars, replacer)
      replaceRequired(fns, brstars, replacer)

      stream.queue(replaceCount
        ? escodegen.generate(ast)
        : src
      )
      
      stream.queue(null)
    })
  })

  // x = require('x'); x('string')
  function replaceRequired(fns, brstars, replacer) {
    var keys = Object.keys(fns)
    if (!keys.length) return

    keys.forEach(function(name) {
      var source = fns[name]

      source = resolve.sync(source, {
        basedir: dirname
      })

      if (!source) return
      var index = brstars.indexOf(source)
      if (index === -1) return

      replacer([name], function(node) {
        if (!node.arguments.length) return
        var value = evaluate(node.arguments[0])
        if (!value) return

        value = require(source)(value)
        debug('replacing for: %s = %s', name, source)
        replaceCount += 1
        hijack(node, value)
      })
    })
  }

  // require('x')('string')
  function replaceDirect(brstars, replacer) {
    replacer(['require'], function(node) {
      var caller = node.parent
      if (!node.arguments.length) return
      if (!caller.arguments) return
      if (!caller.arguments.length) return
      var value = evaluate(caller.arguments[0])
      if (!value) return
      var source = evaluate(node.arguments[0])
      if (!source) return

      source = resolve.sync(source, {
        basedir: dirname
      })

      var index = brstars.indexOf(source)
      if (index === -1) return

      value = require(source)(value)
      replaceCount += 1
      hijack(caller, value)
    })
  }

  function evaluate(ast) {
    return sEval(ast, {
        __dirname: path.dirname(file)
      , __filename: file
    })
  }
}

function getPkg(dir, done) {
  dir = path.resolve(dir)

  if (pkgCache[dir]) {
    debug('loading package.json from cache: %s', dir)
    return done(null, pkgCache[dir])
  }

  if (pkgPending[dir]) {
    debug('waiting for cache: %s', dir)
    return pkgPending[dir].once('ready', function() {
      debug('cache hit: %s', dir)
      if (!pkgPending[dir].listeners().length) {
        delete pkgPending[dir]
      }

      done(null, pkgCache[dir])
    })
  }

  var pending = pkgPending[dir] = new Emitter

  findup(dir, 'package.json', function(err, pkgDir) {
    if (err) return done(err)
    var pkg = path.join(pkgDir, 'package.json')

    fs.readFile(pkg, 'utf8', function(err, json) {
      if (err) return done(err)

      try {
        json = JSON.parse(json)
      } catch(e) {
        return done(e)
      }

      json[dirnameData] = pkgDir
      pkgCache[dir] = json

      done(null, json)
      pending.emit('ready')
    })
  })
}

function hijack(node, value) {
  if (typeof value === 'undefined') return
  if (typeof value === 'function') throw new Error(
    'Mapped value from "'+source+'" may not be a function'
  )

  if (typeof value !== 'object') {
    node.type = 'Literal'
    node.value = value
    return
  }

  value = esprima.parse(
    '('+JSON.stringify(value)+')'
  ) .body[0]
    .expression

  Object.keys(value).forEach(function(key) {
    node[key] = value[key]
  })

  return node
}
