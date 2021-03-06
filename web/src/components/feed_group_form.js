import React, {useContext} from 'react';
import ButtonSubmit from './forms_button_submit'
import {AlertContext} from './feed_alert';
import FeedGroupAddForm from './feed_group_add_form';

const FeedGroupForm = (props) => {
  const showAlert = useContext(AlertContext);
  const activeCollection = props.activeCollection;
  const setActiveCollection = props.setActiveCollection;
  const collections = props.collections;
  const setCollections = props.setCollections;
  const setTab = props.setTab;

  function deleteGroup(id) {
    if(id === 'The Menagerie') {
      showAlert({
        'variant': 'warning', 
        'message': 'The Menagerie must not be deleted!'
      })
    }
    else {
      let newActiveCollection = '';
      let newCollections = collections.filter((item) => item.id !== id); 
      setCollections(newCollections);

      if(activeCollection === id) {
        if(newCollections.length) {
          newActiveCollection = newCollections[0].id;
        }
        setActiveCollection(newActiveCollection);
      }

      showAlert({
        'variant': 'info', 
        'message': `Feed Group Deleted`
      })
    }
  }

  function handleGroupSelect(e, id) {
    setActiveCollection(id);
  }

  let options = collections.map(collection => {
    let isActive = collection.id === activeCollection; 
    let groupNameClass = "button-styled-as-link feed-group-list-group " + (isActive ? "feed-group-list-group-active" : '');

    return <div className="feed-group-list-row" value={collection.id} key={collection.id}>
      <button className={groupNameClass} onClick={(e) => handleGroupSelect(e, collection.id)}>
        {collection.text} {isActive ? ' (active)' : ''}
      </button>
      <div className="feed-group-list-delete">
        <ButtonSubmit onClick={() => deleteGroup(collection.id)} 
                label={<i className="fa fa-trash"></i>} className="float-right" />
      </div>
      </div>
  });

  return (
    <div>
      <FeedGroupAddForm activeCollection={activeCollection} setActiveCollection={setActiveCollection} 
                    collections={collections} setCollections={setCollections} />
      <div className="big-label mt-3">Delete Groups</div>
      <div className="setup-table feed-group-list">
        {options}
      </div>
    </div>
  );

}

export default FeedGroupForm;
