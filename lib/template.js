'use strict';

var Classing = require('classing'),
    path = require('path');

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
};

module.exports = Classing.create('Template', {
  name: {
    default: ''
  },
  configure: function (config) {
    var keys = Object.keys(config),
        total = keys.length,
        key, i;
    for (i = 0; i < total; i++) {
      key = keys[i];
      this[key] = config[key];
    }
    return this;
  },
  layouts: {
    default: function () {
      var state = {};
      return {
        get: function (name) {
          return state[name];
        },
        set: function (name, value) {
          state[name] = value;
        }
      };
    }
  },
  layout: function (name, object, content) {
    var layout = this.layouts.get(this.resolvePath(name));
    if (!layout) {
      return content || '';
    }
    else {
      return layout.render(object, content);
    }
  },
  escape: function (string) {
    return (''+string).replace(/[&<>"']/g, function (match) {
      return entityMap[match];
    });
  },
  resolvePath: function (name) {
    var ref;
    if (name.charAt(0) === '/') {
      return name.slice(1); // from root
    }
    var normalized = '';
    while ((ref = name.slice(0, 3), ref === '../') || (ref = name.slice(0, 2), ref === './')) {
      if (ref === './') {
        ref = path.dirname(this.name);
        if (ref) {
          normalized += ref + '/';
        }
        name = name.slice(2);
      }
      else {
        ref = path.dirname(path.dirname(this.name));
        if (ref) {
          normalized += ref + '/';
        }
        name = name.slice(3);
      }
    }

    if (name) {
      normalized += name;
    }

    return normalized;
  },
  render: function (object, content) {
    return '';
  },
  toString: function () {
    return "exports.name = " + JSON.stringify(this.name) + ";\nexports.render = " + this.render.toString() + ";";
  }
});