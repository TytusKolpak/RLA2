import "./Signup.css"

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { useEffect, useState } from 'react';

// Database related
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { firestore } from '../../firebase_setup/firebase';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userCreated, setUserCreated] = useState(false);

    const auth = getAuth();

    async function addContactsDocument() {
        // addDoc(collection(database, "collectionName"),{documentContents})
        await addDoc(collection(firestore, "Contacts"), { ownerAddress: email, contacts: [] });
    }

    // Here just to turn off the message of successful signup on exit from the page
    useEffect(() => {
        return setUserCreated(false);
    }, [])

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Perform login logic: create a user record in the database with these fields
        console.log("email:", email)
        console.log("password:", password);

        // Reset form inputs
        setEmail('');
        setPassword('');

        // Do create an user
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Success, You have created an account.");
                const user = userCredential.user;
                console.log("user", user);
                setUserCreated(true);
                addContactsDocument();
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode", errorCode);
                console.log("errorMessage", errorMessage);
            });
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

                <Button variant='primary' type="submit">
                    Sign up
                </Button>

                {userCreated &&
                    <h3 className="greeting">
                        You have created an user
                    </h3>
                }
            </Form>
        </div>);

};

export default Signup;