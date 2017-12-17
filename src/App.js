import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import MultiBackend from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/lib/HTML5toTouch';
import { SortableTreeWithoutDndContext as SortableTree } from 'react-sortable-tree';

const factorial = [{
    title: 'fn',
    children: [{
        title: 'n'
    }, {
        title: 'if',
        children: [{
            title: '=',
            children: [{
                title: 'n'
            }, {
                title: 0
            }]
        }, {
            title: 1
        }, {
            title: '*',
            children: [{
                title: 'n'
            }, {
                title: 'factorial',
                children: [{
                    title: '-',
                    children: [{
                        title: 'n',
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
            />
        );
    }
}

export default DragDropContext(MultiBackend(HTML5toTouch))(App);
