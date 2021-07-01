import React from 'react';
import Button from 'react-bootstrap/Button';

function ButtonSubmit(props) {
  let isSubmitting = props.isSubmitting;
  let className = props.className;
  let onClick = props.onClick;
  let label = props.label;

	return <Button variant="primary" type="submit" 
                 disabled={isSubmitting} className={ (className ? className : '') } onClick={onClick}>
    <i className="fa fa-refresh fa-spin" style={{ 
      marginRight: isSubmitting ? '5px' : '',
      width: isSubmitting ? '1em' : 0,
      opacity: isSubmitting ? 1 : 0 
    }} />
    { label ? label : 'Submit' }
  </Button>;
}

export default ButtonSubmit;