import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { EDIT_AUTHOR } from '../gql';

const EditBirthYearForm = () => {
  const [name, setName] = useState('');
  const [born, setBorn] = useState('');

  const [editBirthyear] = useMutation(EDIT_AUTHOR);

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
  };

  return (
    <div>
      <h2>Set birthyear</h2>
      <form onSubmit={handleSubmit}>
        <div>
          name
          <input
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
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
