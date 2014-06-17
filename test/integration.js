var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    LIB = require('../lib'),
    fixtures = require('./fixtures.json');



describe("Integration Tests", function () {
  run("simple");
  run("page");
  run("repeat");
  run("repeat-with-index");
  run("repeat-object");
  run("sanitize");
});


function run (name) {
  it("should process " + name + ".html", function () {
    return Promise.all([
      fs.readFileAsync(__dirname + '/input/' + name + '.html', 'utf8'),
      fs.readFileAsync(__dirname + '/expected/' + name + '.html', 'utf8')
    ])
    .spread(function (input, expected) {
      var template = LIB.compile(input);
      // console.log(template.render(fixtures));
      template.render(fixtures).should.equal(expected);
    });
  });
}