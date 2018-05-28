import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Preview } from 'react-dnd-multi-backend';
import { SortableTreeWithoutDndContext as SortableTree, changeNodeAtPath, removeNodeAtPath, addNodeUnderParent, getFlatDataFromTree } from 'react-sortable-tree';
import { withStyles } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';
import indigo from '@material-ui/core/colors/indigo';
import lightBlue from '@material-ui/core/colors/lightBlue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import Chip from '@material-ui/core/Chip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import NodeEditor from './NodeEditor';
import primitiveFunctions from './primitiveFunctions';
import specialForms from './specialForms';
import placeholderTreeData from './placeholderTreeData';
import { getNodePath } from './urlUtils';

const chipHeight = 32;
const minTouchTargetSize = 48;
const lambdaChar = '\u03BB';

const styles = theme => {
    let lineColor = theme.palette.grey[700];
    let lineColorBackground = { backgroundColor: lineColor };
    return {
        '@global': {
            '.rst__lineHalfHorizontalRight::before': lineColorBackground,
            '.rst__lineFullVertical::after': lineColorBackground,
            '.rst__lineHalfVerticalTop::after': lineColorBackground,
            '.rst__lineHalfVerticalBottom::after': lineColorBackground
        },
        nodeContent: {
            height: '100%',
            display: 'flex',
            alignItems: 'center'
        },
        dragSource: {
            padding: 8,
            margin: -8
        },
        chip: {
            minWidth: minTouchTargetSize,
            fontSize: 14,
            backgroundColor: 'transparent',
            border: '1px solid ' + lineColor
        },
        functionChip: {
            color: indigo[200]
        },
        variableChip: {
            color: lightBlue[200]
        },
        referenceChip: {
            color: grey[300]
        },
        numberChip: {
            color: green[200]
        },
        placeholderChip: {
            color: red[200]
        },
        lineChildren: {
            position: 'absolute',
            width: 1,
            left: minTouchTargetSize / 2,
            bottom: 0,
            height: (minTouchTargetSize - chipHeight) / 2,
            backgroundColor: lineColor
        },
        pickedUp: {
            boxShadow: theme.shadows[8]
        },
        editMenu: {
            width: 450,
            maxHeight: 'calc(100% - 72px)', // leave space to click outside to dismiss
            padding: '8px 0'
        }
    };
};

const modes = { default: 'default', menu: 'menu', edit: 'edit', add: 'add' };

class TreeEditor extends Component {
    state = {
        mode: modes.default,
        menu: {},
        variables: [] // stored as state to avoid changing them before the menu animation finishes
    };

    render = () => (
        <Fragment>
            {this.renderTree()}
            {this.renderPreview()}
            {this.renderMenu()}
            {this.renderEditMenu()}
        </Fragment>
    );

    renderTree = () => (
        <SortableTree
            treeData={this.props.treeData}
            onChange={this.props.setTreeData}
            rowHeight={minTouchTargetSize}
            scaffoldBlockPxWidth={minTouchTargetSize}
            nodeContentRenderer={this.renderNodeContent}
            isVirtualized={false
                /* disable virtualization because it can remove an input element
                   (and the associated on-screen keyboard) */
            }
        />
    );

    renderNodeContent = nodeRendererProps => (
        <div className={this.props.classes.nodeContent}>
            {nodeRendererProps.isDragging ? null : this.renderChip(nodeRendererProps)}
            {this.hasChildren(nodeRendererProps.node) ? this.renderLineChildren() : null}
        </div>
    );

    renderChip = ({ node, path, treeIndex, connectDragSource }) => {
        let classes = {
            root: this.props.classes.chip,
            label: this.getChipLabelClass(node.type)
        };
        let label = this.getNodeLabel(node);
        let handleClick = event => this.openMenu(node, path, treeIndex, event.currentTarget);
        let chip = <Chip classes={classes} label={label} onClick={handleClick} />;
        // the drag source is an anchor tag since it seems to cause a vibration on long press
        return connectDragSource(
            <a className={this.props.classes.dragSource} onContextMenu={e => e.preventDefault()}>{chip}</a>
        );
    };

    getChipLabelClass = type => {
        switch (type) {
            case 'function':
                return this.props.classes.functionChip;
            case 'variable':
                return this.props.classes.variableChip;
            case 'number':
                return this.props.classes.numberChip;
            case 'placeholder':
                return this.props.classes.placeholderChip;
            default:
                return this.props.classes.referenceChip;
        }
    };

    getNodeLabel = node => {
        switch (node.type) {
            case 'number':
                return node.value.toString();
            case 'expression':
                return this.props.expressionNames[node.value];
            case 'function':
                return lambdaChar + node.value;
            default:
                return node.value;
        }
    };

