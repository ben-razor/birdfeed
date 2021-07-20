import React from 'react';
import { Formik } from 'formik';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col'; 
import InputGroup from 'react-bootstrap/InputGroup';
import ButtonSubmit from './forms_button_submit'

function FeedAddForm(props) {
	let addFeed = props.addFeed;

	let urlRegex = /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/i;

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
							placeholder="RSS/Atom or Twitter feed URL"
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

	return addFeedForm;
}

export default FeedAddForm;