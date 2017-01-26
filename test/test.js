var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    LIB = require('../lib'),
    fixtures = require('./fixtures.json'),
    expect = require('expect.js'),
    should = require('should');

describe("Integration Tests", function () {
  var collection;

  before(function () {
    collection = LIB.dir(__dirname + '/input', {
      elements: {
        'demo-nav-bar': "/custom-elements/demo-nav-bar.html",
        'fn-element': function (attributes, content) {
          return '<strong>' + attributes.greeting + '</strong>';
        }
      }
    });
  });

  run("nothing");
  run("simple");
  run("page");
  run("page-with-content");
  run("repeat");
  run("repeat-simple");
  run("repeat-with-index");
  run("repeat-object");
  run("sanitize");
  run("bind");
  run("bind-with-alias");
  run("include");
  run("include-no-content");
  run("include-with-bind");
  run("include-with-bind-alias");
  run("include-repeat");
  run("include-repeat-object");
  run("include-repeat-no-content");
  run("include-repeat-alias");
  run("include-repeat-alias-index");
  run("include-repeat-alias-no-content");
  run("include-repeat-alias-index-no-content");
  run("optional");
  run("filter");
  run("client-template");
  run("ternary");
  run("if");
  run("custom-element");
  run("cache-references");

  function run (name) {
    it("should process " + name + ".html", function () {
      return Promise.all([
        fs.readFileAsync(__dirname + '/expected/' + name + '.html', 'utf8')
      ])
      .spread(function (expected) {
        var template = collection.get(name + '.html');

        //console.log(template.render+'')
        // console.log(template.render(fixtures));
        var content = '';
        if (/-with-content$/.test(name)) {
          content = '<p>Content</p>';
        }

        template.toCase = function (direction, input) {
          return input['to' + direction.charAt(0).toUpperCase() + direction.slice(1) + 'Case']();
        };

        template.reverse = function (input) {
          return input.split('').reverse().join('');
        };

        template.render(fixtures, content).should.equal(expected);
      });
    });
  }

  it("should process custom-string.html", function () {
    return Promise.all([
      fs.readFileAsync(__dirname + '/input/custom-string.html', 'utf8'),
      fs.readFileAsync(__dirname + '/expected/custom-string.html', 'utf8')
    ]).then(function (html) {
      const input = html[0]
      const expected = html[1]

      var template = LIB.string(input, {
        elements: {
          'raw-html': function (params) {
            return params.content
          }
        }
      })

      template.render({}).should.equal(expected);
    });
  });
});
