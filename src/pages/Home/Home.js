import { Button } from "react-bootstrap";
import "./Home.css"

import { useEffect } from "react";

// Database related
import { firestore } from '../../firebase_setup/firebase';
// eslint-disable-next-line 
import { addDoc, setDoc, collection, doc } from 'firebase/firestore';

const Home = () => {

    useEffect(() => {
        console.log("I fire once");

    }, [])

    async function firstFun() {
        // Add a new document with a generated id.
        const docRef = await addDoc(collection(firestore, "cities"), {});
        console.log("Document written with ID: ", docRef.id);
    }

    async function secondFun() {
        console.log("got clicked 😁 2");
        const subColl = "TodaysTestsSub";
        const collectionName = "TodaysTests";
        const document = {
            goodDay: true,
            stars: 5
        }
        const docRef = await addDoc(collection(firestore, collectionName, "KAAhs8LM1LyOANzK8bNo", subColl), document);
        console.log("Created doc:", docRef);
    }

    async function thirdFun() {
        console.log("got clicked 😁 3");
        const subColl = "TodaysTestsSub";
        const collectionName = "TodaysTests";
        const subCollRef = collection(firestore, collectionName, "KAAhs8LM1LyOANzK8bNo", subColl);
        const newDoc = {
            just: "some",
            template: "data:)"
        };
        await addDoc(subCollRef, newDoc);
    }



    return (
        <div className="HomePage">
            <h1>Home page</h1>
            <p>This is a Remote Learning App</p>
            <Button onClick={firstFun} >Fire here firstFun</Button>
            <Button onClick={secondFun} disabled>Fire here secondFun</Button>
            <Button onClick={thirdFun} disabled>Fire here thirdFun</Button>
        </div>
    );
};

export default Home;