const callAPIMiddleware = ({ dispatch, getState }) => (next) => async (action) => {
    const {
        types,
        callAPI,
        shouldCallAPI = () => true,
        payload = {},
        analyticsPayload = {},
    } = action;
    const state = getState();

    if (!types) {
        return next(action);
    }

    if (!Array.isArray(types) || types.length !== 3 || !types.every(type => typeof type === 'string')) {
        throw new Error('Expected an array of three string types.');
    }

    if (typeof callAPI !== 'function') {
        throw new Error('Expected callAPI to be a function.');
    }

    if (!shouldCallAPI(payload, state)) {
        return;
    }

    const [ requestType, successType, failureType ] = types;

    dispatch({
        type: requestType,
        payload,
    });

    try {
        const response = await callAPI(payload, state);

        if (response.statusCode
            && (response.statusCode < 200 || response.statusCode > 299)
            && response.error) {
            dispatch({
                type: failureType,
                error: response,
                payload,
                analyticsPayload,
            });
        }

        else {
            dispatch({
                type: successType,
                response,
                payload,
                analyticsPayload,
            });
        }
    }

    catch (error) {
        dispatch({
            type: failureType,
            error,
            payload,
            analyticsPayload,
        });
    }
};

module.exports = callAPIMiddleware;
