# brstar [![Flattr this!](https://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=hughskennedy&url=http://github.com/hughsk/brstar&title=brstar&description=hughsk/brstar%20on%20GitHub&language=en_GB&tags=flattr,github,javascript&category=software)[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges) #

[Browserify](http://browserify.org/) transform to preprocess static input
brfs-style with your own modules.

For example, take this browserifiable module:

``` javascript
var preprocess = require('./preprocess')
var insertCSS = require('insert-css')
var fs = require('fs')

var styles = preprocess(
  fs.readFileSync(__dirname + '/style.css', 'utf8')
)

if (process.browser) {
  insertCSS(styles)
} else {
  console.log(styles)
}
```

And your CSS preprocessing step:

``` javascript
var autoprefixer = require('autoprefixer')('last 2 versions')

module.exports = function(css) {
  return autoprefixer.process(css).css
}
```

You can bundle it up, and calculate the preprocessing step during the build, and
keep it out of your client-side code!

``` bash
browserify ./index.js -t brfs -t brstar
```

The benefit here is that it makes it easy to write transform steps such as this
while keeping your code node-friendly: you can run the above bundle in node and
get the same output.

## Usage ##

[![brstar](https://nodei.co/npm/brstar.png?mini=true)](https://nodei.co/npm/brstar)

To use `brstar` as a browserify transform:

``` bash
$ browserify -t brstar ./index.js
```

To enable inlining for a module, simply specify it in your `package.json` file
under the `brstar` array:

``` json
{
  "name": "my-app",
  "version": "0.0.0",
  "browserify": {
    "transform": ["brstar"]
  },
  "brstar": [
    "./preprocess.js"
  ]
}
```

## Gotchas ##

Currently no explicit support for source maps, and likely to modify the
formatting of transformed modules. Pull requests are welcome to fix these issues
:)

## License ##

MIT. See [LICENSE.md](http://github.com/hughsk/brstar/blob/master/LICENSE.md) for details.
