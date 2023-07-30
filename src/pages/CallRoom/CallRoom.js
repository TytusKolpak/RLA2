import "./CallRoom.css"
import { firestore } from '../../firebase_setup/firebase';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import { useEffect, useState } from "react";

import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let peerConnection = null;
let localStream = null;
let remoteStream = null;
var unsubscribe = function () { }; // initializing a function to make it global

const CallRoom = ({ currentUser }) => {
    const [showModal, setShowModal] = useState(false);
    const [mainButtonsState, setCreateRoomBtnDisabled] = useState([false, true, true, true]); // disabled / not disabled 
    const [primaryMainButton, setPrimaryMainButton] = useState(0)
    const [roomId, setRoomId] = useState('');
    const [currentRoomText, setCurrentRoomText] = useState('');

    useEffect(()=>{
        return unsubscribe();
    },[])
    const configuration = {
        iceServers: [
            {
                urls: [
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                ],
            },
        ],
        iceCandidatePoolSize: 10,
    };

    async function openUserMedia(e) {
        setCreateRoomBtnDisabled([true, false, false, false]);
        setPrimaryMainButton(1);

        const stream = await navigator.mediaDevices.getUserMedia(
            { video: true, audio: true });
        document.querySelector('#localVideo').srcObject = stream;
        localStream = stream;
        remoteStream = new MediaStream();
        document.querySelector('#remoteVideo').srcObject = remoteStream;

        console.log('Stream:', document.querySelector('#localVideo').srcObject);
    }

    async function collectIceCandidates(roomRef, peerConnection, localName, remoteName) {
        const candidatesCollection = roomRef.collection(localName);

        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                const json = event.candidate.toJSON();
                candidatesCollection.add(json);
            }
        });

        roomRef.collection(remoteName).onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    peerConnection.addIceCandidate(candidate);
                }
            });
        })
    }

    async function createRoom() {

        console.log('Create PeerConnection with configuration: ', configuration);
        peerConnection = new RTCPeerConnection(configuration);

        registerPeerConnectionListeners();

        // Code for creating room document below

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        const roomWithOffer = {
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
        }

        // add document to this database, to this collection, with this content
        const roomRef = await addDoc(collection(firestore, "rooms"), roomWithOffer);
        const roomId = roomRef.id; // for this value here
        setRoomId(roomRef.id); // for global accessibility right after room creation (in hang up doc deletion)
        setCurrentRoomText(`Current room is ${roomId} - You are the caller!`);

        // Code for creating room document above

        console.log(localStream);
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Code for creating a room below

        // Code for creating a room above

        // Code for collecting ICE candidates below

        // Code for collecting ICE candidates above

        peerConnection.addEventListener('track', event => {
            console.log('Got remote track:', event.streams[0]);
            event.streams[0].getTracks().forEach(track => {
                console.log('Add a track to the remoteStream:', track);
                remoteStream.addTrack(track);
            });
        });

        // Listening for remote session description below
        unsubscribe = onSnapshot(roomRef, async snapshot => {

            // When we hang up it enters here and tries to access null data (bc we delete we could check if the change is deletion, but it does the same thing as this if)
            if (snapshot.data()) {
                console.log('Got updated room:', snapshot.data());
                const data = snapshot.data();
                if (!peerConnection.currentRemoteDescription && data.answer) {
                    console.log('Set remote description: ', data.answer);
                    const answer = new RTCSessionDescription(data.answer)
                    await peerConnection.setRemoteDescription(answer);
                }
            }
        });
        // Listening for remote session description above

        // Listen for remote ICE candidates below

        // Listen for remote ICE candidates above
    }

    // This is called when user clicks Join room button on the screen
    function joinRoom() {
        // Show the modal asking for inputting roomId value, which will later call joinRoomById
        setShowModal(true);
    }

    async function confirmJoin() {
        console.log('Join room:', roomId);
        setCurrentRoomText(`Current room is ${roomId} - You are the callee!`);
        await joinRoomById(roomId);
        setShowModal(false)
    }

    async function joinRoomById(roomId) {
        console.log("join room by id:", roomId);
        const roomRef = doc(firestore, 'rooms', roomId)
        const roomSnapshot = await getDoc(roomRef);
        console.log('Got room:', roomSnapshot.exists);

        if (roomSnapshot.exists) {
            console.log('Create PeerConnection with configuration: ', configuration);
            peerConnection = new RTCPeerConnection(configuration);
            registerPeerConnectionListeners();
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Code for collecting ICE candidates below
            // collectIceCandidates(roomRef, peerConnection, localName, remoteName)
            // Code for collecting ICE candidates above

            peerConnection.addEventListener('track', event => {
                console.log('Got remote track:', event.streams[0]);
                event.streams[0].getTracks().forEach(track => {
                    console.log('Add a track to the remoteStream:', track);
                    remoteStream.addTrack(track);
                });
            });

            // Code for creating SDP answer below
            const offer = roomSnapshot.data().offer;
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            const roomWithAnswer = {
                answer: {
                    type: answer.type,
                    sdp: answer.sdp
                }
            }
            await updateDoc(roomRef, roomWithAnswer)
            // Code for creating SDP answer above

            // Listening for remote ICE candidates below

            // Listening for remote ICE candidates above
        }
    }

    async function hangUp(e) {
        const tracks = document.querySelector('#localVideo').srcObject.getTracks();
        tracks.forEach(track => {
            track.stop();
        });

        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
        }

        if (peerConnection) {
            peerConnection.close();
        }

        document.querySelector('#localVideo').srcObject = null;
        document.querySelector('#remoteVideo').srcObject = null;

        setPrimaryMainButton(0);
        setCreateRoomBtnDisabled([false, true, true, true]);
        setCurrentRoomText('');

        // Delete room on hangup
        if (roomId) {
            const roomRef = doc(firestore, 'rooms', roomId);
            // if (! there are any other users in call){
            await deleteDoc(roomRef);
            //}
        }
    }

    function registerPeerConnectionListeners() {
        peerConnection.addEventListener('icegatheringstatechange', () => {
            console.log(
                `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
        });

        peerConnection.addEventListener('connectionstatechange', () => {
            console.log(`Connection state change: ${peerConnection.connectionState}`);
        });

        peerConnection.addEventListener('signalingstatechange', () => {
            console.log(`Signaling state change: ${peerConnection.signalingState}`);
        });

        peerConnection.addEventListener('iceconnectionstatechange ', () => {
            console.log(
                `ICE connection state change: ${peerConnection.iceConnectionState}`);
        });
    }

    return (
        <div className="CallRoom">

            <h1>CallRoom of {currentUser.email}</h1>

            <div className="mainButtons">
                <Button variant={primaryMainButton == 0 ? "primary" : "secondary"} onClick={openUserMedia} disabled={mainButtonsState[0]} >Open camera & microphone</Button>
                <Button variant={primaryMainButton == 1 ? "primary" : "secondary"} onClick={createRoom} disabled={mainButtonsState[1]}>Create room</Button>
                <Button variant={primaryMainButton == 2 ? "primary" : "secondary"} onClick={joinRoom} disabled={mainButtonsState[2]} >Join room</Button>
                <Button variant={primaryMainButton == 3 ? "primary" : "secondary"} onClick={hangUp} disabled={mainButtonsState[3]} >Hangup</Button>
            </div>

            <div id="currentRoom">
                {currentRoomText}
            </div>

            <div id="videos">
                <video id="localVideo" muted autoPlay playsInline></video>
                <video id="remoteVideo" autoPlay playsInline></video>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Join room</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" >
                            <Form.Label>Enter ID for room to join:</Form.Label>
                            <Form.Control
                                placeholder="Enter ID"
                                value={roomId}
                                onChange={e => setRoomId(e.target.value)} />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="primary" onClick={confirmJoin}>Join</Button>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
};

export default CallRoom;