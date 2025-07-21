import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState, useEffect} from 'react';
function Staff() {
const [staff, setStaff] = useState([]);
const [sort, setSort] = useState('id');
useEffect(() => {
const fetchStaff = async() => {
        const token = sessionStorage.getItem('token');
        try {
            const res = await fetch(`${process.env.REACT_APP_URL}/staff`, {
                headers: {'Authorization': `Bearer ${token}`},
                cache: 'no-store'});
            if(!res.ok) throw new Error('Ошибка получения персонала');
            const data = await res.json();

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
}, []);
useEffect(() => {
    const sorted = [...staff];
    switch(sort){
        case 'id':
            sorted.sort((a, b) => a.id - b.id);
            break;
        case 'name':
            sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
            break;
        case 'access_level':
            sorted.sort((a, b) => b.access_level - a.access_level);
            break;
        default:
            break;
    }
    setStaff(sorted);
}, [sort]);
return (
    <div>
        <div className = "sortLine">
            <p>SORT BY:</p>
            <button onClick = { () => setSort('id')} className = "sortButton">ID</button>
            <button onClick = { () => setSort('name')} className = "sortButton">NAME</button>
            <button onClick = { () => setSort('access_level')} className = "sortButton">ACCESS LEVEL</button>
        </div>
        <main className = "staff">
            {staff.map(person => (
                <div key = {person.id} className = "staffCard">
                    {person.url && (<img src = {person.url} />)}
                        <div>
                        <p></p>     
                        <p>{person.full_name} </p>
                        <p>{' Access level: ' + person.access_level} </p>
                        <p>{' Rank: ' + person.rank} </p>
                        <p>{' Div: ' + person.div} </p>
                        </div>
                    <button>DETAILS</button>
            </div>
            ))}
        </main>
    </div>
    );
}
export default Staff;