const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
mongoose.set('strictQuery', false)
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const { GraphQLError } = require('graphql')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky',
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz',
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

const books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'Demons',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const initDb = async () => {
  await Author.deleteMany({})
  await Book.deleteMany({})

  for (const author of authors) {
    let newAuthor = new Author({ name: author.name, born: author.born })
    await newAuthor.save()
  }

  for (const book of books) {
    const authorOfBook = await Author.findOne({ name: book.author })
    let newBook = new Book({
      title: book.title,
      published: book.published,
      author: authorOfBook._id,
      genres: book.genres
    })
    await newBook.save()
  }
}

initDb()

const typeDefs = `
  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    authorCount: Int!
    bookCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    authorCount: async () => Author.collection.countDocuments(),
    bookCount: async () => Book.collection.countDocuments(),
    allBooks: async (root, args) => {
      let books = await Book.find({}).populate('author')
      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        if (author) {
          books = books.filter(book => book.author.equals(author._id))
        }
      }
      if (args.genre) {
        books = books.filter(book => book.genres.includes(args.genre))
      }
      return books
    },
    allAuthors: async () => {
      const authors = await Author.find({})
      const books = await Book.find({})
      return authors.map(author => ({
        ...author.toObject(),
        bookCount: books.filter(book => book.author.equals(author._id)).length
      }))
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
          code: 'UNAUTHENTICATED'
          }
        })
        }
      let author = await Author.findOne({ name: args.author })
      if (!author) {
        author = new Author({ name: args.author })
        try {
          await author.save()
        } catch (error) {
        throw new GraphQLError(
          `Invalid author name: ${args.author}: ${error.message}`, {
            extensions: {
              invalidArgs: args,
              code: 'BAD_USER_INPUT'
            }
          })
        }
      }
      try {
        const book = new Book({ ...args, author: author._id })
        await book.save()
        return book.populate('author')
      } catch (error) {
        throw new GraphQLError(
          `Invalid book data: ${error.message}`, {
            extensions: {
              invalidArgs: args,
              code: 'BAD_USER_INPUT'
            }
          })
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
      throw new GraphQLError('not authenticated', {
        extensions: {
        code: 'UNAUTHENTICATED'
        }
      })
      }
      const author = await Author.findOne({ name: args.name })
      if (!author) return null
      author.born = args.setBornTo
      return author.save()
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
  
      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.username,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
  
      if ( !user || args.password !== 'secret' ) {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })        
      }
  
      const userForToken = {
        username: user.username,
        id: user._id,
      }
  
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})