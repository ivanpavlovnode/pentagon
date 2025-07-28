import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import styled from 'styled-components';
import React, {useEffect, useState, useRef} from 'react';

//STYLED COMPONENTS
const DocumentsWindow = styled.main`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(8, 1fr);
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    height: 90vh;
    min-height: 500px;
    width: 100%;
`;
const CreateButton = styled.button`
    grid-area: 1 / 1 / 2 / 5;
`;
const FindButton = styled.button`
    grid-area: 2 / 1 / 3 / 5;
`;
const DocsTitle = styled.div`
    grid-area: 3 / 1 / 4 / 5;
    border-style: solid;
    padding-left: 5vw;
    display: flex;
    place-items: center;
`;
const ShowDelivered = styled.button`
    width: 20vw;
    height: 100%;
    font-size: 5vw;
`;
const SortTitle = styled.div`
    grid-area: 4 / 1 / 5 / 2;
    padding: 0 0 0 3vw;
    border-style: solid;
    display: flex;
    place-items: center;
`;
const SortByName = styled.button`
    grid-area: 4 / 2 / 5 / 3;
`;
const SortByCreator = styled.button`
    grid-area: 4 / 3 / 5 / 4;
`;
const SortByAccess = styled.button`
    grid-area: 4 / 4 / 5 / 5;
`;
const DocsTable = styled.div`
    grid-area: 5 / 1 / 9 / 5;
    border-style: solid;
`;


function Documents() {
    //Состояния для локальных данных
    const [documents, setDocuments] = useState([]); //Все доступные документы
    const intervalRef = useRef(null);
    const token = useRef(sessionStorage.getItem('token'));

    const fetchDocs = async(req, res) => {
        try{
            const res = await fetch(`${process.env.REACT_APP_URL}/api/staff`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения персонала');
                const data = await res.json();
        }
        catch(err){
            console.error(err);
        }
    }
    useEffect(() => {
        //Обновляем раз в 10 сек список доков для интерактивности
        fetchDocs();
        intervalRef.current = setInterval(fetchDocs, 10000);
        return() => {
            if(intervalRef.current){
                clearInterval(intervalRef.current);
            }
        };
    }, []);




    return (
        <DocumentsWindow>
            <CreateButton>Create New Document</CreateButton>
            <FindButton>Find Document</FindButton>
            <DocsTitle>
                <div>All Obtainable Docs</div>
                <div>Show delivered</div>
                <ShowDelivered> X </ShowDelivered>
            </DocsTitle>
            <SortTitle>Sort by:</SortTitle>
            <SortByName>Doc Name</SortByName>
            <SortByCreator>Creator</SortByCreator>
            <SortByAccess>Access Level</SortByAccess>
            <DocsTable></DocsTable>

        </DocumentsWindow>
    );
}

export default Documents;