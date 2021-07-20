import React, {Fragment} from 'react';
import Button from 'react-bootstrap/Button';

function ButtonSubmit(props) {
  let isSubmitting = props.isSubmitting;
  let className = props.className;
  let onClick = props.onClick;
  let label = props.label;
  let hideLabelDuringSubmit = props.hideLabelDuringSubmit;

	return <Button variant="primary" type="submit" 
                 disabled={isSubmitting} className={ (className ? className : '') } onClick={onClick}>
    <i className="fa fa-refresh fa-spin" style={{ 
      marginRight: isSubmitting && !hideLabelDuringSubmit ? '5px' : '',
      width: isSubmitting ? '' : 0,
      opacity: isSubmitting ? 1 : 0 
    }} />
    { !(hideLabelDuringSubmit && isSubmitting) && 
      <Fragment>
        { label ? label : 'Submit' }
      </Fragment>
    }
  </Button>;
}

export default ButtonSubmit;