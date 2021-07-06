import React, {useState} from 'react'
import Button from 'react-bootstrap/Button'
import Collapse from 'react-bootstrap/Collapse'

function BirdfeedCollapse(props) {
  const [open, setOpen] = useState(false);
	let elemID = props['elemID'];
	let triggerLabel = props['triggerLabel'];
	let content = props['content'];
	let className = props['className'];

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        aria-controls={elemID}
        aria-expanded={open}
				className={className}
      >
				{triggerLabel}
      </Button>
      <Collapse in={open}>
        <div id={elemID}>{content}</div>
      </Collapse>
    </>
  );
}

export default BirdfeedCollapse;