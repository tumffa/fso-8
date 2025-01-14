import React, { useState, useEffect } from 'react';
import GenreFilter from "./GenreFilter"

const Books = ({ books }) => {
  const [genreFilter, setGenreFilter] = useState({})

  useEffect(() => {
    if (books.length > 0) {
      const newGenreFilter = {}
      books.forEach(book => {
        book.genres.forEach(genre => {
          if (!(genre in newGenreFilter)) {
            newGenreFilter[genre] = false
          }
        })
      })
      setGenreFilter(newGenreFilter)
    }
  }, [books])

  const isAnyGenreActive = Object.values(genreFilter).some(value => value);

  const filteredBooks = books.filter(book => {
    if (!isAnyGenreActive) {
      return true;
    }
    const activeGenres = Object.keys(genreFilter).filter(genre => genreFilter[genre]);
    return activeGenres.every(activeGenre => book.genres.includes(activeGenre));
  });

  return (
    <div>
      <h2>Books</h2>
      <table>
        <tbody>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Published</th>
          </tr>
          {filteredBooks.map(book => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <GenreFilter genresFilter={genreFilter} setGenresFilter={setGenreFilter} />
    </div>
  );
};

export default Books;