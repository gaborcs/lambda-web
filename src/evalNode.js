import primitiveFunctions from './primitiveFunctions';

export default node => {
    let { type, value } = node;
    let children = node.children || [];
    if (type === 'number') {
        return value;
    } if (type === 'primitive') {
        return primitiveFunctions[value].apply(children);
    } else {
        return NaN;
    }
};
