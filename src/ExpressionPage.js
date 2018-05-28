import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withScrolling from 'react-dnd-scrollzone';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import Toolbar from './Toolbar';
import RenamableTitle from './RenamableTitle';
import TreeEditor from './TreeEditor';
import evaluator from './evaluator';

const lambdaChar = '\u03BB';

const styles = ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none'
    },
    appBarLeft: {
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex'
    },
    appBarButtons: {
        flex: '0 0 auto'
    },
    scrollingComponent: {
        flex: 1,
        padding: '8px 0',
        overflow: 'auto'
    },
    bottomBar: {
        padding: '0 16px'
    }
});

const ScrollingComponent = withScrolling('div');

class ExpressionPage extends Component {

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
        </div>
    );

    renderAppBar = () => (
        <Toolbar>
            {this.renderAppBarLeft()}
            {this.renderAppBarRight()}
        </Toolbar>
    );

    renderAppBarLeft = () => (
        <div className={this.props.classes.appBarLeft}>
            <IconButton component={Link} to="/expressions"><ArrowBackIcon /></IconButton>
            <RenamableTitle name={this.props.expression.name} setName={this.setName} />
        </div>
    );

    setName = name => {
        this.props.setExpression({
            name,
            treeDataHistory: this.props.expression.treeDataHistory
        });
    };

    renderAppBarRight = () => (
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
            {this.renderTreeEditor()}
        </ScrollingComponent>
    );

    renderTreeEditor = () => (
        <TreeEditor
            expressionNames={this.props.expressions.map(expr => expr.name)}
            treeData={this.props.expression.treeDataHistory.present}
            setTreeData={this.addToHistory} />
    );

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
}

export default withStyles(styles)(ExpressionPage);
