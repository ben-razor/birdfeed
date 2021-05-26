import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import Feeds from './components/feeds';
import FeedSetup from './components/feed_setup';
import DocumentTitle from 'react-document-title';
import './css/darkly/bootstrap.min.css';
import './App.css';
function App() {

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
