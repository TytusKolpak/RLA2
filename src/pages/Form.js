import './Styles/FormPage.css'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';

function TKForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("email", email, "password", password);
    };

    return (
        <div className='FormPage'>
            <h1>Form page</h1>

            <Form>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label >Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter email"
                        value={email}
                        onChange={e => setEmail(e.target.value)} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)} />
                </Form.Group>

                <Button variant="primary" onClick={handleSubmit}>
                    Submit
                </Button>


                {/*
                Submit refreshes whole site
                <Button variant="primary" type="submit">
                    Submit
                </Button> */}
            </Form>
        </div>
    );
}

export default TKForm;