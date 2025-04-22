"use client";

import React, { useState, useRef, useEffect } from 'react';
import '../globals.css'; // Use relative path for CSS import

// Get API URL from environment variables
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  console.error("FATAL: NEXT_PUBLIC_API_URL environment variable is not set!");
  // Consider throwing an error or displaying a message in the UI
}

// --- AnimatedDots component (Revised) ---
function AnimatedDots() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 300);
    return () => clearInterval(interval);
  }, []);
  // Use a container span and apply animation to it
  return (
    <span className="animated-dots-container inline-block animate-pulse animate-simple-pulse"> {/* Added container and fallback animation */}
      <span className="text-xl">{dots}</span> {/* Adjusted size */}
      <span className="text-xl invisible">...</span> {/* Invisible placeholder for layout */}
    </span>
  );
}


const Chatbox = () => {
  // State variables...
  const [uploadMode, setUploadMode] = useState(""); // 'pdf' or 'image' from backend response
  const [file, setFile] = useState(null); // Temporarily hold file on select
  const [sessionId, setSessionId] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [question, setQuestion] = useState("");
  const [chatLog, setChatLog] = useState([{ sender: "AI", text: "Hello! Ask me anything or upload a PDF/Image." }]);
  const [loading, setLoading] = useState(false); // Loading AI answer
  const [uploadLoading, setUploadLoading] = useState(false); // Loading file upload
  const [talkMode, setTalkMode] = useState(false); // TTS enabled/disabled
  const [isRecording, setIsRecording] = useState(false); // STT recording state
  const [audioLoading, setAudioLoading] = useState(false); // TTS audio loading state
  const fileInputRef = useRef(null);
  const chatLogRef = useRef(null);
  const recognitionRef = useRef(null); // For Speech Recognition instance
  const [errorMsg, setErrorMsg] = useState(""); // For displaying errors


  // useEffect for scrolling chat log
  useEffect(() => {
      if (chatLogRef.current) {
          chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
      }
  }, [chatLog]);

  // useEffect for Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after first speech segment
      recognition.lang = 'en-US';
      recognition.interimResults = false; // Only final results
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setQuestion(prev => (prev + transcript).trim()); // Append transcript and trim
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Optionally auto-send if needed
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        setErrorMsg(`Speech Recognition Error: ${event.error} - ${event.message}`);
        setIsRecording(false); // Ensure recording stops
      };
      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
      // Disable the recording button or show a message
    }

    // Cleanup function to stop recognition if component unmounts while recording
    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]); // Re-run effect if isRecording changes (needed for cleanup)

  // triggerFileInput
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset input value to allow re-uploading same file
      fileInputRef.current.click();
    }
     setErrorMsg(""); // Clear previous errors
  };

  // handleFileChange
  const handleFileChange = async (e) => {
    setErrorMsg("");
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Clear existing session before uploading a new file
      if (sessionId) {
        await handleForget(true); // Suppress user message for this forget action
      }

      let determinedMode = "";
      const fileType = selectedFile.type?.toLowerCase();
      const fileNameLower = selectedFile.name?.toLowerCase();

      // Determine mode based on type or extension
      if (fileType === "application/pdf" || fileNameLower?.endsWith(".pdf")) {
        determinedMode = "upload_pdf";
      } else if (fileType?.startsWith("image/") || fileNameLower?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
        determinedMode = "upload_image";
      }

      if (!determinedMode) {
        setErrorMsg("Unsupported file type. Please upload an image (JPEG, PNG, GIF, BMP, WebP) or a PDF.");
        setFile(null);
        setUploadMode("");
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the file input
        return;
      }

      // Set temporary state and trigger upload
      setFile(selectedFile);
      await handleUpload(selectedFile, determinedMode);

      // Clear the actual file input element after processing
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null); // Clear temporary file state
    }
  };


  // handleUpload
  const handleUpload = async (fileToUpload, modeToUpload) => {
    if (!fileToUpload || !modeToUpload || !apiUrl) {
      setErrorMsg("Upload configuration error or missing API URL.");
      return;
    }
    setUploadLoading(true);
    setErrorMsg(""); // Clear previous errors
    const formData = new FormData();
    formData.append('mode', modeToUpload);
    formData.append('file', fileToUpload);

    try {
      const res = await fetch(`${apiUrl}/api/v1/chat/upload`, { // Use full API path
        method: 'POST',
        body: formData
      });
      const data = await res.json(); // Attempt to parse JSON regardless of status

      if (!res.ok) {
        // Use detail from JSON if available, otherwise use status text
        throw new Error(data?.detail || `Upload failed: ${res.status} ${res.statusText}`);
      }

      if (data.session_id) {
        setSessionId(data.session_id);
        setUploadedFilename(data.filename);
        setUploadMode(data.mode); // Use mode from response for consistency
        setChatLog(prev => [...prev, { sender: "System", text: `File uploaded: ${data.filename} (${data.mode} mode)` }]);
      } else {
         // Should not happen if response is ok and follows schema, but handle defensively
         throw new Error(data?.error || "Upload succeeded but no session ID received.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMsg(`Upload Error: ${error.message}`);
      // Reset state on error
      setSessionId("");
      setUploadedFilename("");
      setUploadMode("");
    } finally {
      setUploadLoading(false);
    }
  };


  // pollAudioStatus
  const pollAudioStatus = async (taskId) => {
    if (!apiUrl) {
      setErrorMsg("API URL not configured for polling.");
      return;
    }
    let statusData = { status: "processing" };
    const statusUrl = `${apiUrl}/api/v1/tts/audio_status/${taskId}`; // Use full API path

    console.log(`Polling TTS status at: ${statusUrl}`);
    setAudioLoading(true); // Indicate polling started
    setErrorMsg(""); // Clear previous errors

    try {
      let attempts = 0;
      const maxAttempts = 30; // Poll for max 60 seconds (30 * 2s)

      while (statusData.status === "processing" && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;
        const res = await fetch(statusUrl);
        const data = await res.json(); // Try to parse JSON

        if (!res.ok) {
          throw new Error(data?.detail || `Polling failed: ${res.status} ${res.statusText}`);
        }
        statusData = data;
        console.log(`Poll attempt ${attempts}:`, statusData);
      }

      if (statusData.status === "processing") {
         throw new Error("TTS task timed out.");
      }

      if (statusData.status === "done" && statusData.audio_url) {
        const audio = new Audio(statusData.audio_url);
        audio.playbackRate = 1.10; // Optional: adjust playback speed
        audio.play().catch(e => {
           console.error("Error playing audio:", e);
           setErrorMsg("Could not play audio response. Check browser permissions.");
        });
      } else if (statusData.status === "failed") {
        console.error("TTS synthesis failed:", statusData.error);
        setErrorMsg(`TTS Error: ${statusData.error || 'Synthesis failed.'}`);
      }
    } catch (err) {
      console.error("Error polling TTS status:", err);
       setErrorMsg(`Polling Error: ${err.message}`);
    } finally {
       setAudioLoading(false); // Ensure loading indicator stops
    }
  };


  // handleSendQuestion
  const handleSendQuestion = async () => {
    if (!question.trim() || !apiUrl) return;

    const currentQuestion = question;
    setQuestion(""); // Clear input immediately
    setErrorMsg(""); // Clear previous errors

    // Add user message and AI placeholder
    setChatLog(prev => [
      ...prev,
      { sender: "You", text: currentQuestion },
      { sender: "AI", placeholder: true } // Placeholder for AI response
    ]);
    setLoading(true); // Start loading indicator for AI response

    const formData = new FormData();
    formData.append('question', currentQuestion);
    if (sessionId) {
        formData.append('session_id', sessionId);
    }
    formData.append('tts', talkMode);


    try {
      // Use FormData for consistency with other endpoints, though JSON is also fine here if preferred
      const res = await fetch(`${apiUrl}/api/v1/chat/ask`, { // Use full API path
        method: 'POST',
        body: formData // Send as form data
      });
      const data = await res.json(); // Try to parse JSON

      if (!res.ok) {
        throw new Error(data?.detail || `Request failed: ${res.status} ${res.statusText}`);
      }

      // Update chat log replacing placeholder
      setChatLog(prev => {
        const newLog = [...prev];
        // Find the *last* message that has a placeholder flag
        const placeholderIndex = newLog.map(m => m.placeholder).lastIndexOf(true);
        if (placeholderIndex !== -1) {
          newLog[placeholderIndex] = { sender: "AI", text: data.answer }; // Replace placeholder
        } else {
          // Fallback if placeholder somehow disappeared (shouldn't happen often)
          newLog.push({ sender: "AI", text: data.answer });
        }
        return newLog;
      });

      // Handle TTS if requested and task ID received
      if (talkMode && data.tts_task_id) {
        pollAudioStatus(data.tts_task_id); // Start polling in background
      } else if (talkMode && !data.tts_task_id){
         console.warn("TTS requested, but no task ID received from backend.");
         // Optionally add a system message about TTS not being available
         setChatLog(prev => [...prev, { sender: "System", text: "TTS is currently unavailable." }]);
      }

    } catch (error) {
      console.error("Error sending question:", error);
       setErrorMsg(`Request Error: ${error.message}`);
       // Replace placeholder with error message
       setChatLog(prev => {
         const newLog = [...prev];
         const placeholderIndex = newLog.map(m => m.placeholder).lastIndexOf(true);
         if (placeholderIndex !== -1) {
           newLog[placeholderIndex] = { sender: "AI", text: `Error: ${error.message}` };
         }
         return newLog;
       });
    } finally {
      setLoading(false); // Stop loading indicator for AI response
    }
  };


  // toggleRecording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMsg("Speech Recognition is not supported or enabled in this browser.");
      return;
    }
     setErrorMsg(""); // Clear error
    if (isRecording) {
      recognitionRef.current.stop();
      // onend in useEffect will set isRecording to false
    } else {
      setQuestion(""); // Clear text input before starting new recording
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
          console.error("Error starting speech recognition:", err);
          setErrorMsg(`Could not start recording: ${err.message}`);
          setIsRecording(false);
      }
    }
  };

  // toggleTalkMode
  const toggleTalkMode = () => {
    setTalkMode(prev => !prev);
    // If turning off talk mode, potentially stop any ongoing audio playback?
    // This requires managing the Audio object instance if needed.
  };

  // handleForget
  const handleForget = async (suppressAlert = false) => {
    if (!sessionId || !apiUrl) {
       if (!suppressAlert) setErrorMsg("No active session to forget.");
      return;
    }
    setErrorMsg("");

    const formData = new FormData();
    formData.append('session_id', sessionId);


    try {
      const res = await fetch(`${apiUrl}/api/v1/chat/forget`, { // Use full API path
        method: 'POST',
        body: formData // Send as form data
      });
      const data = await res.json(); // Try parse

      if (!res.ok) {
        throw new Error(data?.detail || `Forget failed: ${res.status} ${res.statusText}`);
      }

      // Add system message only if not suppressed
      if (!suppressAlert) {
          setChatLog(prev => [...prev, { sender: "System", text: data.message || "Session context cleared." }]);
      }

      // Reset session state
      setSessionId("");
      setUploadedFilename("");
      setUploadMode("");
      // Optional: Clear chat log completely?
      // setChatLog([{ sender: "AI", text: "Session cleared. Ask me anything or upload a new file." }]);

    } catch (error) {
      console.error("Error forgetting session:", error);
       if (!suppressAlert) setErrorMsg(`Forget Error: ${error.message}`);
       // Even on error, might want to clear local state if session is likely invalid
       setSessionId("");
       setUploadedFilename("");
       setUploadMode("");
    }
  };


  // JSX Structure
  return (
    <div className="chatbox blur-background large-shadow z-50 bg-[#0a0a0a] bg-opacity-80 w-[90vw] md:w-[70vw] lg:w-[40vw] pb-6 h-[85vh] flex flex-col rounded-3xl shadow-[0_0_20px_10px_rgba(226,0,116,0.3)] border-2 border-[#3a3a3a]">
      {/* Header */}
       <div className="h-[70px] pl-4 pr-4 border-b border-[#3a3a3a] flex gap-x-4 items-center shrink-0">
        <img
          className="rounded-full h-10 w-10 object-cover" // Adjusted size
          src="https://www.telekom.com/resource/blob/1002342/12f9f204ed4293439e1c93f7851ae186/dl-telekom-logo-01-data.jpg"
          alt="Logo"
        />
        <div className="flex flex-col">
          <h1 className="text-base font-semibold text-white">ICM KI-Assistant</h1>
          <p className="text-xs text-gray-400">Image & Document Reader</p>
        </div>
        <button
          onClick={toggleTalkMode}
          className={`ml-auto px-3 py-1 rounded-full text-xs transition-colors ${talkMode ? "bg-[#e20074] text-white" : "bg-transparent text-white border border-[#3a3a3a] hover:bg-[#3a3a3a]"}`}
          aria-pressed={talkMode}
          >
          {talkMode ? "Voice On" : "Voice Off"}
          {audioLoading && <span className="ml-1 animate-pulse">🔊</span>}
        </button>
      </div>

      {/* Chat Log Area */}
      <div ref={chatLogRef} className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col scrollbar-thin scrollbar-thumb-[#e20074] scrollbar-track-transparent">
        {chatLog.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.sender === "System"
              ? "system-message" // Use dedicated class
              : `chat-bubble ${msg.sender === "You" ? "user" : "ai"}`
            }
          >
            {/* Render AnimatedDots directly if placeholder is true */}
            {msg.placeholder ? <AnimatedDots /> : <span className="block max-w-full">{msg.text}</span>} {/* Added max-w-full */}
          </div>
        ))}
        {/* AI loading indicator is handled by the placeholder message */}
      </div>

       {/* Error Display Area */}
       {errorMsg && (
         <div className="px-4 py-2 text-red-400 text-sm bg-red-900 bg-opacity-60 border-t border-red-700 shrink-0">
           {errorMsg}
         </div>
       )}

      {/* Input Area */}
      <div className="px-4 pt-3 flex flex-col space-y-2 border-t border-[#3a3a3a] shrink-0">
        {/* Input field and Mic Button */}
        <div className="flex items-center space-x-2">
           <input
             type="text"
             value={question}
             onChange={(e) => setQuestion(e.target.value)}
             onKeyDown={(e) => { if(e.key === "Enter" && !loading && !uploadLoading){ e.preventDefault(); handleSendQuestion(); } }}
             placeholder={sessionId ? `Ask about ${uploadedFilename}...` : "Ask anything..."}
             className="h-10 rounded-full border border-[#3a3a3a] bg-transparent px-4 w-full outline-none text-white placeholder-gray-500 focus:border-[#e20074] text-sm"
             disabled={loading || uploadLoading}
           />
           {/* Microphone Button - show only if supported */}
            {recognitionRef.current && (
                <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-full border transition-colors shrink-0 ${isRecording ? 'bg-red-600 border-red-700 text-white animate-pulse' : 'bg-transparent border-[#3a3a3a] text-gray-400 hover:text-[#e20074] hover:border-[#e20074]'}`}
                    disabled={loading || uploadLoading}
                    aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    {/* SVG Microphone Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 18.75a6 6 0 0 0 6-6v-1.5a6 6 0 1 0-12 0v1.5a6 6 0 0 0 6 6Zm-4.5-6a4.5 4.5 0 1 1 9 0v1.5a4.5 4.5 0 1 1-9 0v-1.5ZM12 6.75a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 12 6.75Z" />
                    </svg>
                </button>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => handleForget(false)}
            className="h-9 rounded-full border border-[#3a3a3a] bg-transparent px-2 flex-1 text-white text-xs hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={!sessionId || loading || uploadLoading}
          >
            Forget Context
          </button>
          <button
            onClick={triggerFileInput}
            className="h-9 rounded-full border border-[#e20074] bg-[#e20074] text-white font-semibold flex-1 text-xs hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || uploadLoading}
          >
            {uploadLoading ? "Uploading..." : (sessionId ? "Upload New" : "Upload File")}
          </button>
        </div>

        {/* Display uploaded filename */}
        {uploadedFilename && sessionId && (
          <div className="pt-1 text-center text-gray-400 text-xs truncate px-2">
            Context: {uploadedFilename} ({uploadMode})
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