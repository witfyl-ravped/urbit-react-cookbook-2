import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import { unstable_batchedUpdates } from 'react-dom';
import './App.css';

export default function App(props) {
  // const [urb, setUrb] = useState();
  const [sub, setSub] = useState();
  const [selectedLib, setSelectedLib] = useState();
  const [libraryObject, setLibraryObject] = useState({Loading : "Waiting"});

  // useEffect(() => {
  //   async function getApi() {
  //     // const api = await createApi();
  //     setUrb(props.api);
  //   }
  //   getApi();
  // }, []);

  // Could not figure out how to make urb available by the time UI renders with useEffect. Someone school me please
  const urb = props.api;

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

    if(!selectedLib){
      window.alert("Please select library");
      return
    }

    libraryObject.libraries[library] = {
      ...libraryObject.libraries[library],
      [top]: {"title": title}
    }

    console.log(libraryObject);

  }

  // const selectLib = (lib) => {
  //   console.log(lib);
  //   setSelectedLib(lib);
  // }

  // console.log(libraryObject);
  const libs = libraryObject.libraries ? Object.keys(libraryObject.libraries) : ["Loading"];
  console.log(libs);


  return (
    <div className="App">
      <header className="App-header">
        <p>
          Welcome to Library-UI
        </p>
          <pre>Welcome {urb.ship}!</pre>
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
              Books
            </td>
          </tr>
          <tr>
            <td>
              {/* {Object.keys(libs.libraries.map(lib =>(
                <li key={lib}>
                  {lib}
                </li>
              )))} */}
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
            {selectedLib ? selectedLib : null}
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
                </form>
            </td>
          </tr>
        </table>
      </header>
    </div>
  );
}

// export default App;
