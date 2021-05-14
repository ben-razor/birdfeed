import logo from './logo.svg';
import {useEffect, useState} from 'react'
import './App.css';

function formatTime(date, useSeconds=true) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  let timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  if(useSeconds) {
    timeStr += `:${seconds.toString().padStart(2, '0')}`;
  }

  return timeStr;
}

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
        feed['time_str'] = formatTime(date, false);
        date.toDateString()

        if(dateStr === prevDateStr) {
          dateStr = '';
        }
        else {
          prevDateStr = dateStr;
        }
        feed['date_time_str'] = dateStr;

        let source = feed['source'];
        let variant = source.split('').map(x => x.charCodeAt(0)).reduce((p, c) => p + c) % 30; 
        feed['color'] = `hsl(190, 100%, ${variant}%)`;

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
            <td class="source" style={{"color": "white", "background-color": feed.color}}>{ feed.source }</td>
            <td class="time">{ feed.time_str }</td>
            <td class="title"><a href={ feed.link } target="_blank">{ feed.title }</a></td>
        </tr> 
      })}
      </table>
    </div>
  );
}

export default App;
