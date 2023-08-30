// Display styling
import './FilesRoom.css';

// React variable handling
import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';

// for getting auth on reload
import { getAuth, onAuthStateChanged } from "firebase/auth";

// For accessing firebase cloud storage
import { storage } from "../../firebase_setup/firebase";
import { ref, getDownloadURL, uploadBytes, listAll } from "firebase/storage";

// Database related
import { firestore } from '../../firebase_setup/firebase';
import { getDoc, doc } from 'firebase/firestore';

var itemsByFolder = {};

function FilesRoom({ currentUser }) {
    const auth = getAuth();
    const [currentUserEmail, setCurrentUserEmail] = useState(currentUser.email);
    const [selectedFile, setSelectedFile] = useState(null);
    const [itemList, setItemList] = useState([]);
    const [listLoaded, setListLoaded] = useState(false);

    useEffect(() => {
        console.log("Initializing user email");
        onAuthStateChanged(auth, (user) => {
            setCurrentUserEmail(user.email);
        });

        setItemList([]); // Purely for development convenience

        displayItems();
        // eslint-disable-next-line
    }, [])

    useEffect(()=>{
        console.log("listLoaded got changed");
    },[listLoaded])

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

        // Building an UseState variable part
        accessGroups.forEach(accessGroup => {
            console.log("Displaying files in folder:", accessGroup);
            const listRef = ref(storage, accessGroup);
            console.log(listRef);
            listAll(listRef)
                .then(async (res) => {
                    await Promise.all(res.items.map(async (itemRef) => {
                        const downloadUrl = await getDownloadURL(itemRef);
                        console.log("Displaying:", itemRef.name, "from folder", itemRef.parent.name);

                        // add currently found items to the list 
                        setItemList((itemList) => [...itemList, {
                            name: itemRef.name,
                            downloadUrlX: downloadUrl,
                            folder: itemRef.parent.name
                        }]);
                    }));
                })
                .catch((error) => {
                    console.log("Uh-oh, an error occurred!", error);
                });
        });

        console.log(itemList);

        // Organize items by folders
        itemList.forEach(item => {
            if (!itemsByFolder[item.folder]) {
                itemsByFolder[item.folder] = [];
            }
            itemsByFolder[item.folder].push(item);
        });

        setListLoaded(true);
    }

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        const storageRef = ref(storage, `uploadedImages/${selectedFile.name}`);

        uploadBytes(storageRef, selectedFile)
            .then((snapshot) => {
                console.log(snapshot);
                console.log('Uploaded a blob or file!');
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
            });

        // displayItems(); somehow it should rerender the list
    };

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
                        {selectedFile ?
                            <Button variant="primary" type="submit">
                                Upload
                            </Button>
                            :
                            <Button variant="primary" type="submit" disabled>
                                Upload
                            </Button>
                        }

                    </Form>
                </div>

                <div className='displaying'>
                    <h4>Displaying files</h4>

                    {listLoaded ?
                        <div className='horizontalFlex'>
                            {Object.entries(itemsByFolder).map(([folder, items]) => (
                                <div className="accessGroup" key={folder}>
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
