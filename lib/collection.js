'use strict';

var Classing = require('classing');

/**
 * # Template Collection
 *
 */
module.exports = Classing.create('Collection', {
  /**
   * The templates in the collection.
   * @type {Object}
   */
  items: {
    default: function () {
      return {};
    }
  },
  /**
   * The map of custom element names to paths
   * @type {Object}
   */
  elements: {
    default: function () {
      return {};
    }
  },
  /**
   * Configure the collection.
   *
   * @param  {Object}     items The items to add.
   * @return {Collection}       The configured collection.
   */
  configure: function (items) {
    var keys = Object.keys(items),
        total = keys.length,
        key, i;
    for (i = 0; i < total; i++) {
      key = keys[i];
      items[key].collection = this;
      this.items[key] = items[key];
    }
    return this;
  },
  /**
   * Get a template with the given name.
   *
   * @param  {String}   name The template name.
   * @return {Template}      The template instance.
   */
  get: function (name) {
    return this.items[name];
  },
  /**
   * Add a template with the given name.
   *
   * @param {String}    name  The template name.
   * @param {Template}  value The template instance.
   * @return {Collection}     The collection with the template added.
   */
  set: function (name, value) {
    if (name && typeof name === 'object') {
      this.configure(name);
    }
    else {
      value.collection = this;
      this.items[name] = value;
    }
    return this;
  },
  /**
   * Render a template with the given name.
   *
   * @param  {String} name    The name of the template to render.
   * @param  {Object} object  The data for the template.
   * @param  {String} content Content to render within the template body, if any.
   * @return {String}         The rendered template content.
   */
  render: function (name, object, content) {
    var template = this.get(name);
    if (!template) {
      throw new Error('Cannot render missing template: ' + name);
    }
    object = object || {};
    return template.render(object, content);
  },
  /**
   * The number of items in the collection.
   * @type {Integer}
   */
  size: {
    get: function () {
      return Object.keys(this.items);
    }
  },
  /**
   * Iterate the items in the collection.
   *
   * @param  {Function} fn          The function to invoke for each item in the collection.
   * @param  {Object}   thisContext The context for the iterator function, defaults to `this`.
   */
  forEach: function (fn, thisContext) {
    var keys = Object.keys(this.items),
        total = keys.length,
        key, i;

    for (i = 0; i < total; i++) {
      key = keys[i];
      fn.call(thisContext || this, this.items[key], key, this.items);
    }
  },
  /**
   * Return the full source code for the collection.
   * @return {String} The JavaScript source code.
   */
  toString: function () {
    var keys = Object.keys(this.items),
        total = keys.length,
        content = [],
        safeName, key, i;

    for (i = 0; i < total; i++) {
      key = keys[i];
      safeName = JSON.stringify(this.items[key].name);
      content.push("collection.set(" + safeName + ", new Template(function (module) {\n" +
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