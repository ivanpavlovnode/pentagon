import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useEffect, useMemo} from 'react';
function Messenger() {
    const [staff, setStaff] = useState([]);
    const [searchText, setSearch] = useState('');
    const [searchResult, setResult] = useState([]);
    const [chosenContact, setContact] = useState(null);
    const [typedMessage, setTypedMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState();
    const [socket, setSocket] = useState();
    const token = sessionStorage.getItem('token');

    //Инициализация userData, socket, получение сообщений при загрузке
    useEffect(() => {
        //Определяем протокол для подключения к вебсокету через относительный URL
        const WebSocketUrl = () => {
            const URLdefiner = () => {
                if(window.location.host === 'localhost:3000'){
                    return `ws://localhost:5000/messenger?token=${token}`;
                }
                else{
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    return `${protocol}//${window.location.host}/messenger?token=${token}`;
                }
            }
            const url = URLdefiner();
            console.log("WebSocket URL:", url); // Проверьте в консоли браузера
            return url;
        };
        setUserData(JSON.parse(sessionStorage.getItem('userData')));
        setSocket(new WebSocket(WebSocketUrl()));
        
        const fetchStaff = async() => {
            try {
                const res = await fetch(`/api/staff`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения персонала');
                const data = await res.json();
    
                const avatarPromises = data.map(person => 
                    fetch(`/api/avatars/byid`, {
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
                const res = await fetch(`/api/messenger`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения сообщений');
                const data = await res.json();
                setMessages(data);
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
    //Вызывается кнопкой Send, отправка сообщения
    function sendMessage(){
        if(chosenContact === null || typedMessage === '') return;
        const message = {
            sender: userData.id,
            getter: chosenContact,
            text: typedMessage
        }
        socket.send(JSON.stringify(message));
        setTypedMessage('');
    }
    //Подписка и отписка на сообщения с сокета
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages(prev => [
                ...prev,
                {
                    id: message.id,
                    getter: message.getter,
                    sender: message.sender,
                    text: message.text,
                    delivered: message.delivered
                }
            ]);
        }
        socket.addEventListener('message', handleMessage);
        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket]);

    /*Отметка сообщений как прочитанных при выборе контакта 
    и при получении сообщения. В БД - через post запрос, 
    локально - без подтверждения*/
    useEffect(() => {
        if(chosenContact !== null){
            const setDelivered = async() => {
                try {
                    const res = await fetch(`/api/messenger`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        cache: 'no-store',
                        body: JSON.stringify({chosenContact})
                    });
                    if(!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.error || 'Неизвестная ошибка сервера');
                    }
                    setMessages(prev => prev.map(msg => {
                        if(msg.getter === userData.id && msg.sender === chosenContact){
                            return {...msg, delivered: true};
                        }
                        return msg;
                    }));
                }
                catch(err){
                    console.error(err + ' chosenContact: ' + chosenContact);
                }
            }
            //Если есть непрочитанные - тогда отмечаем
            if(
                messages
                .filter(msg => 
                    msg.getter === userData.id && 
                    msg.sender === chosenContact &&
                    msg.delivered === false)
                .length !== 0
            ) setDelivered();
        }
    }, [chosenContact, messages]);

    //Показывает компонент только когда сокет есть и контакты загружены
    if(staff[0] !== undefined && socket && messages != []){
        return (
            <main className = "messenger">
                <div id = "messenger_new"> New messages </div>
                <div id = "messenger_messages">
                    {messages
                        .filter(message => message.delivered !== true && message.sender !== userData.id)
                        .filter((item, index, arr) => arr.findIndex(i => i.sender === item.sender) === index)
                        .map(message =>  (
                        <div key = {message.id}>
                            <button onClick = {() => setContact(message.sender)}>{staff.find(a => a.id === message.sender).full_name}</button>
                        </div>
                    ))}
                </div>
                <div id = "messenger_search">
                    <input type = "text" placeholder = 'Search' id = "messenger_searchtext"
                    value={searchText}
                    onChange={(e) => setSearch(e.target.value)}
                    ></input>
                </div>
                <div id = "messenger_results">
                    {searchText !== '' && 
                        searchResult
                        .filter(person => person.id !== userData.id)
                        .map(person =>  (
                        <div key = {person.id}>
                            <button onClick = {() => setContact(person.id)}>{person.full_name}</button>
                        </div>
                    ))}
                </div>
                <div id = "messenger_text">
                    <input
                        id = "messenger_text_input"
                        type = "text" 
                        placeholder = 'Type message' 
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}>
                    </input>
                </div>
                <div id = "messenger_send">
                    <button onClick = {() => sendMessage()}>Send</button>
                </div>
                <div id = "messenger_history">
                        {messages
                        .sort((a, b) => b.id - a.id)
                        .filter(message => message.sender === chosenContact || message.getter === chosenContact)
                        .map(message => {
                            const isMe = message.sender === userData.id;
                            return (
                                <div key = {message.id} className = {isMe ? "messenger_history_message" : "messenger_history_message_notmy"}>
                                    <div className = "messenger_history_name">
                                        <img src = {staff.find(person => person.id === message.sender).url}/>
                                        {staff.find(person => person.id === message.sender).full_name}
                                    </div>
                                    {message.text}
                                </div>
                            );
                        })}
                </div>
            </main>
        );
    }
    else{
        return (
            <main className = "loadingWindow">LOADING MESSENGER</main>
        )
    }
}

export default Messenger;