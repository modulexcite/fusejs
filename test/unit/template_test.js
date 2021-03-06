new Test.Unit.Runner({

  'testTemplateEvaluation': function() {
    var source = '<tr><td>#{name}</td><td>#{age}</td></tr>',
     person    = { 'name': 'Sam', 'age': 21 },
     template  = fuse.Template(source);

    this.assertEqual('<tr><td>Sam</td><td>21</td></tr>',
      template.evaluate(person),
      'Regular object');
      
    this.assertEqual('<tr><td>Sam</td><td>21</td></tr>',
      template.evaluate($H(person)),
      'Hash object');

    this.assertEqual('<tr><td></td><td></td></tr>',
      template.evaluate({ }),
      'Empty object');
  },

  'testTemplateEvaluationWithEmptyReplacement': function() {
    var template = fuse.Template('##{}');
    this.assertEqual('#', template.evaluate());
    this.assertEqual('#', template.evaluate(null));
    this.assertEqual('#', template.evaluate({ }));
    this.assertEqual('#', template.evaluate({ 'foo': 'bar' }));

    template = fuse.Template('#{}');
    this.assertEqual('', template.evaluate({ }));
  },

  'testTemplateEvaluationWithFalses': function() {
    var source = '<tr><td>#{zero}</td><td>#{_false}</td><td>#{undef}</td><td>#{_null}</td><td>#{empty}</td></tr>',
     falses    = { 'zero':0, '_false':false, 'undef':undef, '_null':null, 'empty':'' },
     template  = fuse.Template(source);

    this.assertEqual('<tr><td>0</td><td>false</td><td></td><td></td><td></td></tr>',
      template.evaluate(falses));
  },

  'testTemplateEvaluationWithNested': function() {
    var source  = '#{name} #{manager.name} #{manager.age} #{manager.undef} #{manager.age.undef} #{colleagues.first.name}';

    var man = function(options){ fuse.Object.extend(this, options) };
    man.prototype.gender = 'Male';

    var worker = new man({
      'colleagues': { 'first': { 'name': 'Mark' } },
      'manager':    new man({ 'name': 'John', 'age': 29 }),
      'name':       'Stephan',
      'age':        22
    });

    this.assertEqual('Stephan', fuse.Template('#{name}').evaluate(worker));
    this.assertEqual('John',    fuse.Template('#{manager.name}').evaluate(worker));
    this.assertEqual('29',      fuse.Template('#{manager.age}').evaluate(worker));
    this.assertEqual('',        fuse.Template('#{manager.undef}').evaluate(worker));
    this.assertEqual('',        fuse.Template('#{manager.age.undef}').evaluate(worker));
    this.assertEqual('Mark',    fuse.Template('#{colleagues.first.name}').evaluate(worker));
    this.assertEqual('Stephan John 29   Mark', fuse.Template(source).evaluate(worker));

    // test inherited properties
    this.assertEqual('', fuse.Template('#{manager.gender}').evaluate(worker),
      'Template should not evaluate inherited properties.');
  },

  'testTemplateEvaluationWithIndexing': function() {
    var source = '#{0} = #{[0]} - #{1} = #{[1]} - #{[2][0]} - #{[2].name} - #{first[0]} - #{[first][0]} - #{[\\]]} - #{first[\\]]}',
     subject   = ['zero', 'one', ['two-zero']];

    subject[2].name    = 'two-zero-name';
    subject.first      = subject[2];
    subject[']']       = '\\';
    subject.first[']'] = 'first\\';

    this.assertEqual('zero',          fuse.Template('#{[0]}').evaluate(subject));
    this.assertEqual('one',           fuse.Template('#{[1]}').evaluate(subject));
    this.assertEqual('two-zero',      fuse.Template('#{[2][0]}').evaluate(subject));
    this.assertEqual('two-zero-name', fuse.Template('#{[2].name}').evaluate(subject));
    this.assertEqual('two-zero',      fuse.Template('#{first[0]}').evaluate(subject));
    this.assertEqual('\\',            fuse.Template('#{[\\]]}').evaluate(subject));
    this.assertEqual('first\\',       fuse.Template('#{first[\\]]}').evaluate(subject));

    this.assertEqual('empty - empty2',
      fuse.Template('#{[]} - #{m[]}').evaluate({ '': 'empty', 'm': { '': 'empty2' } }));

    this.assertEqual('zero = zero - one = one - two-zero - two-zero-name - two-zero - two-zero - \\ - first\\',
      fuse.Template(source).evaluate(subject));
  },

  'testTemplateToTemplateReplacements': function() {
    var source = 'My name is #{name}, my job is #{job}';

    var subject = {
      'name': 'Stephan',
      'getJob': function() { return 'Web developer' },
      'toTemplateReplacements': function() { return { 'name': this.name, 'job': this.getJob() } }
    };

    this.assertEqual('My name is Stephan, my job is Web developer',
      fuse.Template(source).evaluate(subject));

    // test null return value of toTemplateReplacements()
    source  = 'My name is "#{name}", my job is "#{job}"';
    subject = { 'toTemplateReplacements': fuse.K };
    this.assertEqual('My name is "", my job is ""',
      fuse.Template(source).evaluate(subject));

    source = 'My name is "\\#{name}", my job is "\\#{job}"';
    this.assertEqual('My name is "#{name}", my job is "#{job}"',
      fuse.Template(source).evaluate(subject));
  },

  'testTemplateEvaluationCombined': function() {
    var source = '#{name} is #{age} years old, managed by #{manager.name}, #{manager.age}.\n' +
      'Colleagues include #{colleagues[0].name} and #{colleagues[1].name}.';

    var subject = {
      'name':       'Stephan',
      'age':        22,
      'manager':    { 'name': 'John', 'age': 29 },
      'colleagues': [ { 'name': 'Mark' }, { 'name': 'Indy' } ]
    };
    this.assertEqual('Stephan is 22 years old, managed by John, 29.\n' +
      'Colleagues include Mark and Indy.',
      fuse.Template(source).evaluate(subject));
  }
});