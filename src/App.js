import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import MultiBackend from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/lib/HTML5toTouch';
import { SortableTreeWithoutDndContext as SortableTree } from 'react-sortable-tree';
import Chip from 'material-ui/Chip';
import { withStyles } from 'material-ui/styles';

const chipHeight = 32;
const margin = 8;

const styles = {
    chip: {
        minWidth: chipHeight,
        margin
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
            <SortableTree
                treeData={this.state.treeData}
                onChange={treeData => this.setState({ treeData })}
                rowHeight={chipHeight + 2 * margin}
                nodeContentRenderer={this.renderNodeContent.bind(this)}
            />
        );
    }

    renderNodeContent({isDragging, connectDragSource, node}) {
        return isDragging ? null : connectDragSource(this.renderChip(node.title));
    }

    renderChip(label) {
        return <div><Chip className={this.props.classes.chip} label={label}/></div>;
    }
}

export default DragDropContext(MultiBackend(HTML5toTouch))(withStyles(styles)(App));
