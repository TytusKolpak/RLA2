// Display styling
import './ChatRoom.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

// React variable handling
import { useState } from 'react';

// Database related
import { firestore } from '../../firebase_setup/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Get user state from different file
import { useCurrentUser } from '../Login';

var initialized = false

function ChatRoom() {
    const [messages, setMessages] = useState([]);
    const [inputtedMessage, setInputtedMessage] = useState('');
    const pulledUser = useCurrentUser('');

    // It's sure to fire only once
    if (!initialized) {
        seeUsers();
        getUserContacts();
        initialized = true;
    }
    async function seeUsers() {
        const newMessages = [];

        const messagesRef = collection(firestore, "Message")
        const q = query(messagesRef, where("owner", "==", "You"))
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const text = doc.data().text;
            const ID = doc.data().id;
            newMessages.push({ ID: ID, text: text });
        });
        setMessages(newMessages);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        createMessageDoc();
        console.log(inputtedMessage)
    }

    async function createMessageDoc() {
        try {
            const collectionName = "testMessages";
            const document = {
                messageText: inputtedMessage,
                sender: pulledUser.email
            }

            // This is the core of creating a record
            // addDoc(collection(database, "collectionName"),{documentContents})
            // if collection of collectionName doesn't exist, it will be created
            const docRef = await addDoc(collection(firestore, collectionName), document);

            if (docRef) {
                console.log("Added document of id:", docRef.id);
            }
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    // For displaying the elements on the left as radio buttons
    // const [checked, setChecked] = useState(false);
    const [radioValue, setRadioValue] = useState('1');
    const [allContacts, setAllContacts] = useState([]);

    async function getUserContacts() {
        const collectionName = "Contacts"
        const querySnapshot = await getDocs(collection(firestore, collectionName));

        querySnapshot.forEach((doc) => {
            setAllContacts(doc.data().contacts);
            console.log(allContacts);
        });
        
    }

    return (
        <div className='chatRoom'>
            <div id='leftPanel'>

                <ButtonGroup vertical="true">
                    {allContacts && allContacts.map((radio, idx) => (
                        <ToggleButton
                            key={idx}
                            id={`radio-${idx}`}
                            type="radio"
                            name="radio"
                            value={radio.value}
                            checked={radioValue === radio.value}
                            onChange={(e) => setRadioValue(e.currentTarget.value)}
                        >
                            {radio.name}
                        </ToggleButton>
                    ))}
                </ButtonGroup>
            </div>
            <div id='middlePanel'>
                <h1>ChatRoom {pulledUser ? "of " + pulledUser.email : null}</h1>

                <ul>
                    {messages.map((message) => (
                        <li key={message.ID}>{message.text}</li>
                    ))}
                </ul>

                <Form onSubmit={handleFormSubmit}>
                    <Form.Group className="mb-3" >
                        <Form.Label >Message</Form.Label>
                        <Form.Control
                            value={inputtedMessage}
                            onChange={e => setInputtedMessage(e.target.value)}
                        />
                    </Form.Group>

                    {pulledUser ?
                        <Button variant='primary' type="submit">Send</Button>
                        :
                        <>
                            <Button variant='primary' type="submit" disabled>Send</Button>
                            <p>Nobody is logged in.</p>
                        </>}
                </Form>
            </div>
            <div id='rightPanel'>Right</div>
        </div>
    );
}

export default ChatRoom;
