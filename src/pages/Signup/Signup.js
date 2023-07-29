import "./Signup.css"

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { useState } from 'react';

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const auth = getAuth();

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
                // Signed in 
                console.log("Success, You have created an account.");
                const user = userCredential.user;
                console.log("user", user);
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("errorCode", errorCode);
                console.log("errorMessage", errorMessage);
                // ..
            });
    };

    return (
        <div id='Signup'>
            <h1>Signup page</h1>
            <Form onSubmit={handleFormSubmit}>
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
            </Form>
        </div>);

};

export default Signup;