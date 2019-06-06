import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/withStyles';
import s from './ErrorPage.css';

class ErrorPage extends Component {
  static propTypes = {
    error: PropTypes.shape({
      name: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      stack: PropTypes.string.isRequired,
    }),
  };

  static defaultProps = {
    error: null,
  };

  render() {
    if (__DEV__ && this.props.error) {
      return (
        <Fragment>
          <h1>{this.props.error.name}</h1>
          <pre>{this.props.error.stack}</pre>
        </Fragment>
      );
    }

    return (
      <Fragment>
        <h1>Error</h1>
        <p>Sorry, a critical error occurred on this page.</p>
      </Fragment>
    );
  }
}

export { ErrorPage as ErrorPageWithoutStyle };
export default withStyles(s)(ErrorPage);
