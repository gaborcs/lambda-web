const getSpecialFormPath = name => '/special-forms/' + encodeURIComponent(name);
const getPrimitiveFunctionPath = name => '/primitive-functions/' + encodeURIComponent(name);
const getExpressionPath = index => '/expressions/' + index;

const pathProviders = {
    expression: getExpressionPath,
    special: getSpecialFormPath,
    primitive: getPrimitiveFunctionPath
}

const getNodePath = (type, value) => {
    let getPath = pathProviders[type];
    return getPath ? getPath(value) : null;
}

export { getSpecialFormPath, getPrimitiveFunctionPath, getExpressionPath, getNodePath };
