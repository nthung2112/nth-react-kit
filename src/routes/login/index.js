import React from 'react';
import { defineMessages } from 'react-intl';
import Layout from '../../components/Layout';
import Login from './Login';

const messages = defineMessages({
  title: {
    id: 'login.title',
    description: 'Log in page title',
    defaultMessage: 'Log In',
  },
});

function action({ intl }) {
  const title = intl.formatMessage(messages.title);
  return {
    chunks: ['login'],
    title,
    component: (
      <Layout>
        <Login title={title} />
      </Layout>
    ),
  };
}

export default action;
