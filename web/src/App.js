import logo from './logo.svg';
import {useEffect, useState} from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from './components/feeds';
import FeedSetup from './components/feed_setup';
import FeedForm from './components/feed_form';
import './App.css';
function App() {

  return (
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
          <FeedForm />
          <FeedSetup />
        </Route>
        <Route path="/">
          <Feeds />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
