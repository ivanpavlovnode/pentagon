import React, {useState} from 'react';
import './App.css';
import Header from './components/Header';
import Account from './components/Account';
import Staff from './components/Staff';
import Operations from './components/Operations';
import Nuclear from './components/Nuclear';
import Equipment from './components/Equipment';
import Auth from './components/Auth';

function App(){
  //Переключатель вкладок main
  const [currentComponent, setCurrentComponent] = useState('account');
  //Переключатель аутентификации до вкладок
  const [isAuth, setIsAuth] = useState('nope');

  // Функция-переключатель окна аутентификации
  const authentification = () => {
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
  else if(currentComponent === 'equipment') 
  {
    displayedComponent = <Equipment />;
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
  if(isAuth !== 'nope'){
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
        <Auth authentification={authentification}/>
      </div>
    )
  }

}
export default App;