    openMenu = (node, path, treeIndex, anchorEl) => {
        this.setState({
            mode: modes.menu,
            menu: { node, path, treeIndex, anchorEl }
        });
    };

    hasChildren = node => node.children && node.children.length;

    renderLineChildren = () => <div className={this.props.classes.lineChildren} />;

    renderPreview = () => <Preview generator={this.generatePreview} />;

    generatePreview = (type, item, style) => {
        let classes = {
            root: this.props.classes.chip + ' ' + this.props.classes.pickedUp
        };
        let label = this.getNodeLabel(item.node);
        return <div style={style}><Chip classes={classes} label={label} /></div>;
    };

    renderMenu = () => (
        <Menu anchorEl={this.state.menu.anchorEl}
              open={this.state.mode === modes.menu}
              onClose={this.closeMenu}
              disableRestoreFocus>
            {this.renderGoIfNeeded()}
            <MenuItem onClick={this.initiateEdit}>Edit</MenuItem>
            <MenuItem onClick={this.removeNode}>Delete</MenuItem>
            <MenuItem onClick={this.initiateAdd}>Add child</MenuItem>
        </Menu>
    );

    renderGoIfNeeded = () => {
        let path = this.getLinkPathToMenuNode();
        return path && (
            <MenuItem component={Link} to={path} onClick={this.closeMenu}>
                Go
            </MenuItem>
        );
    };

    getLinkPathToMenuNode = () => {
        let { node } = this.state.menu;
        return node ? getNodePath(node.type, node.value) : null;
    };

    initiateEdit = () => {
        this.setState(state => ({
            mode: modes.edit,
            variables: this.getVariables()
        }));
    };

    getVariables = () => {
        let flatData = getFlatDataFromTree({
            treeData: this.props.treeData,
            getNodeKey: ({ treeIndex }) => treeIndex
        });
        let nodes = flatData.map(({ node }) => node);
        let functionNodes = nodes.filter(node => node.type === 'function');
        return functionNodes.map(node => node.value);
    };

    removeNode = () => {
        let resultTreeData = removeNodeAtPath({
            treeData: this.props.treeData,
            path: this.state.menu.path,
            getNodeKey: ({ treeIndex }) => treeIndex
        });
        let newTreeData = resultTreeData.length === 0 ? placeholderTreeData : resultTreeData;
        this.props.setTreeData(newTreeData);
        this.closeMenu();
    };

    initiateAdd = () => {
        this.setState({
            mode: modes.add,
            variables: this.getVariables()
        });
    };

    renderEditMenu = () => (
        <Popover
            classes={{ paper: `${this.props.classes.popover} ${this.props.classes.editMenu}` }}
            anchorEl={this.state.menu.anchorEl}
            anchorOrigin={{ vertical: -16 }}
            open={this.state.mode === modes.edit || this.state.mode === modes.add}
            onClose={this.closeMenu}>
            {this.renderNodeEditor()}
        </Popover>
    );

    renderNodeEditor = () => (
        <NodeEditor
            initialInput={this.getInitialEditorInput()}
            items={this.getAllPossibleEditorItems()}
            saveResult={this.saveEditorResult} />
    );

    getInitialEditorInput = () => this.state.mode === 'edit' ? this.getNodeLabel(this.state.menu.node) : '';

    getAllPossibleEditorItems = () => [
        ...this.state.variables.map(variable => ({ name: variable, type: 'variable', value: variable })),
        ...Object.entries(specialForms).map(([name, info]) => ({ name, type: 'special', value: name })),
        ...Object.entries(primitiveFunctions).map(([name, info]) => ({ name, type: 'primitive', value: name })),
        ...this.props.expressionNames
                .map((name, index) => ({ name, type: 'expression', value: index }))
                .filter(item => item.name)
    ];

    saveEditorResult = (type, value) => {
        let { mode, menu } = this.state;
        let { treeData } = this.props;
        if (mode === 'edit') {
            let valueChanged = type !== menu.node.type || value !== menu.node.value;
            if (valueChanged) {
                this.props.setTreeData(changeNodeAtPath({
                    treeData,
                    path: menu.path,
                    newNode: { ...menu.node, type, value },
                    getNodeKey: ({ treeIndex }) => treeIndex
                }));
            }
        } else {
            if (value !== '') {
                this.props.setTreeData(addNodeUnderParent({
                    treeData,
                    parentKey: menu.treeIndex,
                    expandParent: true,
                    newNode: { type, value },
                    getNodeKey: ({ treeIndex }) => treeIndex
                }).treeData);
            }
        }
        this.closeMenu();
    };

    closeMenu = () => {
        this.setState({ mode: modes.default });
    };
}

export default withStyles(styles)(TreeEditor);
