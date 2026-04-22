import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import toast from 'react-hot-toast';

const TYPES = [
  { type:'park',    emoji:'🌳', label:'公园' },
  { type:'vet',     emoji:'🏥', label:'宠物医院' },
  { type:'petstore',emoji:'🛍️', label:'宠物店' },
];

const DEMO = {
  park:     [
    { place_id:'p1', name:'中央公园宠物区', vicinity:'示例路 123号', rating:4.8, isOpen:true },
    { place_id:'p2', name:'绿地狗狗乐园',   vicinity:'示例路 456号', rating:4.5, isOpen:true },
    { place_id:'p3', name:'河滨宠物公园',   vicinity:'示例路 789号', rating:4.2, isOpen:false },
  ],
  vet:      [
    { place_id:'v1', name:'爱宠动物医院',   vicinity:'医院路 11号',  rating:4.9, isOpen:true },
    { place_id:'v2', name:'萌宠24小时诊所', vicinity:'医院路 22号',  rating:4.6, isOpen:true },
  ],
  petstore: [
    { place_id:'s1', name:'宠爱生活馆',     vicinity:'商业街 33号',  rating:4.7, isOpen:true },
    { place_id:'s2', name:'毛孩子超市',     vicinity:'商业街 44号',  rating:4.4, isOpen:false },
  ],
};

export default function MapPage() {
  const [type,  setType]  = useState('park');
  const [places, setPlaces] = useState(DEMO.park);
  const [loc,   setLoc]   = useState(null);
  const [demo,  setDemo]  = useState(true);
  const [busy,  setBusy]  = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      ()  => setDemo(true)
    );
  }, []);

  useEffect(() => { fetchPlaces(); }, [type, loc]);

  const fetchPlaces = async () => {
    if (!loc) { setPlaces(DEMO[type]); setDemo(true); return; }
    setBusy(true);
    try {
      let token = '';
      try { token = await auth.currentUser?.getIdToken() || ''; } catch {}
      const r = await fetch(
        `${process.env.REACT_APP_API_URL||'http://localhost:5000'}/api/map/nearby?lat=${loc.lat}&lng=${loc.lng}&type=${type}`,
        { headers: token ? { Authorization:`Bearer ${token}` } : {} }
      );
      if (!r.ok) throw new Error();
      const d = await r.json();
      setPlaces(d.places || []);
      setDemo(false);
    } catch {
      setPlaces(DEMO[type]);
      setDemo(true);
    } finally { setBusy(false); }
  };

  const checkIn = place => toast.success(`✅ 已在「${place.name}」打卡！`);

  const emoji = TYPES.find(t=>t.type===type)?.emoji || '📍';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#fdf2f8' }}>
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 16px' }}>
        <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>🗺️ 宠物友好地图</h1>
        <p style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>
          {demo ? '📍 示例数据（开启定位获取真实地点）' : `📍 已定位 ${loc?.lat?.toFixed(3)}, ${loc?.lng?.toFixed(3)}`}
        </p>
      </div>

      {/* Mini map visual */}
      <div style={{ margin:'12px 16px 0', height:140, borderRadius:20, overflow:'hidden', position:'relative',
                    background:'linear-gradient(135deg,#fce7f3,#fdf2f8)', border:'1px solid #fce7f3',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute', inset:0, opacity:.15,
                      backgroundImage:'repeating-linear-gradient(0deg,#f9a8d4 0,#f9a8d4 1px,transparent 0,transparent 32px),repeating-linear-gradient(90deg,#f9a8d4 0,#f9a8d4 1px,transparent 0,transparent 32px)' }} />
        {['🌳','🏥','🛍️'].map((e,i) => (
          <span key={i} style={{ position:'absolute', fontSize:24,
                                 top:`${20+i*25}%`, left:`${18+i*27}%`,
                                 animation:`fp${i} ${2+i*.5}s ease-in-out infinite` }}>{e}</span>
        ))}
        <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ fontSize:32 }}>📍</div>
          <p style={{ color:'#be185d', fontWeight:700, fontSize:13, marginTop:4 }}>
            {demo ? '宠物友好地图' : '实时位置'}
          </p>
        </div>
      </div>

      {/* Type tabs */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px 8px' }}>
        {TYPES.map(({ type:t, emoji:e, label }) => (
          <button key={t} onClick={() => setType(t)}
                  style={{ flex:1, padding:'8px 4px', borderRadius:100, border:'2px solid',
                           fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s',
                           borderColor: type===t ? 'transparent' : '#fce7f3',
                           background:  type===t ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
                           color:       type===t ? 'white' : '#be185d' }}>
            {e} {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 16px' }}>
        {demo && (
          <div style={{ background:'#fdf2f8', border:'1px solid #fce7f3', borderRadius:16,
                        padding:'10px 16px', textAlign:'center', fontSize:12, color:'#f472b6',
                        fontWeight:600, marginBottom:10 }}>
            💡 开启浏览器定位权限，可显示您附近的真实地点
          </div>
        )}
        {busy ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #fce7f3',
                          borderTopColor:'#f472b6', animation:'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {places.map(p => (
              <div key={p.place_id} style={{ background:'white', borderRadius:18, padding:'14px 16px',
                                             border:'1px solid #fce7f3', display:'flex', gap:12, alignItems:'center',
                                             boxShadow:'0 2px 10px rgba(244,114,182,0.08)' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#fce7f3,#fff0f6)',
                              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                  {emoji}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:700, color:'#9d174d', fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{p.vicinity}</p>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    {p.rating && <span style={{ fontSize:11, color:'#f472b6', fontWeight:600 }}>⭐ {p.rating}</span>}
                    <span style={{ fontSize:11, fontWeight:600, color: p.isOpen ? '#10b981' : '#9ca3af' }}>
                      {p.isOpen ? '● 营业中' : '○ 已关闭'}
                    </span>
                  </div>
                </div>
                <button onClick={() => checkIn(p)}
                        style={{ flexShrink:0, padding:'6px 12px', borderRadius:100, border:'2px solid #fce7f3',
                                 background:'white', color:'#f472b6', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  打卡
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fp0{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes fp1{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes fp2{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      `}</style>
    </div>
  );
}
