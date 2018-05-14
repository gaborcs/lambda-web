import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { Link } from 'react-router-dom';
import { Preview } from 'react-dnd-multi-backend';
import withScrolling from 'react-dnd-scrollzone';
import { SortableTreeWithoutDndContext as SortableTree, changeNodeAtPath, removeNodeAtPath, addNodeUnderParent, getFlatDataFromTree } from 'react-sortable-tree';
import { withStyles } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';
import indigo from '@material-ui/core/colors/indigo';
import lightBlue from '@material-ui/core/colors/lightBlue';
import green from '@material-ui/core/colors/green';
import grey from '@material-ui/core/colors/grey';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Chip from '@material-ui/core/Chip';
import Toolbar from '@material-ui/core/Toolbar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import InfoIcon from '@material-ui/icons/Info';
import InfoOutlineIcon from '@material-ui/icons/InfoOutline';
import LambdaAppBar from './LambdaAppBar';
import evaluator from './evaluator';
import primitiveFunctions from './primitiveFunctions';
import specialForms from './specialForms';

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
        root: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            userSelect: 'none'
        },
        name: {
            padding: 8,
            marginLeft: -8,
            overflow: 'hidden'
        },
        appBarButtons: {
            flex: '0 0 auto'
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
        bottomBar: {
            backgroundColor: theme.palette.grey[900]
        },
        popover: {
            padding: '8px 0'
        },
        editMenu: {
            width: 450,
            maxHeight: 'calc(100% - 80px)' // leave space to click outside to dismiss
        },
        editInput: {
            margin: '8px 16px'
        },
        editInfo: {
            padding: '8px 16px 0'
        }
    };
};

const initialTreeData = [{ type: 'placeholder', value: '' }];

const modes = { default: 'default', menu: 'menu', edit: 'edit', add: 'add' };

const ScrollingComponent = withScrolling('div');

const preventDefault = event => {
    event.preventDefault();
};

class ExpressionPage extends Component {
    state = {
        renamer: { open: false },
        mode: modes.default,
        menu: {},
        editValue: '',
        editInfoOpen: false,
        variables: [] // stored as state to avoid changing them before the menu animation finishes
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
            {this.renderAppBarButtons()}
        </LambdaAppBar>
    );

    renderName = () => (
        <ButtonBase className={this.props.classes.name} title="Rename" onClick={this.openRenamer}>
            <Typography variant="title" noWrap>{this.props.expression.name || "unnamed"}</Typography>
        </ButtonBase>
    );

    openRenamer = event => {
        this.setState({
            renamer: { open: true, anchorEl: event.currentTarget, value: this.props.expression.name }
        });
    };

