import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { RawIntlProvider } from 'react-intl';
import { Provider as ReduxProvider } from 'react-redux';
import StyleContext from 'isomorphic-style-loader/StyleContext';
import AppContext from './AppContext';

/* eslint-disable react/forbid-prop-types, react/destructuring-assignment */
const ContextType = {
  // Enables critical path CSS rendering
  // https://github.com/kriasoft/isomorphic-style-loader
  insertCss: PropTypes.func.isRequired,
  // Universal HTTP client
  fetch: PropTypes.func.isRequired,
  pathname: PropTypes.string.isRequired,
  query: PropTypes.object,
  store: PropTypes.object.isRequired,
  // ReactIntl
  intl: PropTypes.any,
  locale: PropTypes.string,
};

class App extends Component {
  static propTypes = {
    context: PropTypes.shape(ContextType).isRequired,
    children: PropTypes.element.isRequired,
  };

  render() {
    const { context } = this.props;
    const { store, intl, insertCss } = context;

    return (
      <AppContext.Provider value={{ context }}>
        <ReduxProvider store={store}>
          <RawIntlProvider value={intl}>
            <StyleContext.Provider value={{ insertCss }}>
              {React.Children.only(this.props.children)}
            </StyleContext.Provider>
          </RawIntlProvider>
        </ReduxProvider>
      </AppContext.Provider>
    );
  }
}

export default App;
