import "./CallRoom.css"
import { firestore } from '../../firebase_setup/firebase';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import ButtonGroup from 'react-bootstrap/ButtonGroup';

import { useEffect, useState } from "react";

import { collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';

let peerConnection = null;
let localStream = null;
let remoteStream = null;
var unsubscribe = function () { }; // initializing a function to make it global
var userCallRole = null;
var roomIdX = null;
const configuration = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 15,
};

const CallRoom = ({ currentUser }) => {
    const [showModal, setShowModal] = useState(false);
    const [mainButtonsState, setCreateRoomBtnDisabled] = useState([false, true, true, true]); // disabled / not disabled 
    const [primaryMainButton, setPrimaryMainButton] = useState(0)
    const [roomId, setRoomId] = useState('');
    const [currentRoomText, setCurrentRoomText] = useState('');
    const [showPlus, setShowPlus] = useState(false);
    const [isTeacher, setIsTeacher] = useState(null);
    const [remoteEmail, setRemoteEmail] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [showCourseSelectionModal, setShowCourseSelectionModal] = useState(false);
    const [userCourses, setUserCourses] = useState([]);

    useEffect(() => {
        return unsubscribe();
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        async function readTeacher() {
            // READING CALLER DATA v// create a subCollection reference 
            const docRef = doc(firestore, "Grades", currentUser.email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                if (docSnap.data().isTeacher) {
                    console.log("User is a teacher");
                    setIsTeacher(true);
                }
            } else {
                console.log("No document for specified user exist! Email:", currentUser.email);
            }
            // READING CALLER DATA ^
        }

        readTeacher();
    }, [currentUser.email])

    async function openUserMedia() {
        console.log("Opening user media");
        setPrimaryMainButton(1);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.querySelector('#localVideo').srcObject = stream;
        localStream = stream;

        // Maybe this can be moved into the part where a callee responds
        remoteStream = new MediaStream();
        document.querySelector('#remoteVideo').srcObject = remoteStream;

        console.log('Stream:', document.querySelector('#localVideo').srcObject);
        setCreateRoomBtnDisabled([true, false, false, false]);
    }

    async function createRoom() {
        console.log("Creating a room");
        const collectionName = "rooms";
        const roomRef = await addDoc(collection(firestore, collectionName), {});
        const roomId = roomRef.id;
        roomIdX = roomRef.id;

        console.log('Create PeerConnection with configuration: ', configuration);
        peerConnection = new RTCPeerConnection(configuration);

        // My function
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
            console.log('Got candidate');

            // Add a document to this (sub)collection 
            await addDoc(callerCandidatesCollection, event.candidate.toJSON());
        });
        // CODE FOR COLLECTING ICE CANDIDATES ABOVE

        // CODE FOR INPUTTING CALLER DATA INTO THE COLLECTION v
        const infoDoc = {
            caller: {
                email: currentUser.email,
                isTeacher: isTeacher
            }
        };
        await updateDoc(roomRef, infoDoc);

        // Add a selected course to the call
        if (isTeacher) {
            // Find the courses of current teacher
            console.log("Select course to assign to this call");

            console.log("Displaying user courses. (for", currentUser.email, ")");
            const collectionName = "Courses";
            const coursesRef = collection(firestore, collectionName);

            // Create a query against the collection.
            const q = query(coursesRef, where("participants", "array-contains", currentUser.email));

            // Query's result
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                // doc.data() is never undefined for query doc snapshots
                console.log(doc.id, ":", doc.data());
                setUserCourses((userCourses) => [...userCourses, doc.id])
            });

            console.log("userCourses:", userCourses);

            setShowCourseSelectionModal(true);
        }
        // CODE FOR INPUTTING CALLER DATA INTO THE COLLECTION ^

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
        userCallRole = "caller";
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
                    // console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                    console.log(`Got new remote ICE candidate:`);
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
        userCallRole = "callee";
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

        if (!roomSnapshot.exists) {
            console.log("Specified room doesn't exist. Check if there is unnecessary space bar at the end of the id.");
            return;
        }

        // below is the code to be executed if the room does exist

        // CODE FOR INPUTTING CALLER DATA INTO THE COLLECTION v
        const infoDoc = {
            callee: {
                email: currentUser.email,
            }
        };
        await updateDoc(roomRef, infoDoc);
        // CODE FOR INPUTTING CALLER DATA INTO THE COLLECTION ^


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
                    // console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
                    console.log(`Got new remote ICE candidate:`);
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
        // LISTENING FOR REMOTE ICE CANDIDATES ABOVE

    }

    async function hangUp() {
        console.log("Hanging up");
        setShowPlus(false);
        setRemoteEmail("");

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

        peerConnection.addEventListener('connectionstatechange', async () => {
            console.log(`Connection state change: ${peerConnection.connectionState}`);

            // End of the whole process
            if (peerConnection.connectionState === "connected") {
                setShowPlus(true);

                var roomIdToAppend
                if (userCallRole === "caller")
                    roomIdToAppend = roomIdX;

                if (userCallRole === "callee")
                    roomIdToAppend = roomId

                console.log("room id to append:", roomIdToAppend);
                const docRef = doc(firestore, "rooms", roomIdToAppend);
                const docSnap = await getDoc(docRef);

                var remoteEmail;
                if (docSnap.exists()) {
                    if (userCallRole === "caller")
                        remoteEmail = docSnap.data().callee.email;

                    if (userCallRole === "callee")
                        remoteEmail = docSnap.data().caller.email;

                    console.log("remoteEmail:", remoteEmail);
                    setRemoteEmail(remoteEmail);
                } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                }
            }
        });

        peerConnection.addEventListener('signalingstatechange', () => {
            console.log(`Signaling state change: ${peerConnection.signalingState}`);
        });

        peerConnection.addEventListener('iceconnectionstatechange ', () => {
            console.log(`ICE connection state change: ${peerConnection.iceConnectionState}`);
        });
    }

    async function giveAPlus() {
        const gradeName = "Activity";
        const gradeScoredPoints = 1;
        const gradeMaxPoints = 0;
        const gradeWeight = 100;
        console.log("Creating a new grade. Grade info:", gradeName, gradeScoredPoints, gradeMaxPoints, gradeWeight);

        const collectionName = "Grades";
        const IDofDocument = remoteEmail;
        const subCollectionName = selectedCourse;
        const courseGradesCollection = collection(firestore, collectionName, IDofDocument, subCollectionName);

        const docRef = await addDoc(courseGradesCollection, {
            name: gradeName,
            scoredPoints: gradeScoredPoints,
            maxPoints: gradeMaxPoints,
            percentageScore: "-",
            gradeInScale: "-",
            gradeInScaleName: "-",
            timestamp: serverTimestamp(),
            gradeWeight: gradeWeight
        });

        console.log("Document written with ID: ", docRef.id);
        setShowPlus(false);
    }

    return (
        <div className="CallRoom">

            <h1>CallRoom of: {currentUser.email.substring(0, currentUser.email.indexOf('@'))} {selectedCourse && "in"} {selectedCourse}</h1>

            <div className="mainButtons">
                {/* eslint-disable-next-line */}
                <Button variant={primaryMainButton == 0 ? "primary" : "secondary"} onClick={openUserMedia} disabled={mainButtonsState[0]} >Open camera & microphone</Button>
                {/* eslint-disable-next-line */}
                <Button variant={primaryMainButton == 1 ? "primary" : "secondary"} onClick={createRoom} disabled={mainButtonsState[1] && !localStream}>Create room</Button>
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
                    <video id="localVideo" muted autoPlay playsInline></video>
                </div>

                <div>
                    {remoteEmail === "" ? null :
                        <div className="overflowTopCenter">
                            <OverlayTrigger trigger="click" placement="right" overlay=
                                {<Popover id="popover-basic">
                                    <Popover.Header as="h3">User's annotation</Popover.Header>
                                    <Popover.Body>
                                        <Form>
                                            <Form.Group controlId="exampleForm.ControlTextarea1">
                                                <Form.Control
                                                    style={{ resize: 'both', maxWidth: '270px', minWidth: '160px', maxHeight: '200px' }}
                                                    as="textarea"
                                                    rows={3}
                                                    placeholder="Create an annotation"
                                                    value={annotation}
                                                    onChange={e => setAnnotation(e.target.value)} />
                                            </Form.Group>
                                        </Form>
                                    </Popover.Body>
                                </Popover>}>
                                <Button variant="outline-dark">{remoteEmail.substring(0, currentUser.email.indexOf('@'))}</Button>
                            </OverlayTrigger>
                        </div>}
                    {(showPlus & isTeacher) ? <Button className="overflow local" variant="outline-secondary" onClick={() => giveAPlus()}>+1</Button> : null}
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

            <Modal show={showCourseSelectionModal} onHide={() => setShowCourseSelectionModal(false)} backdrop="static" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Select course for this room</Modal.Title>
                </Modal.Header>

                <Modal.Body id="CourseSelection" >
                    <ButtonGroup className="mb-2" vertical>
                        {userCourses.map((courseName, index) => (
                            <Button key={index} onClick={() => { setSelectedCourse(courseName); setShowCourseSelectionModal(false) }}>{courseName}</Button>
                        ))}
                    </ButtonGroup>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowCourseSelectionModal(false); hangUp() }}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
};

export default CallRoom;