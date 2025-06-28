import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useRef} from 'react';

function Account() {
/*Для смены фотки*/ 
const [photo, setPhoto] = useState(null);
const photoInput = useRef(null);
const photoChange = async (event) => {  
    const file = event.target.files[0];
    if (!file) return;
    try{
        const token = sessionStorage.getItem("token");
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () =>
        {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${process.env.REACT_APP_URL}/avatars`,{
            method:'POST',
            headers: {'Authorization': `Bearer ${token}`},
            body: formData});
            
            const data = await response.json();
            if(response.ok){
                setPhoto(reader.result);
                sessionStorage.setItem("logline", "Photo change success")
            }
            else{
                throw new Error(data.error || 'Ошибка сервера');
            }
        }
    }
    catch (err) {
        sessionStorage.setItem("logline", `Photo change error :${err.message}`)
        setPhoto('/img/NONE.jpg');
    }
};
const photoChangeClick = () =>
{
    photoInput.current.click();
};
/* Задаю пользовательские данные */
const userData = JSON.parse(sessionStorage.getItem('userData'));

return (
    <main className = "account">
        <div className = "account__photo"><img src = {photo||"/img/NONE.jpg"} alt = "CHAD"></img></div>
        <div className = "account__photoChange">
            {/*Кнопка, которая вызывает input*/}
            <button onClick = {photoChangeClick}>Change Photo</button>
            <input
            type = "file"
            id = "commander_photo"
            accept=".jpg, .jpeg, .png"
            onChange={photoChange}
            style={{ display: 'none' }}
            ref = {photoInput}
            />
        </div>
        <div className = "account__name">Full Name: {userData.full_name} "{userData.call_name}"</div>
        <div className = "account__rank">Rank : {userData.rank}</div>
        <div className = "account__division">Div : {userData.div}</div>
        <div className = "account__recordTitle">Service Record</div>
        <div className = "account__recordText">
            {userData.service_record}
        </div>
    </main>
  );
}




export default Account;