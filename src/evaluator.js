import primitiveFunctions from './primitiveFunctions';

export default expressions => {
    let evalNode = node => {
        let { type, value } = node;
        let children = node.children || [];
        switch (type) {
            case 'number':
                return value;
            case 'primitive':
                return primitiveFunctions[value].apply(evalNode, children);
            case 'expression':
                return evalNode(expressions[value].treeDataHistory.present[0]);
            default:
                return NaN;
        }
    };
    return evalNode;
};
