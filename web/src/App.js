import logo from './logo.svg';
import {useEffect, useState} from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from './components/feeds';
import FeedSetup from './components/feed_setup';
import FeedForm from './components/feed_form';
import DocumentTitle from 'react-document-title';
import './App.css';
function App() {

  return (
    <DocumentTitle title='My Web App'>
      <Router>
        <header>
          <h2 class="logo">Birdfeed</h2>
          <nav>
            <ul>
              <li>
                <NavLink activeClassName="active" exact="true" to="/">Latest</NavLink>
              </li>
              <li>
                <NavLink activeClassName="active" to="/setup">Setup</NavLink>
              </li>
            </ul>
          </nav>

        </header>
        <Switch>
          <Route path="/setup">
            <FeedSetup />
          </Route>
          <Route path="/">
            <Feeds />
          </Route>
        </Switch>
      </Router>
    </DocumentTitle>
 );
}

export default App;
