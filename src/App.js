import React, { useCallback, useEffect, useState, useRef } from 'react';
import './App.css';

export default function App(props) {
  // const [urb, setUrb] = useState();
  const [sub, setSub] = useState();
  const [selectedLib, setSelectedLib] = useState();
  const [selectedBook, setSelectedBook] = useState();
  const [libraryObject, setLibraryObject] = useState({libraries: {}});
  const stateRef = useRef();

  stateRef.current = libraryObject;

  // Could not figure out how to make urb available by the time UI renders with useEffect. Someone school me please
  const urb = props.api;

  // atoms of @tas for meta and comments identifiers
  const metaId = 1635018093;
  const commentsId = 8319395793566789475;

  // *** This section populates React state from graph-store scries

  // Scry to get graph-store keys 
  useEffect(() => {
    urb.scry({
      app: 'graph-store',
      path: '/keys'
    })
    .then(keys => {
      // console.log(keys)
      // console.log(keys['graph-update'])
      keys['graph-update'].keys.forEach(key => {
        if(!key.name.includes(" ")){
          // console.log(key);
          scryKey(key.name);
        }
      })
    });
  }, []);

  // Checks keys from useEffect scry to see if they are libraries and adds reduced graph to state object if yes
  const scryKey = (key) => {
    // console.log("Scrying key", key);
    urb.scry({
      app: 'graph-store',
      path: `/graph/~zod/${key}`
    })
    .then(graph => {
      // console.log(graph)
      
      // Checks for library validator mark
      if(graph['graph-update']['add-graph'].mark === "graph-validator-library") {
        // console.log(`${graph['graph-update']['add-graph'].resource.name} is a library`);

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

        // Checks to see if library has books
        if(Object.keys(graph['graph-update']['add-graph'].graph).length > 0) {
          addBooksToState(graph);
        }
      }
    })
  }

  const addBooksToState = (graph) => {
    // console.log(graph);

    Object.keys(graph['graph-update']['add-graph'].graph).forEach(index => {
      // Destructure basic info from book entry
      const bookName = graph['graph-update']['add-graph'].graph[index].children[metaId].children[1].post.contents[0].text;
      const ISBN = graph['graph-update']['add-graph'].graph[index].children[metaId].children[1].post.contents[1].text;
      const destinationLibrary = graph['graph-update']['add-graph'].resource.name;
      let comments;

      // Check if book has comments and add them to comments object
      if(graph['graph-update']['add-graph'].graph[index].children['8319395793566789475'].children){
        Object.keys(graph['graph-update']['add-graph'].graph[index].children['8319395793566789475'].children).forEach(
          key => (
            comments = {
              ...comments,
              [key]: graph['graph-update']['add-graph'].graph[index].children['8319395793566789475'].children[key].post.contents[0].text
            }
          )
        )
      } else {
        comments = {};
      }

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

  // This section monitors updates that happen after page loads
  let newLibraries = {};
  let newBook = {};

  const updateHandler = useCallback(
    (update) => {
    console.log("New graph", update);

      // Check if new graph is a library
      if(update['graph-update']['add-graph'] && update['graph-update']['add-graph']['mark'] == "graph-validator-library"){
        const newLib = update['graph-update']['add-graph']['resource'];

        // console.log("New graph is a library", newLib);
  
      // If so then add to local library object to check against books below
        newLibraries = {
          ...newLibraries,
          [newLib.name]: newLib
        }

        setLibraryObject((prevLibraryObject) => ({
          ...prevLibraryObject,
          libraries: {
            ...prevLibraryObject.libraries,
            [newLib.name]: {}
          }
        }))

        return
      }

      // Check if new add-nodes is a book
      if(update['graph-update']['add-nodes'] && Object.keys(stateRef.current.libraries).includes(update['graph-update']['add-nodes'].resource.name)){

        const nodes = update['graph-update']['add-nodes'].nodes;
        const destinationLibrary = update['graph-update']['add-nodes'].resource.name;

        Object.keys(update['graph-update']['add-nodes'].nodes)

        console.log("Update is add-nodes, a book");

        Object.keys(nodes).forEach(
          node => {
            if(node.includes(metaId) && nodes[node].post.contents.length == 2){

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
      }
    },[]);

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

  // These functions called by the user to interact with Urbit ship

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

  // Adding this so clear comment section when switching between libraries. Might be a cleaner way to do it?
  const changeSelectedLib = (lib) => {
    setSelectedBook(null);
    setSelectedLib(lib);
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <pre>Connected Ship: {urb.ship}</pre>
        </p>
        <table width="100%" border="1">
          <tr>
            <td>
              {/* Form to create library */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const library = e.target.library.value;
                  createLibrary(library);
                }}>
              <input
                type="library"
                name="library"
                placeholder="Library Name"/>
              <button>
                Create Library
              </button><br/><br/>
              </form>
            </td>
            <td>
              {/* Display selected library over books component */}
              <pre>{selectedLib ? selectedLib : "Select a Library"}</pre>
            </td>
          </tr>
          <tr>
            <td>
              {/* Create a list of existing libraries for user to explore */}
              {libraryObject.libraries ? Object.keys(libraryObject.libraries).map(lib =>(
                <li>
                <button
                  onClick={() => changeSelectedLib(lib)}
                  key={lib}>
                    {lib}
                </button>
                </li>
              ))
              : "Loading..."}
            </td>
            <td>
              {/* Books component */}
              {libraryObject.libraries && selectedLib
                ? <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const title = e.target.title.value;
                        const isbn = e.target.isbn.value;
                        // addBook(selectedLib, title, isbn);
                        console.log("Add book with");
                      }}>
                      <input
                        type="title"
                        name="title"
                        placeholder="Title"/><br/>
                      <input
                        type="isbn"
                        name="isbn"
                        placeholder="ISBN"/><br/>
                      <button
                      onClick={() => window.alert("Add book function")}
                      >Add Book</button>
                    </form>
                    <br/>
                    {libraryObject.libraries[selectedLib].books
                      ? Object.keys(libraryObject.libraries[selectedLib].books).map(index => (
                        <li> 
                          <button
                            onClick={() => setSelectedBook(index)}>
                            Title: {libraryObject.libraries[selectedLib].books[index].title}&nbsp;
                            ISBN: {libraryObject.libraries[selectedLib].books[index].isbn}
                          </button>
                        </li>
                      ))
                      : "No books yet"}
                  </>
                : null}
              <br/>
            </td>
          </tr>
        </table>
        <table width="100%" border="1">
          <tr>
            <td>
              <pre>
                Comments
              </pre>
            </td>
          </tr>
          <tr>
            <td>
              {selectedLib && selectedBook && Object.keys(libraryObject.libraries[selectedLib].books[selectedBook].comments).length > 0
              ? Object.keys(libraryObject.libraries[selectedLib].books[selectedBook].comments).map(
                key => (
                  <p>{libraryObject.libraries[selectedLib].books[selectedBook].comments[key]}</p>
                )
              )
              : selectedLib && selectedBook && Object.keys(libraryObject.libraries[selectedLib].books[selectedBook].comments).length == 0
              ? "No Comments Yet"
              : null}
            </td>
          </tr>
        </table>
      </header>
    </div>
  );
}