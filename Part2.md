# Part 2: Migrating State to React

## Setting Initial State

We'll skip over the initial handshake with your ship which can be found in React Cookbook Chapter 1. Instead we'll start by looking at how to add the library app's initial state to our React UI. The main idea here is that we pull our state out of `graph-store` and store it in React.

Let's start by looking at the state objects we're creating for future use on line 6:

```
  const [sub, setSub] = useState();
  const [libraryObject, setLibraryObject] = useState({libraries: {}});
  const [selectedLib, setSelectedLib] = useState();
  const [selectedBook, setSelectedBook] = useState();
```

Without going into too much detail we can say that `sub` is used to keep track of our subscription to our ship. `libraryObject` is the main object we'll use to keep track of all our libraries, their books, and comments etc. We will leverage React such that all we need to do is change this object to add or remove data and in doing so our UI will re-render with the latest state.

`selectedLib` and `selectedBook` are state variables which we will use later to determine which `library` and `book` are displayed in our app.

Our React app has two main functions as it relates to reading state from our ship(we'll get to writing later):

1) Add the libraries, books, and comments that already exist on our ship to our state

2) Monitor changes to our ship's `graph-store` so that we can add the changes we make to our `graph-store` via our React interface

### Adding Existing Libraries to React State

We start the process of 1) on Line 24 with the following `useEffect()` call:

```
  useEffect(() => {
    urb.scry({
      app: 'graph-store',
      path: '/keys'
    })
    .then(keys => {
      keys['graph-update'].keys.forEach(key => {
        if(!key.name.includes(" ")){
          scryKey(key.name);
        }
      })
    });
  }, []);
```

We're creating a `scry` to `graph-store` on the `/keys` `path`. That fetches all of the keys out of our `graph-store`. We pass the keys into the `.then()` call and use `.forEach()` to pass each key into our custom `scry` function detailed below. You can ignore the condition to pass over `keys` that contain a space as future versions of `library` will not allow keys to include spaces.

Now we're going to start dealing with JSON versions of our ships `graph` structure. On line 39 you'll see a custom `scry` function called `scryKey`, we'll use this to check whether each `key` is indeed a library:

```
  // Checks keys from useEffect scry to see if they are libraries and adds reduced graph to state object if yes
  const scryKey = (key) => {
    urb.scry({
      app: 'graph-store',
      path: `/graph/~zod/${key}`
    })
```

This first section passes the `key` as a variable into the `path` we want to check against within `graph-store` (which we access via the `app:` key). Then:

```
    .then(graph => {
      
      // Checks graph for library validator mark
      if(graph['graph-update']['add-graph'].mark === "graph-validator-library") {

        // Add to library state object
        setLibraryObject((prevLibraryObject) => ({
          ...prevLibraryObject,
          libraries: {
            ...prevLibraryObject.libraries,
            [graph['graph-update']['add-graph'].resource.name]: {
              name: graph['graph-update']['add-graph'].resource.name,
              ship: graph['graph-update']['add-graph'].resource.ship,
            }
          }
        }));
```

In this second section we pass each `graph` that comes back into a `.then` function. It's worth noting that the format of each `scry` above is indeed a graph, and you can go ahead and `console.log` the result to explore it in its entirety.

