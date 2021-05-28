import React, {useState, useEffect, useContext} from 'react';
import DocumentTitle from 'react-document-title';
import {AlertContext} from './feed_alert';

/**
 * Returns time in format HH:MM:SS.
 * 
 * @param {string} date 
 * @param {boolean} useSeconds Whether to include seconds
 * @returns string
 */
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

/**
 * Converts a string to a colour with a given hue, 100% saturation and a value
 * from baseLevel to baseLevel + level.
 * 
 * It calculates the colour using the (mod % levels) of the sum of the character
 * codes in string. It is inefficient but fun.
 * 
 * @param {string} source 
 * @param {number} hue 
 * @param {number} levels 
 * @param {number} baseLevel 
 * @returns string
 */
function stringToColour(text, hue, levels, baseLevel) {
  let variant = text.split('').map(x => x.charCodeAt(0)).reduce((p, c) => p + c) % 20 + 15; 
  let variantCSS = `hsl(190, 100%, ${variant}%)`;
  return variantCSS;
}

async function fetchFeeds() {
  let feeds = [];
  let response = await fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed", {
    headers : { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
      }
  });
  
  let json = await response.json();

  let prevSource = '';
  let prevDateStr = '';

  for(let feed of json) {
    let source = feed['source'];
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

    feed['color'] = stringToColour(source)

    if(source === prevSource) {
      if(dateStr === '') source = '';
    }
    else {
      prevSource = source;
    }
    feed['source'] = source;
  }

  feeds = json;

  return feeds;
}

function Feeds() {
  const [feeds, setFeeds] = useState([]);
  const showAlert = useContext(AlertContext);

  useEffect(() => {
    showAlert({message: ''});
    async function fetchFeedsAndSet() {
      let feeds = await fetchFeeds();
      setTimeout(() => setFeeds(feeds), 1000);
      setFeeds(feeds);
    }
    fetchFeedsAndSet();

    let timer = setInterval(() => fetchFeedsAndSet(), 60000 * 5);
    return () => clearInterval(timer);
  }, [showAlert]);

  return (
    <DocumentTitle title='Birdfeed - Latest News'>
      <div>
          {feeds.length === 0 && 
          <div class="lds-default anim-fade-in-short" style={{marginLeft:"50%", transform: "translate(-50%, 100%) scale(2)"}}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>}

          <table className="fancy anim-fade-in-short"> 
          <tbody>
            {feeds.map((feed, index) => {
              return <tr key={index}>
                  <td className="date">{ feed.date_time_str }</td>
                  <td className="source" style={{color: "white", backgroundColor: feed.color}}>{ feed.source }</td>
                  <td className="time">{ feed.time_str }</td>
                  <td className="title"><a href={ feed.link } target="_blank" rel="noreferrer">{ feed.title }</a></td>
              </tr> 
            })}
          </tbody>
          </table>
      </div>
    </DocumentTitle>
  )
}

export default Feeds;