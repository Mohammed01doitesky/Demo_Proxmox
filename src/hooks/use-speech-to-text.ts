"use client";

import { useState, useRef, useCallback } from 'react';

export interface SpeechToTextResult {
  transcription: string;
  filename: string;
  model: string;
  temperature: number;
}

interface UseSpeechToTextProps {
  onTranscription?: (result: SpeechToTextResult) => void;
  onError?: (error: string) => void;
  apiUrl?: string;
}

export function useSpeechToText({
  onTranscription,
  onError,
  apiUrl = 'http://localhost:8000'
}: UseSpeechToTextProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/wav');

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Try WAV first, fallback to WebM if not supported
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm;codecs=opus';
      }
      mimeTypeRef.current = mimeType;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mimeTypeRef.current 
          });
          
          await transcribeAudio(audioBlob);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to process audio';
          setError(errorMessage);
          onError?.(errorMessage);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording]);

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV
          const numberOfChannels = audioBuffer.numberOfChannels;
          const sampleRate = audioBuffer.sampleRate;
          const length = audioBuffer.length * numberOfChannels * 2;
          const buffer = new ArrayBuffer(44 + length);
          const view = new DataView(buffer);
          
          // WAV header
          const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };
          
          writeString(0, 'RIFF');
          view.setUint32(4, 36 + length, true);
          writeString(8, 'WAVE');
          writeString(12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, numberOfChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * numberOfChannels * 2, true);
          view.setUint16(32, numberOfChannels * 2, true);
          view.setUint16(34, 16, true);
          writeString(36, 'data');
          view.setUint32(40, length, true);
          
          // Convert audio data
          let offset = 44;
          for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
              const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
              view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              offset += 2;
            }
          }
          
          resolve(new Blob([buffer], { type: 'audio/wav' }));
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = () => reject(new Error('Failed to read audio file'));
      fileReader.readAsArrayBuffer(audioBlob);
    });
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    let processedBlob = audioBlob;
    let filename = 'recording.wav';
    
    // Convert to WAV if it's not already WAV
    if (!mimeTypeRef.current.includes('wav')) {
      try {
        processedBlob = await convertToWav(audioBlob);
        filename = 'recording.wav';
      } catch (error) {
        throw new Error('Failed to convert audio to WAV format');
      }
    }
    
    const formData = new FormData();
    formData.append('audio_file', processedBlob, filename);
    
    const response = await fetch(`${apiUrl}/transcribe`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result: SpeechToTextResult = await response.json();
    onTranscription?.(result);
    return result;
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    transcribeAudio
  };
}