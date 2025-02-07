import React from "react";
import FileUpload from "./FileUpload";
import ChatBot from "./Chatbot"

function App() {
    return (
        <div>
            <h1>File Upload Example</h1>
            <FileUpload />
            <h1>ChatBot functionality</h1>
            <ChatBot />
        </div>
    );
}

export default App;
