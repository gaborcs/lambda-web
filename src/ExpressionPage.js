import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withScrolling from 'react-dnd-scrollzone';
import { withStyles } from '@material-ui/core/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Popover from '@material-ui/core/Popover';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import AutoSelectInput from './AutoSelectInput';
import Toolbar from './Toolbar';
import evaluator from './evaluator';
import TreeEditor from './TreeEditor';

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
    name: {
        padding: '8px 20px',
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
    bottomBar: {
        padding: '0 16px'
    }
});

const ScrollingComponent = withScrolling('div');

class ExpressionPage extends Component {
    state = {
        renamer: { open: false }
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
            {this.renderRenamer()}
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
            {this.renderName()}
        </div>
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
                present: TreeEditor.INITIAL_TREE_DATA,
                future: []
            }
        };
    }
}

export default withStyles(styles)(ExpressionPage);
