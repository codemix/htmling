# HTMLing

[![Build Status](https://travis-ci.org/codemix/htmling.svg?branch=master)](https://travis-ci.org/codemix/htmling)

[Polymer](http://polymer-project.org/) compatible HTML5 based templating syntax for node.js.
Render your templates server-side using the same syntax as in the browser, with no virtual DOM trickery required.

For a full demonstration, please see [htmling-demo-app](https://github.com/codemix/htmling-demo-app).

## Installation

via [npm](https://npmjs.org/package/htmling)

```
npm install htmling
```

## Example

Turns this:

```html
<!doctype html>
<html>
  <head>
    <title>{{title}}</title>
    <meta name="description" content="{{description}}">
  </head>
  <body>
    <h1>{{title}}</h1>
    <ul>
    <template repeat="{{user in users}}">
      <li>{{user.name}}</li>
    </template>
    </ul>
  </body>
</html>
```

plus this:

```json
{
  "title": "User List",
  "description": "A list of users",
  "users": [
    {
      "name": "Alice"
    },
    {
      "name": "George"
    }
  ]
}
```

into this:

```html
<!doctype html>
<html>
  <head>
    <title>User List</title>
    <meta name="description" content="A list of users">
  </head>
  <body>
    <h1>User List</h1>
    <ul>
      <li>Alice</li>
      <li>George</li>
    </ul>
  </body>
</html>
```



## How it works

Unlike similar libraries, HTMLing does not require a virtual DOM such as jsDOM. Instead, HTMLing
parses `.html` files and transforms them into very efficient executable JavaScript functions.
It uses a [parser](./src/parser.pegjs) written in [PEG.js](https://github.com/dmajda/pegjs) which emits a standard [Mozilla Parser API](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API) [AST](http://en.wikipedia.org/wiki/Abstract_syntax_tree) with some custom node types. The [compiler](./lib/compiler.js) then uses [estraverse](https://github.com/Constellation/estraverse) to convert these custom node types to standard JavaScript expressions. Finally, the result is passed to [escodegen](https://github.com/Constellation/escodegen) which converts the AST into executable JavaScript.

This compilation process happens only once, and the resulting JavaScript is extremely efficient.


## Usage

HTMLing is easy to integrate with your existing build process, either via the command line or library interfaces.

## CLI

HTMLing ships with a small command line interface:

### Compile an individual file
The compiled output will be written to STDOUT

```
htmling ./file.html
```


### Compile an individual file to a destination
The compiled output will be written to `compiled.js`.

```
htmling -o ./compiled.js ./file.html
```

### Compile a directory hierarchy
Compile a nested directory structure to a directory called `compiled`. The output
directory will be created if it does not already exist, and the resulting folder structure will
match that of the input.

```
htmling -o ./compiled ./pages
```

### Compile a directory hierarchy to a single file
Compile a nested directory structure to a single called `compiled.js`

```
htmling -c -o ./compiled.js ./pages
```


## As a Library

It's also possible to use HTMLing as a library:

### Compile a string

```js
var HTMLing = require('htmling');

var template = HTMLing.string('Hello {{name}}');

console.log(template.render({name: 'Charles'})); // "Hello Charles"
```

### Compile a file

```js
var template = HTMLing.file('./index.html');
console.log(template.render());
```

### Compile a directory

```js
var templates = HTMLing.dir('./pages');
console.log(templates.render('index.html', {}))
```

### Using as an express view engine

HTMLing has support for [express.js](http://expressjs.com/).

```js
var HTMLing = require('htmling');
app.configure(function(){
  app.engine('html', HTMLing.express(__dirname + '/views/'));
  app.set('view engine', 'html');
});
```

In development mode, you'll probably want to enable the `watch` option. This will reload your
templates when they change on disk:

```js
var HTMLing = require('htmling');
app.configure(function(){
  app.engine('html', HTMLing.express(__dirname + '/views/', {watch: true}));
  app.set('view engine', 'html');
});
```

## License

MIT, see [LICENSE.md](./LICENSE.md).

## Docker environment

All you need is [Docker](https://www.docker.com/) with `docker-compose` available from your terminal.


We have a fancy shortcut to get your application up and running, and you also get access to the container terminal:

```console
$ make build
$ make run
```

From this point, it's just a matter of starting the application from within the container shell:

```console
htmling:~/app(master)$ npm test
```

#### Other fancy shortcuts we have for Docker fans

* `$ make in` to open a new container terminal
* `$ make stop` to stop all containers
* `$ make clean` to clean the Docker environment
