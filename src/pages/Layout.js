import { Outlet, Link } from "react-router-dom";

const Layout = () => {
    return (
        <>
            {/* The navigation element. The to attribute dicedes where to route to (it is referenced by path attribute in App.js) */}
            <nav>
                <Link to="/">Home</Link> | <Link to="/login">Login</Link> | <Link to="/Signup">Signup</Link>
            </nav>

            {/* Contents of the selected page */}
            <Outlet />
        </>
    )
};

export default Layout;