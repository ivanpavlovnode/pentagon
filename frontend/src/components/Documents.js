import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import styled from 'styled-components';
import React, {useEffect, useState, useRef, useMemo} from 'react';

//STYLED COMPONENTS
//DETAILED DOCUMENT CARD
const DetailedWindow = styled.main`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(12, 1fr);
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    height: 89vh;
    min-height: 500px;
    width: 100%;
    @media (max-width: 1080px){
        min-height: 700px;
    }
`;
//MAIN WINDOW
const DocumentsWindow = styled.main`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(10, 1fr);
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    height: 89vh;
    min-height: 500px;
    width: 100%;
    @media (max-width: 1080px){
        min-height: 700px;
    }
`;
const CreateButton = styled.button`
    grid-area: 1 / 1 / 2 / 5;
    background-color: rgb(2, 60, 0);
    &:hover{
        background-color: rgb(5, 90, 0);
    }
`;
const FindInput = styled.input`
    grid-area: 2 / 1 / 3 / 5;
    background-color: rgb(2, 60, 0);
    &:hover{
        background-color: rgb(5, 90, 0);
    }
`;
const DocsTitle = styled.div`
    grid-area: 3 / 1 / 4 / 5;
    border-style: solid;
    padding-left: 5vw;
    display: flex;
    place-items: center;
`;
const ShowDelivered = styled.button`
    width: 30vw;
    height: 100%;
    background-color: ${({active}) => (active === "true" ? 'rgb(5, 90, 0)' : 'rgb(12, 12, 12)')};
    &:hover{
        background-color: rgb(2, 60, 0);
    }
`;
const SortTitle = styled.div`
    grid-area: 4 / 1 / 5 / 2;
    border-style: solid;
    display: flex;
    place-items: center;
    justify-content: center;
`;
const SortByName = styled.button`
    grid-area: 4 / 2 / 5 / 3;
    background-color: ${({active}) => (active ? 'rgb(5, 90, 0)' : 'rgb(12, 12, 12)')};
`;
const SortByCreator = styled.button`
    grid-area: 4 / 3 / 5 / 4;
    background-color: ${({active}) => (active ? 'rgb(5, 90, 0)' : 'rgb(12, 12, 12)')};
`;
const SortByDate = styled.button`
    grid-area: 4 / 4 / 5 / 5;
    background-color: ${({active}) => (active ? 'rgb(5, 90, 0)' : 'rgb(12, 12, 12)')};
`;
const DocsTable = styled.div`
    grid-area: 5 / 1 / 11 / 5;
    border-style: solid;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 100%;
    padding: 20px;
    grid-column-gap: 20px;
    grid-row-gap: 20px;
    overflow: scroll;
    &::-webkit-scrollbar{
        display: none;

    }
    @media (max-width: 1080px){
        grid-template-columns: repeat(2, 1fr);
        grid-auto-rows: 50%;
        padding: 10px;
        grid-column-gap: 10px;
        grid-row-gap: 10px;
    }
`;
const DocCard = styled.div`
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    border-style: solid;
    border-radius: 2px;
        @media (max-width: 1080px){
        padding: 10px;
        }
`;
const DocCardButton = styled.button`
    grid-area: 4 / 1 / 5 / 2;
    height: 100%;
    background-color: rgb(2, 60, 0);
    &:hover{
        background-color: rgb(5, 90, 0);
    }
`;
const DocCardDiv = styled.div`
    grid-area: 1 / 1 / 4 / 2;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    line-height: 1;
    word-break: break-word;
    overflow: scroll;
    &::-webkit-scrollbar{
        display: none;
    }
    padding-left: 1vw;
    & *{
        margin: 0;
        font-size: 2vw;
        @media (max-width: 1080px){
            font-size: 3vw;
        }
    }
`;

