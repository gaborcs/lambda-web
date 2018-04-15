import primitiveFunctions from './primitiveFunctions';

export default node => {
    let title = node.title;
    let children = node.children || [];
    let isNumber = !isNaN(title);
    if (isNumber) {
        return +title;
    } if (primitiveFunctions[title]) {
        return primitiveFunctions[title].apply(children);
    } else {
        return NaN;
    }
};
