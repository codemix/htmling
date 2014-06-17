'use strict';

var estraverse = require('estraverse');

// add our custom syntax definitions

estraverse.Syntax.OutputStatement = 'OutputStatement';
estraverse.Syntax.BindStatement = 'BindStatement';
estraverse.Syntax.RepeatStatement = 'RepeatStatement';
estraverse.Syntax.ContentStatement = 'ContentStatement';
estraverse.Syntax.LayoutStatement = 'LayoutStatement';
estraverse.Syntax.AliasExpression = 'AliasExpression';

estraverse.VisitorKeys.OutputStatement = ['expression'];
estraverse.VisitorKeys.BindStatement = ['expression', 'body'];
estraverse.VisitorKeys.RepeatStatement = ['expression', 'body'];
estraverse.VisitorKeys.ContentStatement = ['body'];
estraverse.VisitorKeys.LayoutStatement = ['body'];
estraverse.VisitorKeys.AliasExpression = ['subject', 'alias'];

module.exports = estraverse;