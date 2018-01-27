import React, { Component, Fragment } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition, Preview } from 'react-dnd-multi-backend';
import withScrolling from 'react-dnd-scrollzone';
import { SortableTreeWithoutDndContext as SortableTree, changeNodeAtPath, removeNodeAtPath, addNodeUnderParent } from 'react-sortable-tree';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import Reboot from 'material-ui/Reboot';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import UndoIcon from 'material-ui-icons/Undo';
import RedoIcon from 'material-ui-icons/Redo';
import Chip from 'material-ui/Chip';
import Menu, { MenuItem } from 'material-ui/Menu';
import { withStyles } from 'material-ui/styles';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

const chipHeight = 32;
const minTouchTargetSize = 48;

const theme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

const styles = {
    scrollingComponent: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
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
    tree: {
        flex: 1,
        padding: '8px 0'
    },
    nodeContent: {
        height: '100%',
        display: 'flex',
        alignItems: 'center'
    },
    chip: {
        minWidth: minTouchTargetSize
    },
    inlineEditor: {
        position: 'relative',
        boxSizing: 'content-box' // needed for sizing the input
    },
    inlineEditorSizer: {
        color: 'transparent'
    },
    inlineEditorInput: {
        position: 'absolute',
        left: -12,
        top: -8,
        padding: '8px 0',
        width: 'calc(100% + 24px)',
        height: '100%',
        border: 0,
        outline: 0,
        textAlign: 'center',
        backgroundColor: 'inherit',
        font: 'inherit',
        color: 'inherit'
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
        backgroundColor: theme.palette.background.appBar
    },
    go: {
        outline: 0,
        textDecoration: 'none'
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
const initialEdit = { treeIndex: 0, value: '' };

const ScrollingComponent = withScrolling('div');

class App extends Component {
    state = {
        name: "",
        treeDataHistory: {
            past: [],
            present: initialTreeData,
            future: []
        },
        menu: { open: false },
        edit: initialEdit
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
                {this.renderScrollingContent()}
                {this.renderPreview()}
                {this.renderMenu()}
            </MuiThemeProvider>
        </Router>
    );

    renderScrollingContent = () => (
        <ScrollingComponent className={this.props.classes.scrollingComponent}>
            <Route exact path="/:name" render={this.renderPrimitiveFunction} />
            <Route exact path="/" render={this.renderEvaluator} />
        </ScrollingComponent>
    );

    renderPrimitiveFunction = ({ match }) => {
        let name = match.params.name;
        return (
            <Fragment>
                {this.renderAppBarForPrimitiveFunction(name)}
                {this.renderPrimitiveFunctionDescription(primitiveFunctions[name].description)}
            </Fragment>
        );
    };

    renderAppBarForPrimitiveFunction = name => this.renderAppBar(<Typography type="title">{name}</Typography>);

    renderAppBar = content => (
        <AppBar position="static" elevation={0} color="default">
            <Toolbar>{content}</Toolbar>
        </AppBar>
    );

    renderPrimitiveFunctionDescription = description => (
        <Typography className={this.props.classes.primitiveFunctionDescription}>{description}</Typography>
    );

    renderEvaluator = () => (
        <Fragment>
            {this.renderAppBarForEvaluator()}
            {this.renderSortableTree()}
            {this.renderBottomBar()}
        </Fragment>
    );

    renderAppBarForEvaluator = () => this.renderAppBar(
        <Fragment>
            {this.renderNameInput()}
            {this.renderUndoButton()}
            {this.renderRedoButton()}
        </Fragment>
    );

    renderNameInput = () => (
        <Typography type="title" className={this.props.classes.title}>
            <input
                className={this.props.classes.nameInput}
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

    renderSortableTree = () => (
        <SortableTree
            className={this.props.classes.tree}
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
        let isEditing = this.state.edit && treeIndex === this.state.edit.treeIndex;
        let label = isEditing ? this.renderInlineEditor(path, node) : node.title;
        let handleClick = isEditing ? null : event => this.openMenu(node, path, treeIndex, event.currentTarget);
        let chip = <Chip classes={classes} label={label} onClick={handleClick} />;
        return isEditing ? chip : connectDragSource(<div>{chip}</div>);
    };

    renderInlineEditor = (path, node) => (
        <span className={this.props.classes.inlineEditor}>
            {this.renderInlineEditorSizer()}
            {this.renderInlineEditorInput(path, node)}
        </span>
    );

    renderInlineEditorSizer = () => (
        <span className={this.props.classes.inlineEditorSizer}>{this.state.edit.value || 'a'}</span>
    );

    renderInlineEditorInput = (path, node) => (
        <input className={this.props.classes.inlineEditorInput}
               value={this.state.edit.value}
               autoFocus
               autoCapitalize='off'
               onChange={this.handleInlineEditorChange}
               onKeyDown={this.handleInlineEditorKeyDown.bind(this, path, node)}
               onBlur={() => this.saveInlineEditorValue(path, node)}
        />
    );

    handleInlineEditorChange = event => {
        let value = event.target.value;
        this.setState(state => ({
            edit: {
                treeIndex: state.edit.treeIndex,
                value
            }
        }));
    };

    handleInlineEditorKeyDown = (path, node, event) => {
        switch (event.key) {
            case 'Enter':
                this.saveInlineEditorValue(path, node);
                break;
            case 'Escape':
                this.setState({ edit: null });
                break;
            default:
                return;
        }
    };

    saveInlineEditorValue = (path, node) => {
        this.setState(state => {
            let newTreeData = changeNodeAtPath({
                treeData: state.treeDataHistory.present,
                path,
                newNode: {...node, title: state.edit.value},
                getNodeKey: ({ treeIndex }) => treeIndex
            });
            return {
                treeDataHistory: this.addToHistory(newTreeData),
                edit: null
            };
        })
    };

    openMenu = (node, path, treeIndex, anchorEl) => {
        this.setState({
            menu: { open: true, node, path, treeIndex, anchorEl }
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
              open={this.state.menu.open}
              onClose={this.closeMenu}
              disableRestoreFocus>
            {this.canGoToDefinition() && this.renderGo()}
            <MenuItem onClick={this.editNode}>Edit</MenuItem>
            <MenuItem onClick={this.removeNode}>Delete</MenuItem>
            <MenuItem onClick={this.addChildNode}>Add child</MenuItem>
        </Menu>
    );

    closeMenu = () => {
        this.setState(state => ({
            menu: {
                ...this.state.menu, // this data is still needed for the close transition
                open: false
            }
        }));
    };

    canGoToDefinition = () => this.state.menu.node && primitiveFunctions[this.state.menu.node.title];

    renderGo = () => (
        <Link className={this.props.classes.go} to={this.state.menu.node.title} onClick={this.closeMenu}>
            <MenuItem>Go</MenuItem>
        </Link>
    );

    editNode = () => {
        this.setState(state => ({
            edit: {
                treeIndex: state.menu.treeIndex,
                value: state.menu.node.title
            }
        }));
        this.closeMenu();
    }

    removeNode = () => {
        this.setState(state => {
            let resultTreeData = removeNodeAtPath({
                treeData: state.treeDataHistory.present,
                path: state.menu.path,
                getNodeKey: ({ treeIndex }) => treeIndex
            });
            return resultTreeData.length === 0 ? {
                treeDataHistory: this.addToHistory(initialTreeData),
                edit: initialEdit
            } : {
                treeDataHistory: this.addToHistory(resultTreeData)
            };
        });
        this.closeMenu();
    };

    addChildNode = () => {
        this.setState(state => {
            let result = addNodeUnderParent({
                treeData: state.treeDataHistory.present,
                parentKey: state.menu.treeIndex,
                expandParent: true,
                getNodeKey: ({ treeIndex }) => treeIndex,
                newNode: {
                    title: ''
                }
            });
            return {
                treeDataHistory: this.addToHistory(result.treeData),
                edit: {
                    treeIndex: result.treeIndex,
                    value: ''
                }
            };
        });
        this.closeMenu();
    };

    renderBottomBar = () => (
        <Toolbar className={this.props.classes.bottomBar}>
            <Typography type="subheading">
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
