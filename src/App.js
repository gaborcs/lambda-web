import React, { Component, Fragment } from 'react';
import { findDOMNode } from 'react-dom';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition, Preview } from 'react-dnd-multi-backend';
import withScrolling from 'react-dnd-scrollzone';
import { SortableTreeWithoutDndContext as SortableTree, changeNodeAtPath, removeNodeAtPath, addNodeUnderParent } from 'react-sortable-tree';
import { MuiThemeProvider, createMuiTheme, withStyles } from 'material-ui/styles';
import Reboot from 'material-ui/Reboot';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import UndoIcon from 'material-ui-icons/Undo';
import RedoIcon from 'material-ui-icons/Redo';
import Chip from 'material-ui/Chip';
import Menu, { MenuItem } from 'material-ui/Menu';
import Popover from 'material-ui/Popover';
import Input from 'material-ui/Input';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

const chipHeight = 32;
const minTouchTargetSize = 48;

const theme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

const styles = {
    layoutContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none'
    },
    title: {
        flex: 1
    },
    nameInput: {
        width: '100%',
        border: 0,
        outline: 0,
        backgroundColor: 'inherit',
        font: 'inherit',
        color: 'inherit'
    },
    primitiveFunctionDescription: {
        padding: 24
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
    go: {
        display: 'block',
        outline: 0,
        textDecoration: 'none'
    },
    popover: {
        padding: '8px 0'
    },
    editInput: {
        margin: '8px 16px'
    }
};

const primitiveFunctions = {
    '+': {
        description: 'Primitive function that returns the sum of numbers',
        apply: nodes => nodes.map(evalNode).reduce((a, b) => a + b, 0)
    },
    '*': {
        description: 'Primitive function that returns the product of numbers',
        apply: nodes => nodes.map(evalNode).reduce((a, b) => a * b, 1)
    }
};

