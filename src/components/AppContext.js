import { createContext } from 'react';

const AppContext = createContext({
  fetch: () => {
    throw new Error('Fetch method not initialized.');
  },
});

export default AppContext;
