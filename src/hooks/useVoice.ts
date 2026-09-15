import { useState, useRef, useCallback } from 'react';

interface UseVoiceResult {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: (onResult: (text: string) => void, lang?: string) => void;
  stopListening: () => void;
  cancelListening: () => void;
}

export function useVoice(): UseVoiceResult {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }
  }, []);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      setIsListening(false);
      setError(null);
    }
  }, []);

  const startListening = useCallback(
    (onResult: (text: string) => void, lang: string = 'en-US') => {
      setError(null);
      if (!isSupported) {
        setError('Speech recognition is not supported in your browser.');
        return;
      }

      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied. Please allow microphone access or type your symptoms.');
          } else if (event.error === 'no-speech') {
            setError('No speech was detected. Please try speaking again or type.');
          } else {
            setError(`Voice input error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err: any) {
        setIsListening(false);
        setError(`Failed to start speech recognition: ${err.message}`);
      }
    },
    [isSupported]
  );

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    cancelListening,
  };
}
