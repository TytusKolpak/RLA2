import { Outlet, Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useEffect, useState } from "react";


const Layout = ({ currentUser }) => {
    const [variantDark, setVariantDark] = useState('');

    useEffect(() => {
        setVariantDark(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }, [])

    return (
        <>
            {/* The navigation element. The to attribute decides where to route to (it is referenced by path attribute in App.js) */}
            <Navbar fixed="top" expand="lg" className="bg-body-tertiary" data-bs-theme={variantDark ? 'dark' : 'light'}>
                <Container>
                    <Link to="/">Home</Link>
                    {currentUser && <NavDropdown title="Rooms" id="basic-nav-dropdown">
                        <NavDropdown.Item href="#action/3.1">
                            <Link to="/chatRoom">ChatRoom</Link>
                        </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.2">
                            <Link to="/callRoom">CallRoom</Link>
                        </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.3">
                            <Link to="/filesRoom">FilesRoom</Link>
                        </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.4">
                            <Link to="/coursesRoom">CoursesRoom</Link>
                        </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.5">
                            <Link to="/gradesRoom">GradesRoom</Link>
                        </NavDropdown.Item>
                    </NavDropdown>}
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Signup</Link>
                </Container>
            </Navbar >

            {/* Contents of the selected page */}
            < Outlet />
        </>
    )
};

export default Layout;