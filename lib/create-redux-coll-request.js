const F = require('lodash/fp');
const isEmpty = require('lodash/isEmpty');

const DEFAULT_STATE = {
    errors: undefined,
    results: undefined,
    statuses: undefined,
};

const create = ({
    actionTypePrefix,
    callAPI,
    shouldCallAPI,
    primaryKeyPath = ['id'],
    defaultState = DEFAULT_STATE,
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

    const actionHandlers = {
        [requestType]: (state, action) => {
            const _id = F.path(primaryKeyPath, action.payload);
            const errors = F.compose(
                F.omit([_id]),
                F.pathOr({}, ['errors'])
            )(state);
            const statuses = Object.assign({}, F.pathOr({}, ['statuses'], state), {
                [_id]: 'loading',
            });
            return Object.assign({}, state, { errors, statuses });
        },
        [successType]: (state, action) => {
            const _id = F.path(primaryKeyPath, action.payload);
            const result = F.pathOr({}, ['response'], action);
            const errors = F.compose(
                F.omit([_id]),
                F.pathOr({}, ['errors'])
            )(state);
            const statuses = Object.assign({}, F.pathOr({}, ['statuses'], state), {
                [_id]: 'success',
            });
            const results = Object.assign({}, F.pathOr({}, ['results'], state), {
                [_id]: result,
            });
            return { errors, statuses, results };
        },
        [failureType]: (state, action) => {
            const _id = F.path(primaryKeyPath, action.payload);
            const error = F.pathOr({}, ['error'], action);
            const results = F.compose(
                F.omit([_id]),
                F.pathOr({}, ['results'])
            )(state);
            const statuses = Object.assign({}, F.pathOr({}, ['statuses'], state), {
                [_id]: 'failure',
            });
            const errors = Object.assign({}, F.pathOr({}, ['errors'], state), {
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
