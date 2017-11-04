const R = require('ramda');

const isNonEmptyStr = (str) => R.and(R.is(String), R.compose(R.gt(R.__, 0), R.length))(str)

const DEFAULT_STATE = {
    latestRequest: undefined,
    error: undefined,
    result: undefined,
    status: 'notasked',
};

const DEFAULT_LAST_REQUEST_COMPARATOR = (a, b) => {
    return R.equals(a, b);
};

const create = ({
    actionTypePrefix,
    callAPI,
    shouldCallAPI,
    isLatestRequestComparator = DEFAULT_LAST_REQUEST_COMPARATOR,
    defaultState = DEFAULT_STATE,
}) => {
    if (!isNonEmptyStr(actionTypePrefix)) {
        throw new Error('actionTypePrefix must be a non empty string');            
    }

    const requestType = `${actionTypePrefix}/request`;
    const successType = `${actionTypePrefix}/success`;
    const failureType = `${actionTypePrefix}/failure`;
    const resetType = `${actionTypePrefix}/reset`;

    const request = (payload) => ({
        isReduxRequest: true,
        types: [
            requestType,
            successType,
            failureType,
        ],
        shouldCallAPI,
        callAPI,
        payload: payload,
    });
    
    const isLatestRequest = (state, action) => {
        const lastRequestPayload = R.path(['latestRequest'], state);
        const thisRequestPayload = R.path(['payload'], action);
        return isLatestRequestComparator(lastRequestPayload, thisRequestPayload);
    };
    
    const actionHandlers = {
        [requestType]: (state, action) => Object.assign({}, R.omit(['error'], state), {
            status: 'loading',
            latestRequest: R.path(['payload'], action),
        }),
        [successType]: (state, action) => {
            if (!isLatestRequest(state, action)) {
                return Object.assign({}, state);
            }
            return Object.assign({}, state, {
                status: 'success',
                result: R.path(['response'], action),
            });
        },
        [failureType]: (state, action) => {
            if (!isLatestRequest(state, action)) {
                return Object.assign({}, state);
            }
            return Object.assign({}, state, {
                status: 'failure',
                error: R.path(['error'], action),
            });
        },
        [resetType]: () => Object.assign({}, defaultState),
    };
    
    const reducer = (state = defaultState, action) => {
        const handler = actionHandlers[action.type];
        return handler ? handler(state, action) : state;
    };

    return {
        reducer,
        actionHandlers,
        request,
        defaultState,
    };
};

module.exports = create;
