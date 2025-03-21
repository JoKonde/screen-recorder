// src/App.jsx
import { useState, useRef, useEffect } from 'react';
import { toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '@ffmpeg/ffmpeg';

function App() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const mediaRecorder = useRef(null);
  const recordedChunks = useRef([]);
  const ffmpegRef = useRef(new FFmpeg());
  const audioContext = useRef(null);

  const convertToMP4 = async (webmBlob) => {
    try {
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js', 'text/javascript'),
      });

      const inputName = 'input.webm';
      const outputName = 'output.mp4';
      
      await ffmpeg.writeFile(inputName, new Uint8Array(await webmBlob.arrayBuffer()));
      await ffmpeg.exec(['-i', inputName, '-c', 'copy', outputName]);
      
      const data = await ffmpeg.readFile(outputName);
      return new Blob([data], { type: 'video/mp4' });
    } catch (error) {
      console.error('Conversion échouée, utilisation du WebM:', error);
      return webmBlob;
    }
  };

  const playStartSound = () => {
    audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.current.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.current.currentTime);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.5);
    oscillator.stop(audioContext.current.currentTime + 0.5);
  };

  const startRecording = async () => {
    try {
      playStartSound();
      await new Promise(resolve => setTimeout(resolve, 500));

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true
      });

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),
        ...micStream.getAudioTracks()
      ]);

      screenStream.getTracks().forEach(track => {
        track.onended = () => stopRecording();
      });

      mediaRecorder.current = new MediaRecorder(combinedStream);
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const webmBlob = new Blob(recordedChunks.current, { type: 'video/webm' });
        const finalBlob = await convertToMP4(webmBlob);
        setVideoUrl(URL.createObjectURL(finalBlob));
        recordedChunks.current = [];
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder.current) {
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-sky-800 mb-4">
            <span className="bg-white px-4 py-2 rounded-full shadow-lg">🎥 Enregistreur d'Écran Pro</span>
          </h1>
          <p className="text-sky-700 text-lg mb-6">
            Enregistrez votre écran + audio • Export MP4 • Simple et efficace
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-lg">
          <div className="flex justify-center gap-4 mb-6">
            {!recording ? (
              <button 
                onClick={startRecording}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-transform hover:scale-105 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Commencer
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-transform hover:scale-105 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Arrêter
              </button>
            )}
          </div>

          {videoUrl && (
            <div className="mt-8 space-y-6 animate-fade-in">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full rounded-xl aspect-video border-4 border-white shadow-lg"
                  style={{ maxWidth: '854px', height: '480px' }}
                />
              </div>

              <div className="flex justify-center gap-4">
                <a
                  href={videoUrl}
                  download={`enregistrement-${Date.now()}.mp4`}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Télécharger la vidéo
                </a>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-sky-700">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
            Développé par <a 
              href="https://wote-app.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-semibold hover:text-sky-900 transition-colors"
            >
              Wote
            </a> • © {new Date().getFullYear()}
          </div>
        </footer>
      </div>

      <svg className="fixed inset-0 -z-10 opacity-15" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.6,-25.2C33.1,-17.3,39.1,-8.7,39.5,0.4C39.9,9.4,34.7,18.8,27.2,27.3C19.8,35.8,10.1,43.4,-0.8,44.3C-11.7,45.1,-23.4,39.1,-32.9,30.6C-42.4,22.1,-49.7,11.1,-50.5,-0.9C-51.3,-12.8,-45.6,-25.6,-36.1,-33.5C-26.6,-41.4,-13.3,-44.4,-2.1,-42C9.1,-39.6,18.2,-31.9,25.6,-25.2Z" 
              fill="currentColor" 
              transform="rotate(25 50 50)" />
      </svg>
    </div>
  );
}

export default App;