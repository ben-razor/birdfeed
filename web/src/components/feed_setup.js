import React, {useState, useEffect, Fragment} from 'react';

function FeedSetup() {
  const [feeds, setFeeds] = useState([]);


  useEffect(() => {

  }, [feeds]);

  return (
      <Fragment>
          <h3>List of configured feeds will appear here</h3>
      </Fragment>
  )
}

export default FeedSetup;