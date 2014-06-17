var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    LIB = require('../lib'),
    fixtures = require('./fixtures.json');



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
});


function run (name) {
  it("should process " + name + ".html", function () {
    return Promise.all([
      fs.readFileAsync(__dirname + '/input/' + name + '.html', 'utf8'),
      fs.readFileAsync(__dirname + '/expected/' + name + '.html', 'utf8')
    ])
    .spread(function (input, expected) {
      var template = LIB.compile(input);
      //console.log(template.render+'')
      // console.log(template.render(fixtures));
      var content = '';
      if (/-with-content$/.test(name)) {
        content = '<p>Content</p>';
      }
      template.render(fixtures, content).should.equal(expected);
    });
  });
}