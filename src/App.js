import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { unstable_batchedUpdates } from 'react-dom';
import './App.css';

export default function App(props) {
  // const [urb, setUrb] = useState();
  const [sub, setSub] = useState();
  const [libs, setLibs] = useState();

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

  useEffect(() => {
    const sub = urb.subscribe({
      app: 'graph-store',
      path: '/keys',
      event: data => {
        console.log(data);
        // console.log(GraphReducer(data));
      }
    })
  }, [])

  useEffect(() => {
    const sub = urb.subscribe({
      app: 'library-proxy',
      path: '/libraries',
      event: data => {
        console.log(data);
        const libArray = [];
        data.forEach(lib => libArray.push(lib));
        setLibs(libArray);
      }
    })
  }, [])

  console.log("State libs", libs);

  //   useEffect(() => {
  //   urb.scry({
  //     app: 'graph-store',
  //     path: '/graph/zod/lovely-6118',
  //     // mark: 'keys',
  //     // json: 'get-libaries'
  //     event: data => {
  //       console.log(data);
  //     }
  //   })
  // }, [])

  const GraphReducer = (json) => {
    const data = _.get(json, 'graph-update', false);
    return data;
  
    // unstable_batchedUpdates(() => {
    //   if (data) {
    //     reduceState<GraphState, any>(useGraphState, data, [
    //       keys,
    //       addGraph,
    //       removeGraph,
    //       addNodes,
    //       removePosts
    //     ]);
    //   }
    //   const loose = _.get(json, 'graph-update-loose', false);
    //   if(loose) {
    //     reduceState<GraphState, any>(useGraphState, loose, [addNodesLoose]);
    //   }
  
    //   const flat = _.get(json, 'graph-update-flat', false);
    //   if (flat) {
    //     reduceState<GraphState, any>(useGraphState, flat, [addNodesFlat]);
    //   }
  
    //   const thread = _.get(json, 'graph-update-thread', false);
    //   if (thread) {
    //     reduceState<GraphState, any>(useGraphState, thread, [addNodesThread]);
    //   }
    // });
  };

  // useEffect(() => {
  //   const sub = urb.subscribe({
  //     app: 'library-proxy',
  //     path: '/libraries',
  //     event: data => {
  //       console.log(data);
  //     }
  //   })
  // }, [])

  const addLibrary = () => {
    urb.poke({
      app: 'library-proxy', 
      mark: 'library-frontend', 
      json: {
        'create-library': {
          'library-name': 'Testing State Updates', 
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
        <button
          onClick={addLibrary}
        >
          Create Library
        </button>
      </header>
    </div>
  );
}

// export default App;
