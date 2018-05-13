import React, { Component, Fragment } from 'react';
import { Switch, Route, Link, withRouter } from 'react-router-dom';
import { MuiThemeProvider, createMuiTheme, withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import AddIcon from '@material-ui/icons/Add';
import LambdaAppBar from './LambdaAppBar';
import ExpressionPage from './ExpressionPage';
import specialForms from './specialForms';
import primitiveFunctions from './primitiveFunctions';
import initialExpressions from './initialExpressions.json';

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
    pageDescription: {
        padding: 24
    }
};

class Ui extends Component {
    state = {
        expressions: initialExpressions.map(({ name, treeData }) => ({
            name,
            treeDataHistory: { past: [], present: treeData, future: [] }
        }))
    };

    render = () => (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Switch>
                <Route exact path="/" render={this.renderHomeScreen} />
                <Route exact path="/special-forms/:name" render={this.renderSpecialFormIfFound} />
                <Route exact path="/primitive-functions/:name" render={this.renderPrimitiveFunctionIfFound} />
                <Route exact path="/expressions/:index" render={this.renderExpressionPageIfFound} />
                <Route render={this.renderPageNotFound} />
            </Switch>
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
            expressions: [ ...state.expressions, ExpressionPage.createNewExpression() ]
        }), this.redirectToNewExpression);
    };

    redirectToNewExpression = () => {
        let newExpressionIndex = this.state.expressions.length - 1;
        let newExpressionPath = this.getExpressionPath(newExpressionIndex);
        this.props.history.push(newExpressionPath);
    };

    renderSpecialFormIfFound = ({ match }) => {
        let name = decodeURIComponent(match.params.name);
        let specialForm = specialForms[name];
        return specialForm ?
            this.renderPageWithTitleAndDescription(name, specialForm.description) :
            this.renderPageWithOnlyTitle('Special form not found');
    };

    renderPrimitiveFunctionIfFound = ({ match }) => {
        let name = decodeURIComponent(match.params.name);
        let fn = primitiveFunctions[name];
        return fn ?
            this.renderPageWithTitleAndDescription(name, fn.description) :
            this.renderPageWithOnlyTitle('Primitive function not found');
    };

    renderExpressionPageIfFound = ({ match }) => {
        let expressionIndex = match.params.index;
        let expression = this.state.expressions[expressionIndex];
        return expression ?
            this.renderExpressionPage(expression, expressionIndex) :
            this.renderPageWithOnlyTitle('Expression not found');
    };

    renderExpressionPage = (expression, index) => (
        <ExpressionPage
            expressions={this.state.expressions}
            expression={expression}
            setExpression={this.setExpression.bind(this, index)} />
    );

    setExpression = (index, value) => {
        this.setState(state => ({
            expressions: Object.assign([], state.expressions, { [index]: value })
        }));
    };

    renderPageNotFound = () => this.renderPageWithOnlyTitle('Page not found');

    renderPageWithTitleAndDescription = (title, description) => (
        <Fragment>
            <LambdaAppBar>
                <Typography variant="title">{title}</Typography>
            </LambdaAppBar>
            <Typography className={this.props.classes.pageDescription}>{description}</Typography>
        </Fragment>
    );

    renderPageWithOnlyTitle = title => this.renderPageWithTitleAndDescription(title, '');
}

export default withStyles(styles)(withRouter(Ui));
