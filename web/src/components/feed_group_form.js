import React, {useContext} from 'react';
import { Formik } from 'formik';
import Button from 'react-bootstrap/Button';
import ButtonSubmit from './forms_button_submit'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import {AlertContext} from './feed_alert';

let groupNameRegex = /[a-zA-Z0-9 ]/i;

const FeedGroupForm = (props) => {
  const showAlert = useContext(AlertContext);
  const activeCollection = props.activeCollection;
  const setActiveCollection = props.setActiveCollection;
  const collections = props.collections;
  const setCollections = props.setCollections;

  const addFeedGroupForm = <Formik
    initialValues={{ groupName: ''}} 
    validate={values => {
      const errors = {};
      let groupName = values.groupName;
      let validGroupName = groupNameRegex.test(groupName);

      if (!validGroupName) {
        errors.groupName = 'Invalid group name. Group names have letters and numbers and spaces only';
      }
      return errors;
    }}
    onSubmit={(values, { setSubmitting }) => {
      let groupName = values.groupName;

      if(collections.includes(groupName)) {
        setActiveCollection(groupName);
      }
      else {
        let urlSearchParams = new URLSearchParams({feed_url_group: groupName});

        fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_groups?" + urlSearchParams , {
          headers : { 
            'Accept': 'application/json'
          },
        })
        .then(response => {
          return response.json();
        })
        .then(json => {
          setSubmitting(false);

          if(json.success) {
            showAlert({'variant': 'info', 'message': 'Feed group imported'});
            let newCollections = [...collections, {id: groupName, text: groupName}];
            setCollections(newCollections);
            setActiveCollection(groupName);
          }
          else {
            switch(json.reason) {
              case 'url-group-does-not-exist':
                let newCollections = [...collections, {id: groupName, text: groupName}];
                setCollections(newCollections);
                showAlert({'variant': 'info', 'message': 'Group added'});
                setActiveCollection(groupName);
                break;
              default:
                showAlert({'variant': 'info', 'message': json.reason});
            }
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
            <label htmlFor="groupName" className="big-label">Create / Import Group</label>
            <InputGroup>
            <input
              className="form-control"
              type="text"
              name="groupName"
              id="groupName"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.groupName}
            />
              <div className="input-group-append">
                <ButtonSubmit isSubmitting={isSubmitting} label="Go" />
              </div>
            </InputGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            {errors.groupName && touched.groupName }
          </Col>
        </Row>
    </form>
  )}
</Formik>;

  function deleteGroup(id) {
    let newActiveCollection = '';
    let newCollections = collections.filter((item) => item.id !== id); 
    setCollections(newCollections);

    if(activeCollection === id) {
      if(newCollections.length) {
        newActiveCollection = newCollections[0].id;
      }
      setActiveCollection(newActiveCollection);
    }

    showAlert({
      'variant': 'info', 
      'message': `Feed Group Deleted`
    })
  }

  function handleGroupSelect(e, id) {
    setActiveCollection(id);
  }

  let options = collections.map(collection => {
    let isActive = collection.id === activeCollection; 
    let groupNameClass = "button-styled-as-link feed-group-list-group " + (isActive ? "feed-group-list-group-active" : '');

    return <div className="feed-group-list-row" value={collection.id} key={collection.id}>
      <button className={groupNameClass} onClick={(e) => handleGroupSelect(e, collection.id)}>
        {collection.text}
      </button>
      <div className="feed-group-list-delete">
        <ButtonSubmit onClick={() => deleteGroup(collection.id)}  label="🗑" className="float-right" />
      </div>
      </div>
  });

  return (
    <div>
      {addFeedGroupForm}
      <div className="big-label mt-3">Delete Groups</div>
      <div class="setup-table feed-group-list">
        {options}
      </div>
    </div>
  );

}

export default FeedGroupForm;
