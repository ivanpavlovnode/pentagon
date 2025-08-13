import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useRef} from 'react';
import axios from 'axios';


function Auth(props) {

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
            const data = await fetch(`${process.env.REACT_APP_URL}/api/auth`,
            {method:'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(authData)});
            const res = await data.json();
            if(!res.userData || !res.token){
                setTitleText(res.message);
                setTimeout(() => setTitleText('FIREWALL') , 1000);
            }
            else if(res.userData && res.token){
                setTitleText(res.message);
                sessionStorage.setItem('token', res.token);
                sessionStorage.setItem('userData', JSON.stringify(res.userData));
                props.authentication();
            }
        }
        catch(err){
            setTitleText('CL_ERROR');
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
