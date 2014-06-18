var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    LIB = require('../lib'),
    fixtures = require('./fixtures.json'),
    expect = require('expect.js'),
    should = require('should');




describe("Integration Tests", function () {
  run("simple");
  run("page");
  run("page-with-content");
  run("repeat");
  run("repeat-with-index");
  run("repeat-object");
  run("sanitize");
  run("bind");
  run("bind-with-alias");
  run("layout");
  run("optional");
  run("filter");
});


function run (name) {
  it("should process " + name + ".html", function () {
    return Promise.all([
      fs.readFileAsync(__dirname + '/input/page.html', 'utf8'),
      fs.readFileAsync(__dirname + '/input/' + name + '.html', 'utf8'),
      fs.readFileAsync(__dirname + '/expected/' + name + '.html', 'utf8')
    ])
    .spread(function (layout, input, expected) {
      var template = LIB.string(input);
      template.layouts.set('page.html', LIB.string(layout));
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