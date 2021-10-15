# React Cookbook Pt. 2: Graph Store

This section expands what we learned in React Cookbook Pt. 1 to interact with `graph-store`. We'll use `~sipfyn-pidmex`'s example Library app as an example. Using this example will also require us to learn how to make calls to custom `Gall` agents.

As such, this walkthrough will have two parts. We'll start by creating a custom UI around the functions `~sipfyn-pidmex` built into the Library app. Then we'll focus on populating our React state from the resulting `graph updates`.

# Part 1:

## Installing the Library app

In order to communicate with the Library app I had to make some adjustments to accept incoming JSON from our interface. You can find the modified files [http://github.com](here). Install them on your ship and then take some time to run with `~sipfyn`'s instructions on how to use the app in dojo. That will give you an understanding of what his app currently does and more reserouces to read up on how graph store works under the hood.

### Connecting to UI

After installing the Library app on your ship you can download the UI from this [http://github.com](repo) and follow the instructions from [http://github.com](Pt. 1) to establish connection between your ship and the local React server running the UI.

Once it's up you can see that our example UI allows you to create libraries, add books, add and delete comments, as well as remove whole libraries. All the local commands that you ran from `dojo`, give them all a try.

### Quick Notes

A few notes before we start breaking down the JavaScript functions that send and receive data from your ship. The purpose of this lesson is to demonstrate building a React interface for a `gall` agent that relies on `graph-store` for its state management. 

`library-proxy.hoon` is structured to take incoming pokes to add libraries, books, and comments to its state. This state is stored as a series of `graphs` in `graph-store`. Therefore, our React UI will let us poke the agent to create and access our libraries. However, we will render this data to our DOM by `subscrib`ing to `graph-store`. The reason for this is `graph-store` is already set up to fetch the `graphs` it holds and encode them as JSON. If we were to `subscribe` to our agent instead, we would then be re-creating formating logic that already exists in `graph-store`.

It's important to remember this framework as the scope of our React tutorial. Build an `agent` that receives JSON `poke`s from clear web, parse them into commands that create `graphs` in `graph-store`, then subscribe to `graph-store` to fetch our information and store it as state objects in React.

Finally you'll notice we're not using any reducers in the JavaScript. It may be cumbersome to read through the long nested lookups, but we decided to leave them in to help you grok the structure of `graphs`. Even though they have been converted to JSON, this is still the same architecture you'll find in `graph-store` itself.

# Part 2:

## Setting Initial State

We'll skip over the initial handshake with your ship which can be found in React Cookbook Pt. 1. Instead we'll start by looking at how to add the library app's initial state to our React UI. The crux of what this tutorial accomplishes is leveraging `graph-store` to move the state of our custom apps into React.

Let's start by looking at the state objects we're creating for future use on line 6:

```
  const [sub, setSub] = useState();
  const [libraryObject, setLibraryObject] = useState({libraries: {}});
  const [selectedLib, setSelectedLib] = useState();
  const [selectedBook, setSelectedBook] = useState();
```

Without going into too much detail we can say that `sub` is used to keep track of our subscription to our ship. `libraryObject` is the main object we'll use to keep track of all our libraries, their books, and comments etc. We will leverage React such that all we need to do is change this object to add or remove data and in doing so our UI will re-render with the latest state.

`selectedLib` and `selectedBook` are state variables which we will use later to determine which `library` and `book` are displayed in our app.

Our React app has two main functions as it relates to reading state from our ship.

1) Add the libraries, books, and comments that already exist on our ship to our state

2) Monitor changes to our ship's `graph-store` so that we can add the changes we make to our `graph-store` via our React interface

### Adding Libraries to State

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

We're creating a `scry` to `graph-store` on the `/keys` `path` here. That fetches all of the keys out of your `graph-store`. We pass the keys into the `.then()` call and use `.forEach()` to pass each key into our custom `scry` function detailed below. You can ignore the condition to pass over `keys` that contain a space as future versions of `library` will not allow keys to include spaces.

Now we're going to start dealing with JSON versions of our ships `graph` structure. On line 39 you'll see a custom `scry` function we'll use to check whether each `key` is indeed a library:

```
  // Checks keys from useEffect scry to see if they are libraries and adds reduced graph to state object if yes
  const scryKey = (key) => {
    urb.scry({
      app: 'graph-store',
      path: `/graph/~zod/${key}`
    })
```

This first section passes the `key` as a variable into the `path` we want to check against our app, `graph-store` in this case.

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

`Graphs` are identified by their `mark` and you can reference the `library` documentation to see where `~sipfyn` adds this mark to each library. For us we're just concerned with the fact that the `mark` is found in `add-graph` within `graph-update` on our `graph` object and whether or not it is a `graph-validator-library`. For more on `graph` structures see `~sipfyn`'s documentation [http://github.com](here).

If it passes this test then we're going to add the library to our React state. Now we can look at a concrete example of re-creating our ship's `graph`s in React. Line 50 calls the `setLibraryObject()` function. We're using the React technique of passing in the previous state (`prevLibraryObject` in this case) and then using the spread (`...`) operator to maintain the integrity of our previous app state will adding new data to our object.

So in this case we'll be modifying the `libraries` sub-object. We'll create a new key with the name of our library which we get back looking up `graph['graph-update']['add-graph'].resource.name`. The value of this key is then another object with two keys, `name` and `ship`, i.e. library name and author. I've taken the liberty to give the `name`/`ship` pair, known in Hoon as a `resource`, key name. This doesn't match the original structure of the graph on our ship, but it will make it easier to fetch this data later, and makes the `libraryObject` itself easier to read.

```
        // Then check to see if library has books
        if(Object.keys(graph['graph-update']['add-graph'].graph).length > 0) {
          addBooksToState(graph);
        }
      }
    })
  }
```

Finally, based on what we know about the `library` graph structure we can check to see if the library we just referenced contains any books but checking if the number of `graphs` within `add-graph` is greater than 1. In other words, we know this is where books are stored if there are any. If this condition is met then we can pass that `graph` object to a custom function we made to `addBooksToState()`

### Adding Books to State

This function expands on the concept we used to add our libraries to React state. In the first instance we checked to see if a graph had a `graph-validator-library` mark, and if it had books. This time we're going to take that `graph`, and now that we know it has books, we'll pull the title, ISBN, and then check to see if it has any comments. If it does then we'll pull that information as well, and finally set all of that into our state object.

Starting on line 69:

```
  const addBooksToState = (graph) => {

    Object.keys(graph['graph-update']['add-graph'].graph).forEach(index => {

      // Destructure basic info from book entry
      const bookName = graph['graph-update']['add-graph'].graph[index].children[metaId].children[1].post.contents[0].text;
      const ISBN = graph['graph-update']['add-graph'].graph[index].children[metaId].children[1].post.contents[1].text;
      const destinationLibrary = graph['graph-update']['add-graph'].resource.name;
      let comments;
```

The first step is to cycle through each book's `graph` using `Object.keys` like we did for libraries above. You can then see how we look up the book name and ISBN. Go ahead and `console.log` the graph to help you hold this visualization in your mind. Essentially we go through each `index` to look at each `graph`s children. The only new concept here is the `metaId` variable. It's defined up on line 18. Graph `children` are identified by numbers and our library app gives books two types of `children`, either metadata about the book, or a comment on the book. So this number is derived by casting `meta` and `comments` to `@ud`. We then use that `@ud` to call our metadata or comments for each book.

So in the snippet above we know that book name and ISBN will be the two contents of the post that lives within the children of marked by the metadata `@ud`.

The last note here is that we'll want a local variable of the library name to which this book belongs to help us add it to our state object in a following step. That's what `destinationLibrary` is. Finally we make an empty variable `comments` here so it is in scope of the function we'll use to push to our state. We'll use it in the next step.


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

In this snippet above we're now going to lookup whether or not our book has comments. Again refer to a `console.log` of `graph` if you're having trouble visualizing the overall structure. Otherwise the only new concept here is that we're passing in the `children` id `8319395793566789475` (i.e. the `@ud` of `comments`) directly rather than storing it as a variable as we did for `metaId`. This is because the size of the number causes an error when passed in as a variable. If this is a JavaScript concept that I am not familiar with or using incorrectly, please submit a PR with a fix so that developers can store the cumbersome number as a variable.

Otherwise, if the book has comments, we'll add it to the comments object declared in the previous step, again using the spread operator (`...`) so that we don't overide our object with each new comment we find. Within that `comments` object we label the comment with our `key` and then give it a value of its corresponding `post`.

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
    })
  }
```

Finally we're ready to push everything into our `libraryObject` in state. Again I'm making design choice here so that `libraries` contains a list of keys that are each libraries names. These keys are themselves objects that contain a list of keys that are books. Again, these keys are also objects that a list of numerical keys that contain the book's name, ISBN, and comments object.

### Monitoring Changes

Up until now we've looked at how to read the existing state of our ship's library app. But the purpose of this tutorial is to build a functioning React UI ontop of it. So in order to do that we will also need to be able to listen for changes that occur on our ship in real time.

To do that we're going to jump all the way down to line 254:

```
  useEffect(() => {
    urb.subscribe({
      app: 'graph-store',
      path: '/updates',
      event: updateHandler,
      err: console.log,
      quit: console.log,
    })
    .then((subscriptionId) => {
      setSub(subscriptionId);
    });
  }, []);
  ```

  This is the same technique we used in React Cookbook Pt 1 to monitor incoming messages to our ship. Here we setup a `subscription` to `graph-store` on path `/updates`. It leverages the `useEffect()` to run before the rest of our code, and whenever it detects an event on `/updates` it sends the new information into our `updateHandler` function which we'll look at now on line 116:

```
  // This section monitors updates that happen after page loads
  const updateHandler = useCallback(
    (update) => {
    console.log("New graph", update);

      // Check if new graph is a library
      if(update['graph-update']['add-graph'] && update['graph-update']['add-graph']['mark'] === "graph-validator-library"){
        const newLib = update['graph-update']['add-graph']['resource'];
        
        setLibraryObject((prevLibraryObject) => ({
          ...prevLibraryObject,
          libraries: {
            ...prevLibraryObject.libraries,
            [newLib.name]: {}
          }
        }))

        return
      }
```

So `updateHandler` itself uses the React hook `useCallback()` and gets the new update we just observed as its argument. I left the `console.log` in here as it is helpful for monitoring the raw data that comes out of our ship. Everything in this callback should look familiar to you at this point. First we're checking the mark to see if the update is a library. If so we can go ahead and add it to our libraryObject and then `return` as we know a new library will be empty since the command to create a library doesn't accept books and comments at the same time.

```
     // Check if new add-nodes is a book
      if(update['graph-update']['add-nodes'] && Object.keys(stateRef.current.libraries).includes(update['graph-update']['add-nodes'].resource.name)){

        const nodes = update['graph-update']['add-nodes'].nodes;
        const destinationLibrary = update['graph-update']['add-nodes'].resource.name;

        console.log("Update is adding nodes to existing library");
```

Next we'll want to see if the `update`'s `nodes` contains any existing library names. If they do then we can check if it is a new book added to said library, or if they are a new comment. Notice that to access our libraryObject in this scope we will need our `stateRef()` hook which we setup on line 12. Again if there is a better way to handle this in JavaScript please submit a PR as this was the best solution I found.

We'll then want to store some local variables, the `nodes` themselves and then the `destinationLibrary` to which they will be pushed.

Next we'll need some deductive reasoning to determine whether or not the nodes represent a new book or a new comment. First we check if it's a book:

```
        Object.keys(nodes).forEach(
          node => {
            if(node.includes(metaId) && nodes[node].post.contents.length === 2){
              console.log("New nodes are a book")

              setLibraryObject((prevLibraryObject) => ({
                ...prevLibraryObject,
                libraries: {
                  ...prevLibraryObject.libraries,
                  [destinationLibrary]: {
                    ...prevLibraryObject.libraries[destinationLibrary],
                    books: {
                      ...prevLibraryObject.libraries[destinationLibrary].books,
                      [node.substr(1, 39)]: {
                        title: nodes[node].post.contents[0].text,
                        isbn: nodes[node].post.contents[1].text,
                        comments: {}
                      }
                    }
                  }
                }
              }))
            }
          }
        )
```

We know two things about book `updates`, they will contain a `node` with the `metaId` since books are marked with this as opposed to comments which contain the `commentsId`, and we also know that the contents of that `post` will have a length of `2` i.e. the book name and ISBN while a comment will have a length of `1`, just the comment text.

Once we've identified that we are dealing with a book we are ready to extract the information and push it into state. It's a little more complex as we need to deal with the `nodes` `indices` which can be cumbersome. We're careful to match the format of the `libraryObject` that we established in the first section. In order to extract the book `index` from the `node` `path` we'll actually need to trim the string, hence using `node.substr(1, 39)` to create the key for the new book. Similar to above we know that the comments for this new book will be empty since it has just been created.

Next let's look at the logic for determining that our `add-nodes` is a comment and handling it accordingly:

```
        // Comments only have one node so we use that to check if the nodes are for a comment
        if(Object.keys(nodes).length < 4){
          const node = Object.keys(nodes)[0];
          // console.log("New comments", nodes);
          
          setLibraryObject((prevLibraryObject) => ({
            ...prevLibraryObject,
            libraries: {
              ...prevLibraryObject.libraries,
              [destinationLibrary]: {
                ...prevLibraryObject.libraries[destinationLibrary],
                books: {
                  ...prevLibraryObject.libraries[destinationLibrary].books,
                  [node.substr(1, 39)]: {
                    ...prevLibraryObject.libraries[destinationLibrary].books[node.substr(1, 39)],
                    comments: {
                      ...prevLibraryObject.libraries[destinationLibrary].books[node.substr(1, 39)].comments,
                      [node.substr(61)]: 
                        nodes[node].post
                    }
                  }
                }
              }
            }
          }))
        }

        return
      }
```

This is very similar to adding a book, this time our test is just to see if the number of nodes is less than the `4` we know a book `update` will have. If that's the case then we will push the comment into the comments object we made for its corresponding book. Notice that we're using the `node` substring to identify said book and adding our comment to the key with that substring as its label.

We have one last consideration for having detected a `graph` `update`. This path is also used to notify us of data that has been removed. So we'll need two checks. The first one is very simple, check to see if an entire library has been removed:

```
      // Check to see if the update is notifiy of removed-posts
      // First compare to library names (graphs), if it matches a library name then delete it from our state
      if(update['graph-update']['remove-graph'] && Object.keys(stateRef.current.libraries).includes(update['graph-update']['remove-graph'].name)){

        const newState = stateRef.current;
        delete newState.libraries[(update['graph-update']['remove-graph'].name)];

        setSelectedLib(null);
        setLibraryObject(newState);

      }
```

In our conditional statement we'll need to grab our current state using `stateRef` again. First checking to see if `graph-update` contains `remove-graph`, and then to see if our current state `libraryObject` includes the name of the removed `graph` i.e. one of our existing libraries.

If so we'll make a copy of our existing state using `stateRef.current`, then we will delete the entire library object referenced as `['remove-graph'].name` from this new copy. At which point we're ready to add this modified state object as the new state. Notice we also `setSelectedLib` to `null`. This is because the option to delete a library is only visible when said library is being rendered to the DOM. Thus we know we need to set the displayed library to null since we just deleted the one that was being displayed. More on this in the next section.

The final check we'll need to run on `remove-graph` object is to see if we deleted a comment. If so then we'll need to grab the `index` of said `post`. Quick side note, you'll notice that when you delete a message from a `Landscape` `channel` that your message doesn't disappear, but rather is replaced by a `messsage deleted` message. This is because the `post` `index` isn't deleted, but rather set to an empty value. We're going to keep with this method and empty the contents of the `post` `index`, then later we'll have our UI render empty `indices` as `comment deleted`.

So in order to do that we'll do the following:

```
      // Then check to see if it is a deleted comment (post)
      if(update['graph-update']['remove-posts'] && update['graph-update']['remove-posts'].indices[0].includes("8319395793566789475")){
        console.log("Comment removed");
        const comIndex = update['graph-update']['remove-posts'].indices[0].substr(61);

        // Iterate over keys of each state object until we can check the comment index against the currently selected book
        Object.keys(stateRef.current.libraries).forEach(
          library => (
            Object.keys(stateRef.current.libraries[library].books).forEach(
              book => {
                Object.keys(stateRef.current.libraries[library].books[book].comments).forEach(
                  comment => {
                    if(comment == comIndex){
                      // Couldn't get setState to re-render without doing it this long hand way. Do I need lodash here?
                      setLibraryObject(prevLibraryObject => ({
                        ...prevLibraryObject,
                        libraries: {
                          ...prevLibraryObject.libraries,
                          [library]: {
                            ...prevLibraryObject.libraries[library],
                            books: {
                              ...prevLibraryObject.libraries[library].books,
                              [book]: {
                                ...prevLibraryObject.libraries[library].books[book],
                                comments: {
                                  ...prevLibraryObject.libraries[library].books[book].comments,
                                  [comIndex]: {}
                                }
                              }
                            }
                          }
                        }
                      }));
                    }
                  }
                )
              }
            )
          )
        )
      }
    },[]);
```

Before digging in, yes, to get this app ready for prime time you'd want to write a reducer. But if you're still getting used to the structure of `graphs` then this will be helpful to see the object we're creating in it's entirety.

First we'll check to see if the `remove-posts` entry contains an index with `8319395793566789475`. Remember this is just the workd `comments` cast as a `@ud` so it can be used to identify the type of post. Then we'll splice the `index` of our delted post and store it as `comIndex`. Now we'll have to use `Object.keys` to iterate over libraries, then again to iterate over books, and finally we can cycle through each comment to see if our `comIndex` matches a comment `index` for any of our books.

If we have a match then you can notice my comment that I am once again manually re-creating the updated state object using the spread operator in order to set the `comIndex` to an empty object. That was my solution for triggering a UI re-render. Please submit a PR for another suggestion.

Ok, that does it migrating our `ship`'s state to React! In the next section we'll cover creating React functions to `poke` our `gall agent`. It will look very similar to the UI we created for `Landscape` in Pt. 1.