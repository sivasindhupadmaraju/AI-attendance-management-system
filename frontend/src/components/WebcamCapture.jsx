import React, { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff, RefreshCw, AlertTriangle } from 'lucide-react';

const WebcamCapture = ({ onCapture, isProcessing }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  // Load available camera devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        if (!navigator.mediaDevices) {
          throw new Error("MediaDevices API not available. Please ensure you are on a secure context (HTTPS) or localhost.");
        }
        // Request permissions first to get device labels
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
        initialStream.getTracks().forEach(track => track.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
        setError(err.message || "Camera permission denied or camera not found. Please enable permission.");
      }
    };
    
    getDevices();
  }, []);

  // Start video stream when device changes or camera active state toggled
  useEffect(() => {
    if (cameraActive && selectedDevice) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [cameraActive, selectedDevice]);

  const startCamera = async () => {
    stopCamera(); // stop any active stream first
    setError('');
    
    try {
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
        }
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      // Let the useEffect handle assigning srcObject
    } catch (err) {
      console.error("Error starting camera:", err);
      setError("Unable to access chosen camera. It may be in use by another application.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  // Attach stream to video element when it becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraActive]);

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDevice(devices[nextIndex].deviceId);
  };

  // Capture frame and send base64 data to callback
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas dimensions to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas image to Base64 JPEG string
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(base64Image);
  };

  // Auto-capture timer for continuous recognition
  useEffect(() => {
    let intervalId;
    if (cameraActive && stream && !isProcessing) {
      // Auto capture a frame every 2.5 seconds
      intervalId = setInterval(() => {
        captureFrame();
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cameraActive, stream, isProcessing]);

  return (
    <div className="flex flex-col items-center">
      {/* Video Container */}
      <div className="relative w-full max-w-xl aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        {cameraActive && stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]" // mirror view
            />
            {/* Holographic scanner guidelines overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Scan box grid */}
              <div className="w-64 h-64 border-2 border-brand-500/40 rounded-3xl relative">
                {/* Scanner corners */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-brand-500 rounded-tl-lg"></div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-brand-500 rounded-tr-lg"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-brand-500 rounded-bl-lg"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-brand-500 rounded-br-lg"></div>
                
                {/* Glowing scanning laser line */}
                <div className="scanner-line absolute w-full"></div>
              </div>
            </div>

            {/* Scanning indicator */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-slate-950/80 border border-brand-500/30 rounded-xl text-xs font-bold flex items-center space-x-2 text-brand-400">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse"></span>
              <span>{isProcessing ? 'Analyzing biometrics...' : 'Scanning faces...'}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            {error ? (
              <div className="flex flex-col items-center max-w-sm">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <p className="text-sm font-semibold text-slate-300 mb-2">Camera Access Blocked</p>
                <p className="text-xs text-slate-500">{error}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-4 rounded-full bg-slate-800 text-slate-600 mb-4 border border-slate-700">
                  <CameraOff className="h-10 w-10" />
                </div>
                <p className="text-sm font-semibold text-slate-300 mb-1">Camera is Turned Off</p>
                <p className="text-xs text-slate-500 max-w-xs">Activate the camera feed to begin automated biometric attendance recognition.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="flex items-center space-x-4 mt-6">
        <button
          onClick={toggleCamera}
          className={`flex items-center px-6 py-3 rounded-xl text-sm font-bold border transition-all duration-300
            ${cameraActive 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white' 
              : 'bg-brand-600 border-brand-500 text-white hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/20'
            }
          `}
        >
          <Camera className="mr-2 h-4 w-4" />
          {cameraActive ? 'Deactivate Camera' : 'Activate Camera'}
        </button>

        {cameraActive && devices.length > 1 && (
          <button
            onClick={switchCamera}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
            title="Switch Video Device"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Hidden canvas used to serialize image chunks */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default WebcamCapture;
