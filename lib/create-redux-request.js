const F = require('lodash/fp');
const isEmpty = require('lodash/isEmpty');

const DEFAULT_STATE = {
    latestRequest: undefined,
    error: undefined,
    result: undefined,
    status: 'notasked',
};

const DEFAULT_LAST_REQUEST_COMPARATOR = (a, b) => {
    return F.equals(a, b);
};

const create = ({
    actionTypePrefix,
    callAPI,
    shouldCallAPI,
    isLatestRequestComparator = DEFAULT_LAST_REQUEST_COMPARATOR,
    defaultState = DEFAULT_STATE,
}) => {
    if (!isEmpty(actionTypePrefix)) {
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
        const lastRequestPayload = F.path(['latestRequest'], state);
        const thisRequestPayload = F.path(['payload'], action);
        return isLatestRequestComparator(lastRequestPayload, thisRequestPayload);
    };
    
    const actionHandlers = {
        [requestType]: (state, action) => Object.assign({}, F.omit(['error'], state), {
            status: 'loading',
            latestRequest: F.path(['payload'], action),
        }),
        [successType]: (state, action) => {
            if (!isLatestRequest(state, action)) {
                return Object.assign({}, state);
            }
            return Object.assign({}, state, {
                status: 'success',
                result: F.path(['response'], action),
            });
        },
        [failureType]: (state, action) => {
            if (!isLatestRequest(state, action)) {
                return Object.assign({}, state);
            }
            return Object.assign({}, state, {
                status: 'failure',
                error: F.path(['error'], action),
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
