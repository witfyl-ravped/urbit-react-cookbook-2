import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import { unstable_batchedUpdates } from 'react-dom';
import './App.css';

export default function App(props) {
  // const [urb, setUrb] = useState();
  const [sub, setSub] = useState();
  const [libs, setLibs] = useState([]);

  // useEffect(() => {
  //   async function getApi() {
  //     // const api = await createApi();
  //     setUrb(props.api);
  //   }
  //   getApi();
  // }, []);

  // Could not figure out how to make urb available by the time UI renders with useEffect. Someone school me please
  const urb = props.api;
  console.log(urb);

  // useEffect(() => {
  //   const sub = urb.subscribe({
  //     app: 'graph-store',
  //     path: '/keys',
  //     event: data => {
  //       console.log(data);
  //       // console.log(GraphReducer(data));
  //     }
  //   })
  // }, [])

  const libArray = [];
  const libHandler = useCallback(
    (cbArray) => {
      console.log("Message:", cbArray)
      cbArray.forEach(lib => libArray.push(lib))
      setLibs(libArray)
    }, [libs]
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
      console.log(sub);
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

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Welcome to Library-UI
        </p>
          <pre>Welcome {urb.ship}!</pre>
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
        {libs.map(lib =>(<li key={lib}>{lib}</li>))}
      </header>
    </div>
  );
}

// export default App;
