const R = require('ramda');

const isNonEmptyStr = (str) => typeof str === 'string' && str.length > 0;

const DEFAULT_STATE = {
    errors: undefined,
    results: undefined,
    statuses: 'notasked',
};

const create = ({
    actionTypePrefix,
    callAPI,
    shouldCallAPI,
    primaryKeyPath = ['id'],
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

    const actionHandlers = {
        [requestType]: (state, action) => {
            const _id = R.path(primaryKeyPath, action.payload);
            const errors = R.compose(
                R.omit([_id]),
                R.pathOr({}, ['errors'])
            )(state);
            const statuses = Object.assign({}, R.pathOr({}, ['statuses'], state), {
                [_id]: 'loading',
            });
            return Object.assign({}, state, { errors, statuses });
        },
        [successType]: (state, action) => {
            const _id = R.path(primaryKeyPath, action.payload);
            const result = R.pathOr({}, ['response'], action);
            const errors = R.compose(
                R.omit([_id]),
                R.pathOr({}, ['errors'])
            )(state);
            const statuses = Object.assign({}, R.pathOr({}, ['statuses'], state), {
                [_id]: 'success',
            });
            const results = Object.assign({}, R.pathOr({}, ['results'], state), {
                [_id]: result,
            });
            return { errors, statuses, results };
        },
        [failureType]: (state, action) => {
            const _id = R.path(primaryKeyPath, action.payload);
            const error = R.pathOr({}, ['error'], action);
            const results = R.compose(
                R.omit([_id]),
                R.pathOr({}, ['results'])
            )(state);
            const statuses = Object.assign({}, R.pathOr({}, ['statuses'], state), {
                [_id]: 'failure',
            });
            const errors = Object.assign({}, R.pathOr({}, ['errors'], state), {
                [_id]: error,
            });
            return { errors, statuses, results };
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
