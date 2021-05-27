import React, {useState, useContext, useEffect, Fragment} from 'react';
import FeedForm from './feed_form';
import DocumentTitle from 'react-document-title';
import Button from 'react-bootstrap/Button';
import {AlertContext} from './feed_alert';

function FeedSetup() {
  const [feeds, setFeeds] = useState([]);
  const showAlert = useContext(AlertContext);

  useEffect(() => {
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls", {
          headers : { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).then(response => response.json()).then(json => {
          console.log(json)
          setFeeds(json.data);
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

      if(json.success) {
        showAlert({'variant': 'success', 'message': 'Feed URL deleted'});
        setFeeds(json.data);
      }
      else {
        let message = '';

        if(json.reason === 'url-does-not-exist') {
          message = 'The URL does not exist';  
        }

        showAlert({'variant': 'danger', 'message': message});
      }
    }).catch(error => {
      console.log(error);
      showAlert({'variant': 'danger', 'message': 'Error deleting feed URL'});
    });
  }

  return (
    <DocumentTitle title='Birdfeed - Configure Your News Sources'>
      <Fragment>
        <FeedForm setFeeds={setFeeds} />
        <table className="feed-url-table">
          <tbody>
          {feeds.map((feed, index) => {
            return <tr key={index}>
              <td className="feed-url">{feed}</td>
              <td><Button variant="primary" onClick={() => deleteFeed(feed)} >Delete</Button></td>
              </tr>
          })}
          </tbody>
        </table>
      </Fragment>
    </DocumentTitle>
  )
}

export default FeedSetup;