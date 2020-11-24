import React, { useState, useEffect } from "react";
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import PopupWithForm from "./PopupWithForm";
import ImagePopup from "./ImagePopup";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import Register from "./Register";
import Login from "./Login";
import InfoTooltip from "./InfoTooltip";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { api } from "../utils/api.js";
import * as mestoAuth from '../mestoAuth.js';
import { getToken, setToken, removeToken } from '../utils/token';

function App() {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);  
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [status, setStatus] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [data, setData] = useState( {      
    password: '',
    email: '',          
  });   
  const history = useHistory();

  useEffect(() => {
    api.getAppInfo().then((res) => {
      const [cards, info] = res;
      setCurrentUser(info);
      setCards(cards);
    });
  }, []);

  function handleCardLike(card) {
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    if (!isLiked) {
      api.putLike(card._id).then((newCard) => {
        const newCards = cards.map((c) => (c._id === card._id ? newCard : c));
        setCards(newCards);
      });
    } else {
      api.putDislike(card._id).then((newCard) => {
        const newCards = cards.map((c) => (c._id === card._id ? newCard : c));
        setCards(newCards);
      });
    }
  }

  function handleCardDelete(card) {
    api.removeCard(card._id).then(() => {
      const newCards = cards.filter((c) => c._id !== card._id);
      setCards(newCards);
    });
  }

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }
  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function handleTrashClick() {
    setIsTrashOpen(true);
  }

  function handleCardClick(card) {
    setSelectedCard(card);
  }

  function handleInfoTooltipOpen() {
    setIsInfoTooltipOpen(true);
  }

 
  function closeAllPopups() {
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsTrashOpen(false);
    setIsInfoTooltipOpen(false);
    setSelectedCard(null);
  }

  function handleUpdateUser({ name, about }) {
    api.editUserInfo({ name, about }).then((res) => {
      setCurrentUser(res);
      closeAllPopups();
    });
  }

  function handleUpdateAvatar(avatar) {
    api.editAvatar(avatar).then((res) => {
      setCurrentUser(res);
      closeAllPopups();
    });
  }

  function handleAddPlace({ name, link }) {
    api.addNewCard({ name, link }).then((newCard) => {
      setCards([newCard, ...cards]);
      closeAllPopups();
    });
  }

  function onRegister (data) {
  const { email, password } = data;    
  mestoAuth.register( email, password ).then((res) => {        
    if(res.statusCode !== 400){  
      setStatus('sucess')
      handleInfoTooltipOpen()      
      history.push('/signin'); 
    }                
  })
  .catch((err) => {
    console.log(err);
      if(err.status === 400) {
        setStatus('unsucess')
        handleInfoTooltipOpen()
        return console.log('Некорректно заполнено одно из полей');          
      } else if (err.status === 500) {
        setStatus('unsucess')
        handleInfoTooltipOpen()
        return console.log('Ошибка сервера');
      }
    });
  }
  

  const onLogin = (data) => {
    const { email, password } = data;       
      mestoAuth.authorize(email, password)  
      .then((data) => {                        
        if (data.jwt) {
          setToken(data.jwt);
          setEmail(email);      
          setLoggedIn(true)         
          history.push('/');
        }        
      })
      .catch((err) => {
      console.log(err);
        if(err.status === 400) {
          return console.log('Не передано одно из полей');
        } else if(err.status === 401) {
          return console.log('Пользователь с email не найден');
        } else if (err.status === 500) {
          return console.log('Ошибка сервера');
        }
      });
  }

  const onSignOut = ( ) => {
    removeToken();
    setLoggedIn(false);
    history.push('/signin');
  }

    
   useEffect(() => {       
    const jwt = getToken();
      if (jwt) {     
      mestoAuth.getContent(jwt).then((res) => {
        if (res) {  
          const data = {
            password: res.password,
            email: res.email
          }        
        setLoggedIn(true);        
        setData(data);
        setStatus(res);
        history.push('/')
        }
      }).catch((err) => {
        console.log(err.status);
        if(err.status === 401) {
          return console.log('Переданный токен некорректен');
        } else if(!jwt) {
          return console.log('Токен не передан или передан не в том формате');
        } else if (err.status === 500) {
          return console.log('Ошибка сервера');
        }
      });
    }          
  }, []);

  return (
    <CurrentUserContext.Provider value={currentUser}>          
        <div className="page">
          <div className="page__container">
            <Header 
              email={email}
              loggedIn={loggedIn} 
              onSignOut={onSignOut} 
            />
            <Switch>
            <Route path="/signup">
              <Register  onRegister={onRegister}  />
            </Route>
            <Route path="/signin">
             <Login onLogin={onLogin} />
           </Route>           
           <ProtectedRoute exact path="/"
              loggedIn={loggedIn}            
              cards={cards}
              onEditProfile={handleEditProfileClick}
              onEditAvatar={handleEditAvatarClick}
              onAddPlace={handleAddPlaceClick}
              onCardClick={handleCardClick}
              onTrashClick={handleTrashClick}
              onCardLike={handleCardLike}
              onCardDelete={handleCardDelete}
              email={email}
              component={Main}
            /> 
             <Route  path="/"  >
               {loggedIn ? <Redirect to="/" /> : <Redirect to="/signin" />}
             </Route >              
                                        
            </Switch>  
            <Route exact path="/"  >
            <Footer/>
            </Route>           
            <EditProfilePopup
              isOpen={isEditProfilePopupOpen}
              onClose={closeAllPopups}
              onUpdateUser={handleUpdateUser}
            />
            <EditAvatarPopup
              isOpen={isEditAvatarPopupOpen}
              onClose={closeAllPopups}
              onUpdateAvatar={handleUpdateAvatar}
            />
            <AddPlacePopup
              isOpen={isAddPlacePopupOpen}
              onClose={closeAllPopups}
              onAddPlace={handleAddPlace}
            />
            <PopupWithForm
              name="confirm"
              isOpen={isTrashOpen}
              title="Вы уверены?"
              buttonText="Да"
              onClose={closeAllPopups}
            />
            <ImagePopup card={selectedCard} onClose={closeAllPopups} />  
            < InfoTooltip  onClose={closeAllPopups}  isOpen={isInfoTooltipOpen} status={status}/>    
          </div>
        </div>     
    </CurrentUserContext.Provider>
  );
}

export default App;
