import React, {useState, useContext} from 'react';
import { Formik } from 'formik';
import Button from 'react-bootstrap/Button';
import {AlertContext} from './feed_alert';

let urlRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/i;

const FeedForm = (props) => {
  const showAlert = useContext(AlertContext);
  return (
    <div>
      <h1>Enter RSS URL</h1>
      <Formik
        initialValues={{ url: ''}}
        validate={values => {
          const errors = {};
          let urlMatch = urlRegex.test(values.url);

          if (!values.url) {
            errors.url = 'Required';
          } else if (!urlMatch) {
            errors.url= 'Invalid url';
          }
          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          fetch("https://birdfeed-01000101.ew.r.appspot.com/api/feed_urls", {
            method: 'POST',
            headers : { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({feed_url: values.url})
          }).then(response => {
            if(!response.ok) {
              return Promise.reject();
            }
            else {
              return response.json();
            }
          }).then(json => {
            console.log(json)
            showAlert('Feed URL added')
            setSubmitting(false);
            props.setFeeds(json);
          }).catch(error => {
            console.log(error);
            showAlert('Error adding feed URL\n\nAre you sure this is a valid RSS feed?')
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
            <input
              type="url"
              name="url"
              id="url"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.url}
            />
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              Submit
            </Button>
            <br />
            {errors.url && touched.url && errors.url}
          </form>
        )}
      </Formik>
    </div>
  );

}

export default FeedForm;
