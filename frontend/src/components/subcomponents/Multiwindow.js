import styled from 'styled-components';
import {css} from 'styled-components';
import React, {useEffect, useState, useRef, useMemo, useContext} from 'react';
import { DocumentsContext } from '../Documents';

function Multiwindow(){
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    //window: 'main','read','create','update'
    const {staff, documents, chosenDoc, window, setChosenDoc, setWindow} = useContext(DocumentsContext);
    
    //Состояния для создания и редактирования документа
    const [recipient, setRecipient] = useState(null);
    const [access_level, setAccess_level] = useState(null);
    const [disposable, setDisposable] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);

    //Состояния для интерактивных элементов
    const [searchText, setSearch] = useState('');
    const [showSearchInput, setSearchInput] = useState(false);
    const [showAccessLevelButtons, setAccessLevelButtons] = useState(false);
    const [showDisposableButtons, setDisposableButtons] = useState(false);

    //Определитель принадлежности документа
    const docByUser = useMemo(() => {
        if(chosenDoc !== 0){
            if((documents.find(doc => doc.id === chosenDoc).creator) === userData.id){
                return true;
            }
            else{
                return false;
            }
        }
        else{
            return false;
        }
    }, [chosenDoc]);

    //Поиск по получателям
    const searchResult = useMemo(() => {
        if(searchText !== ''){
            return staff.filter(person => 
            person.full_name
            .toLowerCase()
            .includes(searchText.toLowerCase()));
        }
        else return [];
    }, [searchText]);

    const chosenDocObject = useMemo(() => {
        /*ШАБЛОН ЧТОБЫ ОКНО СОЗДАНИЯ ДОКУМЕНТА РЕНДЕРИЛОСЬ ПРАВИЛЬНО
        ЧЕРЕЗ ТУ ЖЕ ВЕРСТКУ, ЧТО И ОКНО ИЗМЕНЕНИЯ
        ТАМ ВСЕ ОТОБРАЖЕНИЕ СВЯЗАНО СО ЗНАЧЕНИЯМИ ИЗ ДОКУМЕНТА
        ПОЭТОМУ НУЖЕН КАКОЙ НИБУДЬ ДОКУМЕНТ
        НО chosenDoc === 0 это несуществующий документ
        БОЛЬШАЯ ЧАСТЬ ПОЛЕЙ НЕ ИСПОЛЬЗУЕТСЯ, НО Я СОЗДАЛ ВСЕ, ЧТОБЫ СПОКОЙНО ВЕРСТАТЬ*/
        if(chosenDoc === 0){
            return(
                {
                    "access_level": null,
                    "creator": userData.id,
                    "date": new Date().toLocaleString('ru-RU'),
                    "delivered": false,
                    "disposable": false,
                    "docdata": 
                    {
                        "name": "",
                        "description": "",
                        "filepath": ""
                    },
                    "id": "new",
                    "recipient": null,
                    "version": 0
                }
            )
        }
        //Если выбран существующий документ - возвращаем его объект для верстки
        else{
            return (documents.find(doc => doc.id === chosenDoc))
        }
    }, [chosenDoc]);

    //Присвоитель значений из документа в состояния
    //Также обнуляет поиск и элементы UI
    //Применяется при смене документа, отмене или завершении действия
    function defaulter(){
        setRecipient(chosenDocObject.recipient);
        setAccess_level(chosenDocObject.access_level);
        setDisposable(chosenDocObject.disposable);
        setName(chosenDocObject.docdata.name);
        setDescription(chosenDocObject.docdata.description);
        setFile(chosenDocObject.docdata.filepath);
        setSearch('');
        setSearchInput(false);
        setAccessLevelButtons(false);
        setDisposableButtons(false);
    }
    //Присвоитель значений из документа в состояния
    useEffect(() => {
        defaulter();
    }, [chosenDocObject]);

    //Вычисляет разрешенные уровни доступа документов
    const availableAccesssLevels = useMemo(() => {
        const result = [];
        for (let i = 1; i <= userData.access_level; i++){
            result.push(i);
        }
        return result;
    }, []);
    
    return(
        <DocumentsMultiwindow>
            <div style = {{gridArea: "title"}}>
                {window === 'read' && 'VIEWING DOCUMENT'}
                {window === 'update' && 'EDITING DOCUMENT'}
                {window === 'create' && 'CREATING DOCUMENT'}
            </div>

            <div style = {{gridArea: "id"}}>
                {(window === 'read' || window === 'update') && 
                    'id: ' + chosenDocObject.id
                }
                {window === 'create' && 'id: new'}
            </div>

            <div style = {{gridArea: "creator"}}>
                {window === 'read' && 'creator: ' + 
                    staff.find(person => person.id === chosenDocObject.creator).full_name
                }
                {(window === 'update' || window === 'create') && 'creator: ' + userData.full_name}
            </div>

            <div style = {{gridArea: "date"}}>
                {window === 'read' && 'date: ' + 
                    new Date(chosenDocObject.date).toLocaleString()
                }
                {(window === 'update' || window === 'create') && 'date: ' +
                    new Date().toLocaleString('ru-RU')
                }
            </div>

            <div style = {{gridArea: "delivered"}}>
                {window === 'read' && 'delivered: ' + 
                    (chosenDocObject.delivered ? "yes" : "no")
                }
                {(window === 'update' || window === 'create') && 'delivered: no'}
            </div>

            <div style = {{gridArea: "version"}}>
                {window === 'read' && 'version: ' + 
                    chosenDocObject.version 
                }
                {window === 'update' && 'version: ' + 
                    (chosenDocObject.version + 1)
                }
                {window === 'create' && 'version: 0'}
            </div>



            <div style = {{gridArea: "recipient", position: "relative", zIndex: 3}}>
                {window === 'read' && 'recipient: ' + (() => {
                        if(chosenDocObject.recipient !== null){
                            return staff.find(person => person.id === (chosenDocObject.recipient)).full_name
                        }
                        else {
                            return "everybody"
                        }
                    })() //IIFE синтаксис требует () в конце
                }
                {(window === 'update' || window === 'create') && 
                    <DropdownWrapper>
                        {!showSearchInput && 
                        <button onClick = {() => {setSearchInput(true);}}>
                            {'recipient: ' + 
                            (recipient === null ? 
                            'everybody' : 
                            (staff.find(person => person.id === recipient).full_name))}
                        </button>}
                        {showSearchInput && 
                        <Dropdown>
                            <input 
                                style = {{height: "100%", minHeight: "100%"}}
                                type = "text" 
                                placeholder = 'SEARCH'
                                value={searchText}
                                onChange={(e) => setSearch(e.target.value)}>
                            </input>
                            {/* Отдельная кнопка для отправки всем*/}
                            {searchText === '' && 
                                <ButtonWrapper>
                                    <button onClick = {() => {setRecipient(null); setSearchInput(false)}}>EVERYBODY</button>
                                </ButtonWrapper>
                            }
                            {searchText !== '' && 
                                searchResult
                                .map(person =>  (
                                    <ButtonWrapper key = {person.id}>
                                        <button onClick = {() => {setRecipient(person.id); setSearchInput(false)}}>{person.full_name}</button>
                                    </ButtonWrapper>
                            ))}
                        </Dropdown>}
                    </DropdownWrapper>
                }
            </div>



            <div style = {{gridArea: "access_level", position: "relative", zIndex: 2}}>
                {window === 'read' && 'access_level: ' + (() => {
                        if(chosenDocObject.access_level !== null){
                            return chosenDocObject.access_level
                        }
                        else {
                            return "unclassified"
                        }
                    })()
                }
                {(window === 'update' || window === 'create') && 
                    <DropdownWrapper>
                        {!showAccessLevelButtons &&
                        <button 
                        style = {{height: "100%", minHeight: "100%"}}
                        onClick = {() => setAccessLevelButtons(true)}>
                            {'access_level: ' + (access_level === null ? 'unclassified' : access_level)}
                        </button>}
                        {showAccessLevelButtons && 
                        <Dropdown>
                            <ButtonWrapper>
                                <button onClick = {() => {setAccess_level(null); setAccessLevelButtons(false)}}>unclassified</button>
                            </ButtonWrapper>
                            {availableAccesssLevels
                                .map(level => {
                                    return (
                                        <ButtonWrapper key = {level}>
                                            <button onClick = {() => {setAccess_level(level); setAccessLevelButtons(false)}}>{level}</button>
                                        </ButtonWrapper>
                                    );
                            })}
                        </Dropdown>}
                    </DropdownWrapper>}
            </div>



            <div style = {{gridArea: "disposable", position: "relative", zIndex: 1}}>
                {window === 'read' && 'disposable: ' + 
                    (chosenDocObject.disposable === true ? 'yes' : 'no')
                }
                {(window === 'update' || window === 'create') && 
                    <DropdownWrapper>
                        {!showDisposableButtons &&
                        <button 
                        style = {{height: "100%", minHeight: "100%"}}
                        onClick = {() => setDisposableButtons(true)}>
                            {'disposable: ' + (disposable === true ? 'yes' : 'no')}
                        </button>}
                        {showDisposableButtons && 
                        <Dropdown>
                            <ButtonWrapper>
                                <button onClick = {() => {setDisposable(true); setDisposableButtons(false)}}>yes</button>
                            </ButtonWrapper>
                            <ButtonWrapper>
                                <button onClick = {() => {setDisposable(false); setDisposableButtons(false)}}>no</button>
                            </ButtonWrapper>
                        </Dropdown>}
                    </DropdownWrapper>}
            </div>



            <div style = {{gridArea: "name"}}>
                {window === 'read' && 
                <div>
                    {'name: ' + (chosenDocObject.docdata.name.length > 45 ?
                    chosenDocObject.docdata.name.slice(0, 45) + '...' :
                    chosenDocObject.docdata.name)}
                </div>
                }
                {(window === 'update' || window === 'create') && 
                    <input 
                        style = {{height: "100%", minHeight: "100%"}}
                        type = "text" 
                        placeholder = 'Document name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}>
                    </input>
                }
            </div>

            <div style = {{gridArea: "description"}}>
                {window === 'read' && 
                <DescriptionRead>
                    {'description: ' + (chosenDocObject.docdata.description)}
                </DescriptionRead>
                }
                {(window === 'update' || window === 'create') && 
                <DescriptionChange
                    type = "text" 
                    placeholder = 'Document description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />}
            </div>

            <div style = {{gridArea: "file"}}>
                {window === 'read' && 
                    <button>Download file</button>
                }
                {window === 'update' && 
                    <button>Change file</button>
                }
                {window === 'create' && 
                    <button>Upload file</button>
                }
            </div>

            <div style = {{gridArea: "back"}}>
                {window === 'read' && 
                    <button onClick = {() => {setWindow('main'); setChosenDoc(0); defaulter();}}>Exit</button>
                }
                {window === 'update' && 
                    <button onClick = {() => {setWindow('read'); defaulter();}}>Decline</button>
                }
                {window === 'create' && 
                    <button onClick = {() => {setWindow('main'); setChosenDoc(0); defaulter();}}>Cancel</button>
                }
            </div>

            <div style = {{gridArea: "forward"}}>
                {window === 'read' && (docByUser ? 
                    <button onClick = {() => {setWindow('update'); defaulter();}}>Edit</button> : "Can't edit")
                }
                {window === 'update' && (docByUser ? 
                    <button >Confirm changes</button> : "Can't confirm")
                }
                {window === 'create' && <button>Confirm creation</button>}
            </div>
        </DocumentsMultiwindow>
    );
}
export default Multiwindow;

