import './Form.css'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

function TKForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Perform login logic: create a user record in the database with these fields
        console.log("email:", email)
        console.log("password:", password);

        // Reset form inputs
        setEmail('');
        setPassword('');

        // Set submitted state to true
        setSubmitted(true);
    };

    return (
        <div className='FormPage'>
            <h1>Form page</h1>

            {/* this function handles what happens when user submits form (clicks a button) */}
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

                <Button variant={submitted ? 'success' : 'primary'} type="submit">
                    {submitted ? 'Submitted' : 'Submit'}
                </Button>
            </Form>
        </div>
    );
}

export default TKForm;