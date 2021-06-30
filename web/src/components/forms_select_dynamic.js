import React from 'react';
import Button from 'react-bootstrap/Button';

function SelectDynamic(props) {
  let isSubmitting = props.isSubmitting;
  let className = props.className;
  let onClick = props.onClick;
  let options = props.options;

	return <Button variant="primary" type="submit" 
                 disabled={isSubmitting} className={ (className ? className : '') + " birdfeed-submit" } onClick={onClick}>
    <i className="fa fa-refresh fa-spin" style={{ 
      marginRight: isSubmitting ? '5px' : '',
      width: isSubmitting ? '1em' : 0,
      opacity: isSubmitting ? 1 : 0 
    }} />
    { label ? label : 'Submit' }
  </Button>;
}

export default SelectDynamic;