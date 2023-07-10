import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import { useState } from 'react';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [greetingVisibility, setGreetingVisibility] = useState(false);
    const [displayEmail, setDisplayEmail] = useState('')

    const auth = getAuth();

    // Observer on the auth object, works but change it (fires every time i enter anything into a form, so on EVERY change (other variables included))
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            setDisplayEmail(user.email);
            if (!greetingVisibility) {
                setGreetingVisibility(true);
            }
            // ...
        } else {
            // User is signed out
            // ...
        }
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Perform login logic: create a user record in the database with these fields
        console.log("email:", email)
        console.log("password:", password);

        // Reset form inputs
        setEmail('');
        setPassword('');

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                console.log("Success, You are signed in.");
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
    }


    function mySignOut() {
        console.log("auth", auth);
        signOut(auth).then(() => {
            console.log("Sign-out successful.");
            if (greetingVisibility) {
                setGreetingVisibility(false);
                console.log("greetingVisibility:", greetingVisibility);
            }
        }).catch((error) => {
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

            <Button variant='primary' type="submit">
                Log in
            </Button>
        </Form>
        <Button variant='secondary' onClick={mySignOut}>
            Log out
        </Button>

        {greetingVisibility ? <p>HI {displayEmail}</p> : null}

    </>);
};

export default Login;