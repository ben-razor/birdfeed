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
import {useMediaQuery} from 'react-responsive';

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

  const isSmall = useMediaQuery({ query: '(max-width: 768px)' })
  const [tab, setTab] = useState('feeds');

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

  let feedTable = '';
  if(loaded && feeds.length) {
    feedTable = <table className="setup-table feed-url-table anim-fade-in-short">
      <tbody>
        <tr>
          <td>
          </td>
          <td></td>
        </tr>
      {feeds.map((feed, index) => {
        let isDeleting= deleting[feed];

        let MAX_FEED_LEN = 50;
        if(isSmall) {
          MAX_FEED_LEN = 34;
        }
        let feedStr = feed;

        console.log('isdel', isDeleting);
        if(useFeedName) {
          let feedTitle = feedMetadata[feed]["title"];
          if(feedTitle) {
            feedStr = feedTitle;
          }
        }
        if(feedStr.length > MAX_FEED_LEN) {
          feedStr = feedStr.substr(0, MAX_FEED_LEN) + '\u2026';
        }
        return <tr key={feed}>
          <td className="feed-url">{feedStr}</td>
          {!isLockedGroup && 
            <td className="feed-url-delete">
              <ButtonSubmit isSubmitting={isDeleting} onClick={() => deleteFeed(feed)} 
                            label="🗑" hideLabelDuringSubmit={true} className="float-right" />
            </td>
          }
        </tr>
      })}
      </tbody>
    </table>
  }

  let tabs = '';
  if(isSmall) {
    let baseClass = "big-label birdfeed-tab";
    let feedsClass = baseClass;
    let groupsClass = baseClass;

    if(tab === 'feeds') {
      feedsClass += ' birdfeed-tab-selected';
    }
    else if(tab === 'groups') {
      groupsClass += ' birdfeed-tab-selected';
    }

    tabs = <div class="birdfeed-tabs">
        <button class={feedsClass} onClick={() => setTab('feeds')}>
          Feeds
        </button>
        <button class={groupsClass} onClick={() => setTab('groups')}>
          Groups
        </button>
    </div>;
  }

  let showFeeds = !isSmall || tab === 'feeds';
  let showGroups = !isSmall || tab === 'groups';

  return (
    <DocumentTitle title='Birdfeed - Configure Your News Sources'>
      <Fragment>
        {tabs}
        <Row>
          {showFeeds && 
           <Col md={8} style={{minHeight: '20em', display: 'flex', flexDirection: 'column'}}>
            <div className="setup-panel">
              {!loaded && 
                <div className="bf-spinner-container">
                  <div className="lds-default anim-fade-in-delayed-short" style={{margin: 'auto'}}><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                </div>
              }
              {loaded && feeds.length > 0 &&
                <div className="feed-list-header">
                  <div className="big-label">Feeds in <b>{activeCollection}</b></div>
                  <div className="feed-name-url-toggler">
                    <button className={feedNameClass} onClick={toggleUseFeedName}>Feed Name</button>
                    <button className={feedURLClass} onClick={toggleUseFeedName}>URL</button>
                  </div>
                </div>
              }
              {loaded && feeds.length === 0 &&
                <div className="alert alert-info mt-1 anim-fade-in-short">
                  <h6>Empty Group</h6>
                  <hr />
                  <p>There are no feeds in group {activeCollection}.</p>
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
          }
          {showGroups &&
            <Col md={4}>
              <div className="setup-panel">
                <FeedGroupForm activeCollection={activeCollection} setActiveCollection={setActiveCollection} 
                              collections={collections} setCollections={setCollections} 
                              setLoaded={setLoaded} />
              </div>
            </Col>
          }
        </Row>
      </Fragment>
    </DocumentTitle>
  )
}

export default FeedSetup;