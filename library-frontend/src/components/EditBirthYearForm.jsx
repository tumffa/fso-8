import React, { useState } from 'react';
import { useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom';
import { EDIT_AUTHOR, ALL_AUTHORS } from '../gql';

const EditBirthYearForm = ({ authors }) => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');
  const navigate = useNavigate();

  const [editBirthyear] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })

  const handleSubmit = async (event) => {
    event.preventDefault();

    editBirthyear({
      variables: {
        name,
        born: parseInt(born),
      },
    });

    setName('');
    setBorn('');
    navigate('/');
  };

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={handleSubmit}>
        <div>
          name
          <select value={name} onChange={({ target }) => setName(target.value)}>
            <option value="" disabled>Select author</option>
            {authors.map(author => (
              <option key={author.id} value={author.name}>
                {author.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          born
          <input
            type="number"
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  );
}

export default EditBirthYearForm