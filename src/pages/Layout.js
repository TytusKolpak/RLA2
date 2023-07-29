import { Outlet, Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
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
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Signup</Link>
                    <Link to="/callRoom">callRoom</Link>
                    {currentUser && <Link to="/chatRoom">ChatRoom</Link>}
                </Container>
            </Navbar >

            {/* Contents of the selected page */}
            < Outlet />
        </>
    )
};

export default Layout;