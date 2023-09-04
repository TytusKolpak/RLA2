import "./GradesRoom.css"

import { useEffect, useState } from "react";

// database operations
import { firestore } from "../../firebase_setup/firebase";
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp, orderBy, deleteDoc } from "firebase/firestore";

// User interface components
import ListGroup from 'react-bootstrap/ListGroup';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

// // Used to trigger a database read only once but not on screen render
// var templateDropdownPopulated = false;

const GradesRoom = ({ currentUser }) => {
    const [userCourses, setUserCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [allGradeData, setAllGradeData] = useState([]);
    const [isTeacher, setIsTeacher] = useState(false);
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    // In grade modal
    const [gradeName, setGradeName] = useState('');
    const [gradeScoredPoints, setGradeScoredPoints] = useState("");
    const [gradeMaxPoints, setGradeMaxPoints] = useState("");

    // on a scale from 1-100 (%) how much given type of grade affects the final score
    const [gradeWeight, setGradeWeight] = useState(100);
    const [finalGradeAllData, setFinalGradeAllData] = useState([])

    // Without initial allocation of 4 values, there is an error: A component is changing an uncontrolled input to be controlled. (100 is for weight)
    const [newTemplateParameters, setNewTemplateParameters] = useState(["", "", "", 100])
    const [dropdownTemplateNames, setDropdownTemplateNames] = useState([])

    useEffect(() => {
        console.log("Init")
        setUserCourses([]); // Here for development convenience
        displayUsersCourses();
        checkIfTeacher();
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        console.log("allGradeData changed");
        var totalPointsToGet = 0;
        var totalWeightedPointsScored = 0;
        var sumWeight = 0;

        // Consider grade weights in calculating final score
        for (let index = 0; index < allGradeData.length; index++) {
            const element = allGradeData[index];
            let scoredPoints = element[1];
            let maxPoints = element[2];
            let weight = element[7] / 100;

            // nominator = score * weight (sum)
            totalWeightedPointsScored += scoredPoints * weight;
            totalPointsToGet += maxPoints * weight;
            console.log(scoredPoints, "x ", weight, "=>", scoredPoints * weight, "over ", weight);

            // denominator = weight (sum)
            sumWeight += weight;
        }

        // The important part is calculating the weighted average
        console.log("totalWeightedPointsScored", totalWeightedPointsScored, "sumWeight", sumWeight, "totalPointsToGet", totalPointsToGet);

        var weightedAverage = Math.round(totalWeightedPointsScored * 100) / 100;
        console.log("weightedAverage = sum(points*weight)/sum(weight):", weightedAverage);

        var weightedAverageMax = Math.round(totalPointsToGet * 100) / 100;
        console.log("weightedAverageMax = sum(maxPoints*weight)/sum(weight):", weightedAverageMax);

        let finalScoreAsPercentage = Math.round(weightedAverage / weightedAverageMax * 10000) / 100;
        let gradeInScale;
        let gradeInScaleName;
        switch (true) {
            case finalScoreAsPercentage >= 91:
                gradeInScale = 5.0;
                gradeInScaleName = "Bardzo dobry";
                break;
            case finalScoreAsPercentage >= 81:
                gradeInScale = 4.5;
                gradeInScaleName = "Plus dobry";
                break;
            case finalScoreAsPercentage >= 71:
                gradeInScale = 4.0;
                gradeInScaleName = "Dobry";
                break;
            case finalScoreAsPercentage >= 61:
                gradeInScale = 3.5;
                gradeInScaleName = "Plus dostateczny";
                break;
            case finalScoreAsPercentage >= 50:
                gradeInScale = 3.0;
                gradeInScaleName = "Dostateczny";
                break;
            default:
                gradeInScale = 2.0; // Default grade if no condition matches
                gradeInScaleName = "Niedostateczny";
        }

        setFinalGradeAllData([weightedAverage, weightedAverageMax, finalScoreAsPercentage, gradeInScale, gradeInScaleName])
    }, [allGradeData])

    async function checkIfTeacher() {
        const collectionName = "Grades";
        console.log("currentUser.email", currentUser.email);
        const docRef = doc(firestore, collectionName, currentUser.email);
        const docSnap = await getDoc(docRef);

        var userIsATeacher;
        if (docSnap.exists()) {
            userIsATeacher = docSnap.data().isTeacher;
            console.log("Document isTeacher field:", userIsATeacher);
            if (userIsATeacher) {
                setIsTeacher(true);
            } else {
                setIsTeacher(false);
            }
        } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document!");
        }
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
        console.log("Displaying participants for course course:", course);
        setSelectedCourse(course);

        // Set it to all the student's who are enrolled in this course
        const collectionName = "Courses";
        const docRef = doc(firestore, collectionName, course);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // console.log("Participants:", docSnap.data().participants);

            // without the teacher
            const filteredParticipants = docSnap.data().participants.filter((participant) => participant !== currentUser.email)
            setParticipants(filteredParticipants)
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
        const q = query(courseGradesCollection, orderBy("timestamp"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            setAllGradeData((allGradeData) => [...allGradeData, [
                doc.data().name,
                doc.data().scoredPoints,
                doc.data().maxPoints,
                doc.data().percentageScore,
                doc.data().gradeInScale,
                doc.data().gradeInScaleName,
                doc.id,
                doc.data().gradeWeight
            ]])
        });
    }

    function displayGradingModal() {
        console.log("Showing grading modal.");
        setShowGradingModal(true);
    }

    async function displayTemplateModal() {
        console.log("Showing Template modal");

        if (dropdownTemplateNames.length === 0) {
            console.log("Populating template dropdown with a database read.");
            const querySnapshot = await getDocs(collection(firestore, "Grades", currentUser.email, "GradeTemplates"));
            querySnapshot.forEach((doc) => {
                setDropdownTemplateNames((dropdownTemplateNames) => [...dropdownTemplateNames, doc.data().templateName])
            });
        }

        setShowTemplateModal(true);
    }

    async function createNewGrade(e) {
        e.preventDefault();
        console.log("Creating a new grade. Grade info:", gradeName, gradeScoredPoints, gradeMaxPoints, gradeWeight);

        var validatedGradeWeight;
        if (isNaN(gradeWeight))
            validatedGradeWeight = 100;
        else
            validatedGradeWeight = gradeWeight

        const collectionName = "Grades";
        const IDofDocument = selectedParticipant;
        const subCollectionName = selectedCourse;
        const courseGradesCollection = collection(firestore, collectionName, IDofDocument, subCollectionName);

        // Calculate percentage
        const percentage = (gradeScoredPoints / gradeMaxPoints) * 100;

        // Round the percentage to two decimal places
        const roundedPercentageWholeNumber = Math.round(percentage);
        const roundedPercentageTwoPoints = Math.round(percentage * 100) / 100;

        // Determine grade in a scale (later enable modification)
        let gradeInScale;
        let gradeInScaleName;
        switch (true) {
            case roundedPercentageWholeNumber >= 91:
                gradeInScale = 5.0;
                gradeInScaleName = "Bardzo dobry";
                break;
            case roundedPercentageWholeNumber >= 81:
                gradeInScale = 4.5;
                gradeInScaleName = "Plus dobry";
                break;
            case roundedPercentageWholeNumber >= 71:
                gradeInScale = 4.0;
                gradeInScaleName = "Dobry";
                break;
            case roundedPercentageWholeNumber >= 61:
                gradeInScale = 3.5;
                gradeInScaleName = "Plus dostateczny";
                break;
            case roundedPercentageWholeNumber >= 50:
                gradeInScale = 3.0;
                gradeInScaleName = "Dostateczny";
                break;
            default:
                gradeInScale = 2.0; // Default grade if no condition matches
                gradeInScaleName = "Niedostateczny";
        }

        // Ensure no empty field will enter the database
        var validatedGradeName;
        if (gradeName === "")
            validatedGradeName = "Unspecified";
        else
            validatedGradeName = gradeName;

        const docRef = await addDoc(courseGradesCollection, {
            name: validatedGradeName,
            scoredPoints: gradeScoredPoints,
            maxPoints: gradeMaxPoints,
            percentageScore: roundedPercentageTwoPoints,
            gradeInScale: gradeInScale,
            gradeInScaleName: gradeInScaleName,
            timestamp: serverTimestamp(),
            gradeWeight: validatedGradeWeight
        });

        console.log("Document written with ID: ", docRef.id);

        // displayGradesForParticipant(selectedParticipant);
        // Add newly acquired/calculated data to an UseState variable (table)
        setAllGradeData((allGradeData) => [...allGradeData, [
            validatedGradeName,
            gradeScoredPoints,
            gradeMaxPoints,
            roundedPercentageTwoPoints,
            gradeInScale,
            gradeInScaleName,
            docRef.id,
            validatedGradeWeight
        ]])
    }

    async function createNewTemplate(e) {
        e.preventDefault()
        console.log(newTemplateParameters);

        // Create a database write of such a template (into a subCollection (templates will be shared among courses of a given teacher))
        const collectionName = "Grades";
        const IDofDocument = currentUser.email;
        const subCollectionName = "GradeTemplates";
        const courseGradesCollection = collection(firestore, collectionName, IDofDocument, subCollectionName);

        const docRef = await addDoc(courseGradesCollection, {
            templateName: newTemplateParameters[0],
            gradeName: newTemplateParameters[1],
            defaultMaxScore: newTemplateParameters[2],
            defaultWeight: newTemplateParameters[3],
            timestamp: serverTimestamp()
        });

        console.log("Created a doc in", collectionName, "in", subCollectionName, "with id:", docRef.id);
    }

    async function deleteGrade(gradeID, indexToRemove) {
        console.log("Deleting a grade of id:", gradeID, "for:", selectedParticipant, "in course:", selectedCourse);

        // Delete from useState variable
        // console.log("all grade data", allGradeData, "clicked element's index:", indexToRemove);

        // Use the filter method to create a new array without the subarray at the given index
        const updatedGradeData = allGradeData.filter((_, index) => index !== indexToRemove);

        // Update the state with the new array
        setAllGradeData(updatedGradeData);

        // Delete from database
        await deleteDoc(doc(firestore, "Grades", selectedParticipant, selectedCourse, gradeID));
    }

    // One UseState variable, many inputs handled maybe better extra 3 line function than n(3 for a total of 4) more variables 
    function handleTemplateInputs(value, index) {
        const updatedParameters = [...newTemplateParameters];
        updatedParameters[index] = value;
        setNewTemplateParameters(updatedParameters);
    }

    async function applySelectedTemplate(selectedTemplateName) {
        console.log(selectedTemplateName, "chosen.");
        const collectionRef = collection(firestore, "Grades", currentUser.email, "GradeTemplates");

        // Create a query against the collection.
        const q = query(collectionRef, where("templateName", "==", selectedTemplateName));

        // Query's result
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            setGradeName(doc.data().gradeName)
            setGradeMaxPoints(doc.data().defaultMaxScore)
            setGradeWeight(doc.data().defaultWeight)
        });
    }

    return (
        <div className="GradesRoom">
            <h1>Grades Room of {isTeacher ? "teacher" : "student"}: {currentUser.email.substring(0, currentUser.email.indexOf('@'))}</h1>
            <div className="horizontalFlex">
                <div className="courses">
                    <h4>Choose a course.</h4>
                    <ListGroup>
                        {userCourses.map((element, index) => (
                            <ListGroup.Item action onClick={
                                isTeacher ?
                                    () => displayParticipantsForCourse(element) : // Only display different participants for a teacher
                                    () => displayGradesForParticipant(currentUser.email) // Get straight to grades
                            } key={index}>{element}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
                {isTeacher &&
                    <div className="participants">
                        <h4>Choose a participant.</h4>
                        {participants.length === 0 && <p>Select a course</p>}
                        <ListGroup>
                            {participants.map((element, index) => (
                                <ListGroup.Item action onClick={() => displayGradesForParticipant(element)} key={index}>{element}</ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                }
            </div>
            <div className="grades">
                <h4>View/create grades.</h4>
                {
                    selectedParticipant == null ? <p>Select a participant</p> :
                        <>
                            <h5>Grades of: <b>{selectedParticipant.substring(0, selectedParticipant.indexOf('@'))}</b> in course: <b>{selectedCourse}</b></h5>
                            <hr></hr>
                            <div className="mainPanel">
                                <Container className="gradeTable">
                                    <Row>
                                        <Col>Number</Col>
                                        <Col>Grade name</Col>
                                        <Col>Scored points</Col>
                                        <Col>Max points</Col>
                                        <Col>Score as %</Col>
                                        <Col>Grade in scale</Col>
                                        <Col>Weight</Col>
                                        {isTeacher && <Col></Col>}
                                    </Row>
                                    {allGradeData.map((element, index) => (
                                        <Row key={index}>
                                            <Col>{index}</Col>
                                            <Col>{element[0]}</Col>
                                            <Col>{element[1]}</Col>
                                            <Col>{element[2]}</Col>
                                            <Col>{element[3]}%</Col>
                                            <Col>{element[4]}</Col>
                                            <Col>{element[7] / 100}</Col>
                                            {isTeacher && <Col><Button variant="secondary" onClick={() => deleteGrade(element[6], index)}>Delete</Button></Col>}
                                        </Row>
                                    ))}
                                </Container>
                            </div>
                            <hr></hr>
                            <div className="results">
                                {finalGradeAllData &&
                                    <div>
                                        <p>Total points scored: <b>{finalGradeAllData[0]}/{finalGradeAllData[1]}</b>, which is: <b>{finalGradeAllData[2]}%</b>. Final score: <b>{finalGradeAllData[3]}</b> - <b>"{finalGradeAllData[4]}"</b>.</p>
                                    </div>
                                }
                                {isTeacher && <div><Button onClick={displayGradingModal}>Create new grade</Button></div>}
                                {isTeacher && <div><Button variant="secondary" onClick={displayTemplateModal}>Create new template</Button></div>}
                            </div>
                        </>
                }
            </div>

            {/* It's displayed atop of everything else so it doesn't matter where in this structure it is placed */}
            <Modal show={showGradingModal} onHide={() => setShowGradingModal(false)} backdrop="static" centered>

                <Form>
                    <Modal.Header closeButton>
                        <Modal.Title>Create new grade</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3" >
                            <DropdownButton
                                variant="secondary"
                                id="template-dropdown"
                                title="Select Grade Template"
                                className="mb-3">
                                {dropdownTemplateNames.map((template, index) => (
                                    <Dropdown.Item key={index} onClick={() => applySelectedTemplate(template)}>{template}</Dropdown.Item>
                                ))}
                            </DropdownButton>

                            <Form.Label>Name:</Form.Label>
                            <Form.Control
                                className="mb-3"
                                placeholder="Name"
                                value={gradeName}
                                onChange={e => setGradeName(e.target.value)} />



                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Scored points:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Scored points"
                                        value={gradeScoredPoints}
                                        onChange={e => setGradeScoredPoints(parseFloat(e.target.value))} />
                                </Form.Group>

                                <Form.Group as={Col}>
                                    <Form.Label>Max points:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Max points"
                                        value={gradeMaxPoints}
                                        onChange={e => setGradeMaxPoints(parseFloat(e.target.value))} />
                                </Form.Group>

                                <Form.Group as={Col}>
                                    <Form.Label>Weight (%):</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Weight"
                                        value={gradeWeight}
                                        onChange={e => setGradeWeight(parseFloat(e.target.value))} />
                                </Form.Group>
                            </Row>


                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button type="submit" variant="primary" onClick={createNewGrade}>Create</Button>
                        <Button variant="secondary" onClick={() => setShowGradingModal(false)}>Close</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} backdrop="static" centered>

                <Form>
                    <Modal.Header closeButton>
                        <Modal.Title>Create new template for new grades</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <Form.Group className="mb-3" >
                            <Form.Label>Template name:</Form.Label>
                            <Form.Control
                                className="mb-3"
                                placeholder="Name"
                                value={newTemplateParameters[0]}
                                onChange={e => handleTemplateInputs(e.target.value, 0)} />

                            <h5 className="templateModalH5">Default values for new grade</h5>
                            <Form.Label>Name:</Form.Label>
                            <Form.Control
                                className="mb-3"
                                placeholder="Name"
                                value={newTemplateParameters[1]}
                                onChange={e => handleTemplateInputs(e.target.value, 1)} />

                            <Row className="mb-3">
                                <Form.Group as={Col}>
                                    <Form.Label>Max points:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Max points"
                                        value={newTemplateParameters[2]}
                                        onChange={e => handleTemplateInputs(parseFloat(e.target.value), 2)} />
                                </Form.Group>

                                <Form.Group as={Col}>
                                    <Form.Label>Weight (%):</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Weight"
                                        value={newTemplateParameters[3]}
                                        onChange={e => handleTemplateInputs(parseFloat(e.target.value), 3)} />
                                </Form.Group>
                            </Row>

                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button type="submit" variant="primary" onClick={createNewTemplate}>Create</Button>
                        <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>Close</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default GradesRoom;