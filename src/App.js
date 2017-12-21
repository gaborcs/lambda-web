import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition, Preview } from 'react-dnd-multi-backend';
import { SortableTreeWithoutDndContext as SortableTree, removeNodeAtPath } from 'react-sortable-tree';
import Menu, { MenuItem } from 'material-ui/Menu';
import { withStyles } from 'material-ui/styles';

const chipHeight = 32;
const minTouchTargetSize = 48;

const styles = {
    app: {
        height: '100%',
        userSelect: 'none'
    },
    nodeContent: {
        height: '100%',
        display: 'flex',
        alignItems: 'center'
    },
    chip: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: chipHeight,
        padding: '0 12px',
        minWidth: minTouchTargetSize,
        borderRadius: chipHeight / 2,
        fontSize: '.875rem',
        backgroundColor: '#424242',
        color: '#fff'
    },
    lineChildren: {
        position: 'absolute',
        width: 1,
        left: minTouchTargetSize / 2,
        bottom: 0,
        height: (minTouchTargetSize - chipHeight) / 2
    }
};

const factorial = [{
    title: 'fn',
    expanded: true,
    children: [{
        title: 'n'
    }, {
        title: 'if',
        expanded: true,
        children: [{
            title: '=',
            expanded: true,
            children: [{
                title: 'n'
            }, {
                title: 0
            }]
        }, {
            title: 1
        }, {
            title: '*',
            expanded: true,
            children: [{
                title: 'n'
            }, {
                title: 'factorial',
                expanded: true,
                children: [{
                    title: '-',
                    expanded: true,
                    children: [{
                        title: 'n'
                    }, {
                        title: 1
                    }]
                }]
            }]
        }]
    }]
}];

class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            treeData: factorial,
            menu: null
        };
    }

    render = () => (
        <div className={this.props.classes.app}>
            {this.renderSortableTree()}
            {this.renderPreview()}
            {this.state.menu ? this.renderMenu() : null}
        </div>
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

    renderNodeContent = ({isDragging, connectDragSource, node, path}) => (
        <div className={this.props.classes.nodeContent}>
            {isDragging ?
             null :
             connectDragSource(<div>{this.renderChip(node.title, this.handleChipClick.bind(this, path))}</div>)}
            {this.hasChildren(node) ? this.renderLineChildren() : null}
        </div>
    );

    renderChip = (label, onClick) => <div className={this.props.classes.chip} onClick={onClick}>{label}</div>;

    handleChipClick = (path, event) => {
        this.setState({
            menu: {
                path,
                anchorEl: event.currentTarget
            }
        });
    }

    hasChildren = node => node.children && node.children.length;

    renderLineChildren = () => <div className={'custom-line-color ' + this.props.classes.lineChildren} />;

    renderPreview = () => <Preview generator={this.generatePreview} />;

    generatePreview = (type, item, style) => <div style={style}>{this.renderChip(item.node.title)}</div>;

    renderMenu = () => (
        <Menu anchorEl={this.state.menu.anchorEl} open={true} onClose={this.closeMenu}>
            <MenuItem onClick={this.removeNode}>Remove</MenuItem>
        </Menu>
    );

    closeMenu = () => {
        this.setState({
            menu: null
        });
    };

    removeNode = () => {
        this.setState(state => ({
            treeData: removeNodeAtPath({
                treeData: state.treeData,
                path: state.menu.path,
                getNodeKey: ({ treeIndex }) => treeIndex
            })
        }));
        this.closeMenu();
    };
}

const multiBackend = MultiBackend({
    backends: [{
        backend: HTML5Backend
    }, {
        backend: TouchBackend({delayTouchStart: 1000}),
        preview: true,
        transition: TouchTransition
    }]
});

export default DragDropContext(multiBackend)(withStyles(styles)(App));
