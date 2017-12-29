import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition, Preview } from 'react-dnd-multi-backend';
import withScrolling from 'react-dnd-scrollzone';
import { SortableTreeWithoutDndContext as SortableTree, removeNodeAtPath, addNodeUnderParent } from 'react-sortable-tree';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import Chip from 'material-ui/Chip';
import Menu, { MenuItem } from 'material-ui/Menu';
import { withStyles } from 'material-ui/styles';

const chipHeight = 32;
const minTouchTargetSize = 48;

const theme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

const styles = {
    app: {
        height: '100%',
        backgroundColor: theme.palette.background.default,
        userSelect: 'none'
    },
    scrollingComponent: {
        height: '100%',
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
    inlineEditor: {
        position: 'relative'
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
    }
};

const startingState = {
    treeData: [{
        title: ''
    }],
    menu: null,
    edit: {
        treeIndex: 0,
        value: ''
    }
};

const ScrollingComponent = withScrolling('div');

class App extends Component {

    constructor(props) {
        super(props);
        this.state = startingState;
    }

    render = () => (
        <MuiThemeProvider theme={theme}>
            <div className={this.props.classes.app}>
                {this.renderScrollingSortableTree()}
                {this.renderPreview()}
                {this.state.menu ? this.renderMenu() : null}
            </div>
        </MuiThemeProvider>
    );

    renderScrollingSortableTree = () => (
        <ScrollingComponent className={this.props.classes.scrollingComponent}>
            {this.renderSortableTree()}
        </ScrollingComponent>
    );

    renderSortableTree = () => (
        <SortableTree
            treeData={this.state.treeData}
            onChange={treeData => this.setState({ treeData })}
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
            {nodeRendererProps.isDragging ?
             null :
             nodeRendererProps.connectDragSource(<div>{this.renderChip(nodeRendererProps)}</div>)}
            {this.hasChildren(nodeRendererProps.node) ? this.renderLineChildren() : null}
        </div>
    );

    renderChip = ({ node, path, treeIndex }) => {
        let classes = {
            root: this.props.classes.chip
        };
        let isEditing = this.state.edit && treeIndex === this.state.edit.treeIndex;
        let label = isEditing ? this.renderInlineEditor(node) : node.title;
        let handleClick = isEditing ? null : event => this.openMenu(node, path, treeIndex, event.currentTarget);
        return <Chip classes={classes} label={label} onClick={handleClick} />;
    };

    renderInlineEditor = node => (
        <span className={this.props.classes.inlineEditor}>
            {this.renderInlineEditorSizer()}
            {this.renderInlineEditorInput(node)}
        </span>
    );

    renderInlineEditorSizer = () => (
        <span className={this.props.classes.inlineEditorSizer}>{this.state.edit.value || 'a'}</span>
    );

    renderInlineEditorInput = node => (
        <input className={this.props.classes.inlineEditorInput}
               value={this.state.edit.value}
               autoFocus
               autoCapitalize='off'
               onChange={this.handleInlineEditorChange}
               onKeyDown={this.handleInlineEditorKeyDown.bind(this, node)}
               onBlur={() => this.saveInlineEditorValue(node)}
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

    handleInlineEditorKeyDown = (node, event) => {
        switch (event.key) {
            case 'Enter':
                this.saveInlineEditorValue(node);
                break;
            case 'Escape':
                this.setState({ edit: null });
                break;
            default:
                return;
        }
    };

    saveInlineEditorValue = node => {
        node.title = this.state.edit.value;
        this.setState({
            edit: null
        });
    };

    openMenu = (node, path, treeIndex, anchorEl) => {
        this.setState({
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
        <Menu anchorEl={this.state.menu.anchorEl} open={true} onClose={this.closeMenu}>
            <MenuItem onClick={this.editNode}>Edit</MenuItem>
            <MenuItem onClick={this.removeNode}>Remove</MenuItem>
            <MenuItem onClick={this.addChildNode}>Add child</MenuItem>
        </Menu>
    );

    closeMenu = () => {
        this.setState({
            menu: null
        });
    };

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
                treeData: state.treeData,
                path: state.menu.path,
                getNodeKey: ({ treeIndex }) => treeIndex
            });
            return resultTreeData.length === 0 ? startingState : { treeData: resultTreeData };
        });
        this.closeMenu();
    };

    addChildNode = () => {
        this.setState(state => {
            let result = addNodeUnderParent({
                treeData: state.treeData,
                parentKey: state.menu.treeIndex,
                expandParent: true,
                getNodeKey: ({ treeIndex }) => treeIndex,
                newNode: {
                    title: ''
                }
            });
            return {
                treeData: result.treeData,
                edit: {
                    treeIndex: result.treeIndex,
                    value: ''
                }
            };
        });
        this.closeMenu();
    };
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
