import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useEffect} from 'react';
function Staff() {
const [staff, setStaff] = useState([]);
const [avatars, setAvatars] = useState([]);
useEffect(() => {
const fetchStaff = async() => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/staff`, {
                headers: {'Authorization': `Bearer ${token}`},
                cache: 'no-store'});
            if(!res.ok) throw new Error('Ошибка получения персонала');
            const data = await res.json();
            setStaff(data);

            const avatarPromises = data.map(person => 
                fetch(`${process.env.REACT_APP_URL}/avatars/byid`, {
                    headers: {
                    'Authorization': `Bearer ${token}`,
                    'Asked_id': person.id },
                    cache: 'no-store'})
                .then(res => res.blob())
            );
            const blobs = await Promise.all(avatarPromises);
            const urls = blobs.map(blob => URL.createObjectURL(blob));
            setAvatars(urls);
            console.log(urls);

        }
        catch(err){
            console.error(err);
        }
    }
    fetchStaff();
}, []);
return (
    <main className = "staff">
        {staff.map((person, index) => (
            <div key = {person.id} className = "staffCard">
                {avatars[index] && (<img src = {avatars[index]} />)}
                    <div>
                    <p></p>     
                    <p>{person.full_name} </p>
                    <p>{' Rank: ' + person.rank} </p>
                    <p>{' Div: ' + person.div} </p>
                    </div>
                <button>DETAILS</button>
        </div>
        ))}
    </main>
    );
}
export default Staff;