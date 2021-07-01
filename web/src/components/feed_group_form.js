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

      if (!groupName) {
        errors.groupName = 'Required';
      } else if (!validGroupName) {
        errors.groupName = 'Invalid group name. Group names have letters and numbers and spaces only';
      }
      return errors;
    }}
    onSubmit={(values, { setSubmitting }) => {
      let groupName = values.groupName;
      fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_groups?" + new URLSearchParams({ 
        feed_url_group: groupName
      }), {
        headers : { 
          'Accept': 'application/json'
        },
      }).then(response => {
        return response.json();
      }).then(json => {
        setSubmitting(false);

        if(json.success) {
          showAlert({'variant': 'info', 'message': 'Group already exists'});
          let newCollections = [...collections, {id: groupName, text: groupName}];
          setCollections(newCollections);
          setActiveCollection(groupName);
        }
        else {
          let message = '';
          switch(json.reason) {
            case 'url-group-does-not-exist':
              if(!collections.includes(groupName)) {
                let newCollections = [...collections, {id: groupName, text: groupName}];
                setCollections(newCollections);
                showAlert({'variant': 'info', 'message': 'Group added'});
              }
              else {
                showAlert({'variant': 'info', 'message': 'Group already exists'});
              }
              setActiveCollection(groupName);
              break;
            default:
              message = json.reason;
          }
        }
      }).catch(error => {
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
            <label htmlFor="groupName" className="big-label">Add or Import Group</label>
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

  let options = collections.map(collection => {
    return <div className="feed-group-list-row" value={collection.id} key={collection.id}>
      <div className="feed-group-list-group">
        {collection.text}
      </div>
      <div className="feed-group-list-delete">
        <ButtonSubmit onClick={() => deleteGroup(collection.id)}  label="🗑" className="float-right" />
      </div>
      </div>
  });

  return (
    <div>
      {addFeedGroupForm}
      <label htmlFor="groupName" className="big-label mt-3">Delete / Reorder Groups</label>
      <div class="feed-group-list">
        {options}
      </div>
    </div>
  );

}

export default FeedGroupForm;
