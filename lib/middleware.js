const { get, getOr } = require('lodash/fp');

const middleware = ({ dispatch, getState }) => (next) => async (action) => {
    const {
        isReduxRequest = false,
        types,
        callAPI,
        shouldCallAPI = () => true,
        payload = {},
        analyticsPayload = {},
    } = action;
    const state = getState();

    if (!types || !isReduxRequest) {
        return next(action);
    }

    if (
        !Array.isArray(types) ||
        types.length !== 3 ||
        !types.every((type) => typeof type === 'string')
    ) {
        throw new Error('Expected an array of three string types.');
    }

    if (typeof callAPI !== 'function') {
        throw new Error('Expected callAPI to be a function.');
    }

    if (!shouldCallAPI(payload, state)) {
        return;
    }

    const [requestType, successType, failureType] = types;

    dispatch({
        type: requestType,
        payload,
    });

    try {
        const response = await callAPI(payload, state);
        const statusCode = getOr(get(['status'], response), ['statusCode'], response);
        if (statusCode && (statusCode < 200 || statusCode > 299)) {
            dispatch({
                type: failureType,
                error: response,
                payload,
                analyticsPayload,
            });
        } else {
            dispatch({
                type: successType,
                response,
                payload,
                analyticsPayload,
            });
        }
    } catch (error) {
        dispatch({
            type: failureType,
            error,
            payload,
            analyticsPayload,
        });
    }
};

module.exports = middleware;
