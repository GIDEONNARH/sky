import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Helper Components ---

const CodeBlock = ({ language, code }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    return (
        <div className="code-block-container">
            <div className="code-block-header">
                <span>{language || 'code'}</span>
                <button onClick={handleCopy} className="copy-button" title="Copy code to clipboard">
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter language={language} style={vscDarkPlus} PreTag="div">
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

const MarkdownRenderer = ({ content }) => {
    return (
        // FIX (line 38): The `className` prop on ReactMarkdown was causing a type error.
        // Moved `className` to a wrapping `div` to correctly apply styles and resolve the issue.
        <div className="prose-markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // FIX (line 41): Explicitly typing the props for the custom `code` component
                    // to resolve a TypeScript error where the `inline` property was not being inferred correctly.
                    code({ node, inline, className, children, ...props }: { node: any; inline?: boolean; className?: string; children: React.ReactNode; [key: string]: any; }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        return !inline && match ? (
                            <CodeBlock language={lang} code={String(children).replace(/\n$/, '')} />
                        ) : (
                            <code className="inline-code" {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

const SvgIcon = ({ path, className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const ICONS = {
    sun: "M12 9a3 3 0 100 6 3 3 0 000-6zm0-7a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zM5.636 6.636a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707zm12.728 12.728a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 111.414-1.414l.707.707zM3 12a1 1 0 01-1-1H1a1 1 0 110-2h1a1 1 0 011 1zm18 0a1 1 0 01-1-1h-1a1 1 0 110-2h1a1 1 0 011 1zM6.636 18.364a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707-.707zm12.728-12.728a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707.707z",
    moon: "M11.01 3.05C6.51 3.54 3 7.36 3 12c0 4.97 4.03 9 9 9 4.64 0 8.46-3.51 8.95-8.01-.41 0-.82.04-1.24.04-4.42 0-8-3.58-8-8 0-.42.04-.83.04-1.24.4-.03.8-.04 1.22-.04z",
    eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 10c-2.48 0-4.5-2.02-4.5-4.5S9.52 5.5 12 5.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z",
    star: "M12 17.27l-4.15 2.51c-.76.46-1.68-.22-1.49-1.08l1.1-4.72-3.67-3.18c-.67-.58-.31-1.68.57-1.75l4.83-.41L11.5 4.4c.34-.78 1.46-.78 1.8 0l2.05 4.69 4.83.41c.88.07 1.24 1.17.57 1.75l-3.67 3.18 1.1 4.72c.19.86-.73 1.54-1.49 1.08L12 17.27z",
    starFilled: "M12 17.27l-4.15 2.51c-.76.46-1.68-.22-1.49-1.08l1.1-4.72-3.67-3.18c-.67-.58-.31-1.68.57-1.75l4.83-.41L11.5 4.4c.34-.78 1.46-.78 1.8 0l2.05 4.69 4.83.41c.88.07 1.24 1.17.57 1.75l-3.67 3.18 1.1 4.72c.19.86-.73 1.54-1.49 1.08L12 17.27z",
    download: "M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z",
    appDownload: "M17.8,11.7l-4.2-4.2C13.2,7.1,12.7,7,12,7s-1.2,0.1-1.6,0.5l-4.2,4.2c-0.6,0.6-0.6,1.5,0,2.1c0.6,0.6,1.5,0.6,2.1,0 L11,11.1V17c0,0.8,0.7,1.5,1.5,1.5S14,17.8,14,17v-5.9l2.7,2.7c0.3,0.3,0.7,0.4,1.1,0.4s0.8-0.1,1.1-0.4 C18.3,13.2,18.3,12.2,17.8,11.7z M20,3H4C2.9,3,2,3.9,2,5v14c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V5C22,3.9,21.1,3,20,3z M20,19H4V5h16V19z",
    microphone: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-1.1.9-2 2-2s2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.84 6.42 6.25 6.92V22h1.5v-2.08C16.16 19.42 19 16.53 19 13h-2z",
    speaker: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
    speakerMuted: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
    stop: "M6 6h12v12H6z",
    play: "M8 5v14l11-7z",
    send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
    globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    translate: "M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z",
    assistant: "M19.48,12.33c-1.33-2.43-3.86-3.8-6.68-3.86C6.7,8.38,2.1,12.87,2.18,18.99c0.03,2.5,1,4.83,2.6,6.61 c-0.12-0.26-0.23-0.53-0.34-0.81c-0.34-0.86-0.53-1.8-0.53-2.8c0-3.53,2.86-6.4,6.4-6.4s6.4,2.86,6.4,6.4c0,1.31-0.39,2.52-1.07,3.55 c-0.08,0.12-0.15,0.24-0.23,0.36c2.03-1.63,3.49-4.06,3.85-6.86C22.65,16.2,21.51,13.88,19.48,12.33z M10.2,13.48 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S10.75,13.48,10.2,13.48z M14.2,13.48c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1 S14.75,13.48,14.2,13.48z M16.2,4.48c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S16.75,4.48,16.2,4.48z M12.2,2.48 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S12.75,2.48,12.2,2.48z M8.2,4.48c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1 S8.75,4.48,8.2,4.48z",
    camera: "M4 4h3l2-2h6l2 2h3v16H4V4zm8 11c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
    faceScan: "M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,4c2.21,0,4,1.79,4,4s-1.79,4-4,4s-4-1.79-4-4 S9.79,4,12,4z M12,14c-2.67,0-8,1.34-8,4v2h16v-2C20,15.34,14.67,14,12,14z M4,18c0.22-0.72,3.31-2,8-2s7.78,1.28,8,2H4z",
    fingerprint: "M12 7a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5Zm-3.56.5a1 1 0 0 0-1.03 1.71 5.5 5.5 0 0 1 0 5.58 1 1 0 0 0 1.03 1.71A7.5 7.5 0 0 0 12 20a7.5 7.5 0 0 0 3.56-1.5 1 1 0 0 0 1.03-1.71 5.5 5.5 0 0 1 0-5.58 1 1 0 0 0-1.03-1.71A7.5 7.5 0 0 0 12 4a7.5 7.5 0 0 0-3.56 1.5ZM4.11 9.5a1 1 0 0 0-1.22 1.58A9.5 9.5 0 0 0 12 22a9.5 9.5 0 0 0 9.11-10.92 1 1 0 0 0-1.22-1.58A7.5 7.5 0 0 1 12 18a7.5 7.5 0 0 1-7.89-6.5Z",
    shieldCheck: "M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm-1.05 15.54L6.41 13l1.41-1.41L10.95 14.1l4.24-4.24L16.6 11.3l-5.65 5.24z",
    dna: "M12,2c-5.33,4.55-8,8.48-8,11.91,0,3.33,2.67,6,6,6a5.4,5.4,0,0,0,4-1.92A5.4,5.4,0,0,0,18,20c3.33,0,6-2.67,6-6,0-3.43-2.67-7.36-8-11.91Z",
    code: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
    chevronDown: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
};

const App = () => {
    // --- State Management ---
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [activeTab, setActiveTab] = useState('mentor');
    const [isSecuritySuiteOpen, setIsSecuritySuiteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Mentor Chat State
    const [prompt, setPrompt] = useState('');
    const [followUpPrompt, setFollowUpPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatSession, setChatSession] = useState(null);
    const [isChatListening, setIsChatListening] = useState(false);
    const [isEditorDictating, setIsEditorDictating] = useState(false);
    const [showQuickReference, setShowQuickReference] = useState(false);

    // AI Assistant State
    const [isAssistantListening, setIsAssistantListening] = useState(false);
    const [assistantStatusText, setAssistantStatusText] = useState('');

    // Download App State
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Translation State
    const worldLanguages = {
        "Top Languages": ["English", "Spanish", "French", "German", "Chinese (Simplified)", "Japanese", "Russian", "Arabic", "Hindi", "Portuguese"],
        "Europe": ["Italian", "Dutch", "Polish", "Swedish", "Norwegian", "Danish", "Finnish", "Greek", "Ukrainian", "Czech", "Romanian", "Hungarian", "Bulgarian", "Croatian", "Serbian", "Slovak", "Slovenian", "Lithuanian", "Latvian", "Estonian", "Icelandic", "Irish", "Welsh"],
        "Asia": ["Korean", "Indonesian", "Turkish", "Vietnamese", "Thai", "Malay", "Filipino", "Bengali", "Urdu", "Persian (Farsi)", "Hebrew", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Burmese", "Khmer", "Lao", "Mongolian", "Uzbek", "Kazakh", "Georgian", "Armenian"],
        "Africa": ["Swahili", "Hausa", "Yoruba", "Igbo", "Zulu", "Afrikaans", "Amharic", "Somali", "Twi", "Ga", "Ewe", "Fante"],
        "Americas": ["Quechua", "Guarani", "Haitian Creole"],
        "Oceania": ["Fijian", "Samoan", "Maori"]
    };
    const [targetLanguage, setTargetLanguage] = useState('English');

    // Code Editor State
    const defaultEditorCode = '// Write your code here!\n// Or try the "Dictate Code" button!\nconsole.log("Hello, World!");';
    const [editorCode, setEditorCode] = useState(() => localStorage.getItem('editorCode') || defaultEditorCode);
    const [editorLanguage, setEditorLanguage] = useState(() => localStorage.getItem('editorLanguage') || 'javascript');
    const [editorResponse, setEditorResponse] = useState('');
    const [runOutput, setRunOutput] = useState('');
    const [isEditorLoading, setIsEditorLoading] = useState(false);

    // Favorites State
    const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites')) || []);
    const [showFavorites, setShowFavorites] = useState(false);

    // Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [previewTitle, setPreviewTitle] = useState('Live Preview');

    // TTS State
    const [voices, setVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(() => localStorage.getItem('selectedVoiceURI') || '');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isAutoPlayOn, setIsAutoPlayOn] = useState(true);

    // Camera State
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState('');
    const [isFingerprintScanning, setIsFingerprintScanning] = useState(false);
    const [fingerprintScanResult, setFingerprintScanResult] = useState('');
    const [showFingerprintScanner, setShowFingerprintScanner] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Biometric State
    const [isBiometricScanning, setIsBiometricScanning] = useState(false);
    const [biometricScanResult, setBiometricScanResult] = useState('');

    // Antivirus State
    const [isSystemScanning, setIsSystemScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [currentScanFile, setCurrentScanFile] = useState('');
    const [scanReport, setScanReport] = useState('');

    // Iris Scan State
    const [isIrisScanning, setIsIrisScanning] = useState(false);
    const [irisScanResult, setIrisScanResult] = useState('');
    const [irisImage, setIrisImage] = useState(null);

    // DNA State
    const [isDnaScanning, setIsDnaScanning] = useState(false);
    const [dnaScanResult, setDnaScanResult] = useState('');
    const [dnaImage, setDnaImage] = useState(null);

    const recognitionRef = useRef(null);
    const assistantRecognitionRef = useRef(null);
    const textBeforeListeningRef = useRef('');
    const editorRef = useRef(null);
    const chatLogRef = useRef(null);
    const dictationModeRef = useRef('chat'); // 'chat' or 'editor'
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // --- Effects (identical to original code) ---
    useEffect(() => {
        if (isCameraOn && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOn]);

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem('editorCode', editorCode);
    }, [editorCode]);

    useEffect(() => {
        localStorage.setItem('editorLanguage', editorLanguage);
    }, [editorLanguage]);

    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [chatHistory]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            if (dictationModeRef.current === 'chat') {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');

                const targetInputSetter = chatHistory.length > 0 ? setFollowUpPrompt : setPrompt;
                const baseText = textBeforeListeningRef.current;
                const fullMessage = baseText ? `${baseText.trim()} ${transcript}` : transcript;
                
                targetInputSetter(fullMessage);
                
                const isFinal = event.results[event.results.length - 1]?.isFinal;
                
                if (isFinal && fullMessage.trim()) {
                    if (chatHistory.length > 0) {
                        handleSendFollowUp(fullMessage.trim());
                    } else {
                        handleStartNewChat(fullMessage.trim());
                    }
                    textBeforeListeningRef.current = '';
                }
            } else if (dictationModeRef.current === 'editor') {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    handleCodeDictation(finalTranscript);
                }
            }
        };

        recognition.onend = () => {
            setIsChatListening(false);
            if(dictationModeRef.current !== 'editor' || !recognition.continuous) {
              setIsEditorDictating(false);
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                console.warn('Speech recognition ended due to no speech.');
            } else {
                console.error("Speech recognition error:", event.error);
                setError(`Speech recognition error: ${event.error}`);
            }
            setIsChatListening(false);
            setIsEditorDictating(false);
        };
    }, [chatHistory.length]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        assistantRecognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsAssistantListening(true);
            setAssistantStatusText('Listening...');
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setAssistantStatusText(transcript);
            if (event.results[0].isFinal) {
                processCommand(transcript);
            }
        };

        recognition.onend = () => {
            setIsAssistantListening(false);
            setAssistantStatusText('');
        };

        recognition.onerror = (event) => {
            console.error("Assistant speech recognition error:", event.error);
            setAssistantStatusText(`Error: ${event.error}`);
            setTimeout(() => setAssistantStatusText(''), 2000);
            setIsAssistantListening(false);
        };
    }, []);
    
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            if (!localStorage.getItem('selectedVoiceURI') && availableVoices.length > 0) {
                const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
                setSelectedVoiceURI(defaultVoice.voiceURI);
            }
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (selectedVoiceURI) {
            localStorage.setItem('selectedVoiceURI', selectedVoiceURI);
        }
    }, [selectedVoiceURI]);
    
    useEffect(() => {
        const translateExistingHistory = async () => {
            if (targetLanguage === 'English') return;

            setChatHistory(currentHistory => {
                const historyWithLoading = currentHistory.map(msg => {
                    if (msg.role === 'model' && !msg.translations[targetLanguage]) {
                        return { ...msg, isTranslating: { ...msg.isTranslating, [targetLanguage]: true } };
                    }
                    return msg;
                });

                historyWithLoading.forEach((msg, index) => {
                    if (msg.role === 'model' && msg.isTranslating?.[targetLanguage] && !msg.translations[targetLanguage]) {
                        translateText(msg.originalText, targetLanguage).then(translatedText => {
                            setChatHistory(prev => {
                                const updatedHistory = [...prev];
                                const targetMsg = updatedHistory[index];
                                if (targetMsg && targetMsg.originalText === msg.originalText) {
                                    const newIsTranslating = { ...targetMsg.isTranslating };
                                    delete newIsTranslating[targetLanguage];
                                    updatedHistory[index] = {
                                        ...targetMsg,
                                        translations: { ...targetMsg.translations, [targetLanguage]: translatedText },
                                        isTranslating: newIsTranslating
                                    };
                                }
                                return updatedHistory;
                            });
                        });
                    }
                });
                return historyWithLoading;
            });
        };
        translateExistingHistory();
    }, [targetLanguage]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                handleStopCamera();
            }
        };
    }, []);

    // --- Helper Functions (identical to original code) ---
    const translateText = async (text, language) => {
        if (!text || language === 'English') {
            return text;
        }
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Translate the following text to ${language}. Provide only the translation, without any additional comments, titles, or explanations:\n\n---\n\n${text}`,
                config: { temperature: 0.2 }
            });
            return response.text;
        } catch (err) {
            console.error(`Translation to ${language} failed:`, err);
            return `[Translation to ${language} failed]`;
        }
    };

    const handleToggleChatListening = (inputType) => {
        if (!recognitionRef.current) return;
        const recognition = recognitionRef.current;

        if (isChatListening) {
            recognition.stop();
        } else {
            dictationModeRef.current = 'chat';
            textBeforeListeningRef.current = inputType === 'main' ? prompt : followUpPrompt;
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.start();
            setIsChatListening(true);
        }
    };

    const processCodeTranscript = (text) => {
        let transcript = ` ${text.toLowerCase()} `;

        const caseCommands = [
            { trigger: 'camel case', transform: (s) => s.replace(/\s(.)/g, (m, p1) => p1.toUpperCase()) },
            { trigger: 'pascal case', transform: (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/\s(.)/g, (m, p1) => p1.toUpperCase()) },
            { trigger: 'snake case', transform: (s) => s.replace(/\s/g, '_') },
            { trigger: 'kebab case', transform: (s) => s.replace(/\s/g, '-') },
        ];

        for (const command of caseCommands) {
            const regex = new RegExp(`\\b${command.trigger}\\s+(.+?)(?:\\b|$)`, 'gi');
            transcript = transcript.replace(regex, (match, content) => {
                const words = content.split(' ').map(w => w.trim()).filter(Boolean);
                const transformed = command.transform(words.join(' '));
                return transformed.replace(/\s/g, '');
            });
        }
        
        const replacements = {
            'console dot log': 'console.log',
            'console log': 'console.log',
            'fat arrow': '=>', 'arrow function': '=>',
            'triple equals': '===', 'strictly equals': '===',
            'double equals': '==',
            'plus equals': '+=',
            'minus equals': '-=',
            'times equals': '*=',
            'divide equals': '/=',
            'not strictly equals': '!==',
            'not equals': '!=',
            'greater than or equal to': '>=',
            'less than or equal to': '<=',
            'constant': 'const',
            'function': 'function',
            'return': 'return',
            'let': 'let',
            'variable': 'var',
            'if': 'if',
            'else': 'else',
            'for': 'for',
            'while': 'while',
            'import': 'import',
            'export': 'export',
            'from': 'from',
            'class': 'class',
            'new': 'new',
            'await': 'await',
            'async': 'async',
            'period': '.', 'dot': '.',
            'comma': ',',
            'semicolon': ';',
            'colon': ':',
            'open parenthesis': '(', 'open paren': '(',
            'close parenthesis': ')', 'close paren': ')',
            'open curly brace': '{', 'open brace': '{',
            'close curly brace': '}', 'close brace': '}',
            'open bracket': '[', 'open square bracket': '[',
            'close bracket': ']', 'close square bracket': ']',
            'new line': '\n', 'enter': '\n',
            'tab': '\t',
            'equals': '=',
            'plus': '+',
            'minus': '-',
            'times': '*', 'star': '*', 'asterisk': '*',
            'divided by': '/', 'slash': '/',
            'greater than': '>',
            'less than': '<',
            'and': '&&',
            'or': '||',
            'backslash': '\\',
            'underscore': '_',
            'single quote': "'",
            'double quote': '"',
            'question mark': '?',
            'exclamation point': '!',
        };
        
        const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
            const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            transcript = transcript.replace(regex, replacements[key]);
        }

        let processedText = transcript
            .replace(/\s*(=|==|===|!=|!==|>|<|>=|<=|\+|-|\*|\/|&&|\|\||=>|\+=|-=|\*=|\/=)\s*/g, ' $1 ')
            .replace(/\s+([.,;:)\]}])/g, '$1')
            .replace(/([(\[{])\s+/g, '$1')
            .replace(/(\w)\s+(\.)\s+(\w)/g, '$1$2$3')
            .replace(/\s+/g, ' ')
            .trim();

        return processedText;
    };

    const handleCodeDictation = (transcript) => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const processedText = processCodeTranscript(transcript);

        const selection = editor.getSelection();
        const range = {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
        };
        const op = { range, text: ` ${processedText}`, forceMoveMarkers: true };
        editor.executeEdits('voice-dictation', [op]);
    };
    
    const handleToggleEditorDictation = () => {
        if (!recognitionRef.current) return;
        const recognition = recognitionRef.current;

        if (isEditorDictating) {
            recognition.stop();
        } else {
            dictationModeRef.current = 'editor';
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognition.start();
            setIsEditorDictating(true);
        }
    };

    const processCommand = async (transcript) => {
        setAssistantStatusText(`Processing: "${transcript}"`);
        setError('');
    
        try {
            const commandSchema = {
                type: Type.OBJECT,
                properties: {
                    intent: { type: Type.STRING, description: "The primary action the user wants to perform." },
                    parameters: {
                        type: Type.OBJECT,
                        description: "Parameters for the intent, if any.",
                        properties: {
                            tab: { type: Type.STRING, description: "The tab to navigate to." },
                            theme: { type: Type.STRING, description: "The theme to apply ('light' or 'dark')." },
                        },
                    },
                },
                required: ['intent'],
            };
            
            const prompt = `You are a command parser for a web application. Analyze the user's command and map it to a specific intent.
            Possible intents are: 'navigate', 'run_code', 'format_code', 'explain_code', 'debug_code', 'clear_editor', 'toggle_editor_dictation', 'change_theme', 'toggle_favorites', 'new_chat_topic', 'send_chat_message', 'unknown'.
            
            - For navigation intents like 'go to the editor' or 'show me the camera', use the intent 'navigate' and set the 'tab' parameter to one of: 'mentor', 'editor', 'camera', 'iris', 'biometric', 'antivirus', 'voice_control', 'dna'.
            - For theme changes like 'switch to dark mode', use the intent 'change_theme' and set the 'theme' parameter to 'light' or 'dark'.
            - For editor dictation, use 'toggle_editor_dictation'.
            - For favorites, use 'toggle_favorites'.
            - For chat, use 'new_chat_topic' or 'send_chat_message'.
            - For other actions, just return the intent.
            - If the command is ambiguous or not recognized, use the intent 'unknown'.
    
            User command: "${transcript}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: commandSchema,
                },
            });
    
            const commandData = JSON.parse(response.text);
            
            const executeCommand = (action) => {
                action();
                setAssistantStatusText('');
            };
            
            switch (commandData.intent) {
                case 'navigate':
                    if (commandData.parameters?.tab) {
                        executeCommand(() => setActiveTab(commandData.parameters.tab));
                    }
                    break;
                case 'change_theme':
                     if (commandData.parameters?.theme) {
                        executeCommand(() => setTheme(commandData.parameters.theme));
                    }
                    break;
                case 'run_code':
                    executeCommand(() => { setActiveTab('editor'); handleRunCode(); });
                    break;
                case 'format_code':
                    executeCommand(() => { setActiveTab('editor'); handleFormatCode(); });
                    break;
                case 'explain_code':
                    executeCommand(() => { setActiveTab('editor'); handleEditorAction('explain'); });
                    break;
                case 'debug_code':
                    executeCommand(() => { setActiveTab('editor'); handleEditorAction('debug'); });
                    break;
                case 'clear_editor':
                    executeCommand(() => { setActiveTab('editor'); handleClearEditor(); });
                    break;
                case 'toggle_editor_dictation':
                    executeCommand(() => { setActiveTab('editor'); handleToggleEditorDictation(); });
                    break;
                case 'toggle_favorites':
                    executeCommand(() => setShowFavorites(prev => !prev));
                    break;
                case 'new_chat_topic':
                    executeCommand(() => handleNewTopic());
                    break;
                case 'send_chat_message':
                     executeCommand(() => {
                        if (activeTab === 'mentor') {
                            chatHistory.length > 0 ? handleSendFollowUp() : handleStartNewChat();
                        }
                    });
                    break;
                default:
                    setAssistantStatusText(`Unknown command: "${transcript}"`);
                    setTimeout(() => setAssistantStatusText(''), 2000);
            }
    
        } catch (err) {
            console.error("Error processing command:", err);
            setAssistantStatusText("Sorry, I couldn't understand that.");
            setTimeout(() => setAssistantStatusText(''), 2000);
        }
    };

    const handleToggleAssistantListening = () => {
        if (!assistantRecognitionRef.current) return;
        if (isAssistantListening) {
            assistantRecognitionRef.current.stop();
        } else {
            assistantRecognitionRef.current.start();
        }
    };
    
    const playText = (text) => {
        if (!text || voices.length === 0) return;
        window.speechSynthesis.cancel(); 

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setError("An error occurred during speech synthesis.");
            setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
    };

    const addModelResponseToChat = async (responseText) => {
        const modelMessage = {
            role: 'model',
            originalText: responseText,
            translations: {},
            isTranslating: {},
            displayOriginal: false,
        };

        setChatHistory(prev => [...prev, modelMessage]);

        if (targetLanguage !== 'English') {
            setChatHistory(prev => prev.map(msg => 
                msg.originalText === responseText 
                ? { ...msg, isTranslating: { ...msg.isTranslating, [targetLanguage]: true } } 
                : msg
            ));
            
            const translatedText = await translateText(responseText, targetLanguage);
            
            setChatHistory(prev => prev.map(msg => {
                if (msg.originalText === responseText) {
                    const newIsTranslating = { ...msg.isTranslating };
                    delete newIsTranslating[targetLanguage];
                    return { 
                        ...msg, 
                        translations: { ...msg.translations, [targetLanguage]: translatedText }, 
                        isTranslating: newIsTranslating 
                    };
                }
                return msg;
            }));

            if (isAutoPlayOn) {
                playText(translatedText);
            }
        } else {
            if (isAutoPlayOn) {
                playText(responseText);
            }
        }
    };

    const handleStartNewChat = async (message?: string) => {
        const promptToSend = typeof message === 'string' ? message : prompt;
        if (!promptToSend.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        
        const newChatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are an expert AI Code Mentor. Your primary role is to teach mobile app development for iOS and Android. Provide clear, accurate guidance on UI/UX principles, platform-specific APIs (like camera, location), and modern frameworks like React Native and Flutter. You are also an expert in general software development, cybersecurity, Kali Linux, Parrot OS, and Parrot Security. Always focus on best practices, code security, and clear explanations. Do not provide information on hacking or unethical activities."
            },
        });
        setChatSession(newChatSession);
        
        const userMessage = { role: 'user', text: promptToSend };
        setChatHistory([userMessage]);
        
        if (typeof message === 'string') {
            setPrompt('');
        }

        setIsLoading(true);
        setError('');
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPreviewing(false);

        try {
            const result = await newChatSession.sendMessage({ message: promptToSend });
            await addModelResponseToChat(result.text);
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again or start a new topic.');
            setChatHistory(prev => [...prev, { role: 'model', originalText: 'An error occurred. Please try again.', translations: {}, isTranslating: {}, displayOriginal: false }]);
        }
        setIsLoading(false);
    };

    const handleSendFollowUp = async (message?: string) => {
        const messageToSend = typeof message === 'string' ? message : followUpPrompt;
        if (!messageToSend.trim() || !chatSession) return;
        
        const userMessage = { role: 'user', text: messageToSend };
        setChatHistory(prev => [...prev, userMessage]);
        setFollowUpPrompt('');
        
        setIsLoading(true);
        setError('');
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPreviewing(false);

        try {
            const result = await chatSession.sendMessage({ message: messageToSend });
            await addModelResponseToChat(result.text);
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again or start a new topic.');
        }
        setIsLoading(false);
    };

    const handleNewTopic = () => {
        setPrompt('');
        setFollowUpPrompt('');
        setChatHistory([]);
        setChatSession(null);
        setError('');
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPreviewing(false);
        if (isChatListening) {
            recognitionRef.current.stop();
        }
    };

    const handleEditorAction = async (action) => {
        if (!editorCode.trim()) return;
        setIsEditorLoading(true);
        setEditorResponse('');
        setRunOutput('');
        
        let actionPrompt = '';
        if (action === 'explain') actionPrompt = `Explain the following ${editorLanguage} code:\n\n\`\`\`${editorLanguage}\n${editorCode}\n\`\`\``;
        if (action === 'debug') actionPrompt = `Debug the following ${editorLanguage} code. Identify any errors or potential issues and suggest fixes:\n\n\`\`\`${editorLanguage}\n${editorCode}\n\`\`\``;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: actionPrompt,
            });
            setEditorResponse(response.text);
        } catch (err) {
            setEditorResponse('An error occurred. Please try again.');
        }
        setIsEditorLoading(false);
    };
    
    const handleInEditorAIAction = async (action) => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();
        const selectedText = model.getValueInRange(selection);

        if (!selectedText.trim()) {
            return; 
        }

        setIsEditorLoading(true);
        setEditorResponse('');
        setRunOutput('');

        let actionPrompt = '';
        if (action === 'explain') {
            actionPrompt = `Explain the following ${editorLanguage} code snippet:\n\n\`\`\`${editorLanguage}\n${selectedText}\n\`\`\``;
        } else if (action === 'debug') {
            actionPrompt = `Find potential bugs in the following ${editorLanguage} code snippet:\n\n\`\`\`${editorLanguage}\n${selectedText}\n\`\`\``;
        } else {
            setIsEditorLoading(false);
            return;
        }

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: actionPrompt,
            });
            setEditorResponse(response.text);
        } catch (err) {
            console.error("In-editor AI action error:", err);
            setEditorResponse('An error occurred with the AI action. Please try again.');
        }
        setIsEditorLoading(false);
    };

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        editor.addAction({
            id: 'ai-explain-selection',
            label: 'AI: Explain Selection',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: () => handleInEditorAIAction('explain'),
        });

        editor.addAction({
            id: 'ai-debug-selection',
            label: 'AI: Debug Selection',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.6,
            run: () => handleInEditorAIAction('debug'),
        });
    };

    const handleFormatCode = () => {
        if (editorRef.current) {
            editorRef.current.getAction('editor.action.formatDocument').run();
        }
    };
    
    const handleRunCode = () => {
        if (editorLanguage !== 'javascript') {
            setRunOutput('Run is currently only supported for JavaScript.');
            return;
        }
        setRunOutput('');
        const oldLog = console.log;
        let output = [];
        console.log = (...args) => {
            output.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' '));
        };
        try {
            new Function(editorCode)();
            setRunOutput(output.join('\n') || 'Code executed successfully with no console output.');
        } catch (e) {
            setRunOutput(`Error: ${e.message}`);
        } finally {
            console.log = oldLog;
        }
    };

    const handleSaveFavorite = () => {
        const lastUserPrompt = [...chatHistory].reverse().find(m => m.role === 'user')?.text;
        if (lastUserPrompt && chatHistory.length > 1) {
             if (!favorites.some(fav => fav.title === lastUserPrompt)) {
                setFavorites([...favorites, { title: lastUserPrompt, history: chatHistory }]);
            }
        }
    };
    
    const handleDownload = () => {
        if (chatHistory.length === 0) return;

        const content = chatHistory.map(entry => {
            const text = entry.role === 'user' ? entry.text : entry.originalText;
            return `## ${entry.role === 'user' ? 'You' : 'AI Mentor'}\n\n${text}`
        }).join('\n\n---\n\n');
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-chat-history.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleToggleDisplayOriginal = (index) => {
        setChatHistory(prev => prev.map((msg, i) => i === index ? { ...msg, displayOriginal: !msg.displayOriginal } : msg));
    };

    const handlePreviewCode = (content) => {
        const getCode = (lang, text) => {
            const regex = new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g");
            const matches = [...text.matchAll(regex)];
            return matches.map(match => match[1]).join('\n');
        };

        const html = getCode('html', content);
        const css = getCode('css', content);
        const js = getCode('javascript', content);

        const foundLangs = [];
        if (html) foundLangs.push('HTML');
        if (css) foundLangs.push('CSS');
        if (js) foundLangs.push('JavaScript');
        
        setPreviewTitle(`Live Preview: ${foundLangs.join(', ')}`);

        const docContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
            </html>
        `;
        setPreviewContent(docContent);
        setShowPreview(true);
    };
    
    const handleEditorPreview = () => {
        if (editorLanguage !== 'html') return;
        setPreviewTitle('Editor Code Preview');
        setPreviewContent(editorCode);
        setShowPreview(true);
    };

    const handleEditorDownload = () => {
        if (!editorCode) return;
        const extensionMap = {
            javascript: 'js',
            python: 'py',
            html: 'html',
            css: 'css',
            java: 'java',
            cpp: 'cpp',
            typescript: 'ts',
            rust: 'rs',
            kotlin: 'kt',
            go: 'go',
            ruby: 'rb',
            swift: 'swift',
            php: 'php',
            csharp: 'cs',
            dart: 'dart'
        };
        const extension = extensionMap[editorLanguage] || 'txt';
        const filename = `my-code.${extension}`;
        
        const blob = new Blob([editorCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleClearEditor = () => {
        setEditorCode(defaultEditorCode);
        setEditorLanguage('javascript');
        setEditorResponse('');
        setRunOutput('');
    };

    const handleSpeakToggle = (text) => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            playText(text);
        }
    };

    const handlePreviewToggle = () => {
        if (isPreviewing) {
            window.speechSynthesis.cancel();
            setIsPreviewing(false);
            return;
        }

        if (voices.length === 0) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        const utterance = new SpeechSynthesisUtterance("Hello, this is the selected voice.");
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }

        utterance.onstart = () => setIsPreviewing(true);
        utterance.onend = () => setIsPreviewing(false);
        utterance.onerror = () => {
            setError("An error occurred during voice preview.");
            setIsPreviewing(false);
        };
        window.speechSynthesis.speak(utterance);
    };

    const loadFavorite = (fav) => {
        const historyToLoad = fav.history.map(item => {
            if (item.parts) {
                if (item.role === 'user') {
                    return { role: 'user', text: item.parts[0].text };
                } else {
                    return {
                        role: 'model',
                        originalText: item.parts[0].text,
                        translations: {},
                        isTranslating: {},
                        displayOriginal: false,
                    };
                }
            }
            return item;
        });

        setChatHistory(historyToLoad);
        setActiveTab('mentor');
        setShowFavorites(false);
    };

    const handleStartCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = stream;
                setIsCameraOn(true);
                setError('');
            } catch (err) {
                console.error("Error accessing camera: ", err);
                setError("Could not access the camera. Please check permissions and try again.");
                setIsCameraOn(false);
            }
        } else {
            setError("Your browser does not support camera access.");
        }
    };

    const handleStopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        streamRef.current = null;
        setIsCameraOn(false);
        setZoomLevel(1); 
    };

    const handleCapturePhoto = () => {
        if (!isCameraOn || !videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        handleClearCapture(false);
    };
    
    const handleFaceScan = async () => {
        if (!isCameraOn || !videoRef.current || !canvasRef.current) return;
    
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
    
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        handleClearCapture(false);
    
        setIsScanning(true);
        setError('');
    
        try {
            const base64Data = dataUrl.split(',')[1];
            const imagePart = {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Data
                }
            };
    
            const textPart = {
                text: "You are a high-tech digital identity analysis system. The user has provided an image of a person. Do NOT focus on ethnicity or make subjective judgements. Instead, generate a fictional but plausible 'Digital Identity Profile'. The profile must include: a fictional Full Name, a unique alphanumeric ID (e.g., 'ID-852-C4-XF7'), a Status (e.g., 'Verified', 'Restricted Access'), a Security Clearance Level (e.g., 'Gamma-3'), and a brief 'Biometric & Psychological Summary' (2-3 sentences with a futuristic, analytical tone, e.g., 'Iris patterns suggest high aptitude for spatial reasoning. Vocal stress analysis indicates a calm disposition under pressure.'). Present the output in a clean, structured format using Markdown."
            };
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
    
            setScanResult(response.text);
    
        } catch (err) {
            console.error("Face scan failed:", err);
            setError("An error occurred during the face scan. Please try again.");
            setScanResult('');
        } finally {
            setIsScanning(false);
        }
    };
    
    const handleFingerprintScan = async () => {
        setIsFingerprintScanning(true);
        setShowFingerprintScanner(true);
        handleClearCapture(false);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "You are a creative personality analyst specializing in palmistry and fingerprint analysis. A fingerprint has been scanned. Based on common fingerprint archetypes (like loops, whorls, and arches), generate a fun and insightful personality analysis. Do not mention that the scan is hypothetical. The analysis should be 2-3 paragraphs long and have a slightly mystical, encouraging tone. Start with a title like '### Fingerprint Personality Analysis'. Present the output using Markdown.",
            });
            setFingerprintScanResult(response.text);
        } catch (err) {
            console.error("Fingerprint scan failed:", err);
            setError("An error occurred during the fingerprint analysis. Please try again.");
            setFingerprintScanResult('');
        } finally {
            setIsFingerprintScanning(false);
        }
    };

    const handleClearCapture = (clearAll = true) => {
        if (clearAll) {
            setCapturedImage(null);
            setShowFingerprintScanner(false);
        }
        setScanResult('');
        setFingerprintScanResult('');
        setError('');
    };

    const handleBiometricScan = async () => {
        setIsBiometricScanning(true);
        setBiometricScanResult('');
        setError('');

        await new Promise(resolve => setTimeout(resolve, 4000));

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Generate a comprehensive 'Multi-Factor Biometric Authentication Report'. The system has hypothetically just analyzed a subject's iris patterns, voiceprint, and heart-rate variability. The report should be professional and futuristic, summarizing the findings. Occasionally, identify a minor, fictional 'biometric anomaly' (e.g., 'Subtle tachycardic fluctuations,' 'Micro-tremors in vocal pattern'). If an anomaly is found, add a section called 'Biometric Anomalies & Potential Risks' and briefly explain a hypothetical associated risk. If no anomalies are found, omit this section. Always include sections for: 'Identity Confirmation', 'Overall Threat Assessment' (e.g., 'Low', 'Nominal'), and a 'System Recommendation' (e.g., 'Access Granted', 'Further Verification Required'). Use Markdown for clear formatting.",
            });
            setBiometricScanResult(response.text);
        } catch (err) {
            console.error("Biometric scan failed:", err);
            setError("An error occurred during the biometric analysis. Please try again.");
            setBiometricScanResult('');
        } finally {
            setIsBiometricScanning(false);
        }
    };

    const handleSystemScan = async () => {
        setIsSystemScanning(true);
        setScanReport('');
        setScanProgress(0);
        setCurrentScanFile('');
        setError('');

        const dummyFiles = [
            '/usr/bin/systemd',
            '/var/log/syslog',
            '/etc/passwd',
            '/home/user/.bashrc',
            '/lib/x86_64-linux-gnu/libc.so.6',
            '/tmp/data.tmp',
            '/boot/vmlinuz-5.15.0-generic',
            '/usr/share/doc/python3/copyright',
            '/var/cache/apt/pkgcache.bin',
            '/proc/cpuinfo'
        ];

        const scanInterval = setInterval(() => {
            setScanProgress(prev => {
                const next = prev + 10;
                if (next >= 100) {
                    clearInterval(scanInterval);
                    setCurrentScanFile('Finalizing scan...');
                    return 100;
                }
                setCurrentScanFile(dummyFiles[Math.floor(next / 10)] || 'Initializing...');
                return next;
            });
        }, 500);

        await new Promise(resolve => setTimeout(resolve, 5500));

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Generate a professional-looking security report for a system that has just been scanned by an AI antivirus. The scan has completed successfully and found no threats. The report should be reassuring and include sections like 'Scan Summary', 'Threats Detected', and 'Recommendations'. Use Markdown formatting, including bullet points for key details.",
            });
            setScanReport(response.text);
        } catch (err) {
            console.error("System scan failed:", err);
            setError("An error occurred during the system scan analysis. Please try again.");
            setScanReport('');
        } finally {
            setIsSystemScanning(false);
        }
    };
    
    const handleIrisScan = async () => {
        if (!isCameraOn || !videoRef.current) return;

        setIsIrisScanning(true);
        setIrisScanResult('');
        setIrisImage(null);
        setError('');

        await new Promise(resolve => setTimeout(resolve, 4000));

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setIrisImage(dataUrl);

        try {
            const base64Data = dataUrl.split(',')[1];
            const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
            const textPart = { text: "You are a high-tech security identification system. The user has provided an image captured during a simulated iris scan. Do NOT describe the person or the image. Instead, generate a fictional 'Digital Identity Profile' based on this scan. The profile must include: a unique alphanumeric ID (e.g., 'ID-734-B1-XT9'), a fictional full name, a security clearance level (e.g., 'Alpha-7 Clearance'), and a short 'Bio-Signature Summary' (1-2 sentences with futuristic jargon, e.g., 'Quantum-entangled neural pathways indicate high aptitude for complex problem-solving.'). Present the output in a clean, structured format using Markdown." };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });

            setIrisScanResult(response.text);
            playText(response.text);

        } catch (err) {
            console.error("Iris scan failed:", err);
            setError("An error occurred during the iris analysis. Please try again.");
            setIrisScanResult('');
        } finally {
            setIsIrisScanning(false);
            handleStopCamera();
        }
    };

    const handleClearIrisScan = () => {
        setIrisImage(null);
        setIrisScanResult('');
        setError('');
    };

    const handleDnaScan = async () => {
        if (!isCameraOn || !videoRef.current) return;
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setDnaImage(dataUrl);

        setIsDnaScanning(true);
        setDnaScanResult('');
        setError('');

        try {
            const base64Data = dataUrl.split(',')[1];
            const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
            const textPart = { text: "You are a futuristic DNA analysis machine. The user has provided an image of what is hypothetically a blood sample. Analyze this image and generate a detailed 'Genetic & Health Profile'. Do not identify the object in the image (it's just a prop). Instead, create a fictional report including sections like: Ancestry Composition (be creative with futuristic regions), Health & Wellness Insights (suggesting predispositions to things like 'increased caffeine metabolism' or 'aptitude for spatial reasoning'), and a Fun Fact based on the 'genetic markers'. The tone should be scientific, professional, and slightly futuristic. Use Markdown for formatting." };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });

            setDnaScanResult(response.text);

        } catch (err) {
            console.error("DNA scan failed:", err);
            setError("An error occurred during the DNA analysis. Please try again.");
            setDnaScanResult('');
        } finally {
            setIsDnaScanning(false);
        }
    };

    const handleClearDnaScan = () => {
        setDnaImage(null);
        setDnaScanResult('');
        setError('');
    };

    const fileContents = {
        // NOTE: This is a simplified version for brevity. In a real build, this would be auto-populated.
        // The actual downloadable code is the full source of this component.
        tsx: `// This is a placeholder for the full App source code. 
// The live app dynamically populates this with its own source.
import React from 'react';
import { createRoot } from 'react-dom/client';
// ... more imports

const App = () => {
  // ... all app logic and state
  return <div>AI Code Mentor</div>;
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Code Mentor</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; }
        #root, body, html { height: 100%; width: 100%; overflow: hidden; }
    </style>
<script type="importmap">
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.27.0",
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react-syntax-highlighter": "https://aistudiocdn.com/react-syntax-highlighter@^15.5.0",
    "react-syntax-highlighter/": "https://aistudiocdn.com/react-syntax-highlighter@^15.5.0/",
    "@monaco-editor/react": "https://aistudiocdn.com/@monaco-editor/react@^4.6.0",
    "react-markdown": "https://aistudiocdn.com/react-markdown@^9.0.1",
    "react-markdown/": "https://aistudiocdn.com/react-markdown@^9.0.1/",
    "remark-gfm": "https://aistudiocdn.com/remark-gfm@^4.0.0",
    "remark-gfm/": "https://aistudiocdn.com/remark-gfm@^4.0.0/"
  }
}
</script>
</head>
<body><div id="root"></div><script type="module" src="index.tsx"></script></body>
</html>`,
        json: `{
  "description": "Generated by Gemini.",
  "requestFramePermissions": ["microphone", "camera"],
  "name": "Ai code mentor App"
}`
    };

    // --- RENDER FUNCTIONS FOR EACH TAB ---
    const renderMentorTab = () => (
        <>
            <div className="prompt-area">
                <div className="textarea-container">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ask about mobile app dev (iOS/Android), React Native, Flutter..."
                        rows={3}
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => handleToggleChatListening('main')} 
                        className={`mic-button ${isChatListening ? 'listening' : ''}`}
                        title={isChatListening ? 'Stop listening' : 'Start listening'}
                        disabled={isLoading || !recognitionRef.current || isAssistantListening}
                    >
                        <SvgIcon path={ICONS.microphone} />
                    </button>
                </div>
                <div className="button-group">
                    <button onClick={() => handleStartNewChat()} disabled={isLoading || !prompt} className="button">
                        {isLoading ? 'Generating...' : 'Get Explanation'}
                    </button>
                    <button onClick={handleNewTopic} className="button secondary-button" disabled={isLoading}>
                        New Topic
                    </button>
                    <button onClick={() => setShowQuickReference(!showQuickReference)} className="button secondary-button">
                        {showQuickReference ? 'Hide' : 'Show'} OS Cheatsheet
                    </button>
                </div>
            </div>

            {showQuickReference && (
                <div className="quick-reference-panel">
                    <h2>Kali & Parrot OS Quick Reference</h2>
                    <div className="quick-reference-section"><h3>Network Scanning (Nmap)</h3><ul><li><code>nmap -sP 192.168.1.0/24</code> - Ping scan for live hosts.</li><li><code>nmap -sS -p- 192.168.1.1</code> - Stealthy TCP SYN scan on all ports.</li><li><code>nmap -sV -A 192.168.1.1</code> - Version detection, OS fingerprinting, script scanning.</li></ul></div>
                    <div className="quick-reference-section"><h3>Web Application Analysis</h3><ul><li><code>gobuster dir -u http://target.com -w wordlist.txt</code> - Brute-force directories and files.</li><li><code>nikto -h http://target.com</code> - Scan for web server vulnerabilities.</li><li><code>sqlmap -u "http://target.com/page?id=1" --dbs</code> - Detect and exploit SQL injection flaws.</li></ul></div>
                    <div className="quick-reference-section"><h3>Exploitation & Password Cracking</h3><ul><li><code>msfconsole</code> - Launch the Metasploit Framework.</li><li><code>hydra -l user -P pass.txt ssh://target.com</code> - Brute-force a login.</li><li><code>john --wordlist=pass.txt hash.txt</code> - Crack password hashes with John the Ripper.</li></ul></div>
                </div>
            )}
            
            <div className="chat-log-container" ref={chatLogRef}>
                {chatHistory.map((entry, index) => {
                    if (entry.role === 'user') {
                        return (
                            <div key={index} className="message-bubble user-message">
                                <MarkdownRenderer content={entry.text} />
                            </div>
                        );
                    }
                    if (entry.role === 'model') {
                        const isLastModelMessage = index === chatHistory.length - 1;
                        const lastUserPrompt = [...chatHistory].reverse().find(m => m.role === 'user')?.text;
                        const isFavorited = favorites.some(fav => fav.title === lastUserPrompt);
                        let content = entry.displayOriginal || targetLanguage === 'English' ? entry.originalText : (entry.translations[targetLanguage] || entry.originalText);
                        if (!entry.displayOriginal && targetLanguage !== 'English' && entry.isTranslating?.[targetLanguage]) {
                            content += `\n\n---\n*Translating to ${targetLanguage}...*`;
                        }
                        const isPreviewable = entry.originalText.includes('```html') || entry.originalText.includes('```css') || entry.originalText.includes('```javascript');
                        return (
                            <div key={index} className="message-bubble model-message">
                                <div className="output-controls">
                                    <div className="voice-controls">
                                        <button onClick={() => handleSpeakToggle(content)} title={isSpeaking ? "Stop Reading" : "Read Aloud"} disabled={isPreviewing || voices.length === 0}><SvgIcon path={isSpeaking ? ICONS.stop : ICONS.speaker} /></button>
                                        <select value={selectedVoiceURI} onChange={(e) => setSelectedVoiceURI(e.target.value)} disabled={isSpeaking || isPreviewing || voices.length === 0}>
                                            {voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{`${voice.name} (${voice.lang})`}</option>)}
                                        </select>
                                        <button onClick={handlePreviewToggle} title={isPreviewing ? "Stop Preview" : "Preview Voice"} disabled={isSpeaking || voices.length === 0}><SvgIcon path={isPreviewing ? ICONS.stop : ICONS.play} /></button>
                                    </div>
                                    {isLastModelMessage && (
                                        <div className="action-controls">
                                            {targetLanguage !== 'English' && entry.translations[targetLanguage] && (<button onClick={() => handleToggleDisplayOriginal(index)} title={entry.displayOriginal ? 'Show Translation' : 'Show Original'}><SvgIcon path={ICONS.translate} /></button>)}
                                            {isPreviewable && <button onClick={() => handlePreviewCode(entry.originalText)} title="Preview Code"><SvgIcon path={ICONS.eye} /></button>}
                                            <button onClick={handleSaveFavorite} disabled={isFavorited} title="Save Conversation"><SvgIcon path={isFavorited ? ICONS.starFilled : ICONS.star} /></button>
                                            <button onClick={handleDownload} title="Download Chat"><SvgIcon path={ICONS.download} /></button>
                                        </div>
                                    )}
                                </div>
                                <MarkdownRenderer content={content} />
                            </div>
                        );
                    }
                    return null;
                })}
                {isLoading && chatHistory.length > 0 && <div className="message-bubble model-message">Thinking...</div>}
            </div>

            {chatHistory.length > 0 && !isLoading && (
                <div className="follow-up-area">
                    <div className="follow-up-input">
                        <div className="textarea-container">
                            <textarea value={followUpPrompt} onChange={(e) => setFollowUpPrompt(e.target.value)} placeholder="Ask a follow-up question..." rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendFollowUp(); } }} />
                            <button onClick={() => handleToggleChatListening('followup')} className={`mic-button ${isChatListening ? 'listening' : ''}`} title={isChatListening ? 'Stop listening' : 'Start listening'} disabled={!recognitionRef.current || isAssistantListening}><SvgIcon path={ICONS.microphone} /></button>
                        </div>
                        <button onClick={() => handleSendFollowUp()} disabled={!followUpPrompt} className="button"><SvgIcon path={ICONS.send} className="w-5 h-5" /></button>
                    </div>
                </div>
            )}
            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </>
    );

    const renderEditorTab = () => (
        <div>
            <div className="editor-controls">
                <select value={editorLanguage} onChange={(e) => setEditorLanguage(e.target.value)}>
                    <option value="javascript">JavaScript</option><option value="typescript">TypeScript</option><option value="python">Python</option><option value="html">HTML</option><option value="css">CSS</option><option value="java">Java</option><option value="cpp">C++</option><option value="php">PHP</option><option value="csharp">C#</option><option value="dart">Dart</option><option value="rust">Rust</option><option value="kotlin">Kotlin</option><option value="go">Go</option><option value="ruby">Ruby</option><option value="swift">Swift</option>
                </select>
                <div className="monaco-editor-container">
                    <Editor height="40vh" language={editorLanguage} value={editorCode} onChange={(value) => setEditorCode(value || '')} theme={theme === 'dark' ? 'vs-dark' : 'light'} options={{ minimap: { enabled: false }, fontSize: 14 }} onMount={handleEditorDidMount} />
                </div>
                <div className="button-group">
                    <button onClick={handleRunCode} className="button" disabled={isEditorLoading || editorLanguage !== 'javascript'}>Run Code</button>
                    <button onClick={handleEditorPreview} className="button" disabled={isEditorLoading || editorLanguage !== 'html'}>Preview Code</button>
                    <button onClick={handleEditorDownload} className="button" disabled={isEditorLoading || !editorCode}>Download Code</button>
                    <button onClick={() => handleEditorAction('explain')} className="button secondary-button" disabled={isEditorLoading}>Explain Code</button>
                    <button onClick={() => handleEditorAction('debug')} className="button secondary-button" disabled={isEditorLoading}>Debug Code</button>
                    <button onClick={handleFormatCode} className="button secondary-button" disabled={isEditorLoading}>Format Code</button>
                    <button onClick={handleToggleEditorDictation} className={`button secondary-button ${isEditorDictating ? 'listening' : ''}`} disabled={isEditorLoading || !recognitionRef.current || isAssistantListening} title={isEditorDictating ? 'Stop Dictation' : 'Start Dictation'}>
                        <SvgIcon path={ICONS.microphone} />{isEditorDictating ? 'Dictating...' : 'Dictate Code'}
                    </button>
                    <button onClick={handleClearEditor} className="button secondary-button" disabled={isEditorLoading}>Clear Editor</button>
                </div>
            </div>
            {(!isEditorLoading && !editorResponse && !runOutput) ? (
                <div className="editor-output-placeholder">
                    <p>AI responses and code output will appear here.</p>
                    <p><strong>Pro Tip:</strong> Select code in the editor, right-click, and choose an AI action.</p>
                </div>
            ) : (
                <div className="editor-output-area">
                    {isEditorLoading && <p>Loading...</p>}
                    {runOutput && <><h3>Run Output</h3><pre className="run-output">{runOutput}</pre></>}
                    {editorResponse && <><h3>AI Response</h3><MarkdownRenderer content={editorResponse} /></>}
                </div>
            )}
        </div>
    );
    
    const renderVoiceControlTab = () => (
        <div className="voice-control-hub">
            <h2>Voice Control Hub</h2>
            <p>Use your voice to navigate and control the app with natural language.</p>
            <div className="button-group" style={{ justifyContent: 'center', margin: '2rem 0' }}>
                <button onClick={handleToggleAssistantListening} className={`button ${isAssistantListening ? 'listening' : ''}`} style={{ padding: '1.5rem', fontSize: '1.2rem', minWidth: '200px' }} disabled={!assistantRecognitionRef.current || isChatListening || isEditorDictating}>
                    <SvgIcon path={ICONS.microphone} />
                    {isAssistantListening ? 'Listening...' : (assistantStatusText ? `Processing...` : 'Tap and Speak')}
                </button>
            </div>
            <h3>Example Commands:</h3>
            <ul>
                <li>"Navigate to the code editor."</li><li>"Can you show me the camera?"</li><li>"Switch to light mode."</li><li>"Turn on the dark theme."</li><li>"Run the current code."</li><li>"Execute this script."</li><li>"Please explain this."</li><li>"Debug my code."</li><li>"Start a new chat."</li><li>"Let's talk about something else."</li><li>"Show me the iris scanner."</li><li>"Open the antivirus tab."</li>
            </ul>
        </div>
    );

    const renderCameraTab = () => (
         <div>
            <div className="button-group" style={{ marginBottom: '1rem' }}>
                {!isCameraOn ? (<button onClick={handleStartCamera} className="button">Start Camera</button>) : (<button onClick={handleStopCamera} className="button secondary-button">Stop Camera</button>)}
                <button onClick={handleCapturePhoto} className="button" disabled={!isCameraOn || isScanning || isFingerprintScanning || showFingerprintScanner}><SvgIcon path={ICONS.camera} /> Capture Photo</button>
                <button onClick={handleFaceScan} className="button" disabled={!isCameraOn || isScanning || isFingerprintScanning}><SvgIcon path={ICONS.faceScan} /> {isScanning ? 'Scanning...' : 'Scan Face for ID'}</button>
                <button onClick={handleFingerprintScan} className="button" disabled={isScanning || isFingerprintScanning}><SvgIcon path={ICONS.fingerprint} /> {isFingerprintScanning ? 'Scanning...' : 'Scan Fingerprint'}</button>
            </div>
            {!showFingerprintScanner && (
                <>
                    <div className="camera-view">
                        {isCameraOn ? (<video ref={videoRef} autoPlay playsInline muted style={{ transform: `scale(${zoomLevel}) scaleX(-1)` }}></video>) : (<div className="camera-placeholder"><p>Camera is off</p></div>)}
                    </div>
                    {isCameraOn && (
                        <div className="zoom-slider-container">
                            <span>1x</span><input type="range" min="1" max="4" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} title="Camera Zoom"/><span>4x</span>
                        </div>
                    )}
                </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            {showFingerprintScanner && (
                <div className="captured-image-container">
                    <div className="fingerprint-scanner">
                        <SvgIcon path={ICONS.fingerprint} className="fingerprint-icon-bg" />
                        {isFingerprintScanning && <div className="scan-line"></div>}
                    </div>
                    {isFingerprintScanning && (<div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><p>Analyzing hypothetical fingerprint patterns...</p></div>)}
                    {fingerprintScanResult && !isFingerprintScanning && (<div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><MarkdownRenderer content={fingerprintScanResult} /></div>)}
                </div>
            )}
            {capturedImage && !showFingerprintScanner && (
                <div className="captured-image-container">
                    <div className="ar-image-wrapper">
                        <img src={capturedImage} alt="Captured" style={{ transform: 'scaleX(-1)' }} />
                        {scanResult && !isScanning && (<div className="ar-effect-overlay"></div>)}
                    </div>
                    {isScanning && (<div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><p>Analyzing image...</p></div>)}
                    {scanResult && !isScanning && (<div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><h3>Digital Identity Profile</h3><MarkdownRenderer content={scanResult} /></div>)}
                </div>
            )}
            {(capturedImage || showFingerprintScanner) && (<div className="button-group" style={{ justifyContent: 'center', marginTop: '1rem' }}><button onClick={() => handleClearCapture(true)} className="button secondary-button">Clear Results</button></div>)}
            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
    
    const renderIrisTab = () => (
        <div>
            <div className="button-group" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
                {!isCameraOn && !irisImage ? (<button onClick={handleStartCamera} className="button">Start Camera</button>) : null}
                {isCameraOn && !irisImage ? (<button onClick={handleStopCamera} className="button secondary-button">Stop Camera</button>) : null}
                <button onClick={handleIrisScan} className="button" disabled={!isCameraOn || isIrisScanning}><SvgIcon path={ICONS.eye} />{isIrisScanning ? 'Scanning...' : 'Scan Iris for ID'}</button>
            </div>
            <div className="camera-view">
                {isCameraOn ? (
                    <>
                        <video ref={videoRef} autoPlay playsInline muted style={{ transform: `scale(${zoomLevel}) scaleX(-1)` }}></video>
                        {isIrisScanning && (<div className="iris-scan-overlay"><div className="iris-reticle"><div className="iris-scan-line"></div></div></div>)}
                    </>
                ) : (!irisImage && (<div className="camera-placeholder"><p>Camera is off. Start camera to perform iris scan.</p></div>))}
            </div>
            {isCameraOn && (
                <div className="zoom-slider-container">
                    <span>1x</span><input type="range" min="1" max="4" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} title="Camera Zoom"/><span>4x</span>
                </div>
            )}
            {irisImage && (
                <div className="captured-image-container">
                    {isIrisScanning && <p>Analyzing biometric signature...</p>}
                    <img src={irisImage} alt="Captured Iris Scan" style={{ transform: `scaleX(-1)` }} />
                    {irisScanResult && (<div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><h3>Digital Identity Profile</h3><MarkdownRenderer content={irisScanResult} /></div>)}
                    <div className="button-group" style={{ justifyContent: 'center', marginTop: '1rem' }}><button onClick={handleClearIrisScan} className="button secondary-button">Clear Scan</button></div>
                </div>
            )}
            {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
    );

    const renderBiometricTab = () => (
         <div>
            <div className="button-group" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
                <button onClick={handleBiometricScan} className="button" disabled={isBiometricScanning}><SvgIcon path={ICONS.shieldCheck} />{isBiometricScanning ? 'Scanning...' : 'Start Biometric Scan'}</button>
            </div>
            {isBiometricScanning && (
                <div className="biometric-scanner-container">
                    <div className="biometric-circle biometric-circle-1"></div><div className="biometric-circle biometric-circle-2"></div><div className="biometric-circle biometric-circle-3"></div><div className="scanner-text">ANALYZING BIOMETRIC DATA...</div>
                </div>
            )}
            {biometricScanResult && !isBiometricScanning && (
                <div className="message-bubble model-message" style={{textAlign: 'left'}}><h3>Multi-Factor Biometric Authentication Report</h3><MarkdownRenderer content={biometricScanResult} /></div>
            )}
            {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
    );
    
    const renderDnaTab = () => (
        <div>
            <div className="button-group" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
                {!isCameraOn ? (<button onClick={handleStartCamera} className="button">Start Camera to Analyze</button>) : (
                    <>
                        <button onClick={handleStopCamera} className="button secondary-button">Stop Camera</button>
                        <button onClick={handleDnaScan} className="button" disabled={isDnaScanning}><SvgIcon path={ICONS.dna} />{isDnaScanning ? 'Analyzing...' : 'Analyze Blood Sample'}</button>
                    </>
                )}
            </div>
            <div className="camera-view">
                {isCameraOn ? (<video ref={videoRef} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }}></video>) : (<div className="camera-placeholder"><p>Start camera to analyze a blood sample</p></div>)}
            </div>
            {dnaImage && (
                <div className="captured-image-container">
                    <div className="dna-scan-wrapper">
                        <img src={dnaImage} alt="Captured Blood Sample" style={{ transform: 'scaleX(-1)' }} />
                        {isDnaScanning && (<div className="dna-scan-overlay"><div className="dna-scan-line"></div></div>)}
                    </div>
                    {isDnaScanning && !dnaScanResult && <div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><p>Analyzing genetic markers...</p></div> }
                    {dnaScanResult && <div className="message-bubble model-message" style={{marginTop: '1rem', textAlign: 'left'}}><h3>Genetic & Health Profile</h3><MarkdownRenderer content={dnaScanResult} /></div> }
                    <div className="button-group" style={{ justifyContent: 'center', marginTop: '1rem' }}><button onClick={handleClearDnaScan} className="button secondary-button">Clear Analysis</button></div>
                </div>
            )}
            {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
    
    const renderAntivirusTab = () => (
        <div>
            <div className="button-group" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
                <button onClick={handleSystemScan} className="button" disabled={isSystemScanning}><SvgIcon path={ICONS.shieldCheck} />{isSystemScanning ? 'Scanning...' : 'Scan System Now'}</button>
            </div>
            {isSystemScanning && (
                <div className="scan-progress-container">
                    <h3>System Scan in Progress...</h3><progress value={scanProgress} max="100"></progress><p><strong>{scanProgress}%</strong></p><p className="scan-file-path"><code>{currentScanFile}</code></p>
                </div>
            )}
            {scanReport && !isSystemScanning && (<div className="message-bubble model-message" style={{textAlign: 'left'}}><MarkdownRenderer content={scanReport} /></div>)}
            {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'mentor': return renderMentorTab();
            case 'editor': return renderEditorTab();
            case 'voice_control': return renderVoiceControlTab();
            case 'camera': return renderCameraTab();
            case 'iris': return renderIrisTab();
            case 'biometric': return renderBiometricTab();
            case 'dna': return renderDnaTab();
            case 'antivirus': return renderAntivirusTab();
            default: return renderMentorTab();
        }
    };
    
    return (
        <>
            <style>{`
                :root {
                    --font-family: 'Inter', sans-serif;
                    --bg-color: #f7f9fc;
                    --sidebar-bg: #ffffff;
                    --main-header-bg: #ffffff;
                    --text-color: #1a1a1a;
                    --text-color-light: #5c5f62;
                    --border-color: #e1e4e8;
                    --primary-color: #007bff;
                    --primary-color-hover: #0056b3;
                    --secondary-color: #6c757d;
                    --secondary-color-hover: #545b62;
                    --shadow: 0 1px 3px rgba(0,0,0,0.04);
                    --input-bg: #fff;
                    --modal-bg: #fff;
                    --user-message-bg: #e9f5ff;
                    --model-message-bg: #fff;
                    --nav-item-hover-bg: #f1f3f5;
                }
                html.dark {
                    --bg-color: #121212;
                    --sidebar-bg: #1e1e1e;
                    --main-header-bg: #1e1e1e;
                    --text-color: #e0e0e0;
                    --text-color-light: #a0a0a0;
                    --border-color: #333;
                    --primary-color: #4dabf7;
                    --primary-color-hover: #62b7f8;
                    --secondary-color: #555;
                    --secondary-color-hover: #666;
                    --shadow: 0 2px 8px rgba(0,0,0,0.3);
                    --input-bg: #2d2d2d;
                    --modal-bg: #2a2a2a;
                    --user-message-bg: #2a394d;
                    --model-message-bg: #2d2d2d;
                    --nav-item-hover-bg: #2c2c2c;
                }
                body { font-family: var(--font-family); }
                * { box-sizing: border-box; }
                
                .app-layout { display: flex; height: 100vh; width: 100vw; background: var(--bg-color); color: var(--text-color); font-size: 16px; }
                
                /* Sidebar */
                .sidebar { width: 260px; background: var(--sidebar-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; padding: 1rem; transition: background-color 0.3s, color 0.3s; }
                .sidebar-header { padding: 0.5rem; margin-bottom: 1.5rem; }
                .sidebar-header h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
                .nav-menu { flex-grow: 1; }
                .nav-item, .sub-nav-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; border-radius: 8px; cursor: pointer; transition: background-color 0.2s, color 0.2s; user-select: none; }
                .nav-item:hover, .sub-nav-item:hover { background: var(--nav-item-hover-bg); }
                .nav-item.active, .sub-nav-item.active { background: var(--primary-color); color: white; }
                .nav-item.active svg, .sub-nav-item.active svg { color: white; }
                .nav-item svg, .sub-nav-item svg { width: 22px; height: 22px; }
                .nav-item-title { font-weight: 500; }
                .security-suite-toggle .chevron-icon { margin-left: auto; transition: transform 0.2s ease-in-out; }
                .security-suite-toggle.open .chevron-icon { transform: rotate(180deg); }
                .sub-nav { padding-left: 1.5rem; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-in-out; }
                .sub-nav.open { max-height: 500px; }

                /* Main Content */
                .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .main-header { padding: 1rem 2rem; background: var(--main-header-bg); border-bottom: 1px solid var(--border-color); flex-shrink: 0; display: flex; justify-content: flex-end; align-items: center; gap: 1rem; }
                .header-controls { display: flex; align-items: center; gap: 1rem; }
                .header-controls button { background: none; border: none; cursor: pointer; color: var(--text-color); padding: 0.5rem; }
                .header-controls button svg { width: 24px; height: 24px; }
                .language-selector { display: flex; align-items: center; gap: 0.5rem; }
                .language-selector select { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.4rem; color: var(--text-color); }
                .language-selector option { background: var(--bg-color); color: var(--text-color); }
                .content-area { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; }
                .chat-log-container { flex-grow: 1; }
                
                /* Common Components */
                .prompt-area, .editor-controls, .follow-up-area { display: flex; flex-direction: column; gap: 1rem; flex-shrink: 0; }
                .textarea-container { position: relative; width: 100%; }
                textarea { width: 100%; padding: 0.8rem; padding-right: 45px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-color); font-family: inherit; font-size: 1rem; resize: vertical; box-sizing: border-box; }
                .mic-button { position: absolute; right: 12px; bottom: 12px; background: transparent; border: none; cursor: pointer; color: var(--text-color); opacity: 0.7; padding: 0; }
                .mic-button.listening { color: #e63946; animation: pulse-opacity 1.5s infinite ease-in-out; }
                @keyframes pulse-opacity { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
                .button-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
                .button { background: var(--primary-color); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: bold; transition: background-color 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .button:hover:not(:disabled) { background: var(--primary-color-hover); }
                .button:disabled { background-color: var(--secondary-color); opacity: 0.7; cursor: not-allowed; }
                .secondary-button { background: var(--secondary-color); }
                .secondary-button:hover:not(:disabled) { background: var(--secondary-color-hover); }
                .secondary-button.listening { background-color: #c82333; animation: pulse-opacity 1.5s infinite ease-in-out; }
                .message-bubble { margin-bottom: 1rem; padding: 1rem; border-radius: 12px; max-width: 90%; word-wrap: break-word; }
                .user-message { background: var(--user-message-bg); align-self: flex-end; margin-left: 10%; }
                .model-message { background: var(--model-message-bg); border: 1px solid var(--border-color); align-self: flex-start; margin-right: 10%; }
                .output-controls { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
                .action-controls, .voice-controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
                .voice-controls select { padding: 0.4rem; border-radius: 6px; background: var(--input-bg); color: var(--text-color); border: 1px solid var(--border-color); }
                .output-controls button { background: none; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.5rem; cursor: pointer; color: var(--text-color); }
                .output-controls button svg { width: 20px; height: 20px; vertical-align: middle; }
                .prose-markdown { line-height: 1.6; } .prose-markdown p { margin-bottom: 1rem; } .prose-markdown ul, .prose-markdown ol { padding-left: 2rem; margin-bottom: 1rem; } .prose-markdown li { margin-bottom: 0.5rem; } .prose-markdown a { color: var(--primary-color); text-decoration: none; } .prose-markdown a:hover { text-decoration: underline; }
                .inline-code { background-color: var(--border-color); padding: 0.2em 0.4em; margin: 0; font-size: 85%; border-radius: 6px; font-family: monospace; }
                .code-block-container { margin: 1rem 0; border-radius: 8px; overflow: hidden; } .code-block-header { background: #3a3a3a; color: white; padding: 0.5rem 1rem; display: flex; justify-content: space-between; align-items: center; } .copy-button { background: #555; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 5px; cursor: pointer; }
                .monaco-editor-container { border: 1px solid var(--border-color); border-radius: 8px; padding: 2px; overflow: hidden; }
                .run-output { margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px; white-space: pre-wrap; font-family: monospace; }
                .editor-output-placeholder { margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px; text-align: center; color: var(--text-color); opacity: 0.7; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: var(--modal-bg); padding: 2rem; border-radius: 12px; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto; position: relative; }
                .modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-color); }
                .favorites-list li { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid var(--border-color); }
                .favorites-list p { margin: 0; flex-grow: 1; cursor: pointer; }
                .preview-iframe { width: 100%; height: 60vh; border: none; }
                .follow-up-input { display: flex; gap: 0.5rem; }
                .follow-up-input textarea { flex-grow: 1; }
                .quick-reference-panel { border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; background: var(--bg-color); animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .quick-reference-section h3 { color: var(--primary-color); margin-bottom: 0.5rem; } .quick-reference-panel ul { list-style-type: none; padding-left: 0; } .quick-reference-panel li { margin-bottom: 0.5rem; font-size: 0.9rem; } .quick-reference-panel code { background-color: var(--border-color); padding: 0.2em 0.4em; margin: 0; font-size: 90%; border-radius: 6px; font-family: monospace; }
                .assistant-status-bar { position: fixed; bottom: -50px; left: 50%; transform: translateX(-50%); background: var(--sidebar-bg); padding: 0.5rem 1.5rem; border-radius: 8px; box-shadow: var(--shadow); border: 1px solid var(--border-color); transition: all 0.3s ease-in-out; opacity: 0; pointer-events: none; }
                .assistant-status-bar.visible { bottom: 20px; opacity: 1; }
                .camera-view { position: relative; width: 100%; max-width: 640px; margin: 1rem auto; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #000; }
                .camera-view video { width: 100%; height: auto; display: block; transition: transform 0.2s ease-out; }
                .captured-image-container { margin-top: 1rem; text-align: center; } .captured-image-container img { max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color); } .camera-placeholder { display: flex; justify-content: center; align-items: center; height: 360px; background: var(--input-bg); color: var(--text-color); opacity: 0.7; }
                .ar-image-wrapper { position: relative; display: inline-block; line-height: 0; } .ar-effect-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px; pointer-events: none; transform: scaleX(-1); animation: ar-glow 2s infinite ease-in-out; }
                @keyframes ar-glow { 0% { box-shadow: 0 0 5px 2px var(--primary-color), inset 0 0 5px 1px var(--primary-color); } 50% { box-shadow: 0 0 15px 5px var(--primary-color), inset 0 0 10px 2px var(--primary-color); } 100% { box-shadow: 0 0 5px 2px var(--primary-color), inset 0 0 5px 1px var(--primary-color); } }
                .fingerprint-scanner { width: 200px; height: 200px; margin: 2rem auto; position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
                .fingerprint-icon-bg { width: 100%; height: 100%; color: var(--primary-color); opacity: 0.3; }
                .scan-line { position: absolute; left: 0; top: 0; width: 100%; height: 3px; background: var(--primary-color); box-shadow: 0 0 10px var(--primary-color); animation: scan-anim 3s linear infinite; }
                @keyframes scan-anim { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
                .biometric-scanner-container { display: flex; justify-content: center; align-items: center; height: 250px; position: relative; margin: 2rem auto; }
                .biometric-circle { border-radius: 50%; position: absolute; border-style: solid; animation: biometric-pulse 2s infinite ease-in-out; } .biometric-circle-1 { width: 100px; height: 100px; border-width: 2px; border-color: var(--primary-color); opacity: 0.8; } .biometric-circle-2 { width: 150px; height: 150px; border-width: 1px; border-color: var(--primary-color); opacity: 0.5; animation-delay: 0.5s; } .biometric-circle-3 { width: 200px; height: 200px; border-width: 1px; border-color: var(--primary-color); opacity: 0.2; animation-delay: 1s; }
                @keyframes biometric-pulse { 0% { transform: scale(0.95); opacity: 0.7; } 70% { transform: scale(1.1); opacity: 0; } 100% { transform: scale(0.95); opacity: 0; } }
                .scanner-text { color: var(--primary-color); font-weight: bold; letter-spacing: 2px; z-index: 10; animation: text-flicker 3s linear infinite; }
                @keyframes text-flicker { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .scan-progress-container { text-align: center; margin-top: 2rem; } .scan-progress-container progress { width: 100%; height: 20px; border-radius: 10px; overflow: hidden; } .scan-progress-container progress::-webkit-progress-bar { background-color: var(--border-color); } .scan-progress-container progress::-webkit-progress-value { background-color: var(--primary-color); transition: width 0.5s ease-in-out; } .scan-progress-container progress::-moz-progress-bar { background-color: var(--primary-color); }
                .scan-file-path { font-family: monospace; color: var(--text-color); opacity: 0.8; font-size: 0.9rem; margin-top: 0.5rem; height: 1.2em; }
                .iris-scan-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; }
                .iris-reticle { width: 250px; height: 250px; border: 2px solid var(--primary-color); border-radius: 50%; position: relative; opacity: 0.8; box-shadow: 0 0 15px var(--primary-color); animation: iris-pulse 2s infinite ease-in-out; }
                @keyframes iris-pulse { 0% { transform: scale(0.98); opacity: 0.7; } 50% { transform: scale(1.02); opacity: 1; } 100% { transform: scale(0.98); opacity: 0.7; } }
                .iris-scan-line { position: absolute; left: 5%; width: 90%; height: 2px; background: var(--primary-color); box-shadow: 0 0 10px var(--primary-color); animation: scan-anim 4s linear infinite; }
                .voice-control-hub { text-align: center; } .voice-control-hub h3 { margin-top: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; text-align: left; } .voice-control-hub ul { list-style-type: none; padding: 0; text-align: left; columns: 2; -webkit-columns: 2; -moz-columns: 2; } .voice-control-hub li { background: var(--bg-color); padding: 0.5rem; border-radius: 6px; margin-bottom: 0.5rem; }
                .zoom-slider-container { display: flex; align-items: center; gap: 0.5rem; justify-content: center; margin: 0.5rem auto; max-width: 300px; } .zoom-slider-container input[type="range"] { flex-grow: 1; }
                .dna-scan-wrapper { position: relative; display: inline-block; line-height: 0; } .dna-scan-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; border-radius: 8px; }
                .dna-scan-line { position: absolute; left: 0; width: 100%; height: 3px; background: #00ff00; box-shadow: 0 0 15px #00ff00; animation: dna-scan-vertical 3s linear infinite; }
                @keyframes dna-scan-vertical { 0% { top: 0%; } 100% { top: 100%; } }
                .download-modal-section { margin-bottom: 1.5rem; } .download-modal-section h3 { margin-top: 0; margin-bottom: 0.5rem; }
            `}</style>

            <div className="app-layout">
                <nav className="sidebar">
                    <div className="sidebar-header">
                        <h1>AI Mentor</h1>
                    </div>
                    <div className="nav-menu">
                        <div className={`nav-item ${activeTab === 'mentor' ? 'active' : ''}`} onClick={() => setActiveTab('mentor')}>
                            <SvgIcon path={ICONS.assistant} /> <span className="nav-item-title">AI Mentor</span>
                        </div>
                        <div className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
                            <SvgIcon path={ICONS.code} /> <span className="nav-item-title">Code Editor</span>
                        </div>
                        <div className={`nav-item ${activeTab === 'voice_control' ? 'active' : ''}`} onClick={() => setActiveTab('voice_control')}>
                            <SvgIcon path={ICONS.microphone} /> <span className="nav-item-title">Voice Control</span>
                        </div>

                        <div className={`nav-item security-suite-toggle ${isSecuritySuiteOpen ? 'open' : ''}`} onClick={() => setIsSecuritySuiteOpen(!isSecuritySuiteOpen)}>
                            <SvgIcon path={ICONS.shieldCheck} /> <span className="nav-item-title">Security Suite</span> <SvgIcon path={ICONS.chevronDown} className="chevron-icon" />
                        </div>
                        <div className={`sub-nav ${isSecuritySuiteOpen ? 'open' : ''}`}>
                            <div className={`sub-nav-item ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}><SvgIcon path={ICONS.camera} /><span>Camera</span></div>
                            <div className={`sub-nav-item ${activeTab === 'iris' ? 'active' : ''}`} onClick={() => setActiveTab('iris')}><SvgIcon path={ICONS.eye} /><span>Iris</span></div>
                            <div className={`sub-nav-item ${activeTab === 'biometric' ? 'active' : ''}`} onClick={() => setActiveTab('biometric')}><SvgIcon path={ICONS.fingerprint} /><span>Biometric</span></div>
                            <div className={`sub-nav-item ${activeTab === 'dna' ? 'active' : ''}`} onClick={() => setActiveTab('dna')}><SvgIcon path={ICONS.dna} /><span>DNA</span></div>
                            <div className={`sub-nav-item ${activeTab === 'antivirus' ? 'active' : ''}`} onClick={() => setActiveTab('antivirus')}><SvgIcon path={ICONS.shieldCheck} /><span>Antivirus</span></div>
                        </div>
                    </div>
                </nav>
                <main className="main-content">
                    <header className="main-header">
                        <div className="header-controls">
                            <button onClick={handleToggleAssistantListening} title={isAssistantListening ? 'Stop Assistant' : 'Activate AI Assistant'} disabled={!assistantRecognitionRef.current || isChatListening || isEditorDictating}>
                                <SvgIcon path={ICONS.assistant} className={isAssistantListening ? 'listening' : ''} />
                            </button>
                            <button onClick={() => setShowFavorites(true)} title="View Favorites"><SvgIcon path={ICONS.star} /></button>
                            <div className="language-selector">
                                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} title="Select Language">
                                    {Object.entries(worldLanguages).map(([group, languages]) => (<optgroup key={group} label={group}>{languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}</optgroup>))}
                                </select>
                            </div>
                            <button onClick={() => setShowDownloadModal(true)} title="Download App Source Code"><SvgIcon path={ICONS.appDownload} /></button>
                            <button onClick={() => setIsAutoPlayOn(!isAutoPlayOn)} title={isAutoPlayOn ? 'Auto-Play On' : 'Auto-Play Off'}><SvgIcon path={isAutoPlayOn ? ICONS.speaker : ICONS.speakerMuted} /></button>
                            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle Theme"><SvgIcon path={theme === 'light' ? ICONS.moon : ICONS.sun} /></button>
                        </div>
                    </header>
                    <div className="content-area">
                        {renderActiveTab()}
                    </div>
                </main>
                <div className={`assistant-status-bar ${isAssistantListening || assistantStatusText ? 'visible' : ''}`}>
                    <p>{assistantStatusText || '...'}</p>
                </div>
            </div>

            {showFavorites && (
                <div className="modal-overlay" onClick={() => setShowFavorites(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowFavorites(false)}>&times;</button>
                        <h2>Favorites</h2>
                        {favorites.length > 0 ? (
                            <ul className="favorites-list" style={{listStyle:'none', padding:0}}>
                                {favorites.map((fav, index) => (
                                    <li key={index}>
                                        <p onClick={() => loadFavorite(fav)}>{fav.title.substring(0, 50)}...</p>
                                        <button onClick={() => setFavorites(favorites.filter((_, i) => i !== index))} className="button secondary-button">Delete</button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>No favorites saved yet.</p>}
                    </div>
                </div>
            )}
            
            {showPreview && (
                 <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                         <button className="modal-close" onClick={() => setShowPreview(false)}>&times;</button>
                         <h2>{previewTitle}</h2>
                         <iframe srcDoc={previewContent} className="preview-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
                    </div>
                </div>
            )}

            {showDownloadModal && (
                 <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                         <button className="modal-close" onClick={() => setShowDownloadModal(false)}>&times;</button>
                         <h2>Download AI Code Mentor</h2>
                         <p>Copy the content of these files and save them locally to run the application.</p>
                         <div className="download-modal-section"><h3>index.html</h3><CodeBlock language="html" code={fileContents.html} /></div>
                         <div className="download-modal-section"><h3>metadata.json</h3><CodeBlock language="json" code={fileContents.json} /></div>
                         <div className="download-modal-section">
                            <h3>index.tsx (App Source)</h3><p>Note: The full source code is too large to display here. This is a placeholder.</p><div style={{maxHeight: '300px', overflow: 'auto'}}><CodeBlock language="tsx" code={fileContents.tsx.trim()} /></div>
                         </div>
                    </div>
                </div>
            )}
        </>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);