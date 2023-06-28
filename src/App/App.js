import './App.css'
import handleSubmit from '../handles/handlesubmit';
import { useRef } from 'react';
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import ErrorPage from "../routes/error_page";
import Contact from "../routes/contact";
import Root, { loader as rootLoader } from "../routes/root";

function App() {
    const dataRef = useRef()

    const submithandler = (e) => {
        e.preventDefault()
        handleSubmit(dataRef.current.value)
        dataRef.current.value = ""
    }

    // Responsible for routing
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Root />,
            errorElement: <ErrorPage />,
            loader: rootLoader,
            children: [
                {
                    path: "contacts/:contactId",
                    element: <Contact />,
                },
            ],
        },
    ]);

    return (
        <div className="App">

            {/* Responsible for routing */}
            <RouterProvider router={router} />

            <h1>Create an entry to the database:</h1>
            <form onSubmit={submithandler}>
                <input type="text" ref={dataRef} />
                <button type="submit">Save</button>
            </form>
        </div>
    );
}

export default App;
