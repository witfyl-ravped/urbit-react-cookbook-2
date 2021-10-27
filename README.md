# React Cookbook Chapter 2: Custom Gall Agent + Graph Store

This section expands what we learned in React Cookbook Chapter 1 to interact with a custom `gall` agent that leverages `graph-store` to maintain its state. We'll use `~sipfyn-pidmex`'s [example Library app](https://github.com/ynx0/library) as an example. Using this example will also require us to learn how to make calls to custom `Gall` agents.

As such, this walkthrough will have two parts. We'll start by creating a custom UI around the functions `~sipfyn-pidmex` built into the Library app. Then we'll focus on populating our React state from the resulting `graph updates`. The second part will also revisit some concepts from React Cookbook Chapter 1 as we will need to create some pokes to interact with our `agent`.

Keep this structure in mind as you proceed:

```
- Ship runs the Library agent

- Library agent stores and fetches its state in `graph-store`

- React `scries` and `subscribes` to `graph-store` to get existing state and listen for updates

- React renders Library state to the DOM along with UI to `poke` the Library `agent` with new data that gets stored in `graph-store` as state.
```

If that doesn't make sense yet, just remember that React has two jobs:

```
1) Pull state from `graph-store`

2) Poke our custom Library `gall` agent to modify state
```

# Part 1: Getting Started

## Installing the Library app

In order to communicate with the Library app I had to make some adjustments to accept incoming JSON from our interface. You can find the modified files [http://github.com]. Install them on your ship and then take some time to run with `~sipfyn`'s instructions on how to use the app in dojo. That will give you an understanding of what his app currently does and more reserouces to read up on how graph store works under the hood.

It is also important <b>to add multiple libraries and books and to comment on some or all of those books</b> to your ship before beginning. The lesson jumps right in to migrating library state to React, so be sure to add some before proceeding. You'll find the instructions to do so in `~sipfyn`'s documentation. 

### Connecting to UI

After installing the Library app on your ship you can download the UI from this [http://github.com](repo) and follow the instructions from [http://github.com](Chapter 1) to establish connection between your ship and the local React server running the UI.

Once it's up you can see that our example UI allows you to create libraries, add books, add and delete comments, as well as remove whole libraries. All the local commands that you ran from `dojo`, give them all a try.

### Quick Notes

A few notes before we start breaking down the JavaScript functions that send and receive data from your ship. The purpose of this lesson is to demonstrate building a React interface for a `gall` agent that relies on `graph-store` for its state management. 

`library-proxy.hoon` is structured to take incoming pokes to add libraries, books, and comments to its state. This state is stored as a series of `graphs` in `graph-store`. Therefore, our React UI will let us poke the agent to create and access our libraries. However, we will render this data to our DOM by `subscrib`ing to `graph-store`. The reason for this is `graph-store` is already set up to fetch the `graphs` it holds and encode them as JSON. If we were to `subscribe` to our agent instead, we would then be re-creating formating logic that already exists in `graph-store`.

It's important to remember this framework as the scope of our React tutorial. Build an `agent` that receives JSON `poke`s from clear web, parse them into commands that create `graphs` in `graph-store`, then subscribe to `graph-store` to fetch our information and store it as state objects in React.

Finally you'll notice we're not using any reducers in the JavaScript. It may be cumbersome to read through the long nested lookups, but we decided to leave them in to help you grok the structure of `graphs`. Even though they have been converted to JSON, this is still the same architecture you'll find in `graph-store` itself.

### Continue to [Part 2](http://part2.com)