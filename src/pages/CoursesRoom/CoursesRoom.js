import "./CoursesRoom.css"

import { useEffect, useState } from "react";
import ListGroup from 'react-bootstrap/ListGroup';

// database operations
import { firestore } from "../../firebase_setup/firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from "firebase/firestore";

const CoursesRoom = ({ currentUser }) => {
    const [allCourses, setAllCourses] = useState([]);
    const [userCourses, setUserCourses] = useState([]);

    useEffect(() => {
        displayAllCourses();
        displayUserCourses();
        // eslint-disable-next-line
    }, [])

    async function displayAllCourses() {
        console.log("Displaying all courses");
        const collectionName = "Courses";
        const querySnapshot = await getDocs(collection(firestore, collectionName));
        querySnapshot.forEach((doc) => {
            // console.log(doc.id, " => ", doc.data());
            const courseName = doc.id;
            setAllCourses((allCourses) => [...allCourses, courseName]);
        });
    }

    async function displayUserCourses() {
        console.log("Displaying user courses. (for", currentUser.email, ")");
        const collectionName = "Courses";
        const coursesRef = collection(firestore, collectionName);

        // Create a query against the collection.
        const q = query(coursesRef, where("participants", "array-contains", currentUser.email));

        // Query's result
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            // console.log(doc.id, ":", doc.data());
            setUserCourses((userCourses) => [...userCourses, doc.id]);
        });
    }

    async function enrollOnACourse(element) {
        console.log("Course:", element, "clicked.");

        //add current user to participants field to a course document
        const collectionName = "Courses";
        const courseRef = doc(firestore, collectionName, element);

        // Atomically add current user to the "participants" array field.
        console.log("Enrolling user", currentUser.email, "on a course", element);
        await updateDoc(courseRef, {
            participants: arrayUnion(currentUser.email)
        });
        // If user is already on a course arrayUnion won't add the same string to an array again

        // Adding a new course to user courses (in frontend)
        // Database entry is checked by firestore, but here in react we have to check for ourselves
        if (!userCourses.includes(element)) {
            setUserCourses(userCourses => [...userCourses, element]);
        }

        // On every valid enroll a record in database is created either way, but we read the database only on first render since doing it every time would mean extra loading time and data consumption while the effect stays the same.
    }

    return (
        <div className="CoursesRoom">
            <h1>Courses Room of {currentUser.email.substring(0, currentUser.email.indexOf('@'))}</h1>
            <p>Students can enroll on a course here.</p>
            <div className="horizontalFlex">
                <div className="allCourses">
                    <h4>All Courses</h4>
                    <p>Here are all courses drawn from the database. <br></br>Enroll on a course by clicking on it.</p>
                    <ListGroup>
                        {allCourses.map((element, index) => (
                            <ListGroup.Item action onClick={() => enrollOnACourse(element)} key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
                <div className="yourCourses">
                    <h4>Your Courses</h4>
                    <p>Here are all courses on which You have enrolled.</p>
                    <ListGroup>
                        {userCourses.map((element, index) => (
                            <ListGroup.Item action onClick={() => enrollOnACourse(element)} key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </div>
    );
};

export default CoursesRoom;