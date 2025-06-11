import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useRef} from 'react';

function Account() {
/*Для смены фотки*/ 
const [photo, setPhoto] = useState(null);
const photoInput = useRef(null);
const photoChange = (event) =>
{
    const file = event.target.files[0];
    if(file)
    {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () =>
        {
            setPhoto(reader.result);
        };
    }
};
const photoChangeClick = () =>
{
    photoInput.current.click();
};
/* Задаю пользовательские данные */
const userData = sessionStorage.getItem('userData');

return (
    <main className = "account">
        <div className = "account__photo"><img src = {photo||"/img/CHAD.jpg"} alt = "CHAD"></img></div>
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
        <div className = "account__name">Full Name: {userData.name}{userData.call_name}</div>
        <div className = "account__rank">{userData.rank}</div>
        <div className = "account__division">{userData.div}</div>
        <div className = "account__recordTitle">Service Record</div>
        <div className = "account__recordText">
            David Johnes Jr. is a highly decorated and respected officer with a 
            distinguished career marked by exceptional leadership, unwavering dedication, 
            and exemplary performance in both combat and command roles.
        </div>
    </main>
  );
}

export default Account;