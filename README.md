# React Cookbook Pt. 2: Graph Store

This section expands what we learned in React Cookbook Pt. 1 to interact with `graph-store`. We'll use `~sipfyn-pidmex`'s example Library app as an example. Using this example will also require us to learn how to make calls to custom `Gall` agents.

As such, this walkthrough will have two parts. We'll start by creating a custom UI around the functions `~sipfyn-pidmex` built into the Library app. Then we'll focus on populating our React state from the resulting `graph updates`.

# Part 1:

## Installing the Library app

In order to communicate with the Library app I had to make some adjustments to accept incoming JSON from our interface. You can find the modified files [http://github.com](here)

### Connecting to UI

After installing the Library app on your ship you can download the UI from [http://github.com](this repo) and follow the instructions from [http://github.com](Pt. 1) to establish connection between your ship and the local React server running the UI

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.