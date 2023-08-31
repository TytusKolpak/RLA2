import "./CoursesRoom.css"

import { useEffect, useState } from "react";
import ListGroup from 'react-bootstrap/ListGroup';

const CoursesRoom = () => {
    const [allCourses, setAllCourses] = useState([]);
    const [userCourses, setUserCourses] = useState([]);

    useEffect(() => {
        console.log("I fire once on screen render");
        displayCourses();
    }, [])

    function displayCourses() {
        // Change it to database read
        setAllCourses(["Informatyka 2", "Matematyka 3", "Fizyka 1", "Chemia 1"]);
    }

    function courseClick(element) {
        // Now change this to a database write
        console.log("Course:", element, "clicked.");
        if (!userCourses.includes(element)) {
            setUserCourses(userCourses => [...userCourses, element]);
        } else {
            console.log("You have already enrolled on this course.");
        }
    }


    return (
        <div className="CoursesRoom">
            <h1>Courses Room</h1>
            <p>Students can enroll on a course here.</p>
            <div className="horizontalFlex">
                <div className="allCourses">
                    <h4>All Courses</h4>
                    <p>Here are all courses drawn from the database. (Created by admin)</p>
                    <ListGroup>
                        {allCourses.map((element, index) => (
                            <ListGroup.Item action onClick={() => courseClick(element)} key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
                <div className="yourCourses">
                    <h4>Your Courses</h4>
                    <p>Here are all courses on which You have enrolled.</p>
                    <ListGroup>
                        {userCourses.map((element, index) => (
                            <ListGroup.Item action onClick={() => courseClick(element)} key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </div>
    );
};

export default CoursesRoom;