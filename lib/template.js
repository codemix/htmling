'use strict';

var Classing = require('classing'),
    path = require('path');

/**
 * # Template
 */
module.exports = Classing.create('Template', {
  /**
   * The name of the template.
   * @type {String}
   */
  name: {
    default: ''
  },
  /**
   * Configure the template.
   *
   * @param  {Object}   config The configuration for the template.
   * @return {Template}        The configured template instance.
   */
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
  /**
   * A collection of templates which is used to access layouts.
   *
   * @type {Object|Collection}
   */
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
  /**
   * Wrap some content in a layout.
   *
   * @param  {String} name    The name of the layout to render.
   * @param  {Object} object  The data for the layout.
   * @param  {String} content The content to wrap within the layout.
   * @return {String}         The rendered content.
   */
  layout: function (name, object, content) {
    var layout = this.layouts.get(this.resolvePath(name));
    if (!layout) {
      return content || '';
    }
    else {
      return layout.render(object, content);
    }
  },
  /**
   * Escape HTML entities in a string to prevent XSS.
   *
   * @param  {String} string The string to escape.
   * @return {String}        The escaped string.
   */
  escape: function (string) {
    return (''+string).replace(/[&<>"']/g, function (match) {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
      }
    });
  },
  /**
   * Resolve the path of the given template name, relative to this one.
   *
   * @param  {String} name The path to resolve.
   * @return {String}      The resolved path.
   */
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
        if (ref && ref !== '.') {
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
  /**
   * Render the template.
   *
   * @param  {Object} object  The data for the template.
   * @param  {String} content The string content to render within the template, if any.
   * @param  {Object} filters The filter context to use, defaults to `this`.
   * @return {String}         The rendered content,
   */
  render: function (object, content, filters) {
    return ''; // this function is overwritten by instances.
  },
  /**
   * Return the template source code as a string.
   *
   * @return {String} The source code.
   */
  toString: function () {
    return "'use strict';\nexports.name = " + JSON.stringify(this.name) + ";\n" + this.compiledSource;
  }
});