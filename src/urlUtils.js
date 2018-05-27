const getSpecialFormPath = name => '/special-forms/' + encodeURIComponent(name);
const getPrimitiveFunctionPath = name => '/primitive-functions/' + encodeURIComponent(name);
const getExpressionPath = index => '/expressions/' + index;

const pathProviders = {
    expression: getExpressionPath,
    special: getSpecialFormPath,
    primitive: getPrimitiveFunctionPath
}

const getNodePath = (type, value) => pathProviders[type](value);

export { getSpecialFormPath, getPrimitiveFunctionPath, getExpressionPath, getNodePath };
