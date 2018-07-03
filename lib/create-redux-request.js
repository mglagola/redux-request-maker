const F = require('lodash/fp');
const isEmpty = require('lodash/isEmpty');

const camelCase = (array) => F.compose(
    F.camelCase,
    F.remove(F.isNil)
)(array);

const buildDefaultState = ({ stateKeyLatestRequest, stateKeyStatus, stateKeyError, stateKeyResult }) => ({
    [stateKeyLatestRequest]: undefined,
    [stateKeyStatus]: 'notasked',
    [stateKeyError]: undefined,
    [stateKeyResult]: undefined,
});

const DEFAULT_LAST_REQUEST_COMPARATOR = (a, b) => {
    return F.equals(a, b);
};

const create = ({
    actionTypePrefix,
    callAPI,
    shouldCallAPI,
    statePrefix,
    isLatestRequestComparator = DEFAULT_LAST_REQUEST_COMPARATOR,
    defaultState: _defaultState,
}) => {
    if (isEmpty(actionTypePrefix)) {
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
    
    const stateKeyLatestRequest = camelCase([statePrefix, 'latestRequest']);
    const stateKeyStatus = camelCase([statePrefix, 'status']);
    const stateKeyError = camelCase([statePrefix, 'error']);
    const stateKeyResult = camelCase([statePrefix, 'result']);

    const defaultState = F.isNil(_defaultState)
        ? buildDefaultState({ stateKeyLatestRequest, stateKeyStatus, stateKeyError, stateKeyResult })
        : _defaultState;

    const isLatestRequest = (state, action) => {
        const lastRequestPayload = F.path([stateKeyLatestRequest], state);
        const thisRequestPayload = F.path(['payload'], action);
        return isLatestRequestComparator(lastRequestPayload, thisRequestPayload);
    };
    
    const actionHandlers = {
        [requestType]: (state, action) => Object.assign({}, F.omit(['error'], state), {
            [stateKeyStatus]: 'loading',
            [stateKeyLatestRequest]: F.path(['payload'], action),
        }),
        [successType]: (state, action) => {
            if (!isLatestRequest(state, action)) {
                return Object.assign({}, state);
            }
            return Object.assign({}, state, {
                [stateKeyStatus]: 'success',
                [stateKeyResult]: F.path(['response'], action),
            });
        },
        [failureType]: (state, action) => {
            if (!isLatestRequest(state, action)) {
                return Object.assign({}, state);
            }
            return Object.assign({}, state, {
                [stateKeyStatus]: 'failure',
                [stateKeyError]: F.path(['error'], action),
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
