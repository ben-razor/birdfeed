import React, {useState, useEffect, Fragment} from 'react';
import FeedForm from './feed_form';
import DocumentTitle from 'react-document-title';

function FeedSetup() {
  const [feeds, setFeeds] = useState([]);

  useEffect(() => {
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls", {
          headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then(response => response.json()).then(json => {
          setFeeds(json);
        }).catch(error => { console.log(error); });
  }, []);

  function deleteFeed(url) {
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls", {
      method: 'DELETE',
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({feed_url: url})
    }).then(response => response.json()).then(json => {
      console.log(json)
      setFeeds(json);
    }).catch(error => {
      console.log(error);
    });
  }

  return (
    <DocumentTitle title='Birdfeed - Configure Your News Sources'>
      <Fragment>
        <FeedForm setFeeds={setFeeds} />
        <h3>List of configured feeds will appear here</h3>

        <table>
        {feeds.map((feed, index) => {
          return <tr><td>{feed}</td><td><button onClick={() => deleteFeed(feed)} >Delete</button></td></tr>
        })}
        </table>
      </Fragment>
    </DocumentTitle>
  )
}

export default FeedSetup;