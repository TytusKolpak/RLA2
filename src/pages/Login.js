import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { useState, useEffect } from 'react';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentUser, setCurrentUser] = useState();

    const auth = getAuth();

    // set currentUser only on auth change, render once per auth change
    useEffect(() => {
        onAuthStateChanged(auth, (user) =>
            setCurrentUser(user)
        );
    }, [auth]);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Perform login logic: create a user record in the database with these fields
        // console.log("email:", email)
        // console.log("password:", password);

        // Reset form inputs
        setEmail('');
        setPassword('');

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                console.log("Success, You are signed in.");
                console.log("userCredential", userCredential);
            })
            .catch((error) => {
                // Failed to signed in 
                console.log("errorCode", error.code);
                console.log("errorMessage", error.message);
            });
    }


    function mySignOut() {
        // signOut is a promise already, so you can use .then and .catch immediately 
        signOut(auth)
            .then(() => {
                console.log("Sign-out successful.");
            })
            .catch((error) => {
                console.log("An error happened:", error);
            });
    }


    return (<>
        <h1>Login page</h1>
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

            {
                currentUser
                    ?
                    <Button variant='secondary' onClick={mySignOut}>Log out</Button>
                    :
                    <Button variant='primary' type="submit">Log in</Button>
            }

        </Form>

    </>);
};

export default Login;