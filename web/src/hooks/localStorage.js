import React from 'react';

const useStateWithLocalStorage = (localStorageKey, defaultValue, storer=localStorage) => {
  let item = defaultValue;
  let itemJSON = storer.getItem(localStorageKey);
  if(itemJSON) {
    item = JSON.parse(itemJSON) || defaultValue
  }

  const [value, setValue] = React.useState(item);
 
  React.useEffect(() => {
    storer.setItem(localStorageKey, JSON.stringify(value));
  }, [value, localStorageKey, storer]);

  return [value, setValue];
};

export default useStateWithLocalStorage;