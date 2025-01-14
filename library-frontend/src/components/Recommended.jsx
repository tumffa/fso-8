const RecommendedBooks = ({ books, userInfo }) => {
  if (!userInfo || !userInfo.favoriteGenre) {
    return "no info"
  }

  const filteredBooks = books.filter(book => book.genres.includes(userInfo.favoriteGenre))

  return (
    <div>
      <h2>Recommendations</h2>
      <p>Books in your favorite genre <b>{userInfo.favoriteGenre}</b></p>
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
    </div>
  )
}

export default RecommendedBooks