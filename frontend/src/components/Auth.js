import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useRef} from 'react';
import axios from 'axios';

function Auth() {

const[authData, setAuthData] = useState({
    id:'',
    password:''
});
const [titleText, setTitleText] = useState('FIREWALL');

//Функция отправки данных
const authSubmit = async () =>{
    if(authData.id !== '' && authData.password !== '')
    {
        setTitleText('FETCHING');
        try{
            const res = await fetch('http://localhost:5000/auth',
            {method:'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(authData)});

            setTitleText('SUCCESSFUL');
        }
        catch{
            setTitleText('ERROR');
            setTimeout(() => setTitleText('FIREWALL') , 1000); 
        }
    }
    else{
        setTitleText('EMPTY FIELD');
        setTimeout(() => setTitleText('FIREWALL') , 1000); 
        }
};

return (
    <main className = "auth">
        <p className = "auth__title">{titleText}</p>
        <input 
        className = "auth__login" type = "text" placeholder = "id"
        value={authData.id}
        onChange={(e) => setAuthData({...authData, id: e.target.value})}
        />
        <input 
        className = "auth__pass" type = "password" placeholder = "password"
        onChange={(e) => setAuthData({...authData, password: e.target.value})}
        />
        <button className = "auth__btn"
        onClick = {authSubmit}
        >Confirm</button>
    </main>
  );
}

export default Auth;
