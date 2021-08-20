import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
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

  const libObject = {libraries: {}};
  const libHandler = useCallback(
    (cbArray) => {

      cbArray.forEach(lib => (
        libObject.libraries[lib] = {
          // Book1: {
          //   Author: 'zod'
          // },
          // Policy: {
          //   Whitelist: [
          //     'zod', 'mus', 'nus'
          //   ]
          // }
        })
      );
      setLibraryObject(libObject)
    }, [libraryObject]
  )

  useEffect(() => {
    urb.subscribe({
      app: 'library-proxy',
      path: '/libraries',
      event: libHandler,
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

  const addBook = (library, title, top) => {
    
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
          [top]: {title, author: 'zod'}
        }
      }
    }));

    // urb.poke({
    //   app: 'library-proxy',
    //   mark: 'library-frontend',
    //   json: {
    //     'add-book': {
    //       'library': library,
    //       'book': [title, top]
    //     }
    //   }
    // })

    console.log(libraryObject);
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
                    const top = e.target.top.value;
                    addBook(selectedLib, title, top);
                  }}>
                  <input
                    type="title"
                    name="title"
                    placeholder="Title"/><br/>
                  <input
                    type="top"
                    name="top"
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
