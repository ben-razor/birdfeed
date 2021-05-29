import React, {useState, useContext, useEffect, Fragment} from 'react';
import FeedForm from './feed_form';
import DocumentTitle from 'react-document-title';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {AlertContext} from './feed_alert';

function FeedSetup() {
  const [feeds, setFeeds] = useState([]);
  const [deleting, setDeleting] = useState({});
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
    setDeleting({[url]: true});
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
    }).finally(() => {
      setDeleting({});
    });
  }

  return (
    <DocumentTitle title='Birdfeed - Configure Your News Sources'>
      <Fragment>
        <Row>
          <Col style={{minHeight: '20em', display: 'flex', flexDirection: 'column'}}>
          <FeedForm setFeeds={setFeeds} />
          {feeds.length === 0 && 
            <div class="lds-default anim-fade-in-short" style={{margin: 'auto'}}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>}
          {feeds.length > 0 && 
            <table class="feed-url-table anim-fade-in-short">
              <tbody>
              {feeds.map((feed, index) => {
                let isDeleting= deleting[feed];
                return <tr key={index}>
                  <td className="feed-url">{feed}</td>
                  <td>
                    <Button variant="primary" onClick={() => deleteFeed(feed)} 
                            disabled={isDeleting} className="float-right feed-url-delete">
                    <i className="fa fa-refresh fa-spin" style={{ 
                      marginRight: isDeleting ? '5px' : '',
                      width: isDeleting ? '1em' : 0,
                      opacity: isDeleting ? 1 : 0 
                    }} />
                    Delete
                    </Button></td>
                  </tr>
              })}
              </tbody>
            </table>
          }
          </Col>
          <Col></Col>
        </Row>
      </Fragment>
    </DocumentTitle>
  )
}

export default FeedSetup;