import logo from './logo.svg';
import {useEffect, useState} from 'react';
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from "./components/feeds"
import './App.css';
function App() {

  return (
    <Router>
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
      <Switch>
        <Route path="/setup">
        </Route>
        <Route path="/">
          <Feeds />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
