import { Outlet, Link } from "react-router-dom";
import { LinkContainer } from 'react-router-bootstrap';

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
                    {
                        currentUser &&
                        <NavDropdown title="Rooms" id="basic-nav-dropdown">
                            <LinkContainer to="/chatRoom">
                                <NavDropdown.Item>ChatRoom</NavDropdown.Item>
                            </LinkContainer>
                            <LinkContainer to="/callRoom">
                                <NavDropdown.Item>CallRoom</NavDropdown.Item>
                            </LinkContainer>
                            <LinkContainer to="/filesRoom">
                                <NavDropdown.Item>FilesRoom</NavDropdown.Item>
                            </LinkContainer>
                            <LinkContainer to="/coursesRoom">
                                <NavDropdown.Item>CoursesRoom</NavDropdown.Item>
                            </LinkContainer>
                            <LinkContainer to="/gradesRoom">
                                <NavDropdown.Item>GradesRoom</NavDropdown.Item>
                            </LinkContainer>
                        </NavDropdown>
                    }
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