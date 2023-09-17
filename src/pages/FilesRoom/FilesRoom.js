// Display styling
import './FilesRoom.css';

// React variable handling
import { useEffect, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import ListGroupItem from 'react-bootstrap/ListGroupItem';
import Modal from 'react-bootstrap/Modal';

// for getting auth on reload
import { getAuth, onAuthStateChanged } from "firebase/auth";

// For accessing firebase cloud storage
import { storage } from "../../firebase_setup/firebase";
import { ref, getDownloadURL, uploadBytes, listAll, uploadString } from "firebase/storage";

// Database related
import { firestore } from '../../firebase_setup/firebase';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';

function FilesRoom({ currentUser }) {
    const auth = getAuth();
    const [currentUserEmail, setCurrentUserEmail] = useState(currentUser.email);
    const [selectedFile, setSelectedFile] = useState(null);
    const [listLoaded, setListLoaded] = useState(false);
    const [itemsByFolder, setItemsByFolder] = useState({});
    const [selectedFolder, setSelectedFolder] = useState('Select folder to upload to');
    const [accessGroups, setAccessGroups] = useState([]);
    const [newGroup, setNewGroup] = useState('');
    const [newGroupExists, setNewGroupExists] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalError, setModalError] = useState(false);
    const [securityKey, setSecurityKey] = useState('');
    const [securityKeyError, setSecurityKeyError] = useState(false);
    const [hasNoFiles, setHasNoFiles] = useState(false);

    useEffect(() => {
        console.log("Initializing user email");
        onAuthStateChanged(auth, (user) => {
            setCurrentUserEmail(user.email);
        });


        displayItems();
        // eslint-disable-next-line
    }, [])

    async function displayItems() {
        // Access determination part
        console.log("Finding user-available folders");
        console.log("currentUserEmail", currentUserEmail);

        // Retrieving the document with access-list of current user from the database
        const collectionName = "StorageAccess";
        const documentIdentification = currentUserEmail;
        const docRef = doc(firestore, collectionName, documentIdentification);
        const docSnap = await getDoc(docRef);

        // Retrieving list of access groups assigned to this user (X is to differentiate it from the useState variable)
        var accessGroupsX;
        if (docSnap.exists()) {
            // console.log("Document data:", docSnap.data());
            accessGroupsX = docSnap.data().accessGroups;
            setAccessGroups(accessGroupsX);

            // If user doesn't have empty access groups array
            if (accessGroupsX.length !== 0) {
                console.log("User belongs to some access groups.");
                const updatedItemList = [];
                const updatedItemsByFolder = {};

                for (const accessGroup of accessGroupsX) {
                    const listRef = ref(storage, accessGroup);
                    console.log("Displaying files for:", accessGroup);
                    try {
                        const res = await listAll(listRef);

                        for (const itemRef of res.items) {
                            console.log("Displaying:", itemRef.name);
                            const downloadUrl = await getDownloadURL(itemRef);
                            const newItem = {
                                name: itemRef.name,
                                downloadUrlX: downloadUrl,
                                folder: itemRef.parent.name,
                            };
                            updatedItemList.push(newItem);

                            if (!updatedItemsByFolder[newItem.folder]) {
                                updatedItemsByFolder[newItem.folder] = [];
                            }
                            updatedItemsByFolder[newItem.folder].push(newItem);
                        }
                    } catch (error) {
                        console.log("Uh-oh, an error occurred!", error);
                    }
                }
                // console.log("updatedItemsByFolder:", updatedItemsByFolder);

                setItemsByFolder(updatedItemsByFolder);
                setHasNoFiles(false);
            } else {
                console.log(currentUserEmail, "has no access groups!");
                setHasNoFiles(true);
            }

        } else {
            // docSnap.data() will be undefined in this case
            console.log(currentUserEmail, "has no group-access document in the database!");
            setHasNoFiles(true);
        }

        setListLoaded(true);
    }

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = (e) => {
        e.preventDefault();

        const storageRef = ref(storage, selectedFolder + "/" + selectedFile.name);

        uploadBytes(storageRef, selectedFile)
            .then((snapshot) => {
                console.log(snapshot);
                console.log('Uploaded a blob or file!');
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
            });

        displayItems();
    };

    const handleFolderSelect = (eventKey) => {
        setSelectedFolder(eventKey);
        console.log("Selected:", eventKey);
    };

    async function handleNewGroupSubmit(e) {
        console.log("handleNewGroupSubmit");
        e.preventDefault();

        // Get storage groups document in storage access collection
        const collectionName = "StorageAccess";
        const documentIdentification = "StorageGroups";
        const docRef = doc(firestore, collectionName, documentIdentification);
        const docSnapshot = await getDoc(docRef);

        // Check if specified group exists in groups field of StorageGroups document
        const groups = docSnapshot.data().groups;
        const hasNewGroup = groups.includes(newGroup);

        if (hasNewGroup) {
            console.log("Specified group exists. Adding it to users access groups.");

            // Add a group to user access groups
            const documentIdentification = currentUserEmail;
            const docRef = doc(firestore, collectionName, documentIdentification);

            await updateDoc(docRef, {
                accessGroups: arrayUnion(newGroup)
            });

            setNewGroup('');
            displayItems();
        } else {
            console.log("Specified group doesn't exist!");
            setNewGroupExists(false)
            // Turn off the visibility after 5 seconds
            setTimeout(() => {
                setNewGroupExists(true);
            }, 5000);
        }
    }

    async function confirmCreation() {
        if (newGroup) {
            if (securityKey !== "Security key") { // Yes, just a hardcoded "password" which is the same as a placeholder
                setSecurityKeyError(true);

                // Hide the message
                setTimeout(() => {
                    setSecurityKeyError(false);
                }, 5000);
                return;
            }

            console.log("Creating new group:", newGroup);

            // Create a new group (a dummy file with a path like the one specified )
            const storageRef = ref(storage, newGroup + "/Hello.txt");
            const dummy = 'This file is a dummy to make the new "folder" appear.';
            uploadString(storageRef, dummy);

            // Add this group to a StorageGroups list
            const collectionName = "StorageAccess";
            var documentIdentification = "StorageGroups";
            var docRef = doc(firestore, collectionName, documentIdentification);
            await updateDoc(docRef, {
                groups: arrayUnion(newGroup)
            });

            // Add a this group to the groups which current user can access 
            documentIdentification = currentUserEmail;
            docRef = doc(firestore, collectionName, documentIdentification);
            await updateDoc(docRef, {
                accessGroups: arrayUnion(newGroup)
            });

            // Finalize
            setSecurityKey('');
            setNewGroup('');
            setShowModal(false);
            displayItems();
        } else {
            console.log("No group specified");
            setModalError(true);

            // Hide the message
            setTimeout(() => {
                setModalError(false);
            }, 5000);
        }
    }

    return (
        <div className='filesRoom'>
            {currentUserEmail && <h1>FilesRoom of {currentUser.email.substring(0, currentUser.email.indexOf('@'))}</h1>}
            <div className='fileOperationFields'>

                <div className='uploading'>
                    <h4>Uploading</h4>
                    <Form onSubmit={handleUpload}>
                        <Form.Group className="mb-3" controlId="input">
                            <Form.Control type="file" onChange={handleFileChange} />
                        </Form.Group>

                        <DropdownButton
                            variant='secondary'
                            className='mb-3'
                            title={selectedFolder}
                            onSelect={handleFolderSelect}>
                            {accessGroups.map((element, index) => (
                                <Dropdown.Item eventKey={element} key={index}>{element}</Dropdown.Item>
                            ))}
                        </DropdownButton>

                        {/* Disable it it if selected folder is not yet selected (still a placeholder) or if there is no selected file yet */}
                        <Button variant="primary" type="submit" disabled={(selectedFolder === "Select folder to upload to" || !selectedFile)}>
                            Upload a file
                        </Button>
                    </Form>

                    <h4 className='mt-5'>Access Groups</h4>
                    <div className='newGroup'>
                        <Form onSubmit={handleNewGroupSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    placeholder="Enter the name of a group to join it"
                                    value={newGroup}
                                    onChange={e => setNewGroup(e.target.value)} />
                            </Form.Group>

                            <Button className="mb-3" variant="primary" type="submit" disabled={!newGroup}>
                                Join a group
                            </Button>
                        </Form>

                        {!newGroupExists &&
                            <>
                                <h5 className='warning'>Specified group doesn't exist!</h5>
                                <Button variant='outline-primary' onClick={() => setShowModal(true)}>Create such group</Button>
                            </>}

                        <Modal
                            show={showModal}
                            onHide={() => setShowModal(false)}
                            backdrop="static"
                            centered>
                            <Modal.Header closeButton>
                                <Modal.Title>Create a group</Modal.Title>
                            </Modal.Header>

                            <Modal.Body>
                                <Form>
                                    <Form.Group className="mb-3" >
                                        <Form.Label>Enter the name of a group to be created:</Form.Label>
                                        <Form.Control
                                            placeholder="Group name"
                                            value={newGroup}
                                            onChange={e => setNewGroup(e.target.value)} />
                                    </Form.Group>
                                    <Form.Group className="mb-3" controlId="formBasicPassword">
                                        <Form.Label>Enter security key:</Form.Label>
                                        <Form.Control
                                            type="password"
                                            placeholder="Security key"
                                            value={securityKey}
                                            onChange={e => setSecurityKey(e.target.value)} />
                                    </Form.Group>
                                </Form>
                                {modalError && <p> New group name cannot be empty. Please specify a name.</p>}
                                {securityKeyError && <p> Wrong security key.</p>}

                            </Modal.Body>

                            <Modal.Footer>
                                <Button variant="primary" onClick={confirmCreation}>Create</Button>
                                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                </div>

                <div className='displaying'>
                    <h4>Displaying files</h4>

                    {listLoaded ?
                        <div className='horizontalFlex'>
                            {Object.entries(itemsByFolder).map(([folder, items]) => (
                                <div className="singleFolder" key={folder}>
                                    <h6>{folder}</h6>
                                    <ListGroup>
                                        {items.map((item, index) => (
                                            <ListGroupItem key={index}>
                                                <a href={item.downloadUrlX} download={item.name}>
                                                    {item.name}
                                                </a>
                                            </ListGroupItem>
                                        ))}
                                    </ListGroup>
                                </div>
                            ))}
                        </div>

                        // Display a spinner when data is not loaded yet 
                        : <div className='center'><Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner></div>
                    }

                    {hasNoFiles && "User has no files."}

                </div>
            </div>
        </div >
    );
}

export default FilesRoom;
