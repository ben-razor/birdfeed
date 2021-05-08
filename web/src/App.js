import logo from './logo.svg';
import {useEffect, useState} from 'react'
import './App.css';

function App() {
  const [feeds, setFeeds] = useState(["A feed", "Another feed"]);

  useEffect(() => {
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed", {
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
       }
    }).then((response) => {
      console.log(response);
      return response.json();
    }).then((json) => {
      console.log(json);
      setFeeds(json); 
    });
  }, [])

  return (
    <div className="App">
      <header className="App-header">
          Bird Feeder
      {feeds.map((value, index) => {
        return <div>{value.title}</div>
      })}
      </header>
    </div>
  );
}

export default App;
