import React, { Component, Fragment } from 'react';
import { Switch, Redirect, Route, Link, withRouter } from 'react-router-dom';
import { MuiThemeProvider, createMuiTheme, withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar, { height as toolbarHeight } from './Toolbar';
import ExpressionPage from './ExpressionPage';
import specialForms from './specialForms';
import primitiveFunctions from './primitiveFunctions';
import placeholderTreeData from './placeholderTreeData';
import { getSpecialFormPath, getPrimitiveFunctionPath, getExpressionPath } from './urlUtils';
import initialExpressions from './initialExpressions.json';

const theme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

const styles = {
    title: {
        marginLeft: 20
    },
    addButton: {
        position: 'fixed',
        right: 16,
        bottom: 16
    },
    mainContent: {
        paddingTop: toolbarHeight
    },
    pageDescription: {
        padding: 24
    }
};

const newExpression = {
    name: "",
    treeDataHistory: {
        past: [],
        present: placeholderTreeData,
        future: []
    }
};

class Ui extends Component {

    state = {
        expressions: initialExpressions.map(({ name, treeData }) => ({
            name,
            treeDataHistory: { past: [], present: treeData, future: [] }
        })),
        drawerOpen: false
    };

    toggleDrawer = () => {
        this.setState(state => ({ drawerOpen: !state.drawerOpen }));
    };

    closeDrawer = () => {
        this.setState({ drawerOpen: false });
    };

    render = () => (
        <MuiThemeProvider theme={theme}>
            <CssBaseline />
            <Switch>
                <Redirect exact from="/" to="/expressions" />
                {this.topLevelPages.map(this.renderTopLevelRoute)}
                <Route exact path="/expressions/:index" render={this.renderExpressionPageIfFound} />
                <Route exact path="/special-forms/:name" render={this.renderSpecialFormPageIfFound} />
                <Route exact path="/primitive-functions/:name" render={this.renderPrimitiveFunctionPageIfFound} />
                <Route render={this.renderPageNotFound} />
            </Switch>
        </MuiThemeProvider>
    );

    expressionsPage = {
        path: '/expressions',
        title: 'Expressions',
        renderContent: () => {
            let items = this.state.expressions.map((expression, index) => ({
                name: expression.name || 'unnamed',
                path: getExpressionPath(index)
            }));
            return (
                <Fragment>
                    {this.renderList(items)}
                    {this.renderAddNewExpressionButton()}
                </Fragment>
            );
        }
    };

    primitiveFunctionsPage = {
        path: '/primitive-functions',
        title: 'Primitive functions',
        renderContent: () => {
            let primitiveFunctionNames = Object.keys(primitiveFunctions);
            let items = primitiveFunctionNames.map(name => ({ name, path: getPrimitiveFunctionPath(name) }));
            return this.renderList(items);
        }
    };

    specialFormsPage = {
        path: '/special-forms',
        title: 'Special forms',
        renderContent: () => {
            let specialFormNames = Object.keys(specialForms);
            let items = specialFormNames.map(name => ({ name, path: getSpecialFormPath(name) }));
            return this.renderList(items);
        }
    };

    topLevelPages = [ this.expressionsPage, this.primitiveFunctionsPage, this.specialFormsPage ];

    renderList = items => <List>{items.map(this.renderListItem)}</List>;

    renderListItem = (item, index) => (
        <ListItem key={index} button component={Link} to={item.path}>
            <ListItemText primary={item.name} />
        </ListItem>
    );

    renderAddNewExpressionButton = () => (
        <Button variant="fab" color="primary" className={this.props.classes.addButton} onClick={this.addNewExpression}>
            <AddIcon />
        </Button>
    );

    addNewExpression = () => {
        this.setState(state => ({
            expressions: [ ...state.expressions, newExpression ]
        }), this.redirectToNewExpression);
    };

    redirectToNewExpression = () => {
        let newExpressionIndex = this.state.expressions.length - 1;
        let newExpressionPath = getExpressionPath(newExpressionIndex);
        this.props.history.push(newExpressionPath);
    };

    renderTopLevelRoute = (page, index) => (
        <Route key={index} exact path={page.path} render={this.renderTopLevelPage(page)} />
    );

    renderTopLevelPage = page => () => (
        <Fragment>
            <Drawer open={this.state.drawerOpen} onClose={this.closeDrawer}>{this.renderDrawerContent(page)}</Drawer>
            {this.renderAppBarWithMenuButton(page.title)}
            {this.renderMainContent(page.renderContent())}
        </Fragment>
    );

    renderDrawerContent = page => {
        let renderDrawerItem = (item, index) => (
            <MenuItem key={index} selected={item === page} component={Link} to={item.path} onClick={this.closeDrawer}>
                {item.title}
            </MenuItem>
        );
        return <MenuList>{this.topLevelPages.map(renderDrawerItem)}</MenuList>;
    };

    renderAppBarWithMenuButton = title => this.renderAppBar(this.renderMenuButton(), title);

    renderAppBar = (navButton, title) => (
        <Toolbar>
            {navButton}
            <Typography variant="title" className={this.props.classes.title}>{title}</Typography>
        </Toolbar>
    );

    renderMenuButton = () => <IconButton onClick={this.toggleDrawer}><MenuIcon /></IconButton>;

    renderMainContent = content => <div className={this.props.classes.mainContent}>{content}</div>;

    renderExpressionPageIfFound = ({ match }) => {
        let expressionIndex = match.params.index;
        let expression = this.state.expressions[expressionIndex];
        return expression
            ? this.renderExpressionPage(expression, expressionIndex)
            : this.renderExpressionAppBar('Expression not found');
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

    renderExpressionAppBar = title => this.renderAppBarWithUpButton('/expressions', title);

    renderSpecialFormPageIfFound = ({ match }) => {
        let name = decodeURIComponent(match.params.name);
        let specialForm = specialForms[name];
        return specialForm
            ? this.renderSpecialFormPage(name, specialForm.description)
            : this.renderSpecialFormAppBar('Special form not found');
    };

    renderSpecialFormPage = (name, description) => {
        return this.renderDescriptionPage(this.renderSpecialFormAppBar(name), description);
    };

    renderSpecialFormAppBar = title => this.renderAppBarWithUpButton('/special-forms', title);

    renderAppBarWithUpButton = (upPath, title) => this.renderAppBar(this.renderUpButton(upPath), title);

    renderUpButton = path => <IconButton component={Link} to={path}><ArrowBackIcon /></IconButton>;

    renderPrimitiveFunctionPageIfFound = ({ match }) => {
        let name = decodeURIComponent(match.params.name);
        let fn = primitiveFunctions[name];
        return fn
            ? this.renderPrimitiveFunctionPage(name, fn.description)
            : this.renderPrimitiveFunctionAppBar('Primitive function not found');
    };

    renderPrimitiveFunctionPage = (name, description) => {
        return this.renderDescriptionPage(this.renderPrimitiveFunctionAppBar(name), description);
    };

    renderPrimitiveFunctionAppBar = title => this.renderAppBarWithUpButton('/primitive-functions', title);

    renderPageNotFound = () => this.renderAppBarWithMenuButton('Page not found');

    renderDescriptionPage = (appBar, description) => (
        <Fragment>
            {appBar}
            {this.renderMainContent(this.renderDescription(description))}
        </Fragment>
    );

    renderDescription = description => (
        <Typography className={this.props.classes.pageDescription}>{description}</Typography>
    );
}

export default withStyles(styles)(withRouter(Ui));
