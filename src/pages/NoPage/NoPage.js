import { useEffect, useState } from "react";
import "./NoPage.css"
import Spinner from 'react-bootstrap/Spinner';

const NoPage = () => {
    const [displaySpinner, setDisplaySpinner] = useState(true);

    const loadingTime = 5 //In seconds

    useEffect(() => {
        // Turn off the visibility after specified time
        setTimeout(() => {
            setDisplaySpinner(false)
        }, loadingTime * 1000);
    }, [])

    return (
        <div className="NoPage">
            {!displaySpinner ?
                <>
                    <h1>Error</h1>
                    <p>Either page doesn't exist or You have no permission to view it.</p>
                </>
                :
                <>
                    <h1>Loading...</h1>
                    <div className='center'>
                        <Spinner animation="border" role="status"></Spinner>
                    </div>
                </>
            }
        </div>
    );
};

export default NoPage;