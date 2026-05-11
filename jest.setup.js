require('@testing-library/jest-dom');
require('whatwg-fetch');

// Ép kiểu cho Node.js hiểu Request/Response/Fetch là gì
if (!global.Request) {
    const {
        Request,
        Response,
        Headers,
        fetch
    } = require('whatwg-fetch');
    global.Request = Request;
    global.Response = Response;
    global.Headers = Headers;
    global.fetch = fetch;
}
