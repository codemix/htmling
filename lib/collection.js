'use strict';

var Classing = require('classing');

module.exports = Classing.create('Collection', {
  items: {
    default: function () {
      return {};
    }
  },
  configure: function (items) {
    var keys = Object.keys(items),
        total = keys.length,
        key, i;
    for (i = 0; i < total; i++) {
      key = keys[i];
      items[key].layouts = this;
      this.items[key] = items[key];
    }
    return this;
  },
  get: function (name) {
    return this.items[name];
  },
  set: function (name, value) {
    if (name && typeof name === 'object') {
      this.configure(name);
    }
    else {
      value.layouts = this;
      this.items[name] = value;
    }
    return this;
  },
  render: function (name, object, content) {
    var template = this.get(name);
    if (!template) {
      throw new Error('Cannot render missing template: ' + name);
    }
    object = object || {};
    return template.render(object, content);
  },
  size: {
    get: function () {
      return Object.keys(this.items);
    }
  },
  forEach: function (fn, thisContext) {
    var keys = Object.keys(this.items),
        total = keys.length,
        key, i;

    for (i = 0; i < total; i++) {
      key = keys[i];
      fn.call(thisContext || this, this.items[key], key, this.items);
    }
  },
  toString: function () {
    var keys = Object.keys(this.items),
        total = keys.length,
        content = [],
        safeName, key, i;

    for (i = 0; i < total; i++) {
      key = keys[i];
      safeName = JSON.stringify(this.items[key].name);
      content.push("collection.add(" + safeName + ", new Template(function (module) {\n" +
        "  var exports = module.exports;\n" +
        indent(this.items[key].toString()) +
        "  return module.exports;\n" +
        "}({exports: {}})));");
    }

    return "'use strict';\n\n" +
           "var HTMLing = require('htmling'),\n" +
           "    Template = HTMLing.Template,\n" +
           "    Collection = HTMLing.Collection;\n " +
           "\n" +
           "module.exports = new Collection();\n" +
           "\n" + content.join('\n\n');
  }
});


function indent (content) {
  return "  " + content.split(/\n/g).join("\n  ") + "\n";
}