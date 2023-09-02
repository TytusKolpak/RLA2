import "./GradesRoom.css"

import { useEffect, useState } from "react";

// database operations
import { firestore } from "../../firebase_setup/firebase";
import { collection, getDocs, query, where, doc, getDoc, addDoc } from "firebase/firestore";

// User interface components
import ListGroup from 'react-bootstrap/ListGroup';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Button } from "react-bootstrap";

const GradesRoom = ({ currentUser }) => {
    const [userCourses, setUserCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [allGradeData, setAllGradeData] = useState([]);
    const [teacher, setTeacher] = useState(false);

    useEffect(() => {
        console.log("Init")
        setUserCourses([]); // Here for development convenience
        displayUsersCourses();
        checkIfTeacher();
        // eslint-disable-next-line
    }, [])

    async function checkIfTeacher() {
        const collectionName = "Grades";
        console.log("currentUser.email", currentUser.email);
        const docRef = doc(firestore, collectionName, currentUser.email);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
        } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
        }
        setTeacher(true);
    }

    async function displayUsersCourses() {
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

    async function displayParticipantsForCourse(course) {
        console.log("For course:", course);
        setSelectedCourse(course);

        // Set it to all the student's who are enrolled in this course
        const collectionName = "Courses";
        const docRef = doc(firestore, collectionName, course);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // console.log("Participants:", docSnap.data().participants);
            setParticipants(docSnap.data().participants)
        } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
        }
    }

    async function displayGradesForParticipant(participant) {
        setAllGradeData([]);
        console.log("Displaying grades for participant:", participant);
        setSelectedParticipant(participant);

        // create a subCollection reference 
        const collectionName = "Grades";
        const IDofDocument = participant;
        const subCollectionName = selectedCourse;
        const courseGradesCollection = collection(firestore, collectionName, IDofDocument, subCollectionName);

        // use the query's results to populate a useState variable
        const querySnapshot = await getDocs(courseGradesCollection);
        querySnapshot.forEach((doc) => {
            setAllGradeData((allGradeData) => [...allGradeData, [
                doc.data().name,
                doc.data().scoredPoints,
                doc.data().maxPoints
            ]])
        });
        console.log("That's all folks ;D.");
    }

    async function gradeUser() {
        console.log("Grading user.");

        const collectionName = "Grades";
        const IDofDocument = selectedParticipant;
        const subCollectionName = selectedCourse;
        const courseGradesCollection = collection(firestore, collectionName, IDofDocument, subCollectionName);

        // Add a new document with a generated id.
        const docRef = await addDoc(courseGradesCollection, {
            name: "Assignment 1",
            scoredPoints: 9,
            maxPoints: 10
        });

        console.log("Document written with ID: ", docRef.id);

        displayGradesForParticipant(selectedParticipant);
    }

    return (
        <div className="GradesRoom">
            <h1>Grades Room of {teacher ? "teacher" : "student"}: {currentUser.email.substring(0, currentUser.email.indexOf('@'))}</h1>
            <p>All users can view their grades here. Teachers can grade their students.</p>
            <div className="horizontalFlex">
                <div className="courses">
                    <h4>Choose a course.</h4>
                    <ListGroup>
                        {userCourses.map((element, index) => (
                            <ListGroup.Item action onClick={() => displayParticipantsForCourse(element)} key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
                <div className="participants">
                    <h4>Choose course participants.</h4>
                    {participants.length === 0 && <p>Select a course</p>}
                    <ListGroup>
                        {participants.map((element, index) => (
                            <ListGroup.Item action onClick={() => displayGradesForParticipant(element)} key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
                <div className="grades">
                    <h4>View/create grades.</h4>
                    {
                        selectedParticipant == null ? <p>Select a participant</p> :
                            <>
                                <h5>Grades of: <b>{selectedParticipant.substring(0, selectedParticipant.indexOf('@'))}</b> in course: <b>{selectedCourse}</b></h5>

                                <Container className="gradeTable">
                                    <Row>
                                        <Col>Number</Col>
                                        <Col>Grade name</Col>
                                        <Col>Scored points</Col>
                                        <Col>Max points</Col>
                                    </Row>
                                    {allGradeData.map((element, index) => (
                                        <Row>
                                            <Col>{index}</Col>
                                            <Col>{element[0]}</Col>
                                            <Col>{element[1]}</Col>
                                            <Col>{element[2]}</Col>
                                        </Row>
                                    ))}
                                </Container>

                                <Button onClick={gradeUser}>Create new grade</Button>
                            </>
                    }
                </div>
            </div>
        </div>
    );
};

export default GradesRoom;