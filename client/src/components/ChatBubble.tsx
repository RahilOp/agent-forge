import React from "react";
import ReactMarkdown from "react-markdown";

export class ChatBubble extends React.Component<{
  messages: Array<{ sender: "ai" | "human"; text: string }>;
}> {
  render() {
    const { messages } = this.props;

    return (
      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat ${
              message.sender === "human" ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
                <span className="text-sm">
                  {message.sender === "human" ? "U" : "AI"}
                </span>
              </div>
            </div>
            <div className="chat-bubble">
              {message.sender === "ai" ? (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              ) : (
                message.text
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export default ChatBubble;
