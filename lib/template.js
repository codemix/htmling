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
   * A collection of templates which this template belongs to.
   *
   * @type {Object|Collection}
   */
  collection: {
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
   * Wrap some content in an include.
   *
   * @param  {String} name    The name of the template to render.
   * @param  {Object} object  The data for the template.
   * @param  {String} content The content to wrap within the template.
   * @return {String}         The rendered content.
   */
  include: function (name, object, content) {
    var include = this.collection.get(this.resolvePath(name));
    if (!include) {
      return content || '';
    }
    else {
      return include.render(object, content);
    }
  },
  /**
   * Clone a scope, set a new key / value on the cloned
   * scope, then return it. This is used for aliasing in
   * some circumstances.
   *
   * @param  {Object} object The scope to clone.
   * @param  {String} alias  The name of the key to set.
   * @param  {mixed}  value  The value to set.
   * @return {Object}        The cloned scope.
   */
  rescope: function (object, alias, value) {
    var keys = Object.keys(object),
        length = keys.length,
        cloned = {},
        key, i;

    for (i = 0; i < length; i++) {
      key = keys[i];
      cloned[key] = object[key];
    }
    if (alias) {
      cloned[alias] = value;
    }
    return cloned;
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
    return "'use strict';\nexports.name = " +
           JSON.stringify(this.name) + ";\n" +
           (this.compiledSource || this.render.toString());
  }
});