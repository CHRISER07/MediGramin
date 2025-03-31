// import React, { useState, useRef, useEffect } from "react";
// // import "./styles.css"; // Import the CSS file

// const Chatbot = () => {
//   const [messages, setMessages] = useState([
//     { role: "bot", content: "Hello, I'm MediGramin. How can I help you with health remedies today?" }
//   ]);
//   const [input, setInput] = useState("");
//   const [language, setLanguage] = useState("English"); // Default language
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Available languages with their speech codes
//   const languages = [
//     { name: "English", code: "en-US" },
//     { name: "Hindi", code: "hi-IN" },
//     { name: "Tamil", code: "ta-IN" },
//     { name: "Telugu", code: "te-IN" },
//     { name: "Bengali", code: "bn-IN" },
//     { name: "Marathi", code: "mr-IN" }
//   ];

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userMessage = { role: "user", content: input };
//     setMessages((prev) => [...prev, userMessage]);
//     setInput("");

//     try {
//       const response = await fetch("http://127.0.0.1:5000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           message: input,
//           language: language 
//         }),
//       });

//       const data = await response.json();
//       setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
//     } catch (error) {
//       setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
//     }
//   };

//   const speakText = (text, langName) => {
//     // Stop any ongoing speech
//     if (window.speechSynthesis.speaking) {
//       window.speechSynthesis.cancel();
//       setIsSpeaking(false);
//       return;
//     }

//     // Find the language code
//     const langObj = languages.find(lang => lang.name === langName) || languages[0];
    
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = langObj.code;
//     utterance.rate = 0.9; // Slightly slower rate for better clarity
    
//     utterance.onstart = () => setIsSpeaking(true);
//     utterance.onend = () => setIsSpeaking(false);
//     utterance.onerror = () => setIsSpeaking(false);
    
//     window.speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="container">
//       <h2>MediGramin Chatbot</h2>

//       <div className="chat-container">
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={`message ${message.role === "user" ? "user-message" : "bot-message"}`}
//           >
//             {message.content}
//             {message.role === "bot" && (
//               <button 
//                 className={`speak-button ${isSpeaking ? 'speaking' : ''}`}
//                 onClick={() => speakText(message.content, language)}
//                 aria-label="Read aloud"
//               >
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
//                   <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
//                   <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
//                 </svg>
//               </button>
//             )}
//           </div>
//         ))}

//         <div ref={messagesEndRef} />
//       </div>

//       <form className="input-area" onSubmit={handleSubmit}>
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Type your message..."
//         />
//         <button type="submit">Send</button>
//       </form>

//       <div className="language-selector">
//         <p>Select language:</p>
//         <div className="language-buttons">
//           {languages.map((lang) => (
//             <button
//               key={lang.name}
//               onClick={() => setLanguage(lang.name)}
//               className={language === lang.name ? "active" : ""}
//             >
//               {lang.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="disclaimer">
//         MediGramin provides general health information. Always consult a doctor for medical advice.
//       </div>
//     </div>
//   );
// };

// export default Chatbot;

import React, { useState, useRef, useEffect } from "react";
import "./styles.css";  // Import the CSS file

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hello, I'm MediGramin. How can I help you with health remedies today?" }
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English"); // Default language
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const languages = [
    { name: "English", code: "en-US" },
    { name: "Hindi", code: "hi-IN" },
    { name: "Tamil", code: "ta-IN" },
    { name: "Telugu", code: "te-IN" },
    { name: "Bengali", code: "bn-IN" },
    { name: "Marathi", code: "mr-IN" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, language: language }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    }
  };

  const speakText = (text, langName) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const langObj = languages.find((lang) => lang.name === langName) || languages[0];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langObj.code;
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="chatbot-container">
      <h2 className="chatbot-title">MediGramin Chatbot</h2>

      <div className="chat-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === "user" ? "user-message" : "bot-message"}`}
          >
            {message.content}
            {message.role === "bot" && (
              <button
                className={`speak-button ${isSpeaking ? "speaking" : ""}`}
                onClick={() => speakText(message.content, language)}
                aria-label="Read aloud"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>

      <div className="language-selector">
        <p>Select language:</p>
        <div className="language-buttons">
          {languages.map((lang) => (
            <button
              key={lang.name}
              onClick={() => setLanguage(lang.name)}
              className={language === lang.name ? "active" : ""}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      <div className="disclaimer">
        MediGramin provides general health information. Always consult a doctor for medical advice.
      </div>
    </div>
  );
};

export default Chatbot;
