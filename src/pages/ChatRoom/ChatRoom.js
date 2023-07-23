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
import { collection, getDocs, addDoc, query, where, serverTimestamp, orderBy, or } from 'firebase/firestore';

// Get user state from different file
function ChatRoom({ currentUser }) {
    // Whole user object is sent in as an argument to this function and is now available for use (but we don't need it whole)
    // console.log("currentUser",currentUser);
    const [currentUserEmail, setCurrentUserEmail] = useState()

    // Fires once - on entrance to Chat room, initializes some values - user contacts in left panel and messages between user an chosen contact
    useEffect(() => {
        console.log("INITIALIZING user email");
        setCurrentUserEmail(currentUser.email)
    }, [])

    useEffect(() => {
        if (currentUserEmail) {
            console.log("CALLING startup functions with currentUserEmail set to:", currentUserEmail);
            findUserContacts();
            logMessages();
        }
    }, [currentUserEmail])


    const [inputtedMessage, setInputtedMessage] = useState('');

    // Hook used in below very function
    const [allMessagesToDisplay, setAllMessagesToDisplay] = useState([]);

    // Function for displaying messages of specified user. Has to be async since it uses await getDocs. 
    async function logMessages() {
        console.log("logMessages");

        // Create a reference to the cities collection
        const collectionName = "testMessages";
        const collectionRef = collection(firestore, collectionName);

        // Create a query against the collection.
        const searchedValue = currentUserEmail;

        // Unless the currentUserEmail has been loaded there is no field to be searched by
        if (searchedValue) {

            // Find all messages sent or received by this user
            var fieldToQuery1 = "sender";
            var fieldToQuery2 = "recipient";
            var q = query(collectionRef,
                or(where(fieldToQuery1, "==", searchedValue),
                    where(fieldToQuery2, "==", searchedValue)),
                orderBy("timestamp"));

            // Retrieve the results
            var querySnapshot = await getDocs(q);

            // For each returned value
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                // console.log(doc.data());

                // Convert the Firestore timestamp to a JavaScript Date object and create date notation
                const date = doc.data().timestamp.toDate();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = date.getDate();
                const hour = date.getHours();
                const minute = date.getMinutes();
                const resultTime = hour + ":" + minute + " " + day + "." + month;

                const thisMessage = doc.data().messageText + " " + resultTime;
                const sender = doc.data().sender;
                if (thisMessage) {
                    // console.log(thisMessage);
                    setAllMessagesToDisplay((allMessagesToDisplay) => [...allMessagesToDisplay, [thisMessage, sender]]);
                }
            });
        }
    }

    // What happens when user clicks Send button
    const [numberOfMessagesSent, setNumberOfMessagesSent] = useState(0)
    function handleFormSubmit(e) {
        console.log("handleFormSubmit");
        e.preventDefault();
        createMessageDoc();
        setNumberOfMessagesSent(numberOfMessagesSent + 1);
        // Probably display that it was in fact sent
    }

    async function createMessageDoc() {
        try {
            console.log("createMessageDoc");
            const collectionName = "testMessages";
            const document = {
                messageText: inputtedMessage,
                sender: currentUserEmail, // this might need to change
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
                console.log(currentUserEmail, "sent a message to:", recipientEmail, "saying \"" + inputtedMessage + "\"");
            }
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    const [allContacts, setAllContacts] = useState([]);
    const [radioValue, setRadioValue] = useState(0);
    const [radios, setRadios] = useState([]);
    const [recipientEmail, setRecipientEmail] = useState('')

    // Called on startup. Used to populate the left panel with possible message recipients (bound to currently logged user)

    // testing
    useEffect(() => {
        for (let index = 0; index < allContacts.length; index++) {
            const element = allContacts[index];
            console.log(index, element);
            setRadios((radios) => [...radios, { name: element, value: index }])
        }

        setRecipientEmail(allContacts[0])
    }, [allContacts])

    // testing end
    async function findUserContacts() {
        console.log("findUserContacts");
        const collectionName = "Contacts"
        const collectionRef = collection(firestore, collectionName);
        // Create a query against the collection.
        const searchedValue = currentUserEmail;

        // If we have a user email to base our search on
        if (searchedValue) {
            const fieldToQuery = "ownerAddress";
            const q = query(collectionRef, where(fieldToQuery, "==", searchedValue));

            const querySnapshot = await getDocs(q);

            // For now we expect 1 array (contacts is an array with emails), but later it might change
            querySnapshot.forEach((doc) => {
                setAllContacts(doc.data().contacts);
            });
        }
    }

    function changedContact(e) {
        console.log("changedContact");
        // console.log(e.currentTarget.value);
        // console.log(radios[e.currentTarget.value].name);
        // console.log(radios)
        setRadioValue(e.currentTarget.value)
        setRecipientEmail(radios[e.currentTarget.value].name)
    }

    return (
        <div className='chatRoom'>
            <div id='leftPanel' className='panel'>
                <h2>Contacts</h2>
                <div id='contacts'>
                    <ButtonGroup vertical='true'>

                        {/* If radios exist then map them to a set of radio buttons */}
                        {radios.map((radio, idx) => (
                            <ToggleButton className={radio.value}
                                key={idx}
                                id={`radio-${idx}`}
                                type="radio"
                                name="set1"
                                variant={radioValue == radio.value ? 'primary' : 'outline-primary'}
                                value={radio.value}
                                checked={radioValue == radio.value}
                                onChange={(e) => changedContact(e)}>
                                {radio.name}
                            </ToggleButton>
                        ))}
                    </ButtonGroup>
                </div>
            </div>
            <div id='middlePanel' className='panel'>
                {/* <h1>ChatRoom {currentUserEmail ? "of " + currentUserEmail : null}</h1> */}
                <div className="message-container">
                    {allMessagesToDisplay.map((message, index) => (
                        <div className='singleMessage' key={index} >
                            <div className={message[1] === currentUserEmail ? "sender" : "recipient"}>
                                <p>{message[0]}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <Form id='messageInput' onSubmit={handleFormSubmit}>
                    <Form.Group className="mb-3" >
                        <Form.Label >Message</Form.Label>
                        <Form.Control
                            value={inputtedMessage}
                            onChange={e => setInputtedMessage(e.target.value)}
                        />
                    </Form.Group>

                    {currentUserEmail ?
                        <Button variant='primary' type="submit">Send</Button>
                        :
                        <>
                            <Button variant='primary' type="submit" disabled>Send</Button>
                            <p>Nobody is logged in.</p>
                        </>}
                </Form>
            </div>
        </div>
    );
}

export default ChatRoom;
