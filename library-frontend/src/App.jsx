import {
  Routes, Route, Link, useLocation
} from 'react-router-dom'
import { useQuery } from '@apollo/client'
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import { ALL_AUTHORS } from './queries'

const App = () => {
  const location = useLocation()
  const result = useQuery(ALL_AUTHORS, {
    skip: location.pathname !== '/authors'
  })

  const authors = result.data ? result.data.allAuthors : []

  return (
    <div>
      <div>
        <Link to="/authors"><button>authors</button></Link>
        <Link to="/books"><button>books</button></Link>
        <Link to="/add"><button>add book</button></Link>
      </div>
      <Routes>
        <Route path="/authors" element={<Authors authors={authors} />} />
        <Route path="/books" element={<Books />} />
        <Route path="/add" element={<NewBook />} />
      </Routes>
    </div>
  );
};

export default App;
