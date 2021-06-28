import {useState} from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from './components/feeds';
import FeedSetup from './components/feed_setup';
import DocumentTitle from 'react-document-title';
import FeedAlert, {AlertContext} from './components/feed_alert';
import './css/darkly/bootstrap.min.css';
import './App.css';
import React from "react";
import Container from 'react-bootstrap/Container';

const useStateWithLocalStorage = localStorageKey => {
  const [value, setValue] = React.useState(
    localStorage.getItem(localStorageKey) || ''
  );
 
  React.useEffect(() => {
    localStorage.setItem(localStorageKey, value);
  }, [value]);
 
  return [value, setValue];
};

function App(props) {
  const [alertInfo, showAlert] = useState({variant: 'info', message: ''});
  const [hiddenFeeds, setHiddenFeeds] = useState([]);
  const [activeCollection, setActiveCollection] = useStateWithLocalStorage('activeCollection');

  function handleActiveCollectionChange(event) {
    setActiveCollection(event.target.value);
  }

  return (
    <DocumentTitle title='My Web App'>
      <Router>
          <header className="mb-4">
            <div className="header">
              <img src="logo192.png" className="logo" alt="Logo" />
              <div class="header-name-and-select">
                <h2 className="app-name">Birdfeed</h2>
                <select className="header-select" value={activeCollection} onChange={handleActiveCollectionChange}> 
                  <option value="">The Menagerie</option>
                  <option value="UK News">UK News</option>
                  <option value="Crypto">Crypto</option> 
                </select>
              </div>
              <nav>
                <ul>
                  <li>
                    <NavLink activeClassName="active" exact={true} to="/">Latest</NavLink>
                  </li>
                  <li>
                    <NavLink activeClassName="active" to="/setup">Setup</NavLink>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
        <Container>
          <AlertContext.Provider value={showAlert}>
            <FeedAlert alertInfo={alertInfo}></FeedAlert>
            <Switch>
              <Route path="/setup">
                <FeedSetup hiddenFeeds={hiddenFeeds} setHiddenFeeds={setHiddenFeeds}
                       activeCollection={activeCollection} setActiveCollection={setActiveCollection} />
              </Route>
              <Route path="/">
                <Feeds hiddenFeeds={hiddenFeeds} 
                       activeCollection={activeCollection} setActiveCollection={setActiveCollection} />
              </Route>
            </Switch>
          </AlertContext.Provider>
        </Container>
      </Router>
    </DocumentTitle>
 );
}

export default App;