//WINDOW FOR VIEW, CREATE AND UPDATE
const DocumentsMultiwindow = styled.main`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(10, 1fr);
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-areas:
    "title title"
    "id version"
    "creator recipient"
    "date access_level"
    "delivered disposable"
    "name name"
    "description description"
    "description description"
    "file file"
    "back forward";

    height: 88vh;
    min-height: 750px;
    width: 100%;
    z-index: auto;
    &  div{
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        line-height: normal;
        border-style: solid;
        z-index: auto;
        & button{
            height: 100%;
            width: 100%;
        }
    }
    @media (max-width: 1080px){
        min-height: 700px;
    }
`;
const DescriptionChange = styled.textarea`
    display: flex;
    align-items: center;
    text-align: center;
    height: 100%;
    width: 100%;
    word-break: break-all;
    padding: 1vw 2vw;
    &::-webkit-scrollbar{
        display: none;
    }
    &::placeholder{
        display: flex;
        align-items: center;
        text-align: center;
    }
    @media (min-width: 1440px){
       font-size: 2vw;
    }
`
const DescriptionRead = styled.div`
    display: flex;
    align-items: initial !important;
    height: 100%;
    width: 100%;
    overflow: auto;
    word-break: break-all;
    padding: 0 2vw;
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
    @media (min-width: 1440px){
       font-size: 2vw;
    }
`
const Dropdown = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    justify-content: initial !important;
    align-items: initial !important;
`
const DropdownWrapper = styled.div`
    position: absolute;
    display: flex;
    flex-flow: column;
    height: 100%;
    width: 100%;
    border-style: none;
`
const ButtonWrapper = styled.div`
    height: 100%;
    min-height: 100px;
`