function Documents() {
    //Состояния для локальных данных
    const [mode, setMode] = useState('main');
    const [staff, setStaff] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [sort, setSort] = useState('name');
    const [delivered, setDelivered] = useState(true);
    const [chosenDoc, setChosenDoc] = useState(0);
    const [searchText, setSearch] = useState('');
    const intervalRef = useRef(null);
    const token = sessionStorage.getItem('token');

    const fetchDocs = async() => {
        try{
            const res = await fetch(`${process.env.REACT_APP_URL}/api/documents`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения документов');
                const data = await res.json();
                setDocuments(data);
        }
        catch(err){
            console.error(err);
        }
    }
    const fetchStaff = async() => {
            const token = sessionStorage.getItem('token');
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/staff`, {
                    headers: {'Authorization': `Bearer ${token}`},
                    cache: 'no-store'});
                if(!res.ok) throw new Error('Ошибка получения персонала');
                const data = await res.json();
                setStaff(data);
            }
            catch(err){
                console.error(err);
            }
    }

    //Обновляем раз в 30 сек список доков и людей для интерактивности
    useEffect(() => {
        const caller = async() =>{
            await fetchStaff();
            fetchDocs();
        }
        caller();
        intervalRef.current = setInterval(caller, 30000);
        return() => {
            if(intervalRef.current){
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    
    //Фильтрация доставленных сообщений перед поисковой фильтрацией
    // TRUE === ПОКАЗЫВАТЬ ДОСТАВЛЕННЫЕ
    const deliveredDocuments = useMemo(() =>{
        if(delivered) return documents;
        else{
            return documents.filter(doc => doc.delivered === false)
        }
    }, [documents, delivered]);

    //Поисковая фильтрация массива документов для сортировки
    const filteredDocuments = useMemo(() =>{
        if(searchText === '') return deliveredDocuments;
        else{
            const text = searchText.toLowerCase();
            const searchResult = [];
            deliveredDocuments.forEach((doc) =>{
                const creator = staff[doc.creator - 1].full_name.toLowerCase();
                if(
                    creator.includes(text) || 
                    doc.docdata.name.includes(text) ||
                    doc.docdata.description.includes(text) ||
                    String(doc.date).includes(text)
                ){
                    searchResult.push(doc);
                }
            });
            return searchResult;
        }
    }, [deliveredDocuments, staff, searchText]);

    //Сортировка массива документов для рендеринга
    const sortedDocuments = useMemo(() => {
            const sorted = [...filteredDocuments];
            switch(sort){
                case 'name':
                    return sorted.sort((a, b) => a.docdata.name.localeCompare(b.docdata.name));
                case 'creator':
                    return sorted.sort((a, b) => 
                        staff[a.creator - 1 ].full_name
                        .localeCompare(staff[b.creator - 1].full_name));
                case 'date':
                    return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
                default:
                    return sorted;
            }
    }, [filteredDocuments, staff, sort]);

    //Главное окно вкладки документов
    if(staff[0] !== undefined && documents[0] !== undefined && chosenDoc === 0){
        return (
            <DocumentsWindow>
                <CreateButton>Create New Document</CreateButton>
                <FindInput 
                    type = "text" 
                    placeholder = "Find Document"
                    value={searchText}
                    onChange={(e) => setSearch(e.target.value)}></FindInput>
                <DocsTitle>
                    <div>{searchText === '' ? "All obtainable docs:" : "SEARСH RESULTS:"}</div>
                    <div>Show delivered :</div>
                    <ShowDelivered 
                        active = {delivered ? "true" : "false"}
                        onClick={() => setDelivered(!delivered)}
                    >{delivered ? "YES" : "NO"}</ShowDelivered>
                </DocsTitle>
                <SortTitle>Sort by:</SortTitle>
                <SortByName
                    active = {sort === 'name'}
                    onClick = {() => setSort('name')}
                >Document Name</SortByName>
                <SortByCreator
                    active = {sort === 'creator'}
                    onClick = {() => setSort('creator')}
                >Creator</SortByCreator>
                <SortByDate
                    active = {sort === 'date'}
                    onClick = {() => setSort('date')}
                >Date</SortByDate>
                <DocsTable>
                    {sortedDocuments.map(doc => 
                        <DocCard key = {doc.id}>
                        <DocCardDiv>
                            <p>By: {staff[doc.creator - 1].full_name}</p>
                            <p>Date: {new Date(doc.date).toLocaleString()}</p>
                            <p>Name: {doc.docdata.name}</p>
                        </DocCardDiv>
                        <DocCardButton
                            onClick ={() => setChosenDoc(doc.id)}
                        >Open document</DocCardButton>
                    </DocCard>
                    )}
                </DocsTable>
            </DocumentsWindow>
        );
    }
    else if(staff[0] !== undefined && documents[0] !== undefined && chosenDoc !== 0){
        return (
            <DetailedWindow>LOADING DOCUMENTS</DetailedWindow>
        );
    }
    else{
        return (
            <main className = "loadingWindow">LOADING DOCUMENTS</main>
        );
    }
}

export default Documents;