import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/withStyles';

// external-global styles must be imported in your JS.
import normalizeCss from 'normalize.css';
import s from './Layout.css';
import Header from '../Header';
import Feedback from '../Feedback';
import Footer from '../Footer';

class Layout extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  render() {
    return (
      <Fragment>
        <Header />
        {this.props.children}
        <Feedback />
        <Footer />
      </Fragment>
    );
  }
}

export default withStyles(normalizeCss, s)(Layout);
