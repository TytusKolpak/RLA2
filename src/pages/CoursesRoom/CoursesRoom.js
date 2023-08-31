import "./CoursesRoom.css"

import { useEffect } from "react";


const CoursesRoom = () => {

    useEffect(() => {
        console.log("I fire once on screen render")
    }, [])


    return (
        <div className="CoursesRoom">
            <h1>Courses Room</h1>
            
        </div>
    );
};

export default CoursesRoom;