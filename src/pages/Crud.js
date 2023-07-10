import { firestore } from "../firebase_setup/firebase"
import { doc, collection, addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

import Button from 'react-bootstrap/Button';

const Input = () => {

    // If this function would be synchronous, then docRef.id would return undefined
    async function addUser() {
        try {
            // This is the core of creating a record addDoc(collection(firestore, "collectionName"),{documentContents})
            const docRef = await addDoc(collection(firestore, "users"), {
                first: "George",
                last: "Shoe",
                foot: 2,
                born: 1815
            });
            console.log(docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    async function seeUsers() {
        const querySnapshot = await getDocs(collection(firestore, "users"));
        querySnapshot.forEach((doc) => {
            // console.log(`${doc.id} => ${doc.data()}`);
            console.log(doc.data(), doc.id);
        });
    }

    async function updateUser() {
        const documentReference = doc(firestore, "users", "179OHunVevgtJPAvLRBI") // firestore, name of collection, document identifier (ID, maybe something else if set differently)

        // Update the timestamp field with the value from the server
        await updateDoc(documentReference, {
            milk: "likes"
        });

        console.log(documentReference);
    }

    async function deleteUser() {
        const documentReference = doc(firestore,"users", "9KCzUIiaS6pajubyHHVJ")

        await deleteDoc(documentReference)
    }


    return (
        <>
            <h1>Crud page</h1>
            <Button variant="primary" onClick={addUser}>Create a record</Button>
            <Button variant="secondary" onClick={seeUsers}>Read records</Button>
            <Button variant="secondary" onClick={updateUser}>Update record</Button>
            <Button variant="secondary" onClick={deleteUser}>Delete record</Button>
        </>
    );
};

export default Input;