const evalNode = node => {
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

const initialTreeData = [{ title: '' }];

const modes = { default: 'default', menu: 'menu', edit: 'edit', add: 'add' };

const ScrollingComponent = withScrolling('div');

class App extends Component {
    state = {
        name: "",
        treeDataHistory: {
            past: [],
            present: initialTreeData,
            future: []
        },
        mode: modes.default,
        menu: {},
        editValue: ''
    };

    undo = () => {
        this.setState(state => {
            let { past, present, future } = state.treeDataHistory;
            return {
                treeDataHistory: {
                    past: past.slice(0, past.length - 1),
                    present: past[past.length - 1],
                    future: [present, ...future]
                }
            };
        });
    };

    redo = () => {
        this.setState(state => {
            let { past, present, future } = state.treeDataHistory;
            return {
                treeDataHistory: {
                    past: [...past, present],
                    present: future[0],
                    future: future.slice(1)
                }
            };
        });
    };

    addToHistory = treeData => {
        let { past, present } = this.state.treeDataHistory;
        return {
            past: [...past, present],
            present: treeData,
            future: []
        };
    };

    render = () => (
        <Router>
            <MuiThemeProvider theme={theme}>
                <Reboot />
                <Route exact path="/:name" render={this.renderPrimitiveFunction} />
                <Route exact path="/" render={this.renderEvaluator} />
                {this.renderPreview()}
                {this.renderMenu()}
                {this.renderEditMenu()}
            </MuiThemeProvider>
        </Router>
    );

    renderPrimitiveFunction = ({ match }) => {
        let name = match.params.name;
        return (
            <div className={this.props.classes.layoutContainer}>
                {this.renderAppBarForPrimitiveFunction(name)}
                {this.renderPrimitiveFunctionDescription(primitiveFunctions[name].description)}
            </div>
        );
    };

    renderAppBarForPrimitiveFunction = name => this.renderAppBar(<Typography variant="title">{name}</Typography>);

    renderAppBar = content => (
        <AppBar position="static" elevation={0} color="default">
            <Toolbar>{content}</Toolbar>
        </AppBar>
    );

    renderPrimitiveFunctionDescription = description => (
        <Typography className={this.props.classes.primitiveFunctionDescription}>{description}</Typography>
    );

    renderEvaluator = () => (
        <div className={this.props.classes.layoutContainer}>
            {this.renderAppBarForEvaluator()}
            {this.renderScrollingContent()}
            {this.renderBottomBar()}
        </div>
    );

    renderAppBarForEvaluator = () => this.renderAppBar(
        <Fragment>
            {this.renderNameInput()}
            {this.renderUndoButton()}
            {this.renderRedoButton()}
        </Fragment>
    );

    renderNameInput = () => (
        <Typography variant="title" className={this.props.classes.title}>
            <input
                className={this.props.classes.nameInput}
                autoCapitalize="off"
                placeholder="Name"
                value={this.state.name}
                onChange={this.handleNameChange} />
        </Typography>
    );

    handleNameChange = event => {
        this.setState({ name: event.target.value });
    }

    renderUndoButton = () => (
        <IconButton disabled={this.state.treeDataHistory.past.length === 0} onClick={this.undo}>
            <UndoIcon />
        </IconButton>
    );

    renderRedoButton = () => (
        <IconButton disabled={this.state.treeDataHistory.future.length === 0} onClick={this.redo}>
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
            treeData={this.state.treeDataHistory.present}
            onChange={treeData => this.setState({ treeDataHistory: this.addToHistory(treeData) })}
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
        return connectDragSource(<div>{chip}</div>);
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

    initiateEdit = () => {
        this.setState(state => ({
            mode: modes.edit,
            editValue: state.menu.node.title
        }));
    }

    removeNode = () => {
        this.setState(state => {
            let resultTreeData = removeNodeAtPath({
                treeData: state.treeDataHistory.present,
                path: state.menu.path,
                getNodeKey: ({ treeIndex }) => treeIndex
            });
            return resultTreeData.length === 0 ? {
                treeDataHistory: this.addToHistory(initialTreeData)
            } : {
                treeDataHistory: this.addToHistory(resultTreeData)
            };
        });
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
        this.setState(state => {
            let newTreeData = state.mode === 'edit' ?
                    this.editSelectedNode(state, value) :
                    this.addNodeUnderSelected(state, value).treeData;
            return {
                treeDataHistory: this.addToHistory(newTreeData),
                mode: modes.default
            };
        })
    }

    editSelectedNode = (state, value) => {
        let { treeDataHistory, menu, editValue } = state;
        return changeNodeAtPath({
            treeData: treeDataHistory.present,
            path: menu.path,
            newNode: { ...menu.node, title: value || editValue },
            getNodeKey: ({ treeIndex }) => treeIndex
        });
    }
    
    addNodeUnderSelected = (state, value) => {
        let { treeDataHistory, menu, editValue } = state;
        return addNodeUnderParent({
            treeData: treeDataHistory.present,
            parentKey: menu.treeIndex,
            expandParent: true,
            newNode: { title: value || editValue },
            getNodeKey: ({ treeIndex }) => treeIndex
        });
    }

    renderEditInput = () => (
        <Input
            className={this.props.classes.editInput}
            autoFocus
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

    handleEditInputKeyDown = (event) => {
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

    canGoToDefinition = () => this.state.menu.node && primitiveFunctions[this.state.menu.node.title];

    renderGo = () => (
        <Link className={this.props.classes.go} to={this.state.menu.node.title} onClick={this.closeMenu}>
            <MenuItem>Go</MenuItem>
        </Link>
    );

    renderBottomBar = () => (
        <Toolbar className={this.props.classes.bottomBar}>
            <Typography variant="subheading">
                {evalNode(this.state.treeDataHistory.present[0]).toString()}
            </Typography>
        </Toolbar>
    );
}

const multiBackend = MultiBackend({
    backends: [{
        backend: HTML5Backend
    }, {
        backend: TouchBackend({
            delayTouchStart: 500
        }),
        preview: true,
        transition: TouchTransition
    }]
});

export default DragDropContext(multiBackend)(withStyles(styles)(App));
