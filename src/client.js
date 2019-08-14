import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import deepForceUpdate from 'react-deep-force-update';
import queryString from 'query-string';
import { createPath } from 'history';
import { createIntl, createIntlCache } from 'react-intl';

import App from './components/App';
import createFetch from './core/createFetch';
import configureStore from './store/configureStore';
import { updateMeta } from './core/DOMUtils';
import router from './core/router';
import history from './core/history';

const readyStates = new Set(['complete', 'loaded', 'interactive']);

// Universal HTTP client
const fetch = createFetch(window.fetch, {
  baseUrl: window.App.apiUrl,
});

// Initialize a new Redux store
// http://redux.js.org/docs/basics/UsageWithReact.html
const store = configureStore(window.App.state, {
  fetch,
  history,
});

const cache = createIntlCache();
const intl = createIntl(store.getState().intl, cache);

// Allow the passed state to be garbage-collected
// https://redux.js.org/recipes/serverrendering
delete window.App;

const context = {
  // Enables critical path CSS rendering
  // https://github.com/kriasoft/isomorphic-style-loader
  insertCss: (...styles) => {
    // eslint-disable-next-line no-underscore-dangle
    const removeCss = styles.map(x => x._insertCss());
    return () => {
      removeCss.forEach(f => f());
    };
  },
  store,
  // Universal HTTP client
  fetch,
  // intl instance as it can be get with injectIntl
  intl,
};

const container = document.getElementById('app');
let currentLocation = history.location;
let appInstance;

const scrollPositionsHistory = {};

// Re-render the app when window.location changes
async function onLocationChange(location, action) {
  // Remember the latest scroll position for the previous location
  scrollPositionsHistory[currentLocation.key] = {
    scrollX: window.pageXOffset,
    scrollY: window.pageYOffset,
  };
  // Delete stored scroll position for next page if any
  if (action === 'PUSH') {
    delete scrollPositionsHistory[location.key];
  }
  currentLocation = location;

  context.intl = createIntl(store.getState().intl, cache);

  const isInitialRender = !action;
  try {
    context.pathname = location.pathname;
    context.query = queryString.parse(location.search);
    context.locale = store.getState().intl.locale;

    // Traverses the list of routes in the order they are defined until
    // it finds the first route that matches provided URL path string
    // and whose action method returns anything other than `undefined`.
    const route = await router.resolve(context);

    // Prevent multiple page renders during the routing process
    if (currentLocation.key !== location.key) {
      return;
    }

    if (route.redirect) {
      history.replace(route.redirect);
      return;
    }

    const renderReactApp = isInitialRender ? ReactDOM.hydrate : ReactDOM.render;
    appInstance = renderReactApp(<App context={context}>{route.component}</App>, container, () => {
      if (isInitialRender) {
        // Switch off the native scroll restoration behavior and handle it manually
        // https://developers.google.com/web/updates/2015/09/history-api-scroll-restoration
        if (window.history && 'scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }

        const elem = document.getElementById('css');
        if (elem) elem.parentNode.removeChild(elem);
        return;
      }

      document.title = route.title;

      updateMeta('description', route.description);
      // Update necessary tags in <head> at runtime here, ie:
      // updateMeta('keywords', route.keywords);
      // updateCustomMeta('og:url', route.canonicalUrl);
      // updateCustomMeta('og:image', route.imageUrl);
      // updateLink('canonical', route.canonicalUrl);
      // etc.

      let scrollX = 0;
      let scrollY = 0;
      const pos = scrollPositionsHistory[location.key];
      if (pos) {
        scrollX = pos.scrollX;
        scrollY = pos.scrollY;
      } else {
        const targetHash = location.hash.substr(1);
        if (targetHash) {
          const target = document.getElementById(targetHash);
          if (target) {
            scrollY = window.pageYOffset + target.getBoundingClientRect().top;
          }
        }
      }

      // Restore the scroll position if it was saved into the state
      // or scroll to the given #hash anchor
      // or scroll to top of the page
      window.scrollTo(scrollX, scrollY);

      // Google Analytics tracking. Don't send 'pageview' event after
      // the initial rendering, as it was already sent
      if (window.ga) {
        window.ga('send', 'pageview', createPath(location));
      }
    });
  } catch (error) {
    if (__DEV__) {
      throw error;
    }

    console.error(error);

    // Do a full page reload if error occurs during client-side navigation
    if (!isInitialRender && currentLocation.key === location.key) {
      console.error('RSK will reload your page after error');
      window.location.reload();
    }
  }
}

let isHistoryObserved = false;
export default function main() {
  // Handle client-side navigation by using HTML5 History API
  // For more information visit https://github.com/mjackson/history#readme
  currentLocation = history.location;
  if (!isHistoryObserved) {
    isHistoryObserved = true;
    history.listen(onLocationChange);
  }
  onLocationChange(currentLocation);
}

// globally accesible entry point
window.RSK_ENTRY = main;

function runMainClient() {
  // Run the application when both DOM is ready and page content is loaded
  if (readyStates.has(document.readyState) && document.body) {
    main();
  } else {
    document.addEventListener('DOMContentLoaded', main, false);
  }
}

if (!global.Intl) {
  // You can show loading banner here
  require.ensure(
    [
      // Add all large polyfills here
      'intl',
      /* @intl-code-template 'intl/locale-data/jsonp/${lang}.js', */
      'intl/locale-data/jsonp/en.js',
      'intl/locale-data/jsonp/cs.js',
      /* @intl-code-template-end */
    ],
    require => {
      // and require them here
      require('intl');
      // TODO: This is bad. You should only require one language dynamically
      /* @intl-code-template require('intl/locale-data/jsonp/${lang}.js'); */
      require('intl/locale-data/jsonp/en.js');
      require('intl/locale-data/jsonp/cs.js');
      /* @intl-code-template-end */
      runMainClient();
    },
    'polyfills',
  );
} else {
  runMainClient();
}

// Enable Hot Module Replacement (HMR)
if (module.hot) {
  module.hot.accept('./core/router', () => {
    if (appInstance && appInstance.updater.isMounted(appInstance)) {
      // Force-update the whole tree, including components that refuse to update
      deepForceUpdate(appInstance);
    }

    onLocationChange(currentLocation);
  });
}
