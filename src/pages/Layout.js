import { Outlet, Link } from "react-router-dom";
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

// Get user state from different file
import { useCurrentUser } from '../pages/Login';


const Layout = () => {

    const someoneLoggedIn = useCurrentUser();

    return (
        <>
            {/* The navigation element. The to attribute decides where to route to (it is referenced by path attribute in App.js) */}
            <Navbar fixed="top" expand="lg" className="bg-body-tertiary">
                <Container>
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Signup</Link>
                    <Link to="/crud">Crud</Link>
                    {someoneLoggedIn && <Link to="/chatRoom">ChatRoom</Link>}
                </Container>
            </Navbar>

            {/* Contents of the selected page */}
            <Outlet />
        </>
    )
};

export default Layout;