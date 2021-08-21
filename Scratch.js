  // Ideal way to access Urbit api
  useEffect(() => {
    async function getApi() {
      // const api = await createApi();
      setUrb(props.api);
    }
    getApi();
  }, []);
  
  //
  
  // Function to add book locally for testing
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

  Add dummy data for testing
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


  //

  const libHandler = useCallback(
    (cbArray) => {
      cbArray.forEach(lib => {
        if(!lib.includes(" ")) {
          urb.scry({
            app: 'graph-store',
            path: `/graph/~zod/${lib}`
          })
          .then(libGraph =>(
            libObject.libraries[libGraph.['graph-update']['add-graph'].resource.name] = libGraph['graph-update']['add-graph'].resource
          ));
        }
      }
      );
      // setLibraryObject(libObject)
      console.log("libObject", libObject);
    }, []
  )

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