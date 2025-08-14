import React, {useState, useEffect} from 'react';
function Staff() {
    const [staff, setStaff] = useState([]);
    const [details, setDetails] = useState(0);
    const [sort, setSort] = useState('id');
    useEffect(() => {
    const fetchStaff = async() => {
            const token = sessionStorage.getItem('token');
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

    const DetailView = ({person}) => {
        return(
            <main>
                <div className = "detailsCard">
                    <img src = {person.url}/> 
                    <div className = "detailsInfo">
                        <p>{'Full Name: ' + person.full_name}</p>
                        <p>{'Call Name: ' + person.call_name}</p>
                        <p>{'Rank: ' + person.rank}</p>
                        <p>{'Access Level: ' + person.access_level}</p>
                        <p>{'Division: ' + person.div}</p>
                        <p>{'ID: ' + person.id}</p>
                        <p>{'STATUS: ' + person.status}</p>
                    </div>
                </div>
                <h1 className = "detailsCardHeader">Service Record</h1>
                <p id = "detailsCardRecord">{person.service_record}</p>
                <button 
                    id = "detailsCardButton"
                    onClick = {() => setDetails(0)}>EXIT DETAILS
                </button>
            </main>
        );
    }
    if(staff[0] !== undefined && details === 0){
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
                            <button onClick = {() => setDetails(person.id)}>DETAILS</button>
                    </div>
                    ))}
                </main>
            </div>
        );
    }
    else if(staff[0] !== undefined && details !== 0){
        return(
            <div>
                <DetailView person = {staff.find(a => a.id === details)}/>
            </div>
        );
    }
    else{
        return (
            <main className = "loadingWindow">LOADING STAFF</main>
        )
    }
}
export default Staff;