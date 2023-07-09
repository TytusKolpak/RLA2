import { Outlet, Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';


const Layout = () => {
    return (
        <>
            {/* The navigation element. The to attribute decides where to route to (it is referenced by path attribute in App.js) */}
            <Navbar fixed="top" expand="lg" className="bg-body-tertiary">
                <Container>
                      {/* TODO: I ll have to take care of it in greater detail later. For now it looks to primitive */}
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Signup</Link>
                    <Link to="/input">Input</Link>
                    <Link to="/form">Form</Link>
                </Container>
            </Navbar>

            {/* Contents of the selected page */}
            <Outlet />
        </>
    )
};

export default Layout;