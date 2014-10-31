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
   * The state of the template, used for protected properties.
   *
   * @type {Object}
   */
  __state__: {
    default: function () {
      return {paths: {}};
    }
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
    if (typeof name === 'function') {
      return name(object, content);
    }
    if (!this.__state__.paths[name]) {
      this.__state__.paths[name] = this.resolvePath(name);
    }
    var include = this.collection.get(this.__state__.paths[name]);
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
    function Cloned () {
      if (alias) {
        this[alias] = value;
      }
    }
    Cloned.prototype = object;
    return new Cloned();
  },
  /**
   * Escape HTML entities in a string to prevent XSS.
   *
   * @param  {String} string The string to escape.
   * @return {String}        The escaped string.
   */
  escape: function (string) {
    if (string === 0) {
      return 0;
    }
    else if (!string) {
      return '';
    }
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
   * Render a registered custom element.
   *
   * @param  {String}           name       The name of the custom element.
   * @param  {Object}           attributes The attributes for the element.
   * @param  {String|Function}  body       The body for the element.
   * @param  {Object}           context    The context for the body, if a function is given.
   * @param  {Object}           object     The object for the body, if a function is given.
   * @return {String}                      The rendered content.
   */
  customElement: function (name, attributes, body, context, object) {
    var resolved = this.resolveElementPath(name);
    if (!body) {
      return this.include(resolved, attributes);
    }
    else if (typeof body === 'function') {
      return this.include(resolved, attributes, body(context, object));
    }
    else {
      return this.include(resolved, attributes, body);
    }
  },
  /**
   * Resolve the path of the given template name, relative to this one.
   *
   * @param  {String} name The path to resolve.
   * @return {String}      The resolved path.
   */
  resolvePath: function (name) {
    var c = name.charAt(0),
        dirname = path.dirname(this.name),
        ref;
    if (dirname === '.') {
      dirname = '';
    }
    else if (dirname.charAt(dirname.length - 1) !== '/') {
      dirname += '/';
    }
    if (c === '/') {
      return name.slice(1); // from root
    }
    else if (c !== '.') {
      return dirname + name;
    }
    var normalized = '';
    while ((ref = name.slice(0, 3), ref === '../') || (ref = name.slice(0, 2), ref === './')) {
      if (ref === './') {
        ref = dirname;
        if (ref) {
          normalized += ref + '/';
        }
        name = name.slice(2);
      }
      else {
        ref = path.dirname(dirname);
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
   * Resolve the path for a custom element.
   *
   * @param  {String} name The name of the element to resolve.
   * @return {String}      The resolved path.
   */
  resolveElementPath: function (name) {
    return this.collection.elements[name];
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