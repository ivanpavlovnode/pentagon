import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useRef, useEffect} from 'react';

function Account() {
/*Для смены фотки*/ 
const [photo, setPhoto] = useState(null);
const photoInput = useRef(null);
useEffect(() => {
    const fetchAvatar = async() => {
        const token = sessionStorage.getItem('token');
        let url;
        try {
            const data = await fetch(`${process.env.REACT_APP_URL}/api/avatars`, {
                headers: {'Authorization': `Bearer ${token}`},
                cache: 'no-store'});
            if(!data.ok) throw new Error('Ошибка получения аватара');
            const blob = await data.blob();
            // Создаем Blob URL
            url = URL.createObjectURL(blob);
            // Сохраняем в состоянии и sessionStorage
        }
        catch(err){
            console.error(err);
        }
        return url;
    }
    fetchAvatar()
    .then(url => {
        if(url) setPhoto(url);
        else {
            setPhoto('/img/NONE.jpg');
        }
    });
}, []);
const photoChange = async (event) => {  
    const file = event.target.files[0];
    if (!file.type.startsWith('image/jpeg')) return;
    if (!file) return;
    const token = sessionStorage.getItem("token");
    const formData =  new FormData();
    formData.append('avatar', file);
    try{
        const response = await fetch(`${process.env.REACT_APP_URL}/api/avatars`,{
        method:'POST',
        headers: {'Authorization': `Bearer ${token}`},
        cache: 'no-store',
        body: formData});
            
        const data = await response.json();
        if (!response.ok) {
            const errorMessage = data.error || 'Ошибка сервера';
            console.error(`Ошибка ${response.status}: ${errorMessage}`);
            setPhoto('/img/NONE.jpg');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result);
        reader.readAsDataURL(file);
    }
    catch (err) {
        console.error('Сетевая ошибка:', err);
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
        <div className = "account__photo"><img src = {photo} alt = "CHAD"></img></div>
        <div className = "account__photoChange">
            {/*Кнопка, которая вызывает input*/}
            <button onClick = {photoChangeClick}>Change Photo (.jpg)</button>
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