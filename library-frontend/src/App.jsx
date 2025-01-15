import React, { useState, useEffect } from 'react'
import {
  Routes, Route, Link, useLocation, useNavigate
} from 'react-router-dom'
import { useQuery, useApolloClient, useSubscription } from '@apollo/client'
import Authors from "./components/Authors"
import Books from "./components/Books"
import NewBook from "./components/NewBook"
import BirthyearForm from "./components/EditBirthYearForm"
import LoginForm from "./components/LoginForm"
import RecommendedBooks from "./components/Recommended"
import { ALL_AUTHORS, ALL_BOOKS, USER_INFO, BOOK_ADDED } from './gql'

const App = () => {
  const [token, setToken] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const client = useApolloClient()

  useEffect(() => {
    const token = localStorage.getItem('library-user-token')
    if (token) {
      setToken(token)
    }
  }, [])

  const authorsResult = useQuery(ALL_AUTHORS, {
    skip: location.pathname !== '/' && location.pathname !== '/edit-birth-year',
    pollInterval: 2000})
  const authors = authorsResult.data ? authorsResult.data.allAuthors : []
  
  const booksResult = useQuery(ALL_BOOKS, {
    skip: location.pathname !== '/books' && location.pathname !== '/recommendations',
    pollInterval: 2000})
  const books = booksResult.data ? booksResult.data.allBooks : []

  const userInfoResult = useQuery(USER_INFO, {
    skip: !token
  })
  const userInfo = userInfoResult.data ? userInfoResult.data.me : null

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded
      window.alert(`Added book ${addedBook.title}`)
    }
  })

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
    navigate('/')
  }

  const handleErrorMessage = (error) => {
    setErrorMessage(error)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }

  return (
    <div>
      <div>
        {errorMessage && <div style={{color: 'red'}}>{errorMessage}</div>}
        <Link to="/"><button>authors</button></Link>
        <Link to="/books"><button>books</button></Link>
        {token ? (
          <>
            <Link to="/add"><button>add book</button></Link>
            <Link to="/edit-birth-year"><button>edit birthyear</button></Link>
            <Link to="/recommendations"><button>recommendations</button></Link>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <Link to="/login"><button>login</button></Link>
        )}
      </div>
      <Routes>
        <Route path="/" element={<Authors authors={authors} />} />
        <Route path="/books" element={<Books books={books} />} />
        {token ? (
          <>
            <Route path="/add" element={<NewBook />} />
            <Route path="/edit-birth-year" element={<BirthyearForm authors={authors}/>} />
            <Route path="/recommendations" element={<RecommendedBooks books={books} userInfo={userInfo} />} />
          </>
        ) : (
          <Route path="/login" element={
            <LoginForm setToken={setToken} setError={handleErrorMessage} />
          }/>
        )}
      </Routes>
    </div>
  );
};

export default App;
