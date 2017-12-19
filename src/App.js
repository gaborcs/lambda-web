import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
import MultiBackend, { TouchTransition, Preview } from 'react-dnd-multi-backend';
import { SortableTreeWithoutDndContext as SortableTree } from 'react-sortable-tree';
import Chip from 'material-ui/Chip';
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
        minWidth: minTouchTargetSize
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
            treeData: factorial
        };
    }

    render() {
        return (
            <div className={this.props.classes.app}>
                {this.renderSortableTree()}
                {this.renderPreview()}
            </div>
        );
    }

    renderSortableTree() {
        return (
            <SortableTree
                treeData={this.state.treeData}
                onChange={treeData => this.setState({ treeData })}
                rowHeight={minTouchTargetSize}
                scaffoldBlockPxWidth={minTouchTargetSize}
                nodeContentRenderer={this.renderNodeContent.bind(this)}
            />
        );
    }

    renderNodeContent({isDragging, connectDragSource, node}) {
        let hasChildren = node.children && node.children.length;
        return (
            <div className={this.props.classes.nodeContent}>
                {isDragging ? null : connectDragSource(<div>{this.renderChip(node.title)}</div>)}
                {hasChildren ? this.renderLineChildren() : null}
            </div>
        );
    }

    renderChip(label) {
        return <Chip className={this.props.classes.chip} label={label}/>;
    }

    renderLineChildren() {
        return (
            <div style={{
                position: 'absolute',
                backgroundColor: 'black',
                width: 1,
                left: minTouchTargetSize / 2,
                bottom: 0,
                height: (minTouchTargetSize - chipHeight) / 2
            }} />
        );
    }

    renderPreview() {
        return <Preview generator={this.generatePreview.bind(this)} />;
    }

    generatePreview(type, item, style) {
        return <div style={style}>{this.renderChip(item.node.title)}</div>;
    }
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
