import React from 'react';

const GenreFilter = ({ genresFilter, setGenresFilter }) => {
  return (
    <div>
      {Object.keys(genresFilter).map(genre => (
        <button
          key={genre}
          onClick={() => setGenresFilter(prev => ({ ...prev, [genre]: !prev[genre] }))}
          style={{
            backgroundColor: genresFilter[genre] ? 'grey' : 'white',
            border: genresFilter[genre] ? '2px solid blue' : '1px solid gray',
            margin: '5px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          {genre}
        </button>
      ))}
    </div>
  )
}

export default GenreFilter;