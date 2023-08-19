import "./Home.css"

import { useEffect } from "react";

import { storage } from "../../firebase_setup/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { Button } from "react-bootstrap";



const Home = () => {

    useEffect(() => {
        console.log("I fire once")
    }, [])

    function downloadImage() {
        console.log("Downloading and displaying the image :D");
        // Child references can also take paths delimited by '/'
        const spaceRef = ref(storage, 'images/space.jpg');
        // spaceRef now points to "images/space.jpg"
        // imagesRef still points to "images"

        getDownloadURL(spaceRef)
            .then((url) => {
                console.log("url:",url);

                // This can be downloaded directly:
                const xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                xhr.onload = (event) => {
                    const blob = xhr.response;
                    console.log("event:",event);
                    console.log("blob:",blob);
                };
                xhr.open('GET', url);
                xhr.send();

                // Or inserted into an <img> element
                const img = document.getElementById('myimg');
                img.setAttribute('src', url);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    return (
        <div className="HomePage">
            <h1>Home page</h1>
            <p>This is a Remote Learning App</p>
            <Button onClick={downloadImage}>download space</Button>
            <img id="myimg" alt="No img here"></img>
        </div>
    );
};

export default Home;