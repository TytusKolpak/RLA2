import "./CoursesRoom.css"

import { useEffect } from "react";


const CoursesRoom = () => {

    useEffect(() => {
        console.log("I fire once on screen render")
    }, [])


    return (
        <div className="CoursesRoom">
            <h1>Courses Room</h1>
            <p>Students can enroll on a course here.</p>
            <div className="allCourses">
                <h2>All Courses</h2>
            </div>
            <div className="yourCourses">
                <h2>Your Courses</h2>
            </div>
        </div>
    );
};

export default CoursesRoom;