# Redux Request Maker

This is a mini abstraction for making request with redux. The lib will manage the 4 macro possibilities of `not-asked`, `loading`, `success`, and `failure` states.

## Example Usage

#### createReduxRequest Example

You would use `createReduxRequest` non collective result request.

```js
import { createReduxRequest } from 'redux-request-maker';
import xhr from '../utils/xhr';

const {
    request,
    reducer,
} = createReduxRequest({
    actionTypePrefix: 'feed',
    callAPI: () => xhr.get('/api/v1/currencies').then(res => res),
});

export const fetchAllTickers = request;
export default reducer;
```

#### createReduxCollRequest Example

You would use `createReduxCollRequest` for the collective result request.

```js
import { createReduxCollRequest } from 'redux-request-maker';
import xhr from '../utils/xhr';
import F from 'lodash/fp';

const {
    reducer,
    request,
} = createReduxCollRequest({
    actionTypePrefix: 'load-ticker-detail',
    primaryKeyPath: ['slug'],
    callAPI: async ({ slug }) => {
        const res = await xhr.get(`/api/v1/currencies/${slug}`);
        return F.pathOr({}, ['result'], res);
    },
});

export const fetchTicker = request;
export default reducer;
```




