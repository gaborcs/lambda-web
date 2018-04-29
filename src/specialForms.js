export default {
    if: {
        description: 'If the first argument evaluates to true, it evaluates the second argument, otherwise it evaluates the third argument.',
        apply: (evalArg, args) => evalArg(args[0]) ? evalArg(args[1]) : evalArg(args[2])
    }
};
