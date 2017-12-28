import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition, Preview } from 'react-dnd-multi-backend';
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
    }
};

const chipFont = theme.typography.pxToRem(13) + ' ' + theme.typography.fontFamily;

const canvas = document.createElement('canvas');
const canvasContext = canvas.getContext('2d');
canvasContext.font = chipFont;

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

class App extends Component {

    constructor(props) {
        super(props);
        this.state = startingState;
    }

    render = () => (
        <MuiThemeProvider theme={theme}>
            <div className={this.props.classes.app}>
                {this.renderSortableTree()}
                {this.renderPreview()}
                {this.state.menu ? this.renderMenu() : null}
            </div>
        </MuiThemeProvider>
    );

    renderSortableTree = () => (
        <SortableTree
            treeData={this.state.treeData}
            onChange={treeData => this.setState({ treeData })}
            rowHeight={minTouchTargetSize}
            scaffoldBlockPxWidth={minTouchTargetSize}
            nodeContentRenderer={this.renderNodeContent}
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
        <input autoFocus
               value={this.state.edit.value}
               autoCapitalize='off'
               onChange={this.handleInlineEditorChange}
               onKeyDown={this.handleInlineEditorKeyDown.bind(this, node)}
               onBlur={() => this.saveInlineEditorValue(node)}
               style={{
                   border: 0,
                   outline: 0,
                   width: canvasContext.measureText(this.state.edit.value).width + 24,
                   margin: '0 -12px',
                   textAlign: 'center',
                   backgroundColor: 'inherit',
                   font: 'inherit',
                   color: 'inherit'
               }}
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
