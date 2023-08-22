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

function FilesRoom({ currentUser }) {
    const auth = getAuth();
    const [currentUserEmail, setCurrentUserEmail] = useState(currentUser.email)
    const [downloaded, setDownloaded] = useState(false);
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

    async function displayItems() {
        // Access determination part
        console.log("Finding user-available folders");
        const collectionName = "StorageAccess";
        console.log("currentUserEmail", currentUserEmail);
        const documentIdentification = currentUserEmail;
        const docRef = doc(firestore, collectionName, documentIdentification);

        const docSnap = await getDoc(docRef);

        var accessGroups;
        if (docSnap.exists()) {
            // console.log("Document data:", docSnap.data());
            accessGroups = docSnap.data().accessGroups;
            console.log("accessGroups", accessGroups);
        } else {
            // docSnap.data() will be undefined in this case
            console.log("No such document for", currentUserEmail, "!");
        }

        // Displaying part
        accessGroups.forEach(element => {
            console.log("Displaying files in folder:", element);
            const listRef = ref(storage, element);
            listAll(listRef)
                .then(async (res) => {
                    await Promise.all(res.items.map(async (itemRef) => {
                        const downloadUrl = await getDownloadURL(itemRef);
                        console.log("Displaying:", itemRef.name, "from folder", itemRef.parent.name);

                        // add currently found items to the list
                        setItemList((itemList) => [...itemList, { name: itemRef.name, downloadUrlX: downloadUrl }]);
                    }));
                    setListLoaded(true);
                })
                .catch((error) => {
                    console.log("Uh-oh, an error occurred!", error);
                });
        });
    }

    async function downloadImage() {
        try {
            console.log("Downloading and displaying the image");
            const spaceRef = ref(storage, 'images/space.jpg');
            const url = await getDownloadURL(spaceRef);

            // Download the image using fetch
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Download the image
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'downloaded_image.jpg';
            link.click();
            URL.revokeObjectURL(blobUrl);
            setDownloaded(true);
        } catch (error) {
            console.log(error);
        }
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

                <div className='downloading'>
                    <h4>Downloading</h4>
                    <Button
                        variant={downloaded ? "secondary" : "primary"}
                        onClick={downloadImage}>
                        Download space img
                    </Button>
                </div>

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
                    <h4>Displaying</h4>
                    {listLoaded ?
                        <ListGroup>
                            {itemList.map((item, index) => (
                                <ListGroupItem key={index}>
                                    <a href={item.downloadUrlX} download={item.name}>
                                        {item.name}
                                    </a>
                                </ListGroupItem>
                            ))}
                        </ListGroup> :
                        <div className='center'>
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    }

                </div>
            </div>
        </div>
    );
}

export default FilesRoom;
