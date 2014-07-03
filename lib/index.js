'use strict';

var fs = require('fs'),
    path = require('path'),
    fast = require('fast.js'),
    watch = require('node-watch');

module.exports = exports = function HTMLing (input, name, Template) {
  return exports.string(input, name, Template);
};

exports.parser = require('./parser');
exports.traverse = require('./traverse');
exports.compiler = require('./compiler');
exports.codegen = require('./codegen');

exports.Template = require('./template');
exports.Collection = require('./collection');

/**
 * Compile a template from a string.
 *
 * @param  {String}   input    The string to compile.
 * @param  {String}   name     The view name.
 * @param  {Function} Template The class for the template.
 * @return {Template}          The template instance.
 */
exports.string = function (input, name, Template) {
  name = name || '';
  Template = Template || exports.Template;
  var compiled = this.codegen.generate(this.compiler.compile(input));

  var module = {exports: {
    name: name,
    source: input,
    compiledSource: compiled
  }};

  (new Function('module', 'exports', compiled))(module, module.exports); // jshint ignore: line
  return new Template(module.exports);
};

/**
 * Compile a template from a file.
 *
 * @param  {String}   filename The filename to compile.
 * @param  {String}   name     The view name.
 * @param  {Function} Template The class for the template.
 * @return {Template}          The template instance.
 */
exports.file = function (filename, name, Template) {
  var content = fs.readFileSync(filename, 'utf8');
  return exports.string(content, name || filename, Template);
};

/**
 * Compile a directory of templates and return a template collection.
 *
 * @param  {String}     dirname  The directory containing the templates.
 * @param  {String}     extname  The file extension for the templates, defaults to `.html`.
 * @param  {Function}   Template The template class to use.
 * @return {Collection}          A collection of templates.
 */
exports.dir = function (dirname, extname, Template) {
  dirname = path.resolve(dirname);
  extname = extname || '.html';
  var files = findAllFiles(dirname, extname).reduce(function (list, filename) {
    var name = filename.slice(dirname.length);
    if (name.charAt(0) === '/' || name.charAt(0) === '\\') {
      name = name.slice(1);
    }
    list[name] = exports.file(filename, name, Template);
    return list;
  }, {});
  return new exports.Collection(files);
};


/**
 * Return a function which can be used as a view engine for express.
 *
 * @param  {String}   dirname  The directory containing the view files.
 * @param  {Object}   options  The options for the collection.
 */
exports.express = function (dirname, options) {
  options = options || {};
  var collection = exports.dir(dirname, options.extname, options.Template),
      prefixLength = dirname.length;
  if (options.watch) {
    exports.watch(dirname, collection);
  }
  return function (filename, data, done) {
    var result = fast.try(function () {
      return collection.render(filename.slice(prefixLength), data);
    });
    if (result instanceof Error) {
      return done(result);
    }
    else {
      return done(null, result);
    }
  };
};

/**
 * Watches a template collection for changes and reloads the
 * templates as required.
 *
 * @param  {String}     dirname    The base path for the collection.
 * @param  {Collection} collection The collection to watch.
 */
exports.watch = function (dirname, collection) {
  var options = {
    persistent: false
  };
  dirname = path.resolve(dirname);
  watch(dirname, options, function (filename) {
    var result = fast.try(function () {
      var viewname = filename.slice(dirname.length + 1);
      collection.set(viewname, exports.file(filename));
    });
    if (result instanceof Error) {
      console.error(result);
    }
  });
};

function findAllFiles (dirname, extname) {
  return fs.readdirSync(dirname)
  .reduce(function (list, name) {
    var filename = path.join(dirname, name);
    var stat = fs.statSync(filename);
    if (stat.isDirectory()) {
      return list.concat(findAllFiles(filename, extname));
    }
    else {
      if (path.extname(filename, extname)) {
        list.push(filename);
      }
      return list;
    }
  }, []);
}

