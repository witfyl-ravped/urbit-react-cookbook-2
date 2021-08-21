import React, { useCallback, useEffect, useState } from 'react';
import './App.css';

export default function App(props) {
  // const [urb, setUrb] = useState();
  const [sub, setSub] = useState();
  const [selectedLib, setSelectedLib] = useState();
  const [libraryObject, setLibraryObject] = useState({Loading : "Waiting"});

  // Could not figure out how to make urb available by the time UI renders with useEffect. Someone school me please
  const urb = props.api;

  const libObject = {libraries: {}};

  useEffect(() => {
    urb.scry({
      app: 'graph-store',
      path: '/keys'
    })
    .then(keys => {
      console.log(keys)
      console.log(keys['graph-update'])
      keys['graph-update'].keys.forEach(key => {
        if(!key.name.includes(" ")){
          // console.log(key);
          scryKey(key.name);
        }
      })
    });
  }, []);

  const scryKey = (key) => {
    console.log("Scrying key", key);
    urb.scry({
      app: 'graph-store',
      path: `/graph/~zod/${key}`
    })
    .then(graph => {
      console.log(graph)
      if(graph['graph-update']['add-graph'].mark == "graph-validator-library") {
        console.log(`${graph['graph-update']['add-graph'].resource.name} is a library`);

        // libObject.libraries[graph['graph-update']['add-graph'].resource.name] = {
        //   name: graph['graph-update']['add-graph'].resource.name,
        //   ship: graph['graph-update']['add-graph'].resource.ship,
        //   // index: Object.keys(graph['graph-update']['add-graph'].graph)  not sure how to get library index yet, might not need it
        // }

        //Library found, add to library state object
        setLibraryObject((prevLibraryObject) => ({
          ...prevLibraryObject,
          libraries: {
            ...prevLibraryObject.libraries,
            [graph['graph-update']['add-graph'].resource.name]: {
              name: [graph['graph-update']['add-graph'].resource.name],
              ship: [graph['graph-update']['add-graph'].resource.ship]
            }
          }
        }));
      }
    })
  }
  
  // atoms of @tas for meta and comments identifiers
  const metaId = 1635018093;
  const commentsId = 8319395793566789475;
  
  let libraries = {};
  let newBook = {};

  // This section monitors updates that happen after page loads

  const updateHandler = useCallback(
    (update) => {
      console.log(update)

      console.log(Object.keys(libraries));

      // Check if new graph is a library
      if(update['graph-update']['add-graph'] && update['graph-update']['add-graph']['mark'] == "graph-validator-library"){
        const newLib = update['graph-update']['add-graph']['resource'];

        console.log("Name check:", newLib.name);  
        console.log("New Library", newLib);
  
        libraries = {
          ...libraries,
          [newLib.name]: newLib
        }

        console.log(`Added ${newLib.name} to libraries`, libraries)
      }

      // Check if new add-nodes is a book
      if(update['graph-update']['add-nodes'] && Object.keys(libraries).includes(update['graph-update']['add-nodes'].resource.name)){
        const nodes = update['graph-update']['add-nodes'].nodes;
        const newBookLib = update['graph-update']['add-nodes'].resource.name;

        console.log(nodes);

        Object.keys(nodes).forEach(
          node => {
            if(nodes[node].post.contents.length == 2){
              newBook = {
                ...newBook,
                [nodes[node].post.contents[0].text]: {
                  top: node.substr(1, 39),
                  isbn: nodes[node].post.contents[1].text,
                  comments: {}
                }
              }
            }
          }
        )

        console.log("New Book", newBook);
        libraries[newBookLib] = newBook;
        console.log(`Added Book ${newBook.name} to library ${libraries[newBookLib]}`, libraries);
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

  const addLibrary = (library) => {
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

  //Destructuring from state object to render below, might be a better way to do this
  const libs = libraryObject.libraries ? Object.keys(libraryObject.libraries) : ["Loading Libraries"];
  console.log("Libs:", libs);
  const books = libraryObject.libraries && selectedLib ? Object.keys(libraryObject.libraries[selectedLib]) : ["Loading Books"];

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <pre>Connected Ship: {urb.ship}</pre>
          {/* <button
            onClick={() => addDummyData()}>
            Add Dummy Data
          </button> */}
        </p>
        <table width="100%" border="1">
          <tr>
            <td>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const library = e.target.library.value;
                  addLibrary(library);
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
              {selectedLib ? selectedLib : "Select a Library"}
            </td>
          </tr>
          <tr>
            <td>
              {libraryObject.libraries ? Object.keys(libraryObject.libraries).map(lib =>(
                <li>
                <button
                  onClick={() => setSelectedLib(lib)}
                  key={lib}>
                    {lib}
                </button>
                </li>
              ))
              : "Loading..."}
            </td>
            <td>
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
                  <button>Add Book</button>
                </form><br/>
              {libraryObject.libraries && selectedLib && books !== ["Loading Books"]
              ? books.map(book => 
                <li>
                  <button>
                    {book} {libraryObject.libraries[selectedLib][book].title} {libraryObject.libraries[selectedLib][book].author}
                  </button>
                </li>)
              : null}
            </td>
          </tr>
        </table>
      </header>
    </div>
  );
}