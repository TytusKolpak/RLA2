import { Button } from "react-bootstrap";
import "./Home.css"

import { useEffect } from "react";

// Database related
import { firestore } from '../../firebase_setup/firebase';
import { addDoc, collection } from 'firebase/firestore';

const Home = () => {

    useEffect(() => {
        console.log("I fire once");

    }, [])

    async function firstFun() {
        console.log("got clicked 😁");
        const collectionName = "TodaysTests";
        const document = {
            day: "friday",
            pomodoros: 4,
            current: 1
        }
        const docRef = await addDoc(collection(firestore, collectionName), document);
        console.log("Created doc:", docRef);
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
        //await addDoc(collection(firestore, collectionName, "KAAhs8LM1LyOANzK8bNo", subColl), newDoc);
        await addDoc(subCollRef, newDoc);
    }



    return (
        <div className="HomePage">
            <h1>Home page</h1>
            <p>This is a Remote Learning App</p>
            <Button onClick={firstFun} disabled>Fire here firstFun</Button>
            <Button onClick={secondFun} disabled>Fire here secondFun</Button>
            <Button onClick={thirdFun}>Fire here thirdFun</Button>
        </div>
    );
};

export default Home;