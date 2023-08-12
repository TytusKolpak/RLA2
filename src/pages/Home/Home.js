import "./Home.css"

import { useEffect } from "react";

const Home = () => {

    useEffect(() => {
        console.log("I fire once");
    }, [])

    return (
        <div className="HomePage">
            <h1>Home page</h1>
            <p>This is a Remote Learning App</p>
        </div>
    );
};

export default Home;