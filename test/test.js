var LIB = require('../lib');

var should = require('should'),
    expect = require('expect.js');

describe.skip('parser', function () {
  it('should parse some html', function () {
    var html = "<p>hello {{name}}, how are you?</p>";
    var result = LIB.parser.parse(html).body;
    result.length.should.equal(3);
    result[0].type.should.equal('OutputStatement');
    result[1].type.should.equal('OutputStatement');
    result[2].type.should.equal('OutputStatement');
  });
  describe("<template>", function () {
    it('should parse a template tag', function () {
      var html = "<template>wat</template>";
      var result = LIB.parser.parse(html).body;
      result.length.should.equal(1);
      result[0].type.should.equal('BlockStatement');
    });
    it('should parse a template tag with boolean attributes', function () {
      var html = "<template foo>wat</template>";
      var result = LIB.parser.parse(html).body;
      result.length.should.equal(1);
      result[0].type.should.equal('BlockStatement');
      result[0].attributes.should.eql({foo: true});
    });
    it('should parse a template tag with attributes', function () {
      var html = "<template foo=\"123\">wat</template>";
      var result = LIB.parser.parse(html).body;
      result.length.should.equal(1);
      result[0].type.should.equal('BlockStatement');
      result[0].attributes.should.eql({foo: "123"});
    });
    it('should parse a template tag with multiple attributes', function () {
      var html = "<template foo=\"123\" bar='456'>wat</template>";
      var result = LIB.parser.parse(html).body;
      result.length.should.equal(1);
      result[0].type.should.equal('BlockStatement');
      result[0].attributes.should.eql({foo: "123", bar: '456'});
    });
    it('should parse a template tag with an `if` attribute', function () {
      var html = "<template if=\"{{ a | z }}\">hello world</template>";
      var result = LIB.parser.parse(html).body;
      result.length.should.equal(1);
      result[0].type.should.equal('IfStatement');
      dump(result);
    });
    it('should parse a nested template tag ', function () {
      var html = "<template repeat=\"{{user, name in users}}\">Greetings<br><template if=\"{{user}}\">hello {{name}}</template></template>";

      //html = "{{user[abc]}}";
      var result = LIB.parser.parse(html);
      dump(result);
      var compiled = LIB.compiler.compile(result);
      dump(compiled);
      var generated = LIB.codegen.generate(compiled);
      dump(generated);
    });
    it('should parse a template tag with vanilla repeat', function () {
      var html = "<template repeat=\"{{users}}\">Greetings<br>hello {{name}}</template>";
      var result = LIB.parser.parse(html);
      dump(result);
      var compiled = LIB.compiler.compile(result);
      dump(compiled);
      var generated = LIB.codegen.generate(compiled);
      dump(generated);
    });
    it('should parse a template tag with a `repeat` attribute', function () {
      var html = "<template repeat=\"{{ items as user}}\">hello {{user.name}}</template>";
      var result = LIB.parser.parse(html);
      dump(result);
      result.body.length.should.equal(1);
      result.body[0].type.should.equal('RepeatStatement');
    });
    it('should skip a tag which looks like a template but isnt', function () {
      var html = "<template-nope>wat</template-nope>";
      var result = LIB.parser.parse(html).body;
      result.length.should.equal(1);
      result[0].type.should.equal('OutputStatement');
    });
  });
  describe("<content>", function () {
    it('should parse a content tag', function () {
      var html = "<content>this is {{empty}}</content>";
      var result = LIB.parser.parse(html);
      dump(result);
      var compiled = LIB.compiler.compile(result);
      dump(compiled);
      var generated = LIB.codegen.generate(compiled);
      dump(generated);
    });
    it('should parse an empty content tag', function () {
      var html = "<content></content>";
      var result = LIB.parser.parse(html).body;
      dump(result);
      result.length.should.equal(1);
      result[0].type.should.equal('ContentStatement');
    });
  });
  describe("<layout>", function () {
    it('should parse a layout tag', function () {
      var html = "<layout src=\"foo.html\">this is {{value}}</layout>";
      var result = LIB.parser.parse(html);
      dump(result);
      var compiled = LIB.compiler.compile(result);
      dump(compiled);
      var generated = LIB.codegen.generate(compiled);
      dump(generated);
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