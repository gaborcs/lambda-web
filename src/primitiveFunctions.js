import evalNode from './evalNode';

export default {
    '+': {
        description: 'Primitive function that returns the sum of numbers',
        apply: nodes => nodes.map(evalNode).reduce((a, b) => a + b, 0)
    },
    '*': {
        description: 'Primitive function that returns the product of numbers',
        apply: nodes => nodes.map(evalNode).reduce((a, b) => a * b, 1)
    }
};
