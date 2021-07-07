import React, {useState, useContext, useEffect, Fragment} from 'react';
import FeedForm from './feed_form';
import DocumentTitle from 'react-document-title';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {AlertContext} from './feed_alert';
import ButtonSubmit from './forms_button_submit';
import FeedGroupForm from './feed_group_form';
import FeedGroupAddForm from './feed_group_add_form';
import BirdfeedSelected from './birdfeed_selected';
import useStateWithLocalStorage from '../hooks/localStorage';

function FeedSetup(props) {
  const [loaded, setLoaded] = useState(false);
  const [feeds, setFeeds] = useState([]);
  const [isLockedGroup, setIsLockedGroup] = useState(false);
  const [feedMetadata, setFeedMetadata] = useState({});
  const [deleting, setDeleting] = useState({});
  const [useFeedName, setUseFeedName] = useState(true);
  const [user, setUser] = useStateWithLocalStorage('user', '', sessionStorage);
  const [selectedGroups, setSelectedGroups] = useState([]);
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
          method: 'get',
          headers : new Headers({ 
            'Authorization': 'Basic ' + btoa(user + ':' + user),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        }).then(response => { return response.json() }).then(json => {
          if(json.success) {
            setFeedMetadata(json.data['feed_info']);
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
  }, [activeCollection, user]);

  useEffect(() => {
    setLoaded(false);
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_groups?" + new URLSearchParams({ 
        get_selected_groups: true,
      }), {
          method: 'get',
          headers : new Headers({ 
            'Authorization': 'Basic ' + btoa(user + ':' + user),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        }).then(response => { return response.json() }).then(json => {
          if(json.success) {
            setSelectedGroups(json.data);
            setLoaded(true);
          }
        }).catch(error => { console.log(error); });
  }, [user]);

  function deleteFeed(url) {
    setDeleting({[url]: true});
    fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls?", {
      method: 'DELETE',
      headers : new Headers({ 
        'Authorization': 'Basic ' + btoa(user + ':' + user),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
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

  let feedNameClass = 'feed-title-heading feed-title-heading-left';
  let feedURLClass = 'feed-title-heading feed-title-heading-right';

  function setFeedNameClass() {
    if(useFeedName) {
      feedNameClass += ' feed-title-heading-selected';
    }
    else {
      feedURLClass += ' feed-title-heading-selected';
    }
  }

  function toggleUseFeedName() {
    setUseFeedName(!useFeedName);
    setFeedNameClass();
  }
  setFeedNameClass();

  let allChecked = props.hiddenFeeds.length === 0;

  let feedTable = '';
  if(loaded && feeds.length) {
    feedTable = <table className="setup-table feed-url-table anim-fade-in-short">
      <tbody>
        <tr>
          <td>
            <button className={feedNameClass} onClick={toggleUseFeedName}>Feed Name</button>
            <button className={feedURLClass} onClick={toggleUseFeedName}>URL</button>
          </td>
          <td></td>
        </tr>
      {feeds.map((feed, index) => {
        let isDeleting= deleting[feed];

        let isHidden = props.hiddenFeeds.indexOf(feed) !== -1;

        const MAX_FEED_LEN = 50;
        let feedStr = feed;
        if(feed.length > MAX_FEED_LEN) {
          feedStr = feed.substr(0, MAX_FEED_LEN) + '\u2026';
        }

        if(useFeedName) {
          let feedTitle = feedMetadata[feed]["title"];
          if(feedTitle) {
            if(feedTitle.length > MAX_FEED_LEN) {
              feedTitle = feedTitle.substr(0, MAX_FEED_LEN) + '\u2026';
            }
            feedStr = feedTitle;
          }
        }
        return <tr key={feed}>
          <td className="feed-url">{feedStr}</td>
          {!isLockedGroup && 
            <td className="feed-url-delete">
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
              <div className="big-label">Current Group: {activeCollection}</div>
              {!loaded && 
                <div className="lds-default anim-fade-in-delayed-short" style={{margin: 'auto'}}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>}
              {loaded && feeds.length === 0 &&
                <div className="alert alert-info mt-1 anim-fade-in-short">
                  <h4>Empty Group</h4>
                  <hr />
                  <p className="lead">There are no feeds in group {activeCollection}.</p>
                  <p className="lead">Use the form above to add new feeds.</p>
                </div>
              }
              {feedTable}
              {loaded && !isLockedGroup && 
                <FeedForm deleteFeed={deleteFeed} feeds={feeds} user={user} feedMetadata={feedMetadata} selectedGroups={selectedGroups} setFeeds={setFeeds} activeCollection={activeCollection} setFeedMetadata={setFeedMetadata} />
              }
              {loaded && isLockedGroup && 
                <div className="alert alert-info mt-1 anim-fade-in-short">
                  <p>This is a <BirdfeedSelected /> group. Feeds cannot be added or removed.</p>
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