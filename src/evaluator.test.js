import evaluator from './evaluator';

it('can apply a lambda immediately', () => {
    let evalNode = evaluator([]);
    let node = {
        type: 'lambda',
        value: 'x',
        children: [{
            type: 'variable',
            value: 'x'
        }, {
            type: 'number',
            value: 1
        }]
    };
    let evalResult = evalNode(node);
    expect(evalResult).toBe(1);
});

it('can apply a lambda defined in an expression', () => {
    let identity = {
        type: 'lambda',
        value: 'x',
        children: [{
            type: 'variable',
            value: 'x'
        }]
    };
    let expressions = [ identity ];
    let evalNode = evaluator(expressions);
    let node = {
        type: 'expression',
        value: 0,
        children: [{
            type: 'number',
            value: 1
        }]
    };
    let evalResult = evalNode(node);
    expect(evalResult).toBe(1);
});
