const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')

const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

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
      const user = context.currentUser
      return { username: user.username, favoriteGenre: user.favoriteGenre }
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
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
        pubsub.publish('BOOK_ADDED', { bookAdded: book })
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
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  }
}

module.exports = resolvers