`Graphs` are identified by their `mark` and you can reference the `library` documentation to see where `~sipfyn` adds this mark to each library. For us we're just concerned with the fact that the `mark` is found in `add-graph` within `graph-update` on our `graph` object and whether or not that mark is `graph-validator-library`. For more on `graph` structures see `~sipfyn`'s documentation [http://github.com](here).

If it passes this test then we know it's a library and we're going to add it to our React state. Now we can look at a concrete example of re-creating our ship's `graph`s in React. Line 50 calls the `setLibraryObject()` function. We're using the React technique of passing in the previous state (`prevLibraryObject` in this case) and then using the spread operator (`...`) to maintain the integrity of our previous app state while adding new data to our object.

So in this case we'll be modifying the `libraries` sub-object. We'll create a new key with the name of our library which we get by looking up `graph['graph-update']['add-graph'].resource.name`. The value of this key is then another object with two keys, `name` and `ship`, i.e. library name and author. I've taken the liberty to give the `name`/`ship` pair, known in Hoon as a `resource`, a key name (which will be the library name). This doesn't match the original structure of the `graph` on our ship, but it will make it easier to fetch this data later, and makes the `libraryObject` itself easier to read.

```
        // Then check to see if library has books
        if(Object.keys(graph['graph-update']['add-graph'].graph).length > 0) {
          addBooksToState(graph);
        }
      }
    })
  }
```

Finally, based on what we know about the `library` graph structure we can check to see if the library we just referenced contains any books by checking if the number of `graphs` within `add-graph` is greater than 1. In other words, we know this is where books are stored if there are any. If this condition is met then we can pass that `graph` object to a custom function we made to `addBooksToState`

### Adding Books to State

This function expands on the concepts we used to add our libraries to React state. Specifically checking to see if a graph has a `graph-validator-library` mark, and if it has books. This time we're going to take that `graph`, and now that we know it has books, we'll pull the title, ISBN, and then check to see if it has any comments. If it does then we'll pull that information as well, and finally set all of that into our state object.

Starting on line 69 we see the `addBooksToState` function called in the snippet above:

```
  const addBooksToState = (graph) => {

    Object.keys(graph['graph-update']['add-graph'].graph).forEach(index => {

      // Destructure basic info from book entry
      const bookName = graph['graph-update']['add-graph'].graph[index].children[metaId].children[1].post.contents[0].text;
      const ISBN = graph['graph-update']['add-graph'].graph[index].children[metaId].children[1].post.contents[1].text;
      const destinationLibrary = graph['graph-update']['add-graph'].resource.name;
      let comments;
```

The first step is to cycle through each book's `graph` using `Object.keys` like we did for libraries above. You can then see how we look up the book name and ISBN. Go ahead and `console.log` the graph to help you hold this visualization in your mind. Essentially we go through each `index` to look at each `graph`s `children`. The only new concept here is the `metaId` variable. It's defined up on line 18. Graph `children` are identified by numbers and our library app gives books two types of `children`, either metadata about the book, or a comment on the book. So this number is derived by casting the words `meta` and `comments` to a `@ud`. We then use that `@ud` to call our metadata or comments for each book.

Book Name and ISBN are classified as metadata for each book. Since that's what we're looking to pull we know that we'll want to use the `@ud` for the word meta.

The last note here is that we'll want a local variable of the library name to which this book belongs to help us add it to our state object in a following step. That's what `destinationLibrary` is. Finally we make an empty variable `comments` here so it is in scope of the function we'll use to push to our state. We'll use it in the next step:


```
      // Check if book has comments and add them to comments object
      if(graph['graph-update']['add-graph'].graph[index].children['8319395793566789475'].children){
        Object.keys(graph['graph-update']['add-graph'].graph[index].children['8319395793566789475'].children).forEach(
          key => (
            comments = {
              ...comments,
              [key]:
                graph['graph-update']['add-graph'].graph[index].children['8319395793566789475'].children[key].post
            }
          )
        )
      } else {
        comments = {};
      }
```

In this snippet we're now going to lookup whether or not our book has comments. Again refer to a `console.log` of `graph` if you're having trouble visualizing the overall structure. Otherwise the only new concept here is that we're passing in the `children` id `8319395793566789475` (i.e. the `@ud` of `comments`) directly rather than storing it as a variable as we did for `metaId`. This is because the size of the number causes an error when passed in as a variable. If this is a JavaScript concept that I am not familiar with or using incorrectly, please submit a PR with a fix so that developers can store the cumbersome number as a variable.

If the book has comments, we'll add it to the comments object declared in the previous step, again using the spread operator (`...`) so that we don't overide our object with each new comment we find. Within that `comments` object we label the comment with our `key` and then give it a value of its corresponding `post`.

```
    // Commit reduced graph info to state
    setLibraryObject((prevLibraryObject) => ({
    ...prevLibraryObject,
    libraries: {
        ...prevLibraryObject.libraries,
        [destinationLibrary]: {
        ...prevLibraryObject.libraries[destinationLibrary],
        books: {
            ...prevLibraryObject.libraries[destinationLibrary].books,
            [index]: {
            title: bookName,
            isbn: ISBN,
            comments
              }
            }
          }
        }
      }))
```

Finally we're ready to push everything into our `libraryObject` in state. Again I'm making the choice to give `libraries` a list of keys that are each libraries names (`destinationLibrary` in this case). These keys are themselves objects that contain a list of keys that are books. These keys are also objects that are a list of numerical keys containing the book's name, ISBN, and comments object.

### Continue to [Part 3](http://part3.com)