import "./CallRoom.css"
import { firestore } from '../../firebase_setup/firebase';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import { useEffect, useState } from "react";

import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

let peerConnection = null;
let localStream = null;
let remoteStream = null;
var unsubscribe = function () { }; // initializing a function to make it global
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

const CallRoom = ({ currentUser }) => {
    const [showModal, setShowModal] = useState(false);
    const [mainButtonsState, setCreateRoomBtnDisabled] = useState([false, true, true, true]); // disabled / not disabled 
    const [primaryMainButton, setPrimaryMainButton] = useState(0)
    const [roomId, setRoomId] = useState('');
    const [currentRoomText, setCurrentRoomText] = useState('');
    const [localVideoVisible, setLocalVideoVisible] = useState(false)
    const [remoteVideoVisible, setRemoteVideoVisible] = useState(false)

    useEffect(() => {
        return unsubscribe();
    }, [])

    // Checked, OK
    async function openUserMedia(e) {
        console.log("Opening user media");
        setCreateRoomBtnDisabled([true, false, false, false]);
        setPrimaryMainButton(1);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.querySelector('#localVideo').srcObject = stream;
        localStream = stream;
        remoteStream = new MediaStream();
        document.querySelector('#remoteVideo').srcObject = remoteStream;

        console.log('Stream:', document.querySelector('#localVideo').srcObject);
        setLocalVideoVisible(true);
    }

    // Checking order of operations
    async function createRoom() {
        console.log("Creating a room");
        const collectionName = "rooms";
        const roomRef = await addDoc(collection(firestore, collectionName), {});
        const roomId = roomRef.id;

        console.log('Create PeerConnection with configuration: ', configuration);
        peerConnection = new RTCPeerConnection(configuration);

        registerPeerConnectionListeners();

        // That's for registering audio and video
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // CODE FOR COLLECTING ICE CANDIDATES BELOW
        // Create a subCollection inside currently used room
        const subCollectionName = "callerCandidates";
        const callerCandidatesCollection = collection(firestore, collectionName, roomId, subCollectionName);
        console.log("Created a callerCandidatesCollection reference:", callerCandidatesCollection);

        console.log("Adding event Listener \"icecandidate\" to peerConnection:", peerConnection);
        // this will fire when a new ice candidate will be gathered
        peerConnection.addEventListener('icecandidate', async event => {
            if (!event.candidate) {
                console.log('Got final candidate!');
                return;
            }
            // console.log('Got candidate: ', event.candidate);
            console.log('Got candidate');

            // Add a document to this (sub)collection 
            await addDoc(callerCandidatesCollection, event.candidate.toJSON());
        });
        // CODE FOR COLLECTING ICE CANDIDATES ABOVE

        // CREATE A ROOM BELOW
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Created offer:', offer);

        const roomWithOffer = {
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
        }

        await updateDoc(roomRef, roomWithOffer);

        // add a new room document to this database, to this collection, with this content
        setRoomId(roomRef.id); // for global accessibility right after room creation (in hang up doc deletion)
        setCurrentRoomText(`Current room is ${roomId} - You are the caller!`);
        //CREATE A ROOM ABOVE

        // Will be triggered each time a new track becomes available
        console.log("Adding event Listener \"track\" to peerConnection:", peerConnection);
        peerConnection.addEventListener('track', event => {
            // console.log('Got remote track:', event.streams[0]);
            event.streams[0].getTracks().forEach(track => {
                // console.log('Add a track to the remoteStream:', track);
                console.log("Adding a track");
                remoteStream.addTrack(track);
            });
        });

        // LISTENING FOR REMOTE SESSION DESCRIPTION BELOW
        console.log("Listening for remote session description");
        unsubscribe = onSnapshot(roomRef, async snapshot => {
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
        // LISTENING FOR REMOTE SESSION DESCRIPTION ABOVE

        // LISTEN FOR REMOTE ICE CANDIDATES BELOW
        console.log("Listening for remote ice candidates");
        const subCollection2Name = "calleeCandidates";
        const calleeCandidatesCollection = collection(firestore, collectionName, roomId, subCollection2Name);
        onSnapshot(calleeCandidatesCollection, async snapshot => {
            snapshot.docChanges().forEach(async change => {
                if (change.type === 'added') {
                    let data = change.doc.data();
                    console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
        // LISTEN FOR REMOTE ICE CANDIDATES ABOVE
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
        // Just a variable declaration for convenience
        const collectionName = "rooms";

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

            // CODE FOR COLLECTING ICE CANDIDATES BELOW
            const subCollection2Name = "calleeCandidates";
            const calleeCandidatesCollection = collection(firestore, collectionName, roomId, subCollection2Name);

            peerConnection.addEventListener('icecandidate', event => {
                if (!event.candidate) {
                    console.log('Got final candidate!');
                    return;
                }
                console.log('Got candidate: ', event.candidate);

                // add a new candidate document to the ICECandidates subcollection
                async function addCallee() {
                    await addDoc(calleeCandidatesCollection, event.candidate.toJSON());
                }
                addCallee();
            });
            // CODE FOR COLLECTING ICE CANDIDATES ABOVE

            peerConnection.addEventListener('track', event => {
                console.log("We get a remote connection");
                setRemoteVideoVisible(true);
                console.log('Got remote track:', event.streams[0]);
                event.streams[0].getTracks().forEach(track => {
                    console.log('Add a track to the remoteStream:', track);
                    remoteStream.addTrack(track);
                });
            });

            // CODE FOR CREATING SDP ANSWER BELOW
            console.log("roomSnapshot.data().offer", roomSnapshot.data().offer);
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
            // CODE FOR CREATING SDP ANSWER ABOVE

            // LISTENING FOR REMOTE ICE CANDIDATES BELOW
            const subCollectionName = "callerCandidates";
            const callerCandidatesCollection = collection(firestore, collectionName, roomId, subCollectionName);
            onSnapshot(callerCandidatesCollection, async snapshot => {
                snapshot.docChanges().forEach(async change => {
                    if (change.type === 'added') {
                        let data = change.doc.data();
                        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
            // LISTENING FOR REMOTE ICE CANDIDATES ABOVE
        }
    }

    async function hangUp(e) {
        console.log("Hanging up");
        setRemoteVideoVisible(false);
        setLocalVideoVisible(false);

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
            console.log("Deleting the contents of room with ID:", roomId);

            try {
                const querySnapshotCallee = await getDocs(collection(firestore, "rooms", roomId, "calleeCandidates"));
                querySnapshotCallee.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
            } catch (error) {
                console.error('Error:', error);
            }

            try {
                const querySnapshotCaller = await getDocs(collection(firestore, "rooms", roomId, "callerCandidates"));
                querySnapshotCaller.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
            } catch (error) {
                console.error('Error:', error);
            }

            const roomRef = doc(firestore, "rooms", roomId);
            await deleteDoc(roomRef);
        }
    }

    function registerPeerConnectionListeners() {
        peerConnection.addEventListener('icegatheringstatechange', () => {
            console.log(`ICE gathering state changed: ${peerConnection.iceGatheringState}`);
        });

        peerConnection.addEventListener('connectionstatechange', () => {
            console.log(`Connection state change: ${peerConnection.connectionState}`);
        });

        peerConnection.addEventListener('signalingstatechange', () => {
            console.log(`Signaling state change: ${peerConnection.signalingState}`);
        });

        peerConnection.addEventListener('iceconnectionstatechange ', () => {
            console.log(`ICE connection state change: ${peerConnection.iceConnectionState}`);
        });
    }

    return (
        <div className="CallRoom">

            <h1>CallRoom of {currentUser.email}</h1>

            <div className="mainButtons">
                {/* eslint-disable-next-line */}
                <Button variant={primaryMainButton == 0 ? "primary" : "secondary"} onClick={openUserMedia} disabled={mainButtonsState[0]} >Open camera & microphone</Button>
                {/* eslint-disable-next-line */}
                <Button variant={primaryMainButton == 1 ? "primary" : "secondary"} onClick={createRoom} disabled={mainButtonsState[1]}>Create room</Button>
                {/* eslint-disable-next-line */}
                <Button variant={primaryMainButton == 2 ? "primary" : "secondary"} onClick={joinRoom} disabled={mainButtonsState[2]} >Join room</Button>
                {/* eslint-disable-next-line */}
                <Button variant={primaryMainButton == 3 ? "primary" : "secondary"} onClick={hangUp} disabled={mainButtonsState[3]} >Hangup</Button>
            </div>

            <div id="currentRoom">
                {currentRoomText}
            </div>

            <div id="videos">
                <div>
                    {localVideoVisible && <h4 className="center"> That's you</h4>}
                    <video id="localVideo" muted autoPlay playsInline></video>
                </div>
                <div>
                    {remoteVideoVisible && <h4 className="center"> That's them</h4>}
                <video id="remoteVideo" autoPlay playsInline></video>
                </div>
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