'use strict';

var estraverse = require('estraverse');

// add our custom syntax definitions
estraverse.Syntax.Template = 'Template';
estraverse.Syntax.OutputStatement = 'OutputStatement';
estraverse.Syntax.BindStatement = 'BindStatement';
estraverse.Syntax.RepeatStatement = 'RepeatStatement';
estraverse.Syntax.ContentStatement = 'ContentStatement';
estraverse.Syntax.IncludeStatement = 'IncludeStatement';
estraverse.Syntax.AliasExpression = 'AliasExpression';
estraverse.Syntax.IterateExpression = 'IterateExpression';
estraverse.Syntax.CustomElement = 'CustomElement';

estraverse.VisitorKeys.Template = ['body'];
estraverse.VisitorKeys.OutputStatement = ['expression'];
estraverse.VisitorKeys.BindStatement = ['expression', 'body'];
estraverse.VisitorKeys.RepeatStatement = ['expression', 'body'];
estraverse.VisitorKeys.ContentStatement = ['body'];
estraverse.VisitorKeys.IncludeStatement = ['body'];
estraverse.VisitorKeys.AliasExpression = ['subject', 'alias'];
estraverse.VisitorKeys.IterateExpression = ['it', 'index', 'expression', 'body'];
estraverse.VisitorKeys.CustomElement = ['body'];

module.exports = estraverse;