import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useEffect} from 'react';
function Messenger() {
    const [staff, setStaff] = useState([]);
    const [searchText, setSearch] = useState('');
    const [searchResult, setResult] = useState([]);
    const [chosenContact, setContact] = useState();
    const [messages, setmessages] = useState([]);
    useEffect(() => {
        const fetchStaff = async() => {
            const token = sessionStorage.getItem('token');
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/staff`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения персонала');
                const data = await res.json();
    
                const avatarPromises = data.map(person => 
                    fetch(`${process.env.REACT_APP_URL}/api/avatars/byid`, {
                        headers: {
                        'Authorization': `Bearer ${token}`,
                        'Asked_id': person.id },
                        cache: 'no-store'})
                    .then(res => res.blob())
                );
                const blobs = await Promise.all(avatarPromises);
                const urls = blobs.map(blob => URL.createObjectURL(blob));
                const joinedData = data.map((person, index) => ({
                    ...person,
                    url: urls[index]
                }));
                setStaff(joinedData);
            }
            catch(err){
                console.error(err);
            }
        }
        fetchStaff();
        const fetchMessages = async() => {
            const token = sessionStorage.getItem('token');
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/messenger`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения сообщений');
                const data = await res.json();
                setmessages(data);
            }
            catch(err){
                console.error(err);
            }
        }
        fetchMessages();
    }, []);

    useEffect(() => {
        const filteredStaff = staff.filter(person => 
            person.full_name
            .toLowerCase()
            .includes(searchText.toLowerCase()));
            setResult(filteredStaff);
    }, [searchText]);

    useEffect(() => {
        
    }, [chosenContact]);

    return (
        <main className = "messenger">
            <div id = "messenger_new"> New messages </div>
            <div id = "messenger_messages">

            </div>
            <div id = "messenger_search">
                <input type = "text" placeholder = 'Search' id = "messenger_searchtext"
                value={searchText}
                onChange={(e) => setSearch(e.target.value)}
                ></input>
            </div>
            <div id = "messenger_results">
                {searchText !== '' && searchResult.map(person =>  (
                    <div key = {person.id}>
                        <button onClick = {() => setContact(person.id)}>{person.full_name}</button>
                    </div>
                ))}
            </div>
            <div id = "messenger_text">
                <input type = "text" placeholder = 'Type message'></input>
            </div>
            <div id = "messenger_send">
                <button>Send</button>
            </div>
            <div id = "messenger_history">fgfg</div>
        </main>
    );
}

export default Messenger;