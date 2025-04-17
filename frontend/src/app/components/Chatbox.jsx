"use client";

import React, { useState, useRef, useEffect } from 'react';
import '../globals.css'; // Corrected: Use relative path for CSS import

// Get API URL from environment variables
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  console.error("FATAL: NEXT_PUBLIC_API_URL environment variable is not set!");
}

// --- AnimatedDots component remains the same ---
function AnimatedDots() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 300);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="relative inline-block">
      <span className="text-3xl animate-pulse absolute">{dots}</span>
      <span className="text-3xl invisible">...</span>
    </span>
  );
}


const Chatbox = () => {
  // State variables... (same as previous corrected response)
  const [uploadMode, setUploadMode] = useState("");
  const [file, setFile] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState([{ sender: "AI", text: "Hello! Ask me anything or upload a PDF/Image." }]); // Initial message
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [talkMode, setTalkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const fileInputRef = useRef(null);
  const chatLogRef = useRef(null);
  const recognitionRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState("");


  // useEffect for scrolling chat log (same)
  useEffect(() => {
      if (chatLogRef.current) {
          chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
      }
  }, [chatLog]);

  // useEffect for Speech Recognition setup (same)
   useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setQuestion(prev => prev + transcript); // Append transcript
      };
      recognition.onend = () => {
        setIsRecording(false);
        // Optionally auto-send after recording stops and there's text
        // if (question.trim()) {
        //    handleSendQuestion();
        // }
      };
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setErrorMsg(`Speech Recognition Error: ${event.error}`);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
      // Optionally disable the recording button or show a message
    }
  }, []); // Empty dependency array ensures this runs once

  // triggerFileInput (same)
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input value
      fileInputRef.current.click();
    }
     setErrorMsg("");
  };

  // handleFileChange (same as previous corrected response)
  const handleFileChange = async (e) => {
    setErrorMsg("");
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (sessionId) {
        await handleForget(true);
      }

      let determinedMode = "";
      const fileType = selectedFile.type?.toLowerCase();
      const fileNameLower = selectedFile.name?.toLowerCase();

      if (fileType === "application/pdf" || fileNameLower?.endsWith(".pdf")) {
        determinedMode = "upload_pdf";
      } else if (fileType?.startsWith("image/") || fileNameLower?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        determinedMode = "upload_image";
      }

      if (!determinedMode) {
        setErrorMsg("Unsupported file type. Please upload an image (JPEG, PNG, GIF, BMP, WebP) or a PDF.");
        setFile(null);
        setUploadMode("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setUploadMode(determinedMode);
      setFile(selectedFile); // Keep file temporarily

      // Automatically upload
      await handleUpload(selectedFile, determinedMode);

      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
    }
  };


  // handleUpload (same as previous corrected response)
  const handleUpload = async (selectedFile, modeParam) => {
    if (!selectedFile || !modeParam || !apiUrl) {
      setErrorMsg("Upload configuration error.");
      return;
    }
    setUploadLoading(true);
    setErrorMsg("");
    const formData = new FormData();
    formData.append('mode', modeParam);
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${apiUrl}/chat/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Upload failed: ${res.status}`);
      if (data.session_id) {
        setSessionId(data.session_id);
        setUploadedFilename(data.filename);
        setUploadMode(data.mode); // Use mode from response
        setChatLog(prev => [...prev, { sender: "System", text: `File uploaded: ${data.filename}` }]);
      } else {
         throw new Error(data.error || "Upload failed: No session ID received.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMsg(`Upload Error: ${error.message}`);
      setSessionId("");
      setUploadedFilename("");
      setUploadMode("");
    } finally {
      setUploadLoading(false);
    }
  };


  // pollAudioStatus (same as previous corrected response)
   const pollAudioStatus = async (taskId) => {
    let statusData = { status: "processing" };
    const statusUrl = `${apiUrl}/tts/audio_status/${taskId}`; // Use API prefix

    console.log(`Polling TTS status at: ${statusUrl}`);
    setAudioLoading(true); // Ensure indicator is on

    try {
      while (statusData.status === "processing") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const res = await fetch(statusUrl);
        if (!res.ok) {
          statusData = await res.json().catch(() => ({ detail: `Polling failed with status: ${res.status}` }));
          throw new Error(statusData.detail || `Polling failed with status: ${res.status}`);
        }
        statusData = await res.json();
        console.log("Poll status:", statusData);
      }

      setAudioLoading(false); // Turn off indicator when processing stops

      if (statusData.status === "done" && statusData.audio_url) {
        const audio = new Audio(statusData.audio_url);
        audio.playbackRate = 1.10;
        audio.play().catch(e => {
           console.error("Error playing audio:", e);
           setErrorMsg("Could not play audio response.");
        });
      } else if (statusData.status === "failed") {
        console.error("TTS synthesis failed.", statusData.error);
        setErrorMsg(`TTS Error: ${statusData.error || 'Synthesis failed.'}`);
      }
    } catch (err) {
      console.error("Error polling TTS status:", err);
       setErrorMsg(`Polling Error: ${err.message}`);
       setAudioLoading(false); // Ensure loading indicator stops on error
    }
  };


  // handleSendQuestion (same as previous corrected response)
   const handleSendQuestion = async () => {
    if (!question.trim() || !apiUrl) return;

    const currentQuestion = question;
    setQuestion("");
    setErrorMsg("");

    setChatLog(prev => [
      ...prev,
      { sender: "You", text: currentQuestion },
      { sender: "AI", placeholder: true }
    ]);
    setLoading(true);

    const payload = {
        question: currentQuestion,
        session_id: sessionId || null,
        tts: talkMode,
    };

    try {
      const res = await fetch(`${apiUrl}/chat/ask`, { // Use API prefix
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Request failed: ${res.status}`);

      setChatLog(prev => {
        const newLog = [...prev];
        const placeholderIndex = newLog.findIndex(msg => msg.placeholder);
        if (placeholderIndex !== -1) {
          newLog[placeholderIndex] = { sender: "AI", text: data.answer };
        } else { newLog.push({ sender: "AI", text: data.answer }); }
        return newLog;
      });

      if (talkMode && data.tts_task_id) {
        // Don't await, let it poll in background
         pollAudioStatus(data.tts_task_id);
      } else if (talkMode && !data.tts_task_id){
         console.warn("TTS requested, but no task ID received.");
         // Optionally add a system message
      }

    } catch (error) {
      console.error("Error sending question:", error);
       setErrorMsg(`Request Error: ${error.message}`);
       setChatLog(prev => {
         const newLog = [...prev];
         const placeholderIndex = newLog.findIndex(msg => msg.placeholder);
         if (placeholderIndex !== -1) {
           newLog[placeholderIndex] = { sender: "AI", text: `Error: ${error.message}` };
         }
         return newLog;
       });
    } finally {
      setLoading(false);
    }
  };


  // toggleRecording (improved: clear question first)
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMsg("Speech Recognition is not supported in this browser.");
      return;
    }
     setErrorMsg(""); // Clear error
    if (isRecording) {
      recognitionRef.current.stop();
      // onend will set isRecording to false
    } else {
      setQuestion(""); // Clear text input before starting new recording
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // toggleTalkMode (same)
  const toggleTalkMode = () => {
    setTalkMode(prev => !prev);
    // Optionally stop audio if toggling off?
  };

  // handleForget (same as previous corrected response)
  const handleForget = async (suppressAlert = false) => {
    if (!sessionId || !apiUrl) {
       if (!suppressAlert) setErrorMsg("No active session to forget.");
      return;
    }
    setErrorMsg("");

    const payload = { session_id: sessionId };

    try {
      const res = await fetch(`${apiUrl}/chat/forget`, { // Use API prefix
        method: 'POST',
         headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Forget failed: ${res.status}`);

      if (!suppressAlert) {
          setChatLog(prev => [...prev, { sender: "System", text: data.message || "Session cleared." }]);
      }
      setSessionId("");
      setUploadedFilename("");
      setUploadMode("");
      // setChatLog([]); // Optional: clear chat log

    } catch (error) {
      console.error("Error forgetting session:", error);
       if (!suppressAlert) setErrorMsg(`Forget Error: ${error.message}`);
    }
  };


  // JSX Structure (mostly same as previous, with error display)
  return (
    <div className="chatbox blur-background large-shadow z-50 bg-[#000518] bg-opacity-70 w-[90vw] md:w-[70vw] lg:w-[40vw] pb-6 h-[85vh] flex flex-col rounded-3xl shadow-[0_0_20px_10px_#e20074] border-4 border-[#3a3a3a]">
      {/* Header */}
       <div className="h-[13%] pl-3 border-b border-[#3a3a3a] flex gap-x-4 items-center shrink-0">
        <img
          className="rounded-full h-12 w-12"
          src="https://www.telekom.com/resource/blob/1002342/12f9f204ed4293439e1c93f7851ae186/dl-telekom-logo-01-data.jpg"
          alt="Logo"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-white">ICM KI-Assistant</h1>
          <p className="text-sm text-gray-400">Image & Document Reader</p>
        </div>
        <button
          onClick={toggleTalkMode}
          className={`ml-auto mr-3 px-3 py-1 rounded-full text-sm transition-colors ${talkMode ? "bg-[#e20074] text-white" : "bg-transparent text-white border border-[#3a3a3a] hover:bg-[#3a3a3a]"}`}>
          {talkMode ? "Voice Mode On" : "Voice Mode Off"}
        </button>
      </div>

      {/* Chat Log Area */}
      <div ref={chatLogRef} className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col">
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.sender === "System"
              ? "text-center text-xs text-gray-400 italic my-2" // System messages
              : `chat-bubble ${msg.sender === "You" ? "user" : "ai"}` // User/AI messages
            }
          >
            {msg.placeholder ? <AnimatedDots /> : <span>{msg.text}</span>}
          </div>
        ))}
        {/* AI loading indicator (only if loading state is true AND no placeholder exists) */}
        {loading && !chatLog.some(m => m.placeholder) && (
             <div className={`chat-bubble ai`}><AnimatedDots /></div>
        )}
        {/* TTS loading indicator */}
        {audioLoading && (
          <div className="self-start text-sm text-gray-400 italic px-4 py-1 flex items-center">
            <AnimatedDots /><span className="ml-1">Loading audio...</span>
          </div>
        )}
      </div>

       {/* Error Display Area */}
       {errorMsg && (
         <div className="px-5 py-2 text-red-400 text-sm bg-red-900 bg-opacity-50 border-t border-b border-red-700 shrink-0">
           Error: {errorMsg}
         </div>
       )}

      {/* Input Area */}
      <div className="px-5 pt-3 flex flex-col space-y-3 border-t border-[#3a3a3a] shrink-0">
        {/* Input field */}
        <div className="flex items-center space-x-2">
           <input
             type="text"
             value={question}
             onChange={(e) => setQuestion(e.target.value)}
             onKeyDown={(e) => { if(e.key === "Enter" && !loading && !uploadLoading){ e.preventDefault(); handleSendQuestion(); } }}
             placeholder={sessionId ? `Ask about ${uploadedFilename}...` : "Ask anything..."}
             className="h-12 rounded-full border border-[#3a3a3a] bg-transparent px-5 w-full outline-none text-white placeholder-gray-500 focus:border-[#e20074]"
             disabled={loading || uploadLoading}
           />
            {/* Send Button (Optional alternative to Enter) */}
            {/* <button onClick={handleSendQuestion} disabled={loading || uploadLoading || !question.trim()} className="...">Send</button> */}
        </div>


         {/* Talk Mode Button */}
        {talkMode && (
          <div className="flex justify-center">
            <button
              onClick={toggleRecording}
              className={`mb-1 px-4 py-2 rounded-full border text-sm transition-colors ${isRecording ? 'bg-red-600 border-red-700 text-white animate-pulse' : 'bg-[#e20074] border-[#e20074] text-white hover:bg-opacity-80'}`}
              disabled={loading || uploadLoading} // Disable while other operations are running
              >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => handleForget(false)}
            className="h-10 rounded-full border border-[#3a3a3a] bg-transparent px-2 flex-1 text-white text-sm hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={!sessionId || loading || uploadLoading}
          >
            Forget Context
          </button>
          <button
            onClick={triggerFileInput}
            className="h-10 rounded-full border border-[#3a3a3a] bg-[#e20074] text-white font-semibold flex-1 hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || uploadLoading}
          >
            {uploadLoading ? "Uploading..." : (sessionId ? "Upload New" : "Upload File")}
          </button>
        </div>

        {/* Display uploaded filename */}
        {uploadedFilename && sessionId && (
          <div className="mt-1 text-center text-gray-400 text-xs">
            Active context: {uploadedFilename} ({uploadMode})
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Chatbox;