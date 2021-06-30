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
          // Group already exists, ask if user wishes to add the group or pick a different name
          showAlert({'variant': 'info', 'message': 'Group already exists'});
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


  return (
    <div>
      {addFeedGroupForm}
    </div>
  );

}

export default FeedGroupForm;
