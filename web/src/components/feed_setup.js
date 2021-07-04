import React, {useState, useContext, useEffect, Fragment} from 'react';
import FeedForm from './feed_form';
import DocumentTitle from 'react-document-title';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Checkbox from 'react-bootstrap/FormCheck';
import {AlertContext} from './feed_alert';
import ButtonSubmit from './forms_button_submit';
import FeedGroupForm from './feed_group_form';
import FeedGroupAddForm from './feed_group_add_form';

function logTime(label) {
    console.log(label, performance.now() / 1000);
}

function FeedSetup(props) {
  const [loaded, setLoaded] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [isLockedGroup, setIsLockedGroup] = useState(false);
  const [deleting, setDeleting] = useState({});
  const showAlert = useContext(AlertContext);
  let activeCollection = props.activeCollection;
  let setActiveCollection = props.setActiveCollection;
  let collections = props.collections;
  let setCollections = props.setCollections;

  useEffect(() => {
    setLoaded(false);
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_groups?" + new URLSearchParams({ 
        feed_url_group: activeCollection 
      }), {
          headers : { 
            'Accept': 'application/json'
          }
        }).then(response => { return response.json() }).then(json => {
          if(json.success) {
            setFeeds(json.data['feeds']);
            setIsLockedGroup(json.data['locked'])
            setLoaded(true);
          }
          else {
            setLoaded(true);
            setIsLockedGroup(false)
            setFeeds([]);
          }
        }).catch(error => { console.log(error); });
  }, [activeCollection]);

  function deleteFeed(url) {
    setDeleting({[url]: true});
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls?", {
      method: 'DELETE',
      headers : { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({feed_url: url, feed_url_group: activeCollection })
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

  function handleChecked(e, feed) {
    let checked = e.target.checked;
    let hiddenFeeds = props.hiddenFeeds.slice(0);
    let hiddenFeedIndex = hiddenFeeds.indexOf(feed);
    let isHidden = hiddenFeedIndex !== -1;

    if(checked) {
      if(isHidden) {
        hiddenFeeds.splice(hiddenFeedIndex, 1);
      }
    }
    else {
      if(!isHidden) {
        hiddenFeeds.push(feed);
      }
    }
    props.setHiddenFeeds(hiddenFeeds);
  }

  function handleAllChecked(e) {
    let checked = e.target.checked;
    let hiddenFeeds = [];

    if(!checked) {
      hiddenFeeds = feeds.slice(0);
    }

    props.setHiddenFeeds(hiddenFeeds);
  }

  let allChecked = props.hiddenFeeds.length === 0;

  let feedTable = '';
  if(loaded && feeds.length) {
    feedTable = <table className="setup-table feed-url-table anim-fade-in-short">
      <tbody>
        <tr>
          <td colSpan="2"></td>
        </tr>
      {feeds.map((feed, index) => {
        let isDeleting= deleting[feed];

        let isHidden = props.hiddenFeeds.indexOf(feed) !== -1;

        const MAX_FEED_LEN = 50;
        let feedStr = feed;
        if(feed.length > MAX_FEED_LEN) {
          feedStr = feed.substr(0, MAX_FEED_LEN) + '\u2026';
        }

        return <tr key={feed}>
          <td className="feed-url">{feedStr}</td>
          {!isLockedGroup && 
            <td>
              <ButtonSubmit onSubmitting={isDeleting} onClick={() => deleteFeed(feed)} label="🗑" className="float-right" />
            </td>
          }
        </tr>
      })}
      </tbody>
    </table>
  }

  return (
    <DocumentTitle title='Birdfeed - Configure Your News Sources'>
      <Fragment>
        <Row>
          <Col md={8} style={{minHeight: '20em', display: 'flex', flexDirection: 'column'}}>
            <div className="setup-panel">
              <div class="big-label">Current Group: {activeCollection}</div>
              {!isLockedGroup && 
                <FeedForm setFeeds={setFeeds} activeCollection={activeCollection} />
              }
              {!loaded && 
                <div className="lds-default anim-fade-in-delayed-short" style={{margin: 'auto'}}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>}
              {loaded && feeds.length === 0 &&
                <div class="alert alert-info mt-1 anim-fade-in-short">
                  <h4>Empty Group</h4>
                  <hr />
                  <p class="lead">There are no feeds in group {activeCollection}.</p>
                  <p class="lead">Use the form above to add new feeds.</p>
                </div>
              }
              {feedTable}
              {loaded && isLockedGroup && 
                <div class="alert alert-info mt-1 anim-fade-in-short">
                  <p>This is a <b><i>Birdfeed Selected</i></b> group. Feeds cannot be added or removed.</p>
                  <p>To make changes, use the form below to clone this group.</p>

                  <FeedGroupAddForm activeCollection={activeCollection} setActiveCollection={setActiveCollection} 
                    collections={collections} setCollections={setCollections} isCloneForm={true} />
                </div>
              }

          </div>
          </Col>
          <Col md={4}>
            <div className="setup-panel">
              <FeedGroupForm activeCollection={activeCollection} setActiveCollection={setActiveCollection} 
                            collections={collections} setCollections={setCollections} 
                            setLoaded={setLoaded} />
            </div>
          </Col>
        </Row>
      </Fragment>
    </DocumentTitle>
  )
}

export default FeedSetup;