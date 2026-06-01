class ApiRequestError extends Error {
    details?: unknown;

    constructor(message: string, details?: unknown) {
        super(message);
        this.name = 'ApiRequestError';
        this.details = details;
    }
}

const getApiError = async (
    response: Response,
    fallbackMessage: string,
): Promise<ApiRequestError> => {
    try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object') {
            const error = (body as { error?: { message?: unknown } }).error;
            if (typeof error?.message === 'string') {
                return new ApiRequestError(
                    error.message,
                    (error as { details?: unknown }).details,
                );
            }
        }
    } catch {
        return new ApiRequestError(fallbackMessage);
    }

    return new ApiRequestError(fallbackMessage);
};

const requestJson = async <T>(
    url: string,
    options: RequestInit,
    fallbackMessage: string,
): Promise<T> => {
    const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw await getApiError(response, fallbackMessage);
    }

    return (await response.json()) as T;
};

export { ApiRequestError, getApiError, requestJson };
