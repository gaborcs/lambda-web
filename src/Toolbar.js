import React from 'react';
import classNames from 'classnames';
import { withStyles } from "@material-ui/core/styles";

const height = 56;

const styles = theme => ({
    root: {
        position: 'fixed',
        zIndex: theme.zIndex.appBar,
        width: '100%',
        height,
        padding: 4,
        backgroundColor: theme.palette.background.toolbar,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    }
});

let Toolbar = ({ classes, className, children }) => (
    <div className={classNames(classes.root, className)}>
        {children}
    </div>
);

export default withStyles(styles)(Toolbar);
export { height };
