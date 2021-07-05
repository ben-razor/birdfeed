import {useState} from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from './components/feeds';
import FeedSetup from './components/feed_setup';
import DocumentTitle from 'react-document-title';
import FeedAlert, {AlertContext} from './components/feed_alert';
import './css/darkly/bootstrap.min.css';
import './App.css';
import birdfeedLogo from './img/logo192.png';
import React from "react";
import Container from 'react-bootstrap/Container';
import useStateWithLocalStorage from './hooks/localStorage';

function App(props) {
  const [alertInfo, showAlert] = useState({variant: 'info', message: ''});
  const [hiddenFeeds, setHiddenFeeds] = useState([]);
  const [activeCollection, setActiveCollection] = useStateWithLocalStorage('activeCollection', '');
  const [collections, setCollections] = useStateWithLocalStorage('collections', [
    { id: "The Menagerie", text: "The Menagerie"},
    { id: "UK News", text: "UK News"},
    { id: "Crypto", text: "Crypto"},
  ]);

  function handleActiveCollectionChange(event) {
    setActiveCollection(event.target.value);
  }

  let options = collections.map(collection => {
    return <option value={collection.id} key={collection.id}>{collection.text}</option>
  });

  return <DocumentTitle title='My Web App'>
      <Router>
        <div className="thing thing2"></div>
        <div className="thing"></div>
          <header className="mb-4">
            <div className="header">
              <img src={birdfeedLogo} className="logo" alt="Logo" />
              <div className="header-name-and-select">
                <h2 className="app-name">Birdfeed</h2>
                <select className="header-select" value={activeCollection} onChange={handleActiveCollectionChange}> 
                  {options}
                </select>
              </div>
              <nav>
                <ul>
                  <li>
                    <NavLink className="header-nav-link" activeClassName="active" exact={true} to="/">Latest</NavLink>
                  </li>
                  <li>
                    <NavLink className="header-nav-link" activeClassName="active" to="/setup">Setup</NavLink>
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
                       activeCollection={activeCollection} setActiveCollection={setActiveCollection}
                       collections={collections} setCollections={setCollections} />
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
}

export default App;
