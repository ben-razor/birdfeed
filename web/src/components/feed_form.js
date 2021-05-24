import React from 'react';
import { Formik } from 'formik';

let urlRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/i;

const FeedForm = (props) => (
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
        }).then(response => response.json()).then(json => {
          console.log(json)
          setSubmitting(false);
          props.setFeeds(json);
        }).catch(error => {
          console.log(error);
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
          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
          <br />
          {errors.url && touched.url && errors.url}
        </form>
      )}
    </Formik>
  </div>
);

export default FeedForm;
