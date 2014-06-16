var LIB = require('../lib');

var should = require('should'),
    expect = require('expect.js');

describe('parser', function () {
  it('should parse some html', function () {
    var html = "<p>hello {{name}}, how are you?</p>";
    var result = LIB.parser.parse(html);
    result.length.should.equal(3);
    result[0].type.should.equal('OutputStatement');
    result[1].type.should.equal('ExpressionStatement');
    result[2].type.should.equal('OutputStatement');
  });
  describe("<template>", function () {
    it('should parse a template tag', function () {
      var html = "<template>wat</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('TemplateElement');
    });
    it('should ignore the contents of a template tag', function () {
      var html = "<template>Hello {{name}}!</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('TemplateElement');
      result[0].body.length.should.equal(1);
      result[0].body[0].type.should.equal('OutputStatement');
    });
    it('should parse a template tag with boolean attributes', function () {
      var html = "<template foo>wat</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('TemplateElement');
      result[0].attributes.should.eql({foo: true});
    });
    it('should parse a template tag with attributes', function () {
      var html = "<template foo=\"123\">wat</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('TemplateElement');
      result[0].attributes.should.eql({foo: "123"});
    });
    it('should parse a template tag with multiple attributes', function () {
      var html = "<template foo=\"123\" bar='456'>wat</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('TemplateElement');
      result[0].attributes.should.eql({foo: "123", bar: '456'});
    });
    it('should parse a template tag with an `if` attribute', function () {
      var html = "<template if=\"{{ a | z }}\">hello world</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('IfStatement');
      dump(result);
    });
    it('should parse a nested template tag ', function () {
      var html = "<template bind=\"{{item}}\">Greetings<br><template if=\"{{user}}\">hello world</template></template>";
      var result = LIB.parser.parse(html);
      dump(result);
    });
    it('should parse a template tag with a `repeat` attribute', function () {
      var html = "<template repeat=\"{{ items as user}}\">hello {{user.name}}</template>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('RepeatStatement');
      dump(result);
    });
    it('should skip a tag which looks like a template but isnt', function () {
      var html = "<template-nope>wat</template-nope>";
      var result = LIB.parser.parse(html);
      result.length.should.equal(1);
      result[0].type.should.equal('OutputStatement');
    });
  });
});


function dump () {
  var args = [].slice.call(arguments).map(function (arg) {
    if (typeof arg === 'string' || typeof arg === 'number') {
      return arg;
    }
    else {
      return JSON.stringify(arg, null, 2);
    }
  })
  console.log.apply(console, args);
}