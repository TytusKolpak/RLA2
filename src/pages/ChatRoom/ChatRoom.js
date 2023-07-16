// Display character
import './ChatRoom.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

// React variable handling
import { useState, useEffect } from 'react';

// Database related
import { firestore } from '../../firebase_setup/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Get user state from different file
import { useUserAuth } from '../Login';

function ChatRoom() {
    const [messages, setMessages] = useState([]);
    const [inputtedMessage, setInputtedMessage] = useState('');
    const pullUser = useUserAuth();
    const [user] = useState(pullUser)

    // Init
    useEffect(() => {
        seeUsers();
    }, []);

    async function seeUsers() {
        console.log('Click');
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
            const collection = "testMessages";
            const document = {
                messageText: inputtedMessage,
                sender: user.email
            }

            console.log(collection, document);
            // This is the core of creating a record
            // addDoc(collection(database, "collectionName"),{documentContents})
            // if collection of collectionName doesn't exist, it will be created
            const docRef = await addDoc(collection(firestore, collection), document);

            if (docRef) {
                console.log("Added document of id:", docRef.id);
            }
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    return (
        <>
            <h1>ChatRoom {user ?  user.email : null}</h1>

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

                {user ?
                    <Button variant='primary' type="submit">Send</Button>
                    :
                    <>
                        <Button variant='primary' type="submit" disabled>Send</Button>
                        <p>Nobody is logged in.</p>
                    </>}
            </Form>
        </>
    );
}

export default ChatRoom;
