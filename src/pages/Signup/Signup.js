import "./Signup.css"

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { useEffect, useState } from 'react';

// Database related
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { firestore } from '../../firebase_setup/firebase';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [userCreated, setUserCreated] = useState(false);

    const auth = getAuth();

    // Here just to turn off the message of successful signup on exit from the page
    useEffect(() => {
        return setUserCreated(false);
    }, [])

    async function addContactsDocument() {
        console.log("adding a Contacts document for new user.");
        await addDoc(collection(firestore, "Contacts"), { ownerAddress: email, contacts: [] });
    }

    async function addGradingDocument() {
        console.log("Adding a Grades document for new user.");
        const collectionName = "Grades";
        const ID = email;

        // All documents' ID is their owner email (for convenience),
        // teachers have isTeacher field as true, and linked students
        // students have isTeacher field as false, and grades
        if (isChecked) {
            // Treat as a teacher
            await setDoc(doc(firestore, collectionName, ID), {
                isTeacher: true,
                courses: []
            });
        } else {
            // Treat as a student
            await setDoc(doc(firestore, collectionName, ID), {
                isTeacher: false,
                courses: [],
                grades: [] // main grades, later on we can add a new field like Course2DFGrades (or a sub-collection)
            });
        }
    }

    async function addStorageAccessDocument() {
        console.log("Adding a Storage Access document for new user.");
        const collectionName = "StorageAccess";
        const ID = email.toLowerCase(); // For some reason that's the way it needs to be
        await setDoc(doc(firestore, collectionName, ID), { accessGroups: [] });
    }

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Perform login logic: create a user record in the database with these fields
        // console.log("email:", email)
        // console.log("password:", password);

        // Do create an user
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Success, You have created an account.");
                const user = userCredential.user;
                console.log("user", user);
                setUserCreated(true);

                // Add necessary database entries
                addContactsDocument(); // For contacts
                addGradingDocument(); // For grading
                addStorageAccessDocument(); // For accessing files

                const displayTime = 10 // seconds
                // Hide the message
                setTimeout(() => {
                    setUserCreated(false);
                }, displayTime * 1000);
                return;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode", errorCode);
                console.log("errorMessage", errorMessage);
            });

        // Reset form inputs
        setEmail('');
        setPassword('');
        setIsChecked(false);
    };

    return (
        <div id='Signup'>
            <h1>Signup page</h1>
            <Form className="wider" onSubmit={handleFormSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label >Email address</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicCheckbox">
                    <Form.Check
                        type="checkbox"
                        label="I'm a teacher"
                        checked={isChecked}
                        onChange={e => setIsChecked(e.target.checked)}
                    />
                </Form.Group>

                <Button variant='primary' type="submit">
                    Sign up
                </Button>

                {userCreated && <h3 className="greeting"> You have created an user </h3>}
            </Form>
        </div>);

};

export default Signup;