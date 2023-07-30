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
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, or, and, limit, onSnapshot } from 'firebase/firestore';

// for getting auth on reload
import { getAuth, onAuthStateChanged } from "firebase/auth";

// (Get user state from different file as an argument (from App.js)
// but we also need it on reload
function ChatRoom({ currentUser }) {
    // Whole user object is sent in as an argument to this function and is now available for use (but we don't need it whole)
    const auth = getAuth();
    var unsubscribe = function () { }; // initializing a function to make it global
    const [currentUserEmail, setCurrentUserEmail] = useState(currentUser.email)
    const [numberOfMessagesSent, setNumberOfMessagesSent] = useState(0)
    const [inputtedMessage, setInputtedMessage] = useState('');
    const [allMessagesToDisplay, setAllMessagesToDisplay] = useState([]);
    const [allContacts, setAllContacts] = useState([]);
    const [radioValue, setRadioValue] = useState(0);
    const [radios, setRadios] = useState([]);
    const [recipientEmail, setRecipientEmail] = useState('')


    const collectionName = "testMessages";
    // Fires once - on entrance to Chat room, initializes some values - user contacts in left panel and messages between user an chosen contact, also user on reload since we don't get currentUser form ChatRoom argument anymore. Also scroll down to the bottom of the messages div.
    useEffect(() => {
        console.log("Initializing user email");
        onAuthStateChanged(auth, (user) => {
            // console.log("user",user);
            // console.log(user.email);
            setCurrentUserEmail(user.email);
        });

        return (() => {
            console.log("I detach listener for new messages received from last recipient");
            unsubscribe();
        })
    }, [])

    // Only after I assigned a correct value to the currentUserEmail co i find current user's contacts
    useEffect(() => {
        currentUserEmail && findUserContacts();
    }, [currentUserEmail])

    // Called on startup. Used to populate the left panel with possible message recipients (bound to currently logged user)
    // When the allContacts finish loading - create a set of radio buttons with those just-loaded contacts
    useEffect(() => {
        for (let index = 0; index < allContacts.length; index++) {
            const element = allContacts[index];
            // console.log(index, element);
            setRadios((radios) => [...radios, { name: element, value: index }])
        }

        setRecipientEmail(allContacts[0])
    }, [allContacts])

    // Only after i have the recipient's email can i show their messages (and scroll down)
    useEffect(() => {
        recipientEmail && displayMessages();
    }, [recipientEmail])

    useEffect(() => {
        // scroll down when the elements are loaded
        scrollDown();
    }, [allMessagesToDisplay])

    // What happens when user clicks Send button
    function handleFormSubmit(e) {
        console.log("handleFormSubmit");
        e.preventDefault();

        // Create a document in the Messages Collection
        createMessageDoc();

        // Increase a variable, which's change will trigger an useEffect hook to refresh messages 
        setNumberOfMessagesSent(numberOfMessagesSent + 1);

        // Clear input field
        setInputtedMessage('')
    }

    // Scroll down
    function scrollDown() {
        console.log("Scrolling down");
        const messagesDiv = document.getElementById("messageContainer");
        const contentHeight = messagesDiv.scrollHeight;
        messagesDiv.scrollTo({
            top: contentHeight,
            behavior: 'instant',
        })
    }

    // Function for displaying messages of specified user. Has to be async since it uses await getDocs. 
    async function displayMessages() {
        console.log("Displaying Messages");

        // Create a reference to the cities collection
        const collectionRef = collection(firestore, collectionName);

        // For real-time listening to new messages
        console.log("I attach listener for new messages received from:", recipientEmail);
        const q2 = query(
            collectionRef,

            // Where user is the sender AND selected contact is the receiver
            // or
            // User is the receiver and selected contact is the sender
            or(
                and(
                    where("sender", "==", currentUserEmail),
                    where("recipient", "==", recipientEmail)
                ),
                and(
                    where("sender", "==", recipientEmail),
                    where("recipient", "==", currentUserEmail)
                )
            ),

            // Order them by time when they were created
            orderBy("timestamp"),
            // Let's assume we need to display no more than 50 once (for now)
            limit(50)
        );

        // unsubscribe is a function used elsewhere to detach a listener which is created by onSnapshot
        unsubscribe = onSnapshot(q2, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    // console.log("New doc: ", change.doc.data());

                    var date;
                    if (change.doc.data().timestamp) {
                        date = change.doc.data().timestamp.toDate();
                    } else {
                        date = new Date();
                    }

                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = date.getDate();
                    const hour = date.getHours();
                    const minute = date.getMinutes();
                    const resultTime = hour + ":" + minute + " " + day + "." + month;

                    const thisMessage = change.doc.data().messageText;
                    const sender = change.doc.data().sender;

                    setAllMessagesToDisplay((allMessagesToDisplay) => [...allMessagesToDisplay, [thisMessage, sender, resultTime]]);
                }
            });
        });
    }

    async function createMessageDoc() {
        try {
            console.log("Creating a message document");
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

    async function findUserContacts() {
        console.log("Finding user contacts");
        const collectionRef = collection(firestore, "Contacts");
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

        //Clear all content of previously displayed messages before showing messages from/to different contact
        document.getElementById("messageContainer").innerHTML = '';

        // console.log(e.currentTarget.value);
        // console.log(radios[e.currentTarget.value].name);
        // console.log(radios)
        setRadioValue(e.currentTarget.value)
        setRecipientEmail(radios[e.currentTarget.value].name)
        console.log("Changed contact to:", radios[e.currentTarget.value].name);

        // Not to crowd with 18 different listeners we need to detach it when we want to change the subject which it is listened to
        console.log("I detach listener for new messages received from:", recipientEmail);
        unsubscribe();
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
                                // For now it will not work with === instead of ==
                                variant={radioValue == radio.value ? 'primary' : 'secondary'}
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
                <h1>ChatRoom {currentUserEmail ? "of " + currentUserEmail : null}</h1>
                <div id="messageContainer">
                    {allMessagesToDisplay.map((message, index) => (
                        <div className='singleMessage' key={index} >
                            <div className={message[1] === currentUserEmail ? "sender" : "recipient"}>
                                <div className='messageElements'>
                                    <p className='timeDisplay'>{message[2]}</p>
                                    <p className='textDisplay'>{message[0]}</p>
                                </div>
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
                        <Button variant='primary' type="submit">Send</Button> :
                        <Button variant='primary' type="submit" disabled>Send</Button>
                    }
                </Form>
            </div>
        </div>
    );
}

export default ChatRoom;
