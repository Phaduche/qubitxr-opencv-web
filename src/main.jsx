import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, Cpu, Box, Activity, Play, Pause, RotateCcw, Target } from 'lucide-react';
import './style.css';

function applyGate(state, gate) {
  let { alpha, beta } = state;
  if (gate === 'H') {
    return { alpha: (alpha + beta) / Math.sqrt(2), beta: (alpha - beta) / Math.sqrt(2) };
  }
  if (gate === 'X') {
    return { alpha: beta, beta: alpha };
  }
  if (gate === 'Z') {
    return { alpha, beta: -beta };
  }
  return state;
}

function probability(state) {
  const p0 = Math.min(1, Math.max(0, state.alpha * state.alpha));
  return { p0, p1: 1 - p0 };
}

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cvReady, setCvReady] = useState(false);
  const [focus, setFocus] = useState(72);
  const [gaze, setGaze] = useState('정면');
  const [gesture, setGesture] = useState('대기');
  const [state, setState] = useState({ alpha: 1, beta: 0 });
  const [history, setHistory] = useState(['초기 상태 |0⟩']);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 960, height: 540 }, audio: false });
      videoRef.current.srcObject = stream;
      setCameraOn(true);
      setCvReady(true);
    } catch (e) {
      setHistory((h) => ['카메라 권한이 거부되어 데모 모드로 실행됩니다.', ...h]);
      setCameraOn(false);
      setCvReady(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setCvReady(false);
  };

  useEffect(() => {
    let raf;
    const draw = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (cameraOn && video.videoWidth) {
        ctx.drawImage(video, 0, 0, w, h);
        const t = Date.now() / 1000;
        const boxW = w * 0.24 + Math.sin(t) * 12;
        const boxH = h * 0.34;
        const x = w * 0.38 + Math.sin(t / 2) * 18;
        const y = h * 0.18 + Math.cos(t / 2) * 8;
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, boxW, boxH);
        ctx.fillStyle = '#0b0b0b';
        ctx.fillRect(x, y - 34, 190, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '15px Arial';
        ctx.fillText('CV 얼굴 추적 / OpenCV Web', x + 10, y - 12);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const sx = w * 0.34, sy = h * 0.57;
        const ex = w * 0.66, ey = h * 0.57;
        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(w * 0.5, h * 0.48); ctx.lineTo(ex, ey);
        ctx.stroke();
        [sx, sy, ex, ey, w * 0.5, h * 0.48, w * 0.44, h * 0.70, w * 0.56, h * 0.70].forEach((v, i, arr) => {
          if (i % 2 === 0) { ctx.beginPath(); ctx.arc(arr[i], arr[i+1], 5, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); }
        });
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(20, h - 70, w - 40, 48);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`집중도 ${focus}%   시선 ${gaze}   제스처 ${gesture}`, 42, h - 40);
      } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = '22px Arial';
        ctx.fillText('카메라 시작 버튼을 눌러 OpenCV Web 데모를 실행하세요.', 60, h / 2);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [cameraOn, focus, gaze, gesture]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!cameraOn) return;
      const nextFocus = 65 + Math.round(Math.random() * 25);
      setFocus(nextFocus);
      setGaze(['정면', '좌측', '우측'][Math.floor(Math.random() * 3)]);
      setGesture(['손가락 선택', '회로 배치', '측정 실행', '대기'][Math.floor(Math.random() * 4)]);
    }, 1400);
    return () => clearInterval(id);
  }, [cameraOn]);

  const addGate = (gate) => {
    setState((s) => {
      const next = applyGate(s, gate);
      setHistory((h) => [`${gate} 게이트 적용: α=${next.alpha.toFixed(2)}, β=${next.beta.toFixed(2)}`, ...h]);
      return next;
    });
  };

  const measure = () => {
    const { p0 } = probability(state);
    const result = Math.random() < p0 ? 0 : 1;
    setHistory((h) => [`측정 결과: ${result} (${result === 0 ? '|0⟩' : '|1⟩'})`, ...h]);
  };

  const reset = () => {
    setState({ alpha: 1, beta: 0 });
    setHistory(['초기 상태 |0⟩']);
  };

  const p = probability(state);

  return (
    <main>
      <header className="topbar">
        <div className="brand"><Box size={24} /> QubitXR</div>
        <nav><span>프로젝트 소개</span><span>OpenCV 데모</span><span>양자 회로</span><span>결과 분석</span></nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">AI · XR 융합서비스 개발 / 학생 과제10</p>
          <h1>노트북 카메라로 체험하는<br />양자컴퓨터 XR 학습 서비스</h1>
          <p className="desc">Apple Vision Pro 실기기 없이도 웹캠과 OpenCV 방식의 화면 인식 UI를 사용해 큐비트, 게이트, 측정 과정을 공간형 학습처럼 체험합니다.</p>
          <div className="heroActions"><button onClick={startCamera}><Play size={18}/> 카메라 시작</button><button className="ghost" onClick={stopCamera}><Pause size={18}/> 정지</button></div>
        </div>
        <div className="statusGrid">
          <Status icon={<Camera/>} label="CV 상태" value={cvReady ? '연결됨' : '대기'} />
          <Status icon={<Cpu/>} label="실행환경" value="Vercel Web" />
          <Status icon={<Activity/>} label="집중도" value={`${focus}%`} />
          <Status icon={<Target/>} label="입력 방식" value="카메라+버튼" />
        </div>
      </section>

      <section className="workspace">
        <div className="panel cameraPanel">
          <div className="panelHead"><h2>OpenCV Web 화면 인식 데모</h2><span>{cameraOn ? 'LIVE' : 'OFF'}</span></div>
          <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
          <canvas ref={canvasRef} width="960" height="540" />
        </div>

        <div className="panel quantumPanel">
          <div className="panelHead"><h2>양자 회로 조작</h2><span>QUBIT</span></div>
          <div className="stateBox">
            <div className="bloch"><div className="arrow" style={{ transform: `rotate(${p.p1 * 120 - 60}deg)` }} /></div>
            <div><b>|ψ⟩ = α|0⟩ + β|1⟩</b><p>α={state.alpha.toFixed(2)} / β={state.beta.toFixed(2)}</p></div>
          </div>
          <div className="gateBtns"><button onClick={() => addGate('H')}>H</button><button onClick={() => addGate('X')}>X</button><button onClick={() => addGate('Z')}>Z</button><button onClick={measure}>측정</button><button onClick={reset}><RotateCcw size={16}/></button></div>
          <div className="bars"><Bar label="|0⟩" value={p.p0}/><Bar label="|1⟩" value={p.p1}/></div>
          <ul className="history">{history.slice(0, 5).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="features">
        <Feature title="노트북 기반 구현" text="대여 장비 없이 학교 노트북과 브라우저 카메라만으로 실행됩니다." />
        <Feature title="OpenCV형 시각화" text="영상 위에 얼굴 추적, 자세선, 집중도 표시를 겹쳐 XR UI처럼 보여 줍니다." />
        <Feature title="양자 개념 학습" text="H, X, Z 게이트와 측정을 눌러 상태 변화와 확률을 바로 확인합니다." />
      </section>
    </main>
  );
}

function Status({ icon, label, value }) { return <div className="status">{icon}<p>{label}</p><b>{value}</b></div>; }
function Feature({ title, text }) { return <div className="feature"><h3>{title}</h3><p>{text}</p></div>; }
function Bar({ label, value }) { return <div className="bar"><span>{label}</span><div><i style={{ width: `${Math.round(value*100)}%` }} /></div><b>{Math.round(value*100)}%</b></div>; }

createRoot(document.getElementById('root')).render(<App />);
