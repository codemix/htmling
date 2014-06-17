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
  },
  render: function (name, object, content) {
    var template = this.get(name);
    if (!template) {
      throw new Error('Cannot render missing template: ' + name);
    }
    object = object || {};
    return template.render(object, content);
  }
});
