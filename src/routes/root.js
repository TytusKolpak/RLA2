import { Outlet, Link, useLoaderData, } from "react-router-dom";
import { getContacts } from "./contacts";


export async function loader() {
    const contacts = await getContacts();
    return { contacts };
}

export default function Root() {
    const { contacts } = useLoaderData();
    return (
        <>
            {/* navigation element */}
            <nav>{contacts.length ? (
                <ul>
                    {contacts.map((contact) => (
                        <li key={contact.id}>
                            <Link to={`contacts/${contact.id}`}>
                                {contact.first || contact.last ? (
                                    <>
                                        {contact.first} {contact.last}
                                    </>
                                ) : (
                                    <i>No Name</i>
                                )}{" "}
                                {contact.favorite && <span>★</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>
                    <i>No contacts</i>
                </p>
            )}
            </nav>

            {/* content of the selected page */}
            <div id="detail">
                <Outlet />
            </div>
        </>
    );
}