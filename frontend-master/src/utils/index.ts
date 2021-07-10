type JWT = {
    exp: number
    iat: number
    value: number
}
import { useCallback, useEffect } from "react";

export function parseJWTToken(token: string): JWT {
    return JSON.parse(window.atob(token.split(".")[1]))
}

export function isJWTExpired(token: JWT): boolean {
    return new Date(token.exp * 1000).getTime() <= new Date().getTime()
}

export function verbaliseSentiment(sentiment: number): string {
    if (sentiment < -0.5) return "Very negative";
    else if (sentiment < 0) return "Negative";
    else if (sentiment < 0.5) return "Positive";
    else return "Very positive";
}

export const useDebouncedEffect = (effect: () => void, delay: number , deps: any[]): void => {
    const callback = useCallback(effect, deps);

    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [callback, delay]);
}