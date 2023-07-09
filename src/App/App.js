import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../pages/Layout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Input from "../pages/Input";
import NoPage from "../pages/NoPage";
import TKForm from "../pages/Form/Form";


function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>

                    {/* The "element" attribute corresponds to the import, 
                    path attribute corresponds to the "to" attribute in "Link" element in Layout.js  */}
                    <Route path="/" element={<Layout />}>

                        {/* Just "index" instead of path="..." means: when there is no specified value, such as localhost:3000 */}
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="signup" element={<Signup />} />
                        <Route path="input" element={<Input />} />
                        <Route path="form" element={<TKForm />} />

                        {/* The path="*" specifies that any uncovered path will lead to this element */}
                        <Route path="*" element={<NoPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
