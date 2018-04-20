import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { Preview } from 'react-dnd-multi-backend';
import withScrolling from 'react-dnd-scrollzone';
import { SortableTreeWithoutDndContext as SortableTree, changeNodeAtPath, removeNodeAtPath, addNodeUnderParent } from 'react-sortable-tree';
import { withStyles } from 'material-ui/styles';
import ButtonBase from 'material-ui/ButtonBase';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import UndoIcon from 'material-ui-icons/Undo';
import RedoIcon from 'material-ui-icons/Redo';
import Chip from 'material-ui/Chip';
import Toolbar from 'material-ui/Toolbar';
import Menu, { MenuItem } from 'material-ui/Menu';
import Popover from 'material-ui/Popover';
import { FormControl } from 'material-ui/Form';
import Input, { InputLabel } from 'material-ui/Input';
import { Link } from 'react-router-dom';
import LambdaAppBar from './LambdaAppBar';
import evalNode from './evalNode';
import primitiveFunctions from './primitiveFunctions';

const chipHeight = 32;
const minTouchTargetSize = 48;

const styles = theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none'
    },
    name: {
        padding: '8px 16px'
    },
    renamer: {
        padding: 8
    },
    scrollingComponent: {
        flex: 1,
        padding: '8px 0',
        overflow: 'auto'
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
        minWidth: minTouchTargetSize
    },
    lineChildren: {
        position: 'absolute',
        width: 1,
        left: minTouchTargetSize / 2,
        bottom: 0,
        height: (minTouchTargetSize - chipHeight) / 2
    },
    pickedUp: {
        boxShadow: theme.shadows[8]
    },
    bottomBar: {
        backgroundColor: theme.palette.grey[900]
    },
    popover: {
        padding: '8px 0'
    },
    editInput: {
        margin: '8px 16px'
    }
});

const initialTreeData = [{ title: '' }];

const modes = { default: 'default', menu: 'menu', edit: 'edit', add: 'add' };

const ScrollingComponent = withScrolling('div');

class ExpressionPage extends Component {
    state = {
        renamer: { open: false },
        mode: modes.default,
        menu: {},
        editValue: ''
    };

    undo = () => {
        let { past, present, future } = this.props.expression.treeDataHistory;
        this.setTreeDataHistory({
            past: past.slice(0, past.length - 1),
            present: past[past.length - 1],
            future: [present, ...future]
        });
    };

    redo = () => {
        let { past, present, future } = this.props.expression.treeDataHistory;
        this.setTreeDataHistory({
            past: [...past, present],
            present: future[0],
            future: future.slice(1)
        });
    };

    setTreeDataHistory = value => {
        this.props.setExpression({
            name: this.props.expression.name,
            treeDataHistory: value
        });
    };

    addToHistory = treeData => {
        let { past, present } = this.props.expression.treeDataHistory;
        this.setTreeDataHistory({
            past: [...past, present],
            present: treeData,
            future: []
        });
    };

    render = () => (
        <div className={this.props.classes.root}>
            {this.renderAppBar()}
            {this.renderScrollingContent()}
            {this.renderBottomBar()}
            {this.renderPreview()}
            {this.renderRenamer()}
            {this.renderMenu()}
            {this.renderEditMenu()}
        </div>
    );

    renderAppBar = () => (
        <LambdaAppBar>
            {this.renderName()}
            {this.renderIconButtons()}
        </LambdaAppBar>
    );

    renderName = () => (
        <ButtonBase className={this.props.classes.name} title="Rename" onClick={this.openRenamer}>
            <Typography variant="title">{this.props.expression.name || "unnamed"}</Typography>
        </ButtonBase>
    );

    openRenamer = event => {
        this.setState({
            renamer: { open: true, anchorEl: event.currentTarget, value: this.props.expression.name }
        });
    };

    renderIconButtons = () => (
        <div>
            {this.renderUndoButton()}
            {this.renderRedoButton()}
        </div>
    );

    renderUndoButton = () => (
        <IconButton disabled={this.props.expression.treeDataHistory.past.length === 0} onClick={this.undo}>
            <UndoIcon />
        </IconButton>
    );

    renderRedoButton = () => (
        <IconButton disabled={this.props.expression.treeDataHistory.future.length === 0} onClick={this.redo}>
            <RedoIcon />
        </IconButton>
    );

    renderScrollingContent = () => (
        <ScrollingComponent className={this.props.classes.scrollingComponent}>
            {this.renderSortableTree()}
        </ScrollingComponent>
    );

