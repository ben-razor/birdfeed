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
  const user = props.user;

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
    onSubmit={(values, { setSubmitting }) => {
      fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls", {
        method: 'POST',
        headers : { 
          'Authorization': 'Basic ' + btoa(user + ':' + user),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({feed_url: values.url, feed_url_group: activeCollection })
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
    }}
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
        let className = 'big-label feed-title-heading birdfeed-trigger feed-title-heading-left feed-title-heading-selected';
        let id = k;

        groupIndex++;

        let open = openPanels[id] ? true : false;

        let content = <Fragment key={groupIndex}>
        <Button onClick={() => setOpenPanel(id, !open)} aria-controls={id} aria-expanded={open} className={className} >
          {k}
        </Button>
        </Fragment>

        let feeds = v['feeds'].map((feed, index) => {
          let feedTitle = feed;
          if(feedMetadata[feed]) {
            feedTitle = feedMetadata[feed]["title"];
          }
          return <div class="feed-url" key={index}>{feedTitle}</div>
        });

        <Collapse in={open ? true : false}><div id={id}>{feeds}</div></Collapse>

        return content;    
      })
    }
    {
      Object.entries(selectedGroups).map(([k, v]) => {
        let className = 'big-label feed-title-heading birdfeed-trigger feed-title-heading-left feed-title-heading-selected';
        let id = k;

        let open = openPanels[id] ? true : false;
        let feeds = v['feeds'].map((feed, index) => {
          let feedTitle = feed;
          if(feedMetadata[feed]) {
            feedTitle = feedMetadata[feed]["title"];
          }
          return <div class="feed-url" key={index}>{feedTitle}</div>
        });

        let content = <Collapse in={open ? true : false}><div id={id}>{feeds}</div></Collapse>

        return content;    
      })

    }
    </div>
  </div>

  return (
    <div>
      <button onClick={() => setOrToggleAddFeedMode('selected')} className={addSelectedFeedClass}>Add <BirdfeedSelected /> Feeds</button>
      <button onClick={() => setOrToggleAddFeedMode('url')} className={addFeedURLClass}>Add Feed URL</button>
      {addFeedMode === 'selected' && addSelectedFeedForm}
      {addFeedMode === 'url' && addFeedForm}
    </div>
  );

}

export default FeedForm;
