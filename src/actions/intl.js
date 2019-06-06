/* eslint-disable import/prefer-default-export */

import { IntlProvider } from 'react-intl';

import {
  SET_LOCALE_START,
  SET_LOCALE_SUCCESS,
  SET_LOCALE_ERROR,
} from '../constants';

function getIntlFromState(state) {
  const intl = (state && state.intl) || {};
  const { initialNow, locale, messages } = intl;
  const localeMessages = (messages && messages[locale]) || {};
  const provider = new IntlProvider({
    initialNow,
    locale,
    messages: localeMessages,
    defaultLocale: 'en-US',
  });
  return provider.getChildContext().intl;
}

export function getIntl() {
  return (dispatch, getState) => getIntlFromState(getState());
}

export function setLocale({ locale }) {
  return async (dispatch, getState, { fetch, history }) => {
    dispatch({
      type: SET_LOCALE_START,
      payload: {
        locale,
      },
    });

    try {
      const state = getState();
      let messages = {};

      if (!state.intl.messages[locale]) {
        const response = await fetch(`/api/intl/${locale}`);
        messages = await response.json();
      } else {
        messages = state.intl.messages[locale];
      }
      dispatch({
        type: SET_LOCALE_SUCCESS,
        payload: {
          locale,
          messages,
        },
      });

      // remember locale for every new request
      if (process.env.BROWSER) {
        const maxAge = 3650 * 24 * 3600; // 10 years in seconds
        document.cookie = `lang=${locale};path=/;max-age=${maxAge}`;
        history.push(`?lang=${locale}`);
      }

      // return bound intl instance at the end
      return getIntlFromState(getState());
    } catch (error) {
      dispatch({
        type: SET_LOCALE_ERROR,
        payload: {
          locale,
          error,
        },
      });
      return null;
    }
  };
}