    renderAppBarButtons = () => (
        <div className={this.props.classes.appBarButtons}>
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
            root: this.props.classes.chip,
            label: this.getChipLabelClass(node.type)
        };
        let label = this.getNodeLabel(node);
        let handleClick = event => this.openMenu(node, path, treeIndex, event.currentTarget);
        let chip = <Chip classes={classes} label={label} onClick={handleClick} />;
        // the drag source is an anchor tag since it seems to cause a vibration on long press
        return connectDragSource(
            <a className={this.props.classes.dragSource} onContextMenu={preventDefault}>{chip}</a>
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
                return this.props.expressions[node.value].name;
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

    renderRenamer = () => (
        <Popover
            classes={{ paper: this.props.classes.renamer }}
            anchorEl={this.state.renamer.anchorEl}
            open={this.state.renamer.open}
            onClose={this.closeRenamer}
            marginThreshold={0}>
            {this.renderRenamerTextField()}
        </Popover>
    );

    closeRenamer = () => {
        this.setState(state => ({
            renamer: { ...state.renamer, open: false }
        }));
    };

    saveRenameResult = () => {
        this.props.setExpression({
            name: this.state.renamer.value,
            treeDataHistory: this.props.expression.treeDataHistory
        });
        this.closeRenamer();
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
        if (!node) {
            return null;
        }
        switch (node.type) {
            case 'special':
                return '/special-forms/' + encodeURIComponent(node.value);
            case 'primitive':
                return '/primitive-functions/' + encodeURIComponent(node.value);
            case 'expression':
                return '/expressions/' + node.value;
            default:
                return null;
        }
    };

    initiateEdit = () => {
        this.setState(state => ({
            mode: modes.edit,
            editValue: this.getNodeLabel(state.menu.node),
            variables: this.getVariables()
        }));
    };

    getVariables = () => {
        let flatData = getFlatDataFromTree({
            treeData: this.props.expression.treeDataHistory.present,
            getNodeKey: ({ treeIndex }) => treeIndex
        });
        let nodes = flatData.map(({ node }) => node);
        let functionNodes = nodes.filter(node => node.type === 'function');
        return functionNodes.map(node => node.value);
    };

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
            editValue: '',
            variables: this.getVariables()
        });
    };

    renderEditMenu = () => (
        <Popover
            classes={{ paper: `${this.props.classes.popover} ${this.props.classes.editMenu}` }}
            anchorEl={this.state.menu.anchorEl}
            getContentAnchorEl={() => findDOMNode(this.editInput)}
            open={this.state.mode === modes.edit || this.state.mode === modes.add}
            onClose={this.closeMenu}>
            {this.renderEditInput()}
            {this.state.editInfoOpen ? this.renderEditInfo() : this.renderEditMenuItems()}
        </Popover>
    );

    saveEditMenuResult = (type, value) => {
        let { mode, menu, editValue } = this.state;
        let { treeDataHistory } = this.props.expression;
        if (!type) {
            if (editValue.startsWith(lambdaChar)) {
                type = 'function';
                value = editValue.substr(1);
            } else if (isNaN(editValue)) {
                type = 'placeholder';
                value = editValue;
            } else {
                type = 'number';
                value = +editValue;
            }
        }
        if (mode === 'edit') {
            let valueChanged = type !== menu.node.type || value !== menu.node.value;
            if (valueChanged) {
                this.addToHistory(changeNodeAtPath({
                    treeData: treeDataHistory.present,
                    path: menu.path,
                    newNode: { ...menu.node, type, value },
                    getNodeKey: ({ treeIndex }) => treeIndex
                }));
            }
        } else {
            if (value !== '') {
                this.addToHistory(addNodeUnderParent({
                    treeData: treeDataHistory.present,
                    parentKey: menu.treeIndex,
                    expandParent: true,
                    newNode: { type, value },
                    getNodeKey: ({ treeIndex }) => treeIndex
                }).treeData);
            }
        }
        this.closeMenu();
    };

    renderEditInput = () => (
        <div className={this.props.classes.editInput}>
            <AutoSelectInput
                fullWidth
                value={this.state.editValue}
                onChange={this.handleEditInputChange}
                onKeyDown={this.handleEditInputKeyDown}
                inputProps={{ autoCapitalize: "off" }}
                endAdornment={this.renderEditInputAdornment()}
                ref={node => {
                    this.editInput = node;
                }} />
        </div>
    );

    handleEditInputChange = event => {
        let { value } = event.target;
        this.setState({
            editValue: value === '.' ? lambdaChar : value
        });
    };

    handleEditInputKeyDown = event => {
        if (event.key === 'Enter') {
            this.saveEditMenuResult();
        }
    };

    renderEditInputAdornment = () => (
        <InputAdornment position="end">
            <IconButton onClick={this.toggleEditInfo} onMouseDown={preventDefault}>
                {this.state.editInfoOpen ? <InfoIcon /> : <InfoOutlineIcon />}
            </IconButton>
        </InputAdornment>
    );

    toggleEditInfo = () => {
        this.setState(state => ({
            editInfoOpen: !state.editInfoOpen
        }));
    };

    renderEditInfo = () => (
        <div className={this.props.classes.editInfo}>
            <Typography variant="subheading" gutterBottom>Valid inputs</Typography>
            <Typography gutterBottom>Numbers: just enter the number</Typography>
            <Typography gutterBottom>References: select from the autocomplete list</Typography>
            <Typography gutterBottom>Function signatures: start with ".", then enter the parameter name</Typography>
        </div>
    );

    renderEditMenuItems = () => this.getEditMenuItems().map(this.renderEditMenuItem);

    getEditMenuItems = () => this.getAllPossibleEditMenuItems().filter(this.matchesSearch);

    getAllPossibleEditMenuItems = () => [
        ...this.state.variables.map(variable => ({ name: variable, type: 'variable', value: variable })),
        ...Object.entries(specialForms).map(([name, info]) => ({ name, type: 'special', value: name })),
        ...Object.entries(primitiveFunctions).map(([name, info]) => ({ name, type: 'primitive', value: name })),
        ...this.props.expressions
                .map((expression, index) => ({ name: expression.name, type: 'expression', value: index }))
                .filter(item => item.name)
    ];

    matchesSearch = item => item.name.startsWith(this.state.editValue);

    renderEditMenuItem = (item, index) => (
        <MenuItem key={index} onClick={this.saveEditMenuResult.bind(this, item.type, item.value)}>
            {item.name}
        </MenuItem>
    );

    closeMenu = () => {
        this.setState({ mode: modes.default });
    };

    renderBottomBar = () => (
        <Toolbar className={this.props.classes.bottomBar}>
            <Typography variant="subheading">
                {this.eval().toString()}
            </Typography>
        </Toolbar>
    );

    eval = () => {
        let expressionNodes = this.props.expressions.map(this.getExpressionNode);
        let evalNode = evaluator(expressionNodes);
        let node = this.getExpressionNode(this.props.expression);
        try {
            let value = evalNode(node);
            return typeof value === 'function' ? lambdaChar : value;
        } catch (e) {
            return e.message;
        }
    };

    getExpressionNode = expression => expression.treeDataHistory.present[0];

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
