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

function App() {
  const [alertInfo, showAlert] = useState({variant: 'info', message: ''});

  return (
    <DocumentTitle title='My Web App'>
      <Router>
          <header className="mb-4">
            <div className="header">
              <img src="logo192.png" className="logo" alt="Logo" />
              <h2 className="app-name d-none d-md-block">Birdfeed</h2>
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
                <FeedSetup />
              </Route>
              <Route path="/">
                <Feeds />
              </Route>
            </Switch>
          </AlertContext.Provider>
        </Container>
      </Router>
    </DocumentTitle>
 );
}

export default App;
