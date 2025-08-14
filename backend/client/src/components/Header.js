import { FOCUSABLE_SELECTOR } from '@testing-library/user-event/dist/utils';
import React, {useState} from 'react';
function Header(props) {
const[isToggled, setIsToggled] = useState(false);
const Toggle = () => 
{
    setIsToggled(!isToggled);
};
const [title, setTitle] = useState('Account');

return (
    <header className = "header">
        <img src="/img/Pentagon_Logo.png" alt="PENTAGON"/>
        <p className = "header__p">US Department of Defense</p>
        <p className = "header__p" >{title}</p>
        <div className = "header__dropdown">
            <button onClick = {Toggle} className="header__button">Navigation</button>
            {isToggled && (
                <div>
                    <button className="header__button"
                    onClick = {() => {props.changeComponent('account'); setTitle('Account');}}>Account</button>
                    <button className="header__button"
                    onClick = {() => {props.changeComponent('staff'); setTitle('Staff');}}>Staff</button>
                    <button className="header__button"
                    onClick = {() => {props.changeComponent('messenger'); setTitle('Messenger');}}>Messenger</button>
                    <button className="header__button"
                    onClick = {() => {props.changeComponent('documents'); setTitle('Documents');}}>Documents</button>
                    <button className="header__button"
                    onClick = {() => {sessionStorage.clear(); window.location.reload();}}>Log out</button>
                </div>
            )}
        </div>
    </header>
  );
}

export default Header;