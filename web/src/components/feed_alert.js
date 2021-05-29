import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
export const AlertContext = React.createContext('showAlert');

function FeedAlert(props) {
    const [alertInfo, showAlert] = useState({variant: 'info', message: ''});
    const t = 5;

    useEffect(() => {
        showAlert({})
        let alertTimer = null;
        setTimeout(() => {
            showAlert({variant: props.alertInfo.variant, message: props.alertInfo.message});
            clearTimeout(alertTimer);
            alertTimer = setTimeout(() => showAlert({message: ''}), t * 1000);
        }, 0);
        return () => clearTimeout(alertTimer);
    }, [props.alertInfo]);

    let isShowing = Boolean(alertInfo.message);
    
    if(isShowing) {
        return <Alert variant={alertInfo.variant} className={'bf-alert anim-fade-out'}>{alertInfo.message}</Alert>
    }
    else {
        return '';
    }
}

export default FeedAlert;