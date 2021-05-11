import logo from './logo.svg';
import {useEffect, useState} from 'react'
import './App.css';

function App() {
  const [feeds, setFeeds] = useState([]);

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
      let prevSource = '';
      let prevDateStr = '';

      for(let feed of json) {

        let date = new Date(feed['date']);
        let dateStr = date.toLocaleDateString();
        feed['time_str'] = date.toLocaleTimeString();

        if(dateStr === prevDateStr) {
          dateStr = '';
        }
        else {
          prevDateStr = dateStr;
        }
        feed['date_time_str'] = dateStr;

        let source = feed['source'];

        if(source === prevSource) {
          if(dateStr === '') source = '';
        }
        else {
          prevSource = source;
        }
        feed['source'] = source;

      }
      setFeeds(json); 
    });
  }, [])

  return (
    <div>
      <table class="fancy"> 
      {feeds.map((feed, index) => {
        return <tr>
            <td class="date">{ feed.date_time_str }</td>
            <td class="source">{ feed.source }</td>
            <td class="time">{ feed.time_str }</td>
            <td class="title"><a href="{{ feed.link }}" target="_blank">{ feed.title }</a></td>
        </tr> 
      })}
      </table>
    </div>
  );
}

export default App;
