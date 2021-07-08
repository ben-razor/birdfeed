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

let urlRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/i;

const FeedForm = (props) => {
  const [addFeedMode, setAddFeedMode] = useState('none');
  const showAlert = useContext(AlertContext);
  const activeCollection = props.activeCollection;
  const feedMetadata = props.feedMetadata;
  const selectedGroups = props.selectedGroups;
  const [selectedSubmitting, setSelectedSubmitting] = useState(false);
  const user = props.user;
  const userFeeds= props.feeds;
  const deleteFeed = props.deleteFeed;

  function addFeed(url, setSubmitting) {
    console.log('add feed');
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
        setSubmitting(false);
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
        setSubmitting(false);
      });
    }

  const addFeedForm = <Formik
    initialValues={{ url: ''}}
    validate={values => {
      const errors = {};
      let urlMatch = urlRegex.test(values.url);

      if(values.url && !urlMatch) {
        errors.url = 'Invalid url';
      }
      return errors;
    }}
    onSubmit={(values, { setSubmitting }) => { addFeed(values.url, setSubmitting) }}
  >
    {({
      values,
      errors,
      touched,
      handleChange,
      handleBlur,
      handleSubmit,
      isSubmitting,
      /* and other goodies */
    }) => (
      <form onSubmit={handleSubmit}>
        <Row>
          <Col>
            <InputGroup>
            <input
              className="form-control"
              type="url"
              name="url"
              id="url"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.url}
            />
              <div className="input-group-append">
                <ButtonSubmit isSubmitting={isSubmitting} />
              </div>
            </InputGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            {errors.url && touched.url && errors.url}
          </Col>
        </Row>
    </form>
  )}
  </Formik>;

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

  const [openPanels, setOpenPanels] = useState({});

  function setOpenPanel(id, open) {
    let newOpenPanels = {...openPanels};

    Object.keys(newOpenPanels).forEach((panelID) => {
      newOpenPanels[panelID] = false;
    });

    newOpenPanels[id] = open;

    setOpenPanels(newOpenPanels);
  }

  let groupIndex = 0;

  let addSelectedFeedForm = <div>
    <div>
    {
      Object.entries(selectedGroups).map(([k, v]) => {
        let className = 'feed-title-heading birdfeed-trigger feed-title-heading-left feed-title-heading-selected';
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
    {
      Object.entries(selectedGroups).map(([k, v]) => {
        let id = k;

        let open = openPanels[id] ? true : false;
        let feeds = v['feeds'].map((feed, index) => {
          let feedTitle = feed;
          if(feedMetadata[feed] && feedMetadata[feed]["title"]) {
            feedTitle = feedMetadata[feed]["title"];
          }
          return <div className="feed-url feed-group-list-row" key={index}>
            <button className="button-styled-as-link feed-group-list-group" onClick={() => addFeed(feed, setSelectedSubmitting)}>{feedTitle}</button>
            <div className="feed-group-list-delete">

              {userFeeds.includes(feed) &&
                <button type="submit" className="float-right btn btn-primary" onClick={() => deleteFeed(feed)}>
                  <i className="fa fa-refresh fa-spin" style={{width: '0px', opacity: 0}}></i>🗑
                </button>
              }
              {!userFeeds.includes(feed) &&
                <button type="submit" className="float-right btn btn-success" onClick={() => addFeed(feed, setSelectedSubmitting)}>
                  <i className="fa fa-refresh fa-spin" style={{width: '0px', opacity: 0}}></i>+
                </button>
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

  return (
    <div className="add-feeds-panel">
      <button onClick={() => setOrToggleAddFeedMode('selected')} className={addSelectedFeedClass}>Add <BirdfeedSelected /> Feeds</button>
      <button onClick={() => setOrToggleAddFeedMode('url')} className={addFeedURLClass}>Add Feed URL</button>
      {addFeedMode !== 'none' &&
        <div className="add-feeds-panel-form">
          {addFeedMode === 'selected' && addSelectedFeedForm}
          {addFeedMode === 'url' && addFeedForm}
        </div>
      }
    </div>
  );

}

export default FeedForm;
