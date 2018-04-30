export default {
    '=': {
        description: 'Primitive function that checks if its two arguments are equal.',
        apply: a => b => a === b
    },
    '+': {
        description: 'Primitive function that returns the sum of two numbers.',
        apply: a => b => a + b
    },
    '-': {
        description: 'Primitive function that returns the first argument minus the second argument.',
        apply: a => b => a - b
    },
    '*': {
        description: 'Primitive function that returns the product of two numbers.',
        apply: a => b => a * b
    },
    '/': {
        description: 'Primitive function that returns the first argument divided by the second argument.',
        apply: a => b => a / b
    }
};
