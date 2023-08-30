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

// for getting auth on reload
import { getAuth, onAuthStateChanged } from "firebase/auth";

// For accessing firebase cloud storage
import { storage } from "../../firebase_setup/firebase";
import { ref, getDownloadURL, uploadBytes, listAll } from "firebase/storage";

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

        // Retrieving list of access groups assigned to this user
        var accessGroups;
        if (docSnap.exists()) {
            // console.log("Document data:", docSnap.data());
            accessGroups = docSnap.data().accessGroups;
            console.log("accessGroups", accessGroups);
        } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document for", currentUserEmail, "!");
        }
        setAccessGroups(accessGroups);

        const updatedItemList = [];
        const updatedItemsByFolder = {};

        for (const accessGroup of accessGroups) {
            const listRef = ref(storage, accessGroup);

            try {
                const res = await listAll(listRef);

                for (const itemRef of res.items) {
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
        console.log("updatedItemsByFolder:", updatedItemsByFolder);

        setItemsByFolder(updatedItemsByFolder);

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

        const groups = docSnapshot.data().groups;
        const hasNewGroup = groups.includes(newGroup);
        
        if (hasNewGroup) {
            console.log("Specified group exists. Adding it to users access groups.");

            // Add a group to user access groups
            const documentIdentification = currentUserEmail;
            const docRef = doc(firestore, collectionName, documentIdentification);

            await updateDoc(docRef,{
                accessGroups: arrayUnion(newGroup)
            });

            displayItems();
        } else {
            console.log("Specified group doesn't exist!");
            setNewGroupExists(false)
            // Turn off the visibility after 5 seconds
            setTimeout(() => {
                setNewGroupExists(true)
            }, 5000);
        }

        // // Add a new group to current user in access group collection
        // try {
        //     const collectionName = "StorageAccess";
        //     const documentIdentification = currentUserEmail;
        //     const docRef = doc(firestore, collectionName, documentIdentification);
        //     const docSnap = await getDoc(docRef);

        //     if (docSnap) {
        //         console.log("Adding an access group to current user");
        //     }

        // } catch (e) {
        //     console.error("Error adding document: ", e);
        // }

        // Clear input field
        setNewGroup('')
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

                        <Button variant="primary" type="submit" disabled={(!selectedFolder || !selectedFile)}>
                            Upload
                        </Button>
                    </Form>

                    <h4 className='mt-5'>Groups</h4>
                    <div className='newContact'>
                        <Form onSubmit={handleNewGroupSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Control
                                    placeholder="Enter group to join"
                                    value={newGroup}
                                    onChange={e => setNewGroup(e.target.value)}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                Add
                            </Button>
                        </Form>

                        {!newGroupExists && <h5 className='warning'>Specified group doesn't exist!</h5>}

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


                </div>

            </div>
        </div>
    );
}

export default FilesRoom;
