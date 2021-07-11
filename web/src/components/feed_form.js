import React, {useContext, useEffect, useState, Fragment} from 'react';
import { Formik } from 'formik';
import ButtonSubmit from './forms_button_submit'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col'; 
import Collapse from 'react-bootstrap/Collapse'
import Button from 'react-bootstrap/Button'
import InputGroup from 'react-bootstrap/InputGroup';
import {AlertContext} from './feed_alert';
import BirdfeedSelected from './birdfeed_selected';
import BirdfeedCollapse from './birdfeed_collapse';
import {useMediaQuery} from 'react-responsive';
import FeedAddForm from './feed_add_form';

const FeedForm = (props) => {
  const [addFeedMode, setAddFeedMode] = useState('none');
  const showAlert = useContext(AlertContext);
  const activeCollection = props.activeCollection;
  const feedMetadata = props.feedMetadata;
  const selectedGroups = props.selectedGroups;
  const [adding, setAdding] = useState({});
  const [selectedSubmitting, setSelectedSubmitting] = useState(false);
  const [openPanels, setOpenPanels] = useState({'Crypto': true});
  const user = props.user;
  const userFeeds= props.feeds;
  const deleteFeed = props.deleteFeed;
  const deleting = props.deleting;

  const isSmall = useMediaQuery({ query: '(max-width: 768px)' })

  function addFeed(url, setSubmitting) {
    setAdding({[url]: true});
      fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls", {
        method: 'POST',
        headers : { 
          'Authorization': 'Basic ' + btoa(user + ':' + user),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({feed_url: url, feed_url_group: activeCollection })
      })
      .then(response => {
        return response.json();
      })
      .then(json => {
        if(json.success) {
          showAlert({'variant': 'success', 'message': 'Feed URL added'})
          props.setFeedMetadata(json.data['feed_info'])
          props.setFeeds(json.data['feeds']);
        }
        else {
          let message = '';
          switch(json.reason) {
            case 'no-data-from-feed':
              message = 'No data from feed\n\nAre you sure this is a valid feed?';
              break;
            case 'url-exists':
              message = 'Feed URL already exists';
              break;
            case 'max-feeds-10':
              message = 'Maximum 10 feed URLS have been added';
              break;
            case 'timeout':
              message = 'The feed URL took too long to respond';
              break;
            default:
              message = '';
          }
          showAlert({'variant': 'danger', 'message': message});
        }
      })
      .catch(error => {
        console.log(error);
        showAlert({
          'variant': 'danger', 
          'message': `Error adding feed URL\n\nAre you sure this is a valid RSS feed?\n\n`
        })
      })
      .finally(() => {
        setSubmitting(false);
        setAdding({[url]: false});
      });
    }



  let addFeedBaseClass = 'big-label feed-title-heading birdfeed-trigger';
  let addSelectedFeedClass = addFeedBaseClass + ' feed-title-heading-left';
  let addFeedURLClass = addFeedBaseClass + ' feed-title-heading-right';

  if(addFeedMode === 'selected') {
    addSelectedFeedClass += ' feed-title-heading-selected';
  }
  else if(addFeedMode === 'url') {
    addFeedURLClass += ' feed-title-heading-selected';
  }

  function setOrToggleAddFeedMode(mode) {
    if(mode === addFeedMode) {
      setAddFeedMode('none');
    }
    else {
      setAddFeedMode(mode);
    }
  }

  function setOpenPanel(id, open) {
    let newOpenPanels = {...openPanels};

    Object.keys(newOpenPanels).forEach((panelID) => {
      newOpenPanels[panelID] = false;
    });

    newOpenPanels[id] = open;

    setOpenPanels(newOpenPanels);
  }

  let groupIndex = 0;

  let addSelectedFeedForm = 
  <div>
    <div>
      <div class="birdfeed-selected-group-panel">
        {
          Object.entries(selectedGroups).map(([k, v]) => {
            let className = 'birdfeed-selected-group-button ';
            let id = k;

            groupIndex++;

            let open = openPanels[id] ? true : false;

            let content = <Fragment key={groupIndex}>
              <Button onClick={() => setOpenPanel(id, !open)} aria-controls={id} aria-expanded={open} className={className} >
                {k}
              </Button>
            </Fragment>;

            return content;    
          })
        }
      </div>
      <div class="selected-feed-group-list-panel">
        {
          Object.entries(selectedGroups).map(([k, v]) => {
            let id = k;

            let open = openPanels[id] ? true : false;
            let feeds = v['feeds'].map((feed, index) => {
              let isDeleting= deleting[feed];
              let isAdding = adding[feed];
              let feedTitle = feed;
              if(feedMetadata[feed] && feedMetadata[feed]["title"]) {
                feedTitle = feedMetadata[feed]["title"];
                let SMALL_SCREEN_MAX_LEN = 34;
                if(isSmall && feedTitle.length > SMALL_SCREEN_MAX_LEN) {
                  feedTitle = feedTitle.substr(0, 34) + '\u2026';
                }
              }
              return <div className="feed-url feed-group-list-row" key={index}>
                <button className="button-styled-as-link feed-group-list-group" onClick={() => addFeed(feed, setSelectedSubmitting)}>
                  {feedTitle}
                </button>
                <div className="feed-group-list-delete">

                  {userFeeds.includes(feed) &&
                    <ButtonSubmit isSubmitting={isDeleting} onClick={() => deleteFeed(feed)} 
                            label={<i className="fa fa-trash"></i>} hideLabelDuringSubmit={true} className="float-right" />
                  }
                  {!userFeeds.includes(feed) &&
                    <ButtonSubmit isSubmitting={isAdding} onClick={() => addFeed(feed, setSelectedSubmitting)} 
                            label={<i className="fa fa-plus"></i>} hideLabelDuringSubmit={true} className="btn-success float-right" />
                  }

                </div>

              </div>
            });

            let content = <Collapse in={open} key={k}>
              <div id={id} className="setup-table feed-group-list selected-feed-group-list">{feeds}</div>
            </Collapse>

            return content;    
          })
        }
      </div>
    </div>
  </div>

  return (
    <div className="add-feeds-panel">
      <button onClick={() => setOrToggleAddFeedMode('selected')} className={addSelectedFeedClass}>Add <BirdfeedSelected /> Feeds</button>
      <button onClick={() => setOrToggleAddFeedMode('url')} className={addFeedURLClass}>Add Feed URL</button>
      {addFeedMode !== 'none' &&
        <div className="add-feeds-panel-form">
          {addFeedMode === 'selected' && addSelectedFeedForm}
          {addFeedMode === 'url' && 
            <FeedAddForm addFeed={addFeed} setAdding={setAdding} user={user} activeCollection={activeCollection} showAlert={showAlert}/>
          }
        </div>
      }
    </div>
  );

}

export default FeedForm;
