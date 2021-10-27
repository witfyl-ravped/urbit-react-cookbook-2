# Part 4: Render UI & Send JSON Commands

The last thing we need to do is render some UI to accept input from our users. Setting this up on a custom `gall` `agent` requires quite a bit of JSON parsing which quickly becomes very complex. While the specifics are beyond our scope (you can read more [here](http://JSONGuide) just know that we have created a custom mark for the library app to accept JSON from the web aptly named `library-frontend`. 

We're not going to spend much time on rendering the UI to accept the input as that was covered in depth in Chapter 1 of the Cookbook and would be redundant here. But it is worth looking at the local functions themselves and some of the techniques used to integrate them into the UI.

## Local Functions

### Create and Remove Library

Line 282 is the function to create a new library:

```
  const createLibrary = (library) => {
    urb.poke({
      app: 'library-proxy', 
      mark: 'library-frontend', 
      json: {
        'create-library': {
          'library-name': library, 
          'policy': 'open'
        }
      }
    });
  };
  ```

You can see it takes the `library` input entered by the user and then structures a `poke` with our `library-frontend` `mark`. We simply add a `json` object here with the `create-library` command, itself an object that carries the library name as well as a policy parameter. We're just setting the policy to `open` for all libraries for now until we add networking to future versions of our app.

Line 295 is the `removeLibrary` function. Nothing new here, it just needs the library name passed to it and then it can run the `remove-library` command.

### Add Book

Line 307 is the `addBook` function which incorporates some UI functions worth tracing:

```
  const addBook = (title, isbn) => {
    urb.poke({
      app: 'library-proxy',
      mark: 'library-frontend',
      json: {
        'add-book': {
          'library-name': selectedLib,
          'book': {
            title,
            isbn
          }
        }
      }
    })
  }
  ```

Notice that it only takes two variables (`title` and `isbn`) but also sends a third variable `selectedLib` to the `add-book` JSON command. This is because the UI to input the name and ISBN of a new book is only visible when a user selects a library to explore. This is why we created the `selectedLib` state variable at the outset. Clicking on a library automatically sets this state variable to the  selected library name, and here we grab that name from the state and pass it to our `add-book` command.

While on the topic, let's look at rendering the list of libraries with corresponding selection buttons on line 401:

```
    {/* Create a list of existing libraries for user to explore */}
    {libraryObject.libraries ? Object.keys(libraryObject.libraries).map(lib =>(
      <li>
      <button
          onClick={() => changeSelectedLib(lib)}
          key={lib}>
          {lib}
      </button>
      </li>))
    : "Loading..."}
```

We're using a ternary operator to make sure the `libraryObject.libraries` state object has been created, and if so we `map` through each one of its keys(the `?` is essentially the `then` statement in our `if` structure). If the condition isn't met then we render "Loading..." (the `:` is the `else` statement). Ternary operates are a very basic technique for rendering conditional UI in React.

We create the variable `lib` to refer to the current key our `map` function is handling. Remember earlier that we used the library name as the key for each entry in the libraries object, so this makes each library name available to us with the `lib` variable.

Using `.map` to render a list from array entries with the `<li>` tag is also a very basic React technique. If it's your first time seeing it, also know that React requires a unique `key` for each item and thus we can use the same `lib` variable here which will be unique to each entry.

It's also how we pass our library name into the function we made to add the selected library to state. You can see we're passing into `changeSelectedLib` which is defined on line 353:

```
  const changeSelectedLib = (lib) => {
  // Adding this to clear comment section when switching between libraries. Might be a cleaner way to do it?
    setSelectedBook(null);
    setSelectedLib(lib);
  }
```

It simply passes the `lib` variable from the item in the list we just rendered into our `setSelectedLib` state function. You can also see my note about setting `selectedBook` to null to clear the book display when a user switches to a new library. All that to show how we pass the third and final variable into our `addBook` function.

### Add and Remove Comments

Finally we'll need two more functions to add and remove comments. `addComment` should look familiar to you. We just need to pass in the comment we collect from the user along with the `selectedLib` and `selectedBook` from our state. The book list is very similar to the library list but with one extra feature. It's on line 432:

```
{libraryObject.libraries[selectedLib].books
    ? Object.keys(libraryObject.libraries[selectedLib].books).map(index => (
    <li> 
        <button
        onClick={() => setSelectedBook(index)}>
        Title: {libraryObject.libraries[selectedLib].books[index].title}&nbsp;
        ISBN: {libraryObject.libraries[selectedLib].books[index].isbn}
        </button>
    </li>))
    : "No books yet"}
```

Notice that we're using the state variable `selectedLib` to select the correct key within the libraries object. We do this in our ternary statement to trigger the render, and also throughout the function to pull the book's title and ISBN. Instead of the `lib` variable in the previous example we are using the name `index` to refer to each key since we set up our book object earlier to store a book's information within an object using its `index` as its key.

With that, the `addComment` function on line 323 should look familiar to you:

```
  const addComment = (comment) => {
    urb.poke({
      app: 'library-proxy',
      mark: 'library-frontend',
      json: {
        'add-comment': {
          'library-name': selectedLib,
          'top': selectedBook,
          'comment': comment
        }
      }
    })
  }
```

We just need to pass in the comment collected from the user, and then grab the `selectedLib` and `selectedBook` from our state. And you can see on line 459 that we use another ternary statement to determine if we should render the form to collect a users's comment:

```
libraryObject.libraries && selectedLib && selectedBook
```

This reads that if the libraries object exists, and (`&&`) the user has set a `selectedLib` to state (by clicking on a library), and (`&&` again) also set a `selectedBook` to state (again by having clicked on a book) then render the following. If all three conditions are not met, then render `null`.

Finally `removeComment` requires a new technique as seen on line 337:

```
  const removeComment = (comment) => {
    urb.poke({
      app: 'library-proxy',
      mark: 'library-frontend',
      json: {
        'remove-comment': {
          'library-name': selectedLib,
          'index': [selectedBook.toString(), '8319395793566789475', comment.toString()]
        }
      }
    })
  }
```

Remember how `indices` are long series of numbers that we saw in the `graph` objects we logged out? Well in order for us to remove a comment, we will have to reverse engineer its `index`. The real mechanics of this we have taken care of on the hoon side, in parsing the JSON for incoming `remove-comment` commands. But we'll to provide our hoon function with the three strings required to make our `index`.

As we already mentioned, the number in an index comes from casting a string as a `@ud`. So the `index` of a given comment is the `@ud` version of `booknanme/comments/comment`, and our JSON object that carries this info packages it into a `remove-comment` command. First we grab the `selectedLib` from state. Then we make the index by creating an array that contains the parsed `selectedBook` using the JavaScript `.toString()` function, the `@ud` for the word `comments` which we already know and have been using, and then finally the user's comment which we get from our UI display the user clicks on line 489. Under the Hoon hood this array is turned into the index used to identify and then delete the comment.

It's worth looking at the logic used to render comments as well, line 479:

```
{selectedLib && selectedBook && Object.keys(libraryObject.libraries[selectedLib].books[selectedBook].comments).length > 0
? Object.keys(libraryObject.libraries[selectedLib].books[selectedBook].comments).map(
key => (
    <>
    <p>
        {libraryObject.libraries[selectedLib].books[selectedBook].comments[key].contents
        ? <>
            {libraryObject.libraries[selectedLib].books[selectedBook].comments[key].author}:
            {libraryObject.libraries[selectedLib].books[selectedBook].comments[key].contents[0].text}&nbsp;
            <button
            onClick={() => removeComment(key)}
            >
            Remove
        </button>
        </>                 
        : "Comment Deleted"
        }
    </p>
    </>
))
: selectedLib && selectedBook && Object.keys(libraryObject.libraries[selectedLib].books[selectedBook].comments).length === 0
? "No Comments Yet"
: null}
```

The first ternary operator determines if both a library and book are selected, and if so whether or not the selected book has any comments. If it does then we map over the array of comments and check if each comment has a non-null `author` and `text`. If it does then we will render to the DOM the author of the comment (for now it will always be `zod` but when we add networking this will vary) as well as the comment itself along with a button to remove the comment by passing its key to our `removeComment` function. If these values are null, then it will render the phrase "Comment Deleted". Remember that `graph-store` doesn't delete the entry of a removed comment, but rather renders its values null.

You'll notice a second `:` which is essentially an `else if` command in a ternary operation. Our `else if` here is to render the alternative text "No Comments Yet" since the lenghth of a books comments keys is actually 0. Then another else if to not render anything if none of these conditions are met i.e. the use hasn't selected anything yet.