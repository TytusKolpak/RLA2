import './ChatRoom.css';
import { useState, useEffect } from 'react';
import { firestore } from '../../firebase_setup/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Button } from 'react-bootstrap';

function ChatRoom() {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        console.log(messages);
    }, [messages]);

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

    return (
        <>
            <h1>ChatRoom</h1>
            <Button onClick={seeUsers}>OK</Button>

            <ul>
                {console.log(messages.length)}
                {messages.map((message) => (
                    <li key={message.ID}>{message.text}</li>
                ))}
            </ul>
        </>
    );
}

export default ChatRoom;
