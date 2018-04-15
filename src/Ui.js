import React, { Component } from 'react';
import { MuiThemeProvider, createMuiTheme, withStyles } from 'material-ui/styles';
import CssBaseline from 'material-ui/CssBaseline';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import AddIcon from 'material-ui-icons/Add';
import List, { ListItem, ListItemText } from 'material-ui/List';
import { Route, Link, withRouter } from 'react-router-dom';
import LambdaAppBar from './LambdaAppBar';
import ExpressionPage from './ExpressionPage';
import primitiveFunctions from './primitiveFunctions';

const theme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

const styles = {
    layoutContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    addButton: {
        position: 'absolute',
        right: 16,
        bottom: 16
    },
    primitiveFunctionDescription: {
        padding: 24
    }
};

class Ui extends Component {
    state = {
        expressions: []
    };

    render = () => (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Route exact path="/" render={this.renderHomeScreen} />
            <Route exact path="/primitives/:name" render={this.renderPrimitiveFunction} />
            <Route exact path="/expressions/:index" render={this.renderExpressionPage} />
        </MuiThemeProvider>
    );

    renderHomeScreen = () => (
        <div className={this.props.classes.layoutContainer}>
            <LambdaAppBar><Typography variant="title">Expressions</Typography></LambdaAppBar>
            {this.renderExpressions()}
            {this.renderAddNewExpressionButton()}
        </div>
    );

    renderExpressions = () => (
        <List>
            {this.state.expressions.map(this.renderExpression)}
        </List>
    );

    renderExpression = (expression, index) => (
        <ListItem key={index} button component={Link} to={this.getExpressionPath(index)}>
            <ListItemText primary={expression.name || 'unnamed'} />
        </ListItem>
    );

    getExpressionPath = index => `/expressions/${index}`;

    renderAddNewExpressionButton = () => (
        <Button variant="fab" color="primary" className={this.props.classes.addButton} onClick={this.addNewExpression}>
            <AddIcon />
        </Button>
    );

    addNewExpression = () => {
        this.setState(state => ({
            expressions: [ ExpressionPage.createNewExpression(), ...state.expressions ]
        }), this.redirectToNewExpression);
    };

    redirectToNewExpression = () => {
        let newExpressionIndex = this.state.expressions.length - 1;
        let newExpressionPath = this.getExpressionPath(newExpressionIndex);
        this.props.history.push(newExpressionPath);
    }

    renderPrimitiveFunction = ({ match }) => {
        let name = match.params.name;
        return (
            <div className={this.props.classes.layoutContainer}>
                <LambdaAppBar><Typography variant="title">{name}</Typography></LambdaAppBar>
                {this.renderPrimitiveFunctionDescription(primitiveFunctions[name].description)}
            </div>
        );
    };

    renderPrimitiveFunctionDescription = description => (
        <Typography className={this.props.classes.primitiveFunctionDescription}>{description}</Typography>
    );

    renderExpressionPage = ({ match }) => {
        let expressionIndex = match.params.index;
        return (
            <ExpressionPage
                expression={this.state.expressions[expressionIndex]}
                setExpression={this.setExpression.bind(this, expressionIndex)} />
        );
    };

    setExpression = (index, value) => {
        this.setState(state => ({
            expressions: Object.assign([], state.expressions, { [index]: value })
        }));
    };
}

export default withStyles(styles)(withRouter(Ui));
