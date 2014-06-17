# HTMLing

[Polymer](http://polymer-project.org/)'s HTML based templating syntax for node.js.
Render your templates server-side using the same syntax as in the browser, with no virtual DOM trickery required.


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




## License

MIT, see [LICENSE.md](./LICENSE.md).