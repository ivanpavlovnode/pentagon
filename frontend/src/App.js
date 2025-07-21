import React, {useState} from 'react';
import './App.css';
import Header from './components/Header';
import Account from './components/Account';
import Staff from './components/Staff';
import Operations from './components/Operations';
import Nuclear from './components/Nuclear';
import Messenger from './components/Messenger';
import Auth from './components/Auth';

function App(){
  //Переключатель вкладок main
  const [currentComponent, setCurrentComponent] = useState('account');
  //Переключатель аутентификации до вкладок
  const [isAuth, setIsAuth] = useState('nope');

  // Функция-переключатель окна аутентификации
  const authentication = () => {
    sessionStorage.setItem("logline", "Authentication success");
    setIsAuth('hell yeah!');
  };
  // Функция-переключатель окна main
  const changeComponent = (componentName) => {
    setCurrentComponent(componentName);
  };
  
  // Отображаем нужный компонент
  let displayedComponent;
  if(currentComponent === 'account') 
  {
    displayedComponent = <Account />;
  } 
  else if(currentComponent === 'staff') 
  {
    displayedComponent = <Staff />;
  } 
  else if(currentComponent === 'messenger') 
  {
    displayedComponent = <Messenger />;
  }
  else if(currentComponent === 'operations') 
  {
    displayedComponent = <Operations />;
  }
  else if(currentComponent === 'nuclear') 
  {
    displayedComponent = <Nuclear />;
  }


  //Проверка аутентификации, выдача <del>в еб@ло</del> окна аутентификации
  if(isAuth !== 'nope' || sessionStorage.getItem("token") !== null)
  {
    return(
      <div>
        <Header changeComponent={changeComponent}/>
        {displayedComponent}
      </div>
    );
  }
  else{
    return(
      <div>
        <Auth authentication={authentication}/>
      </div>
    )
  }

}
export default App;