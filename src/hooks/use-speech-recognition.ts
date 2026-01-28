
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type UseSpeechRecognitionProps = {
  onTranscriptionComplete: (transcript: string) => void;
};

export const useSpeechRecognition = ({ onTranscriptionComplete }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, []);

  const uploadAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscript("Processing...")
    setError(null);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: audioBlob,
        headers: {
            'Content-Type': audioBlob.type,
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Transcription failed.");
      }
      
      const finalTranscript = result.transcript || "";
      setTranscript(finalTranscript);
      onTranscriptionComplete(finalTranscript);
      
    } catch (err: any) {
      console.error("Transcription upload error:", err);
      setError(err.message || "An error occurred during transcription.");
      setTranscript("");
      onTranscriptionComplete(""); // Ensure we call back with empty string on error
    } finally {
        setIsProcessing(false);
    }
  };
  
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return;

    resetTranscript();
    setTranscript(""); // Explicitly clear previous transcript
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const options = {};
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsListening(true);

    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError') {
        setError("Microphone access was denied. Please allow access in your browser settings.");
      } else {
        setError("Could not start recording. Please check your microphone.");
      }
      setIsListening(false);
    }
  }, [isListening, isProcessing, onTranscriptionComplete, resetTranscript]);


  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop(); // onstop will handle the upload
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    isProcessing,
  };
};
