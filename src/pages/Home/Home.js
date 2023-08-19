import "./Home.css"

import { useEffect, useState } from "react";

import { storage } from "../../firebase_setup/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { Button } from "react-bootstrap";



const Home = () => {
    const [downloaded, setDownloaded] = useState(false);

    useEffect(() => {
        console.log("I fire once")
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

            // Display the image in an <img> element
            const img = document.getElementById('myimg');
            img.src = url;
        } catch (error) {
            console.log(error);
        }
    }


    return (
        <div className="HomePage">
            <h1>Home page</h1>
            <p>This is a Remote Learning App</p>
            <Button
                variant={downloaded ? "secondary" : "primary"}
                onClick={downloadImage}>
                Download space img
            </Button>
            <img id="myimg" alt="No img here"></img>
            <Button>Upload</Button>
        </div>
    );
};

export default Home;