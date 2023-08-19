// Display styling
import './FilesRoom.css';

// React variable handling
import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { ListGroup, ListGroupItem } from 'react-bootstrap';

// for getting auth on reload
import { getAuth, onAuthStateChanged } from "firebase/auth";

// For accessing firebase cloud storage
import { storage } from "../../firebase_setup/firebase";
import { ref, getDownloadURL, uploadBytes, listAll } from "firebase/storage";

function FilesRoom({ currentUser }) {
    const auth = getAuth();
    const [currentUserEmail, setCurrentUserEmail] = useState(currentUser.email)
    const [downloaded, setDownloaded] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [itemNames, setItemNames] = useState([]);

    useEffect(() => {
        console.log("Initializing user email");
        onAuthStateChanged(auth, (user) => {
            setCurrentUserEmail(user.email);
        });

        const listRef = ref(storage, 'uploadedImages');
        listAll(listRef)
            .then((res) => {
                const names = res.items.map((itemRef) => itemRef.fullPath);
                setItemNames(names);
            })
            .catch((error) => {
                console.log("Uh-oh, an error occurred!", error);
            });

        // eslint-disable-next-line
    }, [])

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
                        <Button variant="primary" type="submit">
                            Upload
                        </Button>
                    </Form>
                </div>

                <div className='displaying'>
                    <h4>Displaying</h4>
                    <ListGroup>
                        {itemNames.map((itemName, index) => (
                            <ListGroupItem key={index}>{itemName}</ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </div>
    );
}

export default FilesRoom;
