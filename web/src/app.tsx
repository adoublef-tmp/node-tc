export function App() {

    // connect to sse
    const sse = new EventSource("http://localhost:8080/facts/stream", {
        withCredentials: true,
    });

    sse.addEventListener("message", (event) => {
        console.log("onmessage", JSON.parse(event.data));
    });

    sse.addEventListener("open", (event) => {
        console.log("open", event);
    });

    return (
        <>
            <div>Hello SSE</div>
        </>
    );
}
