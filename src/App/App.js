import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../pages/Layout";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import NoPage from "../pages/NoPage/NoPage";
import ChatRoom from "../pages/ChatRoom/ChatRoom";
import CallRoom from '../pages/CallRoom/CallRoom';
import FilesRoom from '../pages/FilesRoom/FilesRoom';

import { useState, useEffect } from 'react';

// // Get user state from different file
import { getAuth, onAuthStateChanged } from "firebase/auth";


function App() {
    const auth = getAuth();
    const [currentUser, setCurrentUser] = useState('');
    useEffect(() => {
        onAuthStateChanged(auth, (user) =>
            setCurrentUser(user)
        );
    }, [auth]);

    return (
        <div className="App">
            <BrowserRouter>
                <Routes>

                    {/* The "element" attribute corresponds to the import, 
                    path attribute corresponds to the "to" attribute in "Link" element in Layout.js  */}
                    <Route path="/" element={<Layout currentUser={currentUser}/>}>

                        {/* Just "index" instead of path="..." means: when there is no specified value, such as localhost:3000 */}
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login currentUser={currentUser}/>} />
                        <Route path="signup" element={<Signup />} />
                        <Route path="chatRoom" element={<ChatRoom currentUser={currentUser} />} />
                        <Route path="callRoom" element={<CallRoom currentUser={currentUser} />} />
                        <Route path="filesRoom" element={<FilesRoom currentUser={currentUser} />} />

                        {/* The path="*" specifies that any uncovered path will lead to this element */}
                        <Route path="*" element={<NoPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