    renderSortableTree = () => (
        <SortableTree
            treeData={this.props.expression.treeDataHistory.present}
            onChange={this.addToHistory}
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
            root: this.props.classes.chip
        };
        let handleClick = event => this.openMenu(node, path, treeIndex, event.currentTarget);
        let chip = <Chip classes={classes} label={node.title} onClick={handleClick} />;
        // the drag source is an anchor tag since it seems to cause a vibration on long press
        return connectDragSource(
            <a className={this.props.classes.dragSource} onContextMenu={e => e.preventDefault()}>{chip}</a>
        );
    };

    openMenu = (node, path, treeIndex, anchorEl) => {
        this.setState({
            mode: modes.menu,
            menu: { node, path, treeIndex, anchorEl }
        });
    };

    hasChildren = node => node.children && node.children.length;

    renderLineChildren = () => <div className={'custom-line-color ' + this.props.classes.lineChildren} />;

    renderPreview = () => <Preview generator={this.generatePreview} />;

    generatePreview = (type, item, style) => {
        let classes = {
            root: this.props.classes.chip + ' ' + this.props.classes.pickedUp
        };
        return <div style={style}><Chip classes={classes} label={item.node.title} /></div>;
    };

    renderRenamer = () => (
        <Popover
            classes={{ paper: this.props.classes.renamer }}
            anchorEl={this.state.renamer.anchorEl}
            open={this.state.renamer.open}
            onClose={this.saveRenameResult}
            marginThreshold={0}>
            {this.renderRenamerTextField()}
        </Popover>
    );

    saveRenameResult = () => {
        this.setState(state => {
            this.props.setExpression({
                name: state.renamer.value,
                treeDataHistory: this.props.expression.treeDataHistory
            });
            return {
                renamer: { ...state.renamer, open: false }
            };
        });
    };

    renderRenamerTextField = () => (
        <FormControl>
            <InputLabel htmlFor="renamer-input">Rename</InputLabel>
            <AutoSelectInput
                id="renamer-input"
                value={this.state.renamer.value}
                onChange={this.handleRenamerInputChange}
                onKeyDown={this.handleRenamerInputKeyDown}
                inputProps={{ autoCapitalize: "off" }} />
        </FormControl>
    );

    handleRenamerInputChange = event => {
        let value = event.target.value;
        this.setState(state => ({
            renamer: { ...state.renamer, value }
        }));
    };

    handleRenamerInputKeyDown = event => {
        if (event.key === 'Enter') {
            this.saveRenameResult();
        }
    };

    renderMenu = () => (
        <Menu anchorEl={this.state.menu.anchorEl}
              open={this.state.mode === modes.menu}
              onClose={this.closeMenu}
              disableRestoreFocus>
            {this.canGoToDefinition() && this.renderGo()}
            <MenuItem onClick={this.initiateEdit}>Edit</MenuItem>
            <MenuItem onClick={this.removeNode}>Delete</MenuItem>
            <MenuItem onClick={this.initiateAdd}>Add child</MenuItem>
        </Menu>
    );

    canGoToDefinition = () => this.state.menu.node && primitiveFunctions[this.state.menu.node.title];

    renderGo = () => (
        <MenuItem component={Link} to={"/primitives/" + this.state.menu.node.title} onClick={this.closeMenu}>
            Go
        </MenuItem>
    );

    initiateEdit = () => {
        this.setState(state => ({
            mode: modes.edit,
            editValue: state.menu.node.title
        }));
    }

    removeNode = () => {
        let resultTreeData = removeNodeAtPath({
            treeData: this.props.expression.treeDataHistory.present,
            path: this.state.menu.path,
            getNodeKey: ({ treeIndex }) => treeIndex
        });
        let newTreeData = resultTreeData.length === 0 ? initialTreeData : resultTreeData;
        this.addToHistory(newTreeData);
        this.closeMenu();
    };

    initiateAdd = () => {
        this.setState({
            mode: modes.add,
            editValue: ''
        });
    };

    renderEditMenu = () => (
        <Popover
            classes={{ paper: this.props.classes.popover }}
            anchorEl={this.state.menu.anchorEl}
            getContentAnchorEl={() => findDOMNode(this.editInput)}
            open={this.state.mode === modes.edit || this.state.mode === modes.add}
            onClose={() => this.saveEditMenuResult()}>
            {this.renderEditInput()}
            {Object.entries(primitiveFunctions).map(([name, info]) => this.renderFunctionMenuItem(name))}
        </Popover>
    );

    saveEditMenuResult = value => {
        let { mode, menu, editValue } = this.state;
        let { treeDataHistory } = this.props.expression;
        value = value || editValue;
        if (mode === 'edit') {
            let valueChanged = value !== menu.node.title;
            if (valueChanged) {
                this.addToHistory(changeNodeAtPath({
                    treeData: treeDataHistory.present,
                    path: menu.path,
                    newNode: { ...menu.node, title: value },
                    getNodeKey: ({ treeIndex }) => treeIndex
                }));
            }
        } else {
            if (value) {
                this.addToHistory(addNodeUnderParent({
                    treeData: treeDataHistory.present,
                    parentKey: menu.treeIndex,
                    expandParent: true,
                    newNode: { title: value },
                    getNodeKey: ({ treeIndex }) => treeIndex
                }).treeData);
            }
        }
        this.closeMenu();
    };

    renderEditInput = () => (
        <AutoSelectInput
            className={this.props.classes.editInput}
            placeholder="Enter value"
            value={this.state.editValue}
            onChange={this.handleEditInputChange}
            onKeyDown={this.handleEditInputKeyDown}
            inputProps={{ autoCapitalize: "off" }}
            ref={node => {
                this.editInput = node;
            }} />
    );

    handleEditInputChange = event => {
        this.setState({ editValue: event.target.value });
    };

    handleEditInputKeyDown = event => {
        if (event.key === 'Enter') {
            this.saveEditMenuResult();
        }
    };

    renderFunctionMenuItem = name => (
        <MenuItem key={name} onClick={this.saveEditMenuResult.bind(this, name)}>{name}</MenuItem>
    );

    closeMenu = () => {
        this.setState({ mode: modes.default });
    };

    renderBottomBar = () => (
        <Toolbar className={this.props.classes.bottomBar}>
            <Typography variant="subheading">
                {evalNode(this.props.expression.treeDataHistory.present[0]).toString()}
            </Typography>
        </Toolbar>
    );

    static createNewExpression() {
        return {
            name: "",
            treeDataHistory: {
                past: [],
                present: initialTreeData,
                future: []
            }
        };
    }
}

class AutoSelectInput extends React.Component {
    componentDidMount() {
        let element = findDOMNode(this.node);
        element.focus();
        element.select();
    }

    render = () => (
        <Input
            {...this.props}
            inputRef={node => {
                this.node = node;
            }} />
    );
}

export default withStyles(styles)(ExpressionPage);
