import evaluator from './evaluator';

it('can apply a function immediately', () => {
    let evalNode = evaluator([]);
    let node = {
        type: 'function',
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

it('can apply a function defined in an expression', () => {
    let identity = {
        type: 'function',
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
