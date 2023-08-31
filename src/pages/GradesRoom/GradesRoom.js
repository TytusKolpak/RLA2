import "./GradesRoom.css"

import { useEffect } from "react";


const GradesRoom = () => {

    useEffect(() => {
        console.log("I fire once on screen render")
    }, [])


    return (
        <div className="GradesRoom">
            <h1>Grades Room</h1>
            
        </div>
    );
};

export default GradesRoom;