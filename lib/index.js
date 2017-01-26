'use strict';

var fs = require('fs'),
    path = require('path'),
    fast = require('fast.js'),
    watch = require('node-watch'),
    minifier = require('html-minifier');

module.exports = exports = function HTMLing (input, options) {
  return exports.string(input, options);
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
 * @param  {Object}   options  The options for the compiler.
 * @return {Template}          The template instance.
 */
exports.string = function (input, options) {
  options = options || {};
  options.name = options.name || '';
  options.Template = options.Template || exports.Template;

  if (options.minify) {
    input = minifier.minify(input, typeof options.minify === 'object' ? options.minify : {
      collapseWhitespace: true,
      collapseBooleanAttributes: true
    });
  }
  var compiled = this.codegen.generate(this.compiler.compile(input, {
    elements: options.elements || {}
  }));

  var module = {exports: {
    name: options.name,
    source: input,
    compiledSource: compiled
  }};

  (new Function('module', 'exports', compiled))(module, module.exports); // jshint ignore: line
  var templateRender = new options.Template(module.exports);
  templateRender.collection.elements = options.elements || {};
  return templateRender;
};

/**
 * Compile a template from a file.
 *
 * @param  {String}   filename The filename to compile.
 * @param  {Object}   options  The options for the compiler.
 * @return {Template}          The template instance.
 */
exports.file = function (filename, options) {
  var content = fs.readFileSync(filename, 'utf8');
  options = options || {};
  options.name = options.name || filename;
  return exports.string(content, options);
};

/**
 * Compile a directory of templates and return a template collection.
 *
 * @param  {String}     dirname  The directory containing the templates.
 * @param  {Object}     options  The options for the compiler.
 * @return {Collection}          A collection of templates.
 */
exports.dir = function (dirname, options) {
  dirname = path.resolve(dirname);
  options = options || {};
  options.extname = options.extname || '.html';
  var files = findAllFiles(dirname, options.extname).reduce(function (list, filename) {
    var name = filename.slice(dirname.length);
    if (name.charAt(0) === '/' || name.charAt(0) === '\\') {
      name = name.slice(1);
    }
    options.name = name;
    list[name] = exports.file(filename, options);
    return list;
  }, {});
  var collection = new exports.Collection(files);
  collection.elements = options.elements || {};
  return collection;
};


/**
 * Return a function which can be used as a view engine for express.
 *
 * @param  {String}   dirname  The directory containing the view files.
 * @param  {Object}   options  The options for the collection.
 */
exports.express = function (dirname, options) {
  options = options || {};
  var collection = exports.dir(dirname, options),
      prefixLength = dirname.length;
  if (options.watch) {
    exports.watch(dirname, collection, options);
  }
  return function (filename, data, done) {
    var result = fast.try(function () {
      return collection.render(filename.slice(prefixLength), data, data.content);
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
 * @param  {Object}     options    The options for the collection.
 */
exports.watch = function (dirname, collection, options) {
  dirname = path.resolve(dirname);
  watch(dirname, {persistent: false}, function (filename) {
    var result = fast.try(function () {
      var viewname = filename.slice(dirname.length + 1);
      options.name = viewname;
      collection.set(viewname, exports.file(filename, options));
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
