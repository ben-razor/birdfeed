import React, {useState, useEffect, useContext, Fragment} from 'react';
import DocumentTitle from 'react-document-title';
import {AlertContext} from './feed_alert';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

/**
 * Returns time in format HH:MM:SS.
 * 
 * @param {Date} date 
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
 * Returns date in format dd/mm/yyyy.
 * 
 * @param {Date} date 
 * @param {boolean} useYear Whether to include year 
 * @param {string} separator Custom separator to use
 * @returns string
 */
function formatDate(date, useYear=true, separator='/') {
  let dayStr = date.getDate().toString().padStart(2, '0');
  let monthStr = date.getMonth().toString().padStart(2, '0');
  let yearStr = date.getYear().toString();

  let dateStr = dayStr + separator + monthStr;
  
  if(useYear) {
    dateStr += separator + yearStr;
  }

  return dateStr;
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
  let variantCSS = `hsla(190, 100%, ${variant}%, 0.5)`; 
  return variantCSS;
}

async function fetchWithTimeout(resource, options) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}

function processFeeds(feeds, hiddenFeeds) {
  let prevSource = '';
  let prevDateStr = '';
  let visibleFeeds = [];

  for(let feed of feeds) {
    if(hiddenFeeds.includes(feed['source_url'])) {
      continue;
    }
    else {
      visibleFeeds.push(feed);
    }
    let source = feed['source'];
    const MAX_SOURCE_LEN = 40;
    let date = new Date(feed['date']);
    let dateStr = formatDate(date, false);
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

    if(source.length > MAX_SOURCE_LEN) {
      feed['source'] = source.substr(0, MAX_SOURCE_LEN) + '\u2026';
    }
    else {
      feed['source'] = source;
    }
  }

  return visibleFeeds;
}

/**
 * Fetch feed json and process ready for display.
 * 
 * @throws AbortError 
 * @returns {object[]} An array of feed data
 */
async function fetchFeeds(activeCollection, hiddenFeeds) {
  let feeds = [];

  const response = await fetchWithTimeout(
    "https://birdfeed-01000101.ew.r.appspot.com/api/feed?" + new URLSearchParams({ 
      feed_url_group: activeCollection 
    }), {
    timeout: 5000,
    headers : { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
      }
  });

  feeds = await response.json();
  feeds = processFeeds(feeds, hiddenFeeds);
 
  return feeds;
}

function Feeds(props) {
  const [feeds, setFeeds] = useState([]);
  const [timedOut, setTimedOut] = useState(false);
  const [refresh, setRefresh] = useState(1);
  const showAlert = useContext(AlertContext);

  function triggerRefresh() {
    setRefresh(refresh === 1 ? 2 : 1);
  }

  useEffect(() => {
    showAlert({message: ''});
    async function fetchFeedsAndSet() {
      console.log('fetching feeds...');
      try {
        let feeds = await fetchFeeds(props.activeCollection, props.hiddenFeeds);
        setFeeds(feeds);
        setTimedOut(false);
      }
      catch(error) {
        setTimedOut(true); 
      }
    }
    fetchFeedsAndSet();

    let timer = setInterval(() => { 
      fetchFeedsAndSet();
    }, 60000 * 5);

    return () => clearInterval(timer);
  }, [showAlert, refresh, props.hiddenFeeds, props.activeCollection]);

  return (
    <DocumentTitle title='Birdfeed - Latest News'>
      <div>
          {feeds.length === 0 && !timedOut && 
            <div className="lds-default anim-fade-in-delayed-short" style={{marginLeft:"50%", transform: "translate(-50%, 100%) scale(2)"}}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
          }

          {feeds.length > 0 &&
            <table className="fancy anim-fade-in-short"> 
            <tbody>
              {feeds.map((feed, index) => {
                return <tr key={index}>
                    <td className="date">{ feed.date_time_str }</td>
                    <td className="source" style={{color: "white", backgroundColor: feed.color}}>
                      <div className="sourceText">{ feed.source }</div>
                      <div className="time d-block d-md-none">{ feed.time_str }</div>
                    </td>
                    <td className="time d-none d-md-block">{ feed.time_str }</td>
                    <td className="title"><a href={ feed.link } target="_blank" rel="noreferrer">{ feed.title }</a></td>
                </tr> 
              })}
            </tbody>
            </table>
          }
          
          {timedOut &&
            <Fragment>
              <Alert variant="warning">Timed out while attempting to get feeds.</Alert>
              <Button onClick={() => triggerRefresh()}>Try Again</Button>
            </Fragment>
          }
      </div>

    </DocumentTitle>
  )
}

export default Feeds;