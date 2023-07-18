// Display styling
import './ChatRoom.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

// React variable handling
import { useEffect, useState } from 'react';

// Database related
import { firestore } from '../../firebase_setup/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';

// Get user state from different file
import { useCurrentUser } from '../Login';

function ChatRoom() {
    const [inputtedMessage, setInputtedMessage] = useState('');
    const pulledUser = useCurrentUser('');

    // Hook used in below very function
    const [messagesToDisplay, setMessagesToDisplay] = useState([])

    // Function for displaying messages of specified user. Has to be async since it uses await getDocs. 
    async function logMessages() {
        // console.log("Your messages:");

        // Create a reference to the cities collection
        const collectionName = "testMessages";
        const collectionRef = collection(firestore, collectionName);

        // Create a query against the collection.
        const fieldToQuery = "sender";
        const searchedValue = pulledUser.email;

        // Unless the pulledUser has been loaded there is no field to be searched by
        if (searchedValue) {
            const q = query(collectionRef, where(fieldToQuery, "==", searchedValue));

            // Retrieve the results
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                const thisMessage = doc.data().messageText;
                if (thisMessage) {
                    // console.log(thisMessage);
                    setMessagesToDisplay((messagesToDisplay) => [...messagesToDisplay, thisMessage])
                }
            });
        }
    }

    // What happens when user clicks Send button
    const [numberOfMessagesSent, setNumberOfMessagesSent] = useState(0)
    function handleFormSubmit(e) {
        e.preventDefault();
        createMessageDoc();
        setNumberOfMessagesSent(numberOfMessagesSent + 1);
        // Probably display that it was in fact sent
    }

    async function createMessageDoc() {
        try {
            const collectionName = "testMessages";
            const document = {
                messageText: inputtedMessage,
                sender: pulledUser.email, // this might need to change
                recipient: recipientEmail,
                timestamp: serverTimestamp()
            }

            // This is the core of creating a record
            // addDoc(collection(database, "collectionName"),{documentContents})
            // if collection of collectionName doesn't exist, it will be created
            const docRef = await addDoc(collection(firestore, collectionName), document);

            // Display a message if the creation of a message was successful
            if (docRef) {
                console.log("Added document of id:", docRef.id);
                console.log(pulledUser.email, "sent a message to:", recipientEmail, "saying \"" + inputtedMessage + "\"");
            }
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    const chosenRadioButton = '0';
    const [allContacts, setAllContacts] = useState([]);
    const [radioValue, setRadioValue] = useState(chosenRadioButton);
    const [radios, setRadios] = useState([]);
    const [recipientEmail, setRecipientEmail] = useState('')

    // Called on startup
    async function getUserContacts() {
        const collectionName = "Contacts"
        const querySnapshot = await getDocs(collection(firestore, collectionName));

        querySnapshot.forEach((doc) => {
            setAllContacts(doc.data().contacts);
        });

        // Set names and values(0,1,2,...) of the radio buttons used to display possible message recipients
        setRadios(allContacts.map((contact, index) => ({
            name: contact,
            value: String(index),
        })));

        // Now that we have radios the setRecipientEmail should be used to set recipient to this corresponding to chosen radioValue
        // console.log(allContacts[chosenRadioButton]);
        setRecipientEmail(allContacts[chosenRadioButton])
        console.count();
    }

    function changedContact(e) {
        setRadioValue(e.currentTarget.value)
        // console.log(e.currentTarget.value);
        // console.log(radios[e.currentTarget.value].name);
        setRecipientEmail(radios[e.currentTarget.value].name)
    }

    // Listen for change of radios value and when it's changed call getUserContacts()
    useEffect(() => {
        getUserContacts();

        // This next line is not healthy, but all works ok so far and i want clear console. I am sure to come back here eventually.
        // eslint-disable-next-line
    }, [recipientEmail])

    useEffect(() => {
        logMessages();

        // Same os elsewhere. IK it's wrong but it's a quick fix for now
        // eslint-disable-next-line
    }, [pulledUser, numberOfMessagesSent])

    return (
        <div className='chatRoom'>
            <div id='leftPanel' className='panel'>
                <h2>Contacts</h2>
                <div id='contacts'>
                    <ButtonGroup vertical='true'>

                        {/* If radios exist then map them to a set of radio buttons */}
                        {radios && radios.map((radio, idx) => (
                            <ToggleButton
                                key={idx}
                                id={`radio-${idx}`}
                                type="radio"
                                name="set1"
                                variant={radioValue === radio.value ? 'primary' : 'secondary'}
                                value={radio.value}
                                checked={radioValue === radio.value}
                                onChange={(e) => changedContact(e)}
                            >
                                {radio.name}
                            </ToggleButton>
                        ))}
                    </ButtonGroup>
                </div>
            </div>
            <div id='middlePanel' className='panel'>
                <h1>ChatRoom {pulledUser ? "of " + pulledUser.email : null}</h1>

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
            <div id='rightPanel' className='panel'>
                <h2>Sent messages</h2>
                <br />
                {messagesToDisplay.map((message, index) => (
                    <p key={index}>{message}</p>
                ))}
            </div>
        </div>
    );
}

export default ChatRoom;
