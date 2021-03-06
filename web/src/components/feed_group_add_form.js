import React, {useContext, Fragment} from 'react';
import { Formik } from 'formik';
import ButtonSubmit from './forms_button_submit'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import {AlertContext} from './feed_alert';
import {useMediaQuery} from 'react-responsive';

let groupNameRegexStr = '[a-zA-Z0-9 ]{2,20}';
let groupNameRegex = new RegExp(groupNameRegexStr);

const FeedGroupAddForm = (props) => {
  const showAlert = useContext(AlertContext);
  const activeCollection = props.activeCollection;
  const setActiveCollection = props.setActiveCollection;
  const collections = props.collections;
  const setCollections = props.setCollections;
  const isCloneForm = props.isCloneForm;

  const isSmall = useMediaQuery({ query: '(max-width: 768px)' })

  let label = 'Create / Import Group';
  let buttonText = 'Go';
  let placeholderText = '';

  if(isCloneForm) {
    label = 'Clone Group';
    buttonText = 'Clone';
    placeholderText = "New group name";
  }

  const addFeedGroupForm = <Formik
    initialValues={{ groupName: ''}} 
    validate={values => {
      const errors = {};
      let groupName = values.groupName.trim();
      let validGroupName = groupNameRegex.test(groupName);

      if (!validGroupName) {
        errors.groupName = 'Group name must be 2 to 20 characters. Letters, numbers and spaces are allowed.';
      }
      return errors;
    }}
    onSubmit={(values, { setSubmitting }) => {
      let groupName = values.groupName;

      if(collections.find(x => x.id === groupName)) {
        setActiveCollection(groupName);
        setSubmitting(false);
        showAlert({'variant': 'info', 'message': 'Group already exists'});
      }
      else {
        let url = "https://birdfeed-01000101.ew.r.appspot.com/api/feed_groups"; 
        let options = null;

        if(!isCloneForm) {
          let urlSearchParams = new URLSearchParams({feed_url_group: groupName});
          url += '?' + urlSearchParams;
          options = {
            headers : { 
              'Accept': 'application/json'
            }
          }
        }
        else {
          options = {
            method: 'POST',
            headers : { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              feed_url_group: activeCollection,
              new_group_name: groupName
            })
          } 
        }

        fetch(url, options).then(response => {
          return response.json();
        })
        .then(json => {
          setSubmitting(false);

          if(json.success) {
            let message = 'Feed group imported';
            if(isCloneForm) {
              message = 'Feed group cloned';
            }
            showAlert({'variant': 'info', 'message': message});
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
              case 'new-url-group-already-exists':
                let message = 'New group already exists\n\nPlease choose a different name';
                showAlert({'variant': 'warning', 'message': message});
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
            <label htmlFor="groupName" className="big-label">{label}</label>
            <InputGroup>
            <input
              className="form-control"
              type="text"
              name="groupName"
              id="groupName"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.groupName}
              title="Group name must be 2 to 20 characters. Letters, numbers and spaces are allowed."
              pattern={groupNameRegexStr}
              placeholder={placeholderText}
            />
              <div className="input-group-append">
                <ButtonSubmit isSubmitting={isSubmitting} label={buttonText} />
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

  return <Fragment>{addFeedGroupForm}</Fragment>

}

export default FeedGroupAddForm;
