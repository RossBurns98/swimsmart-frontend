export function decodeJwt(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g,"/");
        const padded = base64 + "===".slice((base64.length + 3) % 4);
        const json = atob(padded);
        return JSON.parse(json);
    }   catch {
        return null;
    }
}