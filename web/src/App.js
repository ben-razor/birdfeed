import {useState} from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from './components/feeds';
import FeedSetup from './components/feed_setup';
import DocumentTitle from 'react-document-title';
import Alert from 'react-bootstrap/Alert';
import {AlertContext} from './components/feed_alert';
import './css/darkly/bootstrap.min.css';
import './App.css';
import React from "react";

function App() {
  const [showingAlert, showAlert] = useState('');

  let alertTimer = null;

  function resetAlert(t) {
    clearTimeout(alertTimer);
    alertTimer = setTimeout(() => showAlert(''), t * 1000);
  }

  function revealAlert(text) {
    showAlert(text);
    resetAlert(5);
  }

  return (
    <DocumentTitle title='My Web App'>
      <Router>
        <header>
          <div className="header">
            <img src="logo192.png" className="logo" alt="Logo" />
            <h2 className="app-name">Birdfeed</h2>
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
        <Alert variant="info" className={'bf-alert ' + (showingAlert ? 'anim-fade-out' : '')}>{showingAlert}</Alert>
        <AlertContext.Provider value={revealAlert}>
          <Switch>
            <Route path="/setup">
              <FeedSetup />
            </Route>
            <Route path="/">
              <Feeds />
            </Route>
          </Switch>
        </AlertContext.Provider>
      </Router>
    </DocumentTitle>
 );
}

export default App;
