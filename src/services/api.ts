const getApiErrorMessage = async (
    response: Response,
    fallbackMessage: string,
): Promise<string> => {
    try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object') {
            const error = (body as { error?: { message?: unknown } }).error;
            if (typeof error?.message === 'string') {
                return error.message;
            }
        }
    } catch {
        return fallbackMessage;
    }

    return fallbackMessage;
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
        throw new Error(await getApiErrorMessage(response, fallbackMessage));
    }

    return (await response.json()) as T;
};

export { getApiErrorMessage, requestJson };
