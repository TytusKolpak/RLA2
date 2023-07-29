import "./CallRoom.css"

const CallRoom = ({currentUser}) => {
    return (
        <div className="CallRoom">
            <h1>CallRoom of {currentUser.email}</h1>
        </div>
    );
};

export default CallRoom;