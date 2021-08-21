import React, { useCallback, useEffect, useState } from 'react';
import './App.css';

export default function App(props) {
  // const [urb, setUrb] = useState();
  const [sub, setSub] = useState();
  const [selectedLib, setSelectedLib] = useState();
  const [libraryObject, setLibraryObject] = useState({Loading : "Waiting"});
  const [fakeBooks, setFakeBooks] = useState();

  // useEffect(() => {
  //   async function getApi() {
  //     // const api = await createApi();
  //     setUrb(props.api);
  //   }
  //   getApi();
  // }, []);

  // Could not figure out how to make urb available by the time UI renders with useEffect. Someone school me please
  const urb = props.api;
  let addedData;

  // const libObject = {libraries: {}};
  // const libHandler = useCallback(
  //   (cbArray) => {

  //     cbArray.forEach(lib => (
  //       libObject.libraries[lib] = {
  //         // Book1: {
  //         //   Author: 'zod'
  //         // },
  //         // Policy: {
  //         //   Whitelist: [
  //         //     'zod', 'mus', 'nus'
  //         //   ]
  //         // }
  //       })
  //     );
  //     setLibraryObject(libObject)
  //   }, [libraryObject]
  // )

  // useEffect(() => {
  //   urb.subscribe({
  //     app: 'library-proxy',
  //     path: '/libraries',
  //     event: libHandler,
  //     err: console.log,
  //     quit: console.log,
  //   })
  //   .then((subscriptionId) => {
  //     setSub(subscriptionId);
  //   });
  // }, []);

  // atoms of @tas for meta and comments identifiers
  const metaId = 1635018093;
  const commentsId = 8319395793566789475;
  
  let libraries = {};
  let newBook = {};
  libraries["Fake Lib"] = "Aren't we all?"

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

  const addBook = (library, title, isbn) => {
    
    if(!selectedLib){
      window.alert("Please select library");
      return
    }

    addedData = true;

    setLibraryObject((prevLibraryObject) => ({
      ...prevLibraryObject,
      libraries: {
        ...prevLibraryObject.libraries, 
        [library]: {
          ...prevLibraryObject.libraries[library],
          [isbn]: {title, author: 'zod'}
        }
      }
    }));

    // urb.poke({
    //   app: 'library-proxy',
    //   mark: 'library-frontend',
    //   json: {
    //     'add-book': {
    //       'library': library,
    //       'book': [title, isbn]
    //     }
    //   }
    // })

    // console.log(libraryObject);
  }

  const addDummyData = () =>{
    console.log("adding fake data");
    Object.keys(libraryObject.libraries).forEach( lib => (
      libraryObject.libraries[lib] = {
        ...libraryObject.libraries[lib],
        111: {title: 'Fake Book 1', author: 'zod'},
        222: {title: 'Fake Book 2', author: 'zod'},
        333: {title: 'Fake Book 3', author: 'zod'}
      }
    ));
  }

  if(libraryObject.libraries){
    addDummyData();
  }

  // console.log(libraryObject);

  //Destructuring from state object to render below, might be a better way to do this
  const libs = libraryObject.libraries ? Object.keys(libraryObject.libraries) : ["Loading Libraries"];
  const books = libraryObject.libraries && selectedLib ? Object.keys(libraryObject.libraries[selectedLib]) : ["Loading Books"];

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <pre>Connected Ship: {urb.ship}</pre>
          <button
            onClick={() => addDummyData()}>
            Add Dummy Data
          </button>
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
              {libs.map(lib =>(
                <li>
                <button
                  onClick={() => setSelectedLib(lib)}
                  key={lib}>
                    {lib}
                </button>
                </li>
              ))}              
            </td>
            <td>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const title = e.target.title.value;
                    const isbn = e.target.isbn.value;
                    addBook(selectedLib, title, isbn);
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

// export default App;
