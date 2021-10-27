# Part 3: Monitoring Changes

### Subscribing to `graph-store` updates

Up until now we've looked at how to read the existing state of our ship's library app. But the purpose of this tutorial is to build a functioning React UI ontop of it. So in order to do that we will also need to be able to listen for changes that occur on our ship in real-time.

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

  This is the same technique we used in React Cookbook Chapter 1 to monitor incoming messages to our ship. Here we setup a `subscription` to `graph-store` on path `/updates`. It leverages the `useEffect` to run before the rest of our code, and whenever it detects an event on `/updates` it sends the new information into our `updateHandler` function which we'll look at now on line 116:

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

So `updateHandler` itself uses the React hook `useCallback` and gets the new update we just detected as its argument. I left the `console.log` in here as it is helpful for monitoring the raw data that comes out of our ship. Everything in this callback should look familiar to you at this point. First we're checking the mark to see if the `update` is a library. If so we can go ahead and add it to our libraryObject and then `return` as we know a new library will be empty since the command to create a library doesn't accept books and comments at the same time.

### Examining `graph-update`

```
     // Check if new add-nodes is a book
      if(update['graph-update']['add-nodes'] && Object.keys(stateRef.current.libraries).includes(update['graph-update']['add-nodes'].resource.name)){

        const nodes = update['graph-update']['add-nodes'].nodes;
        const destinationLibrary = update['graph-update']['add-nodes'].resource.name;

        console.log("Update is adding nodes to existing library");
```

Next we'll want to see if the `update`'s `nodes` contain any existing library names. If they do then we can check if it is a new book added to said library, or if they are a new comment. Notice that to access our libraryObject in this scope we will need our `stateRef` hook which we setup on line 12. Again if there is a better way to handle this in JavaScript please submit a PR as this was the best solution I found.

We'll then want to store some local variables, specifically the `nodes` themselves and then the `destinationLibrary` to which they will be pushed.

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

We know two things about book `updates` that will distinguish them from comment `updates`:

1) They will contain a `node` with the `metaId` index (as opposed to comments which contain the `commentsId` index)
2) We also know that the contents of that `node`'s `post` will have a length of `2` i.e. the book name and ISBN while a comment's `node`s `post` will have a length of `1` i.e. just the comment text.

Once we've identified that we are dealing with a book we are ready to extract its information and push it into state. It's a little more complex as we need to deal with the `nodes` `indices` which can be cumbersome. In order to extract the book `index` from the `node` `path` we'll actually need to trim the string, hence using `node.substr(1, 39)` to create the key for the new book. Similar to above we know that the comments for this new book will be empty since the book itself has just been created.

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

Similar to adding a book, but this time our test is just to see if the number of `nodes` is less than the `4` we know a book `update` will have. If that's the case then we will push the comment into the comments object we made for its corresponding book. Notice that we're using the `node` substring to identify said book and adding our comment(`nodes[node].post`) to the key with that substring as its label.

So these first two conditionals check to see if new data has been added. But we have one last consideration for having detected a `graph` `update`. This same path is also used to notify us of data that has been <i>removed</i>. So we'll need two checks. The first one is very simple, check to see if an entire library has been removed:

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

In our conditional statement we'll need to grab our current state using `stateRef` again. First checking to see if `graph-update` contains `remove-graph`, and also if our current state `libraryObject` includes the name of the removed `graph` i.e. one of our existing libraries.

If so we'll make a copy of our existing state using `stateRef.current`, then we will delete the entire library object referenced as `['remove-graph'].name` from this new copy. At which point we're ready to add this modified state object as the new state. Notice we also `setSelectedLib` to `null`. This is because the option to delete a library is only visible when said library is being rendered to the DOM. Thus we know we need to set the displayed library to null since we just deleted the one that was being displayed. More on this in the next section.

The final check we'll need to run on the `remove-graph` object is to see if it represents a deleted comment. If so then we'll need to grab the `index` of said `post`. Quick side note, you'll notice that when you delete a message from a `Landscape` `channel` that your message doesn't disappear, but rather is replaced by a `messsage deleted` message. This is because the `post` `index` isn't deleted, but rather set to an empty value. We're going to keep with this method and empty the contents of the `post` `index` of a deleted comment, then later we'll have our UI render empty `indices` as `comment deleted`.

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
                      // Couldn't get setState to re-render without doing it the long hand way. Do I need lodash here?
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

Before digging in, yes, to get this app ready for prime time you'd want to write a reducer. But in this tutorial, we're just focused on parsing the `graph` structures.

First we'll check to see if the `remove-posts` entry contains an index with `8319395793566789475`. Remember this is just the word `comments` cast as a `@ud` so it can be used to identify the type of post. Then we'll splice the `index` of our delted post and store it as `comIndex` i.e. the `index` of the comment. Now we'll have to use `Object.keys` to iterate over libraries, then again to iterate over books, and finally we can cycle through each comment to see if our `comIndex` matches a comment's `index` for any of our books.

If we have a match then you can notice my comment that I am once again manually re-creating the updated state object using the spread operator in order to set the `comIndex` to an empty object. That was my solution for triggering a UI re-render. Please submit a PR for another suggestion.

And that does it migrating our `ship`'s state to React! In the next section we'll cover creating React functions to `poke` our `gall agent` with JSON commands. It will look very similar to the UI we created for `Landscape` in Chapter 1, and allow our web users to interact with our library app.

### Continue to [Part 4](http://part4.com)