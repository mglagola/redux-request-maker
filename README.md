# Redux Request Maker

This is a mini abstraction for making network requests with redux. The lib will manage the 4 high level state possibilities of networking requests, including `not-asked`, `loading`, `success`, and `failure` states.

The request *states* (this lib calls them `status` or `statuses`) idea comes from [this blog post](http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html).

## Installation

We need to install `redux-request-maker` and `lodash` as `lodash` is a `peerDependency` of `redux-request-maker`.

```bash
npm install --save redux-request-maker lodash
```

Configure store with `redux-request-maker` middleware.

```diff
// ./store/configure.js
import { createStore, applyMiddleware, compose } from 'redux';
+ import { middleware as reduxRequestMiddleware } from 'redux-request-maker';
import thunkMiddleware from 'redux-thunk';
import createRootReducer from './reducers';

const middleware = [
    thunkMiddleware,
+    reduxRequestMiddleware,
];

const createStoreWithMiddleware = compose(
    applyMiddleware(...middleware)
)(createStore);

function configureStore (initialState = {}) {
    const reducers = createRootReducer(persistCombineReducers);
    const store = createStoreWithMiddleware(reducers, initialState);
    return store;
};

export default configureStore;
```

## Example Usage

#### createReduxRequest Example

Use `createReduxRequest` non collective result request.

```js
import { createReduxRequest } from 'redux-request-maker';
import xhr from '../utils/xhr';

const {
    request,
    reducer,
} = createReduxRequest({
    actionTypePrefix: 'fetch-feed',
    callAPI: () => xhr.get('/api/v1/feed'),
});

export const fetchAllTickers = request;
export default reducer;
```

#### createReduxCollRequest Example

Use `createReduxCollRequest` for the collective result request.

```js
import { createReduxCollRequest } from 'redux-request-maker';
import xhr from '../utils/xhr';
import F from 'lodash/fp';

const {
    reducer,
    request,
} = createReduxCollRequest({
    actionTypePrefix: 'fetch-item-detail',
    primaryKeyPath: ['slug'],
    callAPI: async ({ slug }) => {
        return xhr.get(`/api/v1/item/${slug}`);
    },
});

export const fetchTicker = request;
export default reducer;
```




