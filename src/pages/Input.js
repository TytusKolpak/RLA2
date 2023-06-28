import handleSubmit from '../handles/handlesubmit';
import { useRef } from 'react';

const Input = () => {
    const dataRef = useRef()

    const submithandler = (e) => {
        e.preventDefault()
        handleSubmit(dataRef.current.value)
        dataRef.current.value = ""
    }

    return (
        <>
            <h1>Input page</h1>
            Input:
            <form onSubmit={submithandler}>
                <input type="text" ref={dataRef} />
                <button type="submit">Save</button>
            </form>
        </>
    );
};

export default Input;