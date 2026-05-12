import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMapCheckins, createMapCheckin } from '../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n/I18nContext';
import navMap from '../assets/icons/nav_map.png';

const LOCAL_CHECKIN_KEY = 'gg_local_checkins';

function loadLocalCheckins() {
  try { return JSON.parse(localStorage.getItem(LOCAL_CHECKIN_KEY) || '[]'); }
  catch { return []; }
}
function pushLocalCheckin(entry) {
  const list = loadLocalCheckins();
  list.unshift(entry);
  localStorage.setItem(LOCAL_CHECKIN_KEY, JSON.stringify(list.slice(0, 50)));
}
function formatRelativeTime(ts, lang = 'en', t = (k) => k) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return lang === 'zh' ? '刚刚' : 'Just now';
  if (diff < 3600) return lang === 'zh' ? `${Math.floor(diff/60)} 分钟前` : `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return lang === 'zh' ? `${Math.floor(diff/3600)} 小时前` : `${Math.floor(diff/3600)} hr ago`;
  if (diff < 604800) return lang === 'zh' ? `${Math.floor(diff/86400)} 天前` : `${Math.floor(diff/86400)} day ago`;
  return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-NZ');
}

const TYPES = [
  { type:'park',    emoji:'🌳', labelKey:'map.tab.park'     },
  { type:'vet',     emoji:'🏥', labelKey:'map.tab.vet'      },
  { type:'petstore',emoji:'🛍️', labelKey:'map.tab.petstore' },
];

// Maps internal type IDs used by Google Places Nearby Search
const PLACES_TYPE = { park: 'park', vet: 'veterinary_care', petstore: 'pet_store' };

const AUCKLAND = { lat: -36.8485, lng: 174.7633 };

const DEMO = {
  park: [
    { place_id:'p1', name:'Central Park Pet Zone', vicinity:'123 Sample Road', rating:4.8, isOpen:true,  geometry:{ lat: AUCKLAND.lat+0.004, lng: AUCKLAND.lng+0.003 } },
    { place_id:'p2', name:'Greenfield Dog Park',   vicinity:'456 Sample Road', rating:4.5, isOpen:true,  geometry:{ lat: AUCKLAND.lat-0.003, lng: AUCKLAND.lng+0.005 } },
    { place_id:'p3', name:'Riverside Pet Park',   vicinity:'789 Sample Road', rating:4.2, isOpen:false, geometry:{ lat: AUCKLAND.lat+0.005, lng: AUCKLAND.lng-0.004 } },
  ],
  vet: [
    { place_id:'v1', name:'CarePaws Animal Hospital',   vicinity:'11 Clinic Road',  rating:4.9, isOpen:true,  geometry:{ lat: AUCKLAND.lat+0.002, lng: AUCKLAND.lng-0.003 } },
    { place_id:'v2', name:'Happy Paws 24h Clinic', vicinity:'22 Clinic Road',  rating:4.6, isOpen:true,  geometry:{ lat: AUCKLAND.lat-0.004, lng: AUCKLAND.lng-0.002 } },
  ],
  petstore: [
    { place_id:'s1', name:'Pet Life Store',     vicinity:'33 Market Street',  rating:4.7, isOpen:true,  geometry:{ lat: AUCKLAND.lat+0.003, lng: AUCKLAND.lng+0.001 } },
    { place_id:'s2', name:'Fur Friends Market',     vicinity:'44 Market Street',  rating:4.4, isOpen:false, geometry:{ lat: AUCKLAND.lat-0.002, lng: AUCKLAND.lng+0.004 } },
  ],
};

// Neutral cream base — pink stays as an accent on roads and markers, not bg.
// 5 distinct zones: cream bg, beige buildings, light blue water, green parks,
// pink roads.
const PINK_MAP_STYLE = [
  // Base — neutral cream (replaces overwhelming pink wash)
  { elementType: 'geometry', stylers: [{ color: '#fefce8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7c2d4f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },

  // Buildings & residential — visible warm beige
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#fde6d3' }] },

  // Roads — white with subtle warm-gray stroke (no pink, accent moves to markers)
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e7d8c1' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d4c4a8' }] },

  // Water — light sky blue (gentle, not saturated)
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0c4a6e' }] },

  // Parks — soft green
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#a7f3d0' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#065f46' }] },

  // Hide noisy POIs so our pink markers are the focus
  { featureType: 'poi.business',         stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical',          stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction',       stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school',           stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex',   stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government',       stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',              stylers: [{ visibility: 'off' }] },
];

export default function MapPage() {
  const { t, lang } = useI18n();
  const { currentUser } = useAuth();
  const [type,  setType]  = useState('park');
  // Start with empty places + busy=true so the user sees a loading state
  // first, not stale DEMO data. Only fall back to DEMO once we've actually
  // confirmed the real backend / Places API can't deliver.
  const [places, setPlaces] = useState([]);
  const [loc,   setLoc]   = useState(null);
  const [demo,  setDemo]  = useState(false);
  const [busy,  setBusy]  = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsFailed, setMapsFailed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history,     setHistory]     = useState(loadLocalCheckins());

  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef([]);
  const userMarkerRef   = useRef(null);
  const infoWindowRef   = useRef(null);

  // Geolocation — give the user up to 6 seconds to grant + return a fix.
  // If they deny, dismiss the prompt, or the device can't get a fix, fall
  // back to DEMO data for the current type.
  useEffect(() => {
    let cancelled = false;
    const fallback = () => {
      if (cancelled) return;
      setPlaces(DEMO[type]);
      setDemo(true);
      setBusy(false);
    };

    if (!navigator.geolocation) { fallback(); return; }

    const timer = setTimeout(fallback, 6000);

    navigator.geolocation.getCurrentPosition(
      p => {
        if (cancelled) return;
        clearTimeout(timer);
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => { clearTimeout(timer); fallback(); },
      { timeout: 5000 }
    );

    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line
  }, []);

  // Initialize Google Map once SDK is loaded
  useEffect(() => {
    // 1. Check API key presence first — if missing, skip SDK entirely
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
      setMapsFailed(true);
      return;
    }

    // 2. Check if auth already failed (script may have errored before this effect ran)
    if (document.documentElement.getAttribute('data-gmaps-failed') === 'true') {
      setMapsFailed(true);
      return;
    }

    // 3. Listen for runtime auth failures
    const onAuthFail = () => setMapsFailed(true);
    document.addEventListener('gmaps-auth-failure', onAuthFail);

    let cancelled = false;
    const timeout = setTimeout(() => { if (!cancelled && !mapsReady) setMapsFailed(true); }, 8000);

    (async () => {
      try {
        if (!window.googleMapsReady) { setMapsFailed(true); return; }
        await window.googleMapsReady;
        if (cancelled || !mapContainerRef.current || !window.google?.maps) return;
        // Re-check auth flag — gm_authFailure may have fired during the await
        if (document.documentElement.getAttribute('data-gmaps-failed') === 'true') {
          setMapsFailed(true);
          return;
        }
        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: loc || AUCKLAND,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: PINK_MAP_STYLE,
        });
        infoWindowRef.current = new window.google.maps.InfoWindow();
        setMapsReady(true);
        clearTimeout(timeout);
      } catch (e) {
        console.warn('[Map] SDK init failed:', e);
        setMapsFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      document.removeEventListener('gmaps-auth-failure', onAuthFail);
    };
  }, []);

  // Re-center on user location change
  useEffect(() => {
    if (!mapRef.current || !loc) return;
    mapRef.current.panTo(loc);
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new window.google.maps.Marker({
      position: loc,
      map: mapRef.current,
      title: lang === 'zh' ? '你在这里' : 'You are here',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3,
      },
    });
  }, [loc, mapsReady]);

  // Render markers when places change
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const typeEmoji = TYPES.find(t => t.type === type)?.emoji || '📍';

    places.forEach(p => {
      if (!p.geometry) return;
      const marker = new window.google.maps.Marker({
        position: p.geometry,
        map: mapRef.current,
        title: p.name,
        label: { text: typeEmoji, fontSize: '20px' },
        icon: {
          path: 'M 0,0 m -16,0 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0',
          fillColor: '#f472b6',
          fillOpacity: 0.95,
          strokeColor: 'white',
          strokeWeight: 3,
          scale: 1,
          labelOrigin: new window.google.maps.Point(0, 0),
        },
      });
      marker.addListener('click', () => {
        const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.geometry.lat},${p.geometry.lng}&destination_place_id=${encodeURIComponent(p.place_id)}`;
        const openLabel   = t('map.info.openNow');
        const closedLabel = t('map.info.closed');
        const dirLabel    = t('map.action.dirNav');
        const content = `
          <div style="padding:8px 4px;min-width:170px;font-family:-apple-system,sans-serif">
            <div style="font-weight:800;color:#9d174d;font-size:13px">${p.name}</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:2px">${p.vicinity || ''}</div>
            <div style="display:flex;gap:8px;margin-top:6px">
              ${p.rating ? `<span style="font-size:11px;color:#f472b6;font-weight:600">⭐ ${p.rating}</span>` : ''}
              ${p.isOpen != null ? `<span style="font-size:11px;font-weight:600;color:${p.isOpen ? '#10b981' : '#9ca3af'}">${p.isOpen ? openLabel : closedLabel}</span>` : ''}
            </div>
            <a href="${dirUrl}" target="_blank" rel="noopener"
               style="display:inline-block;margin-top:8px;padding:5px 12px;background:linear-gradient(135deg,#f472b6,#fb7185);color:white;border-radius:10px;text-decoration:none;font-size:11px;font-weight:700">
              ${dirLabel}
            </a>
          </div>`;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open({ anchor: marker, map: mapRef.current });
      });
      markersRef.current.push(marker);
    });
  }, [places, type, mapsReady]);

  // Fetch places
  // Fetch when type/loc changes. In DEMO fallback mode just swap lists; in
  // live mode try the real APIs (which themselves can still fall to DEMO).
  useEffect(() => {
    if (demo) { setPlaces(DEMO[type]); return; }
    fetchPlaces();
    // eslint-disable-next-line
  }, [type, loc]);

  // Client-side Places API fallback — uses Maps JS SDK's PlacesService
  // directly from the browser. Works when backend isn't reachable (e.g. local
  // dev without backend running). Requires the Places API enabled on the
  // frontend's REACT_APP_GOOGLE_MAPS_KEY.
  const fetchPlacesClientSide = (location, t) => {
    if (!window.google?.maps?.places) {
      return Promise.reject(new Error('Places library not loaded'));
    }
    const container = mapRef.current || document.createElement('div');
    return new Promise((resolve, reject) => {
      const service = new window.google.maps.places.PlacesService(container);
      service.nearbySearch(
        { location, radius: 2000, type: PLACES_TYPE[t] || 'park' },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results.slice(0, 10).map(p => ({
              place_id: p.place_id,
              name:     p.name,
              vicinity: p.vicinity,
              rating:   p.rating || null,
              geometry: p.geometry?.location ? {
                lat: p.geometry.location.lat(),
                lng: p.geometry.location.lng(),
              } : null,
              isOpen: p.opening_hours?.isOpen?.() ?? null,
            })));
          } else {
            reject(new Error('Places API status: ' + status));
          }
        }
      );
    });
  };

  const fetchPlaces = async () => {
    if (!loc) return; // still waiting for geolocation; don't fall to DEMO yet
    setBusy(true);

    // 1. Try backend first (production path: Vercel serverless /api/map/nearby)
    try {
      let token = '';
      try { token = await auth.currentUser?.getIdToken() || ''; } catch {}
      const r = await fetch(
        `${process.env.REACT_APP_API_URL||'http://localhost:5000'}/api/map/nearby?lat=${loc.lat}&lng=${loc.lng}&type=${type}`,
        { headers: token ? { Authorization:`Bearer ${token}` } : {} }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.places?.length) {
          setPlaces(d.places);
          setDemo(false);
          setBusy(false);
          return;
        }
      }
    } catch { /* fall through to client-side */ }

    // 2. Try client-side Places API (local dev path: uses frontend Maps key)
    try {
      const places = await fetchPlacesClientSide(loc, type);
      if (places.length) {
        setPlaces(places);
        setDemo(false);
        setBusy(false);
        return;
      }
    } catch { /* fall through to DEMO */ }

    // 3. DEMO data (last resort — only after both real paths failed)
    setPlaces(DEMO[type]);
    setDemo(true);
    setBusy(false);
  };

  // Real check-in (was just toast before). Always also write a localStorage
  // shadow so the route-history view shows entries even if the backend POST
  // fails or the user is in _local fallback mode.
  const checkIn = async (place) => {
    const localEntry = {
      id: `local-${Date.now()}`,
      placeId:   place.place_id,
      placeName: place.name,
      typeEmoji: TYPES.find(t => t.type === type)?.emoji || '📍',
      location:  place.geometry || null,
      createdAt: new Date().toISOString(),
    };
    pushLocalCheckin(localEntry);
    setHistory(loadLocalCheckins());

    try {
      if (!currentUser?.uid) throw new Error('no user');
      await createMapCheckin({
        uid: currentUser.uid,
        placeId: place.place_id,
        placeName: place.name,
        location: place.geometry || null,
        type,
      });
      toast.success(t('map.toast.checkin', { name: place.name }));
    } catch {
      toast.success(t('map.toast.checkinLocal', { name: place.name }));
    }
  };

  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      setHistory(loadLocalCheckins());
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        const data = await fetchMapCheckins(uid);
        const remote = (data?.checkins || []).map((entry) => ({
          ...entry,
          typeEmoji: TYPES.find((t) => t.type === entry.type)?.emoji || '📍',
        }));
        const local = loadLocalCheckins();
        const merged = [...remote];
        local.forEach((l) => {
          const dup = remote.find((r) => r.placeId === l.placeId && Math.abs(new Date(r.createdAt).getTime() - new Date(l.createdAt).getTime()) < 60000);
          if (!dup) merged.push(l);
        });
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!cancelled) setHistory(merged.slice(0, 20));
      } catch {
        if (!cancelled) setHistory(loadLocalCheckins());
      }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.uid]);

  const emoji = TYPES.find(t=>t.type===type)?.emoji || '📍';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100dvh - 72px)', minHeight:'calc(100vh - 72px)', background:'#fdf2f8' }}>
      <div style={{ background:'linear-gradient(135deg,#f9a8d4,#fda4af)', padding:'40px 16px 16px',
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:10 }}>
          <img src={navMap} alt="" draggable={false}
               style={{ width:40, height:40, flexShrink:0, objectFit:'contain',
                        filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
          <div style={{ minWidth:0 }}>
            <h1 style={{ color:'white', fontWeight:800, fontSize:18 }}>{t('map.header.title')}</h1>
            <p style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>
              {demo
                ? t('map.header.demoData')
                : t('map.header.located', { lat: loc?.lat?.toFixed(3), lng: loc?.lng?.toFixed(3) })}
            </p>
          </div>
        </div>
        <button onClick={() => setHistoryOpen(true)}
                style={{ flexShrink:0, marginLeft:12, padding:'8px 14px', borderRadius:100,
                         border:'none', background:'rgba(255,255,255,0.95)', color:'#9d174d',
                         fontWeight:700, fontSize:12, cursor:'pointer',
                         boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
          {t('map.history.button')}{history.length ? ` ${history.length}` : ''}
        </button>
      </div>

      {/* Real map */}
      <div style={{ margin:'12px 16px 0', position:'relative' }}>
        <div
          ref={mapContainerRef}
          style={{
            height: 'clamp(180px, 32vh, 260px)',
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px solid #fce7f3',
            background: 'linear-gradient(135deg,#fce7f3,#fdf2f8)',
            boxShadow: '0 4px 14px rgba(244,114,182,0.10)',
          }}
        />
        {!mapsReady && !mapsFailed && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                        color:'#be185d', fontSize:12, fontWeight:600 }}>
            {t('map.loading')}
          </div>
        )}
        {mapsFailed && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center',
                        background:'linear-gradient(135deg,#fce7f3,#fdf2f8)', borderRadius:20,
                        color:'#be185d', fontSize:12, fontWeight:600, padding:16, textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>📍</div>
            {t('map.failed.title')}{t('map.failed.subtitle')}<br/>
            {t('map.failed.fallback')}
          </div>
        )}
      </div>

      {/* Type tabs */}
      <div style={{ display:'flex', gap:8, padding:'12px 16px 8px' }}>
        {TYPES.map(({ type:tt, emoji:e, labelKey }) => (
          <button key={tt} onClick={() => setType(tt)}
                  style={{ flex:1, padding:'8px 4px', borderRadius:100, border:'2px solid',
                           fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s',
                           borderColor: type===tt ? 'transparent' : '#fce7f3',
                           background:  type===tt ? 'linear-gradient(135deg,#f472b6,#fb7185)' : 'white',
                           color:       type===tt ? 'white' : '#be185d' }}>
            {e} {t(labelKey)}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 16px 16px' }}>
        {demo && (
          <div style={{ background:'#fdf2f8', border:'1px solid #fce7f3', borderRadius:16,
                        padding:'10px 16px', textAlign:'center', fontSize:12, color:'#f472b6',
                        fontWeight:600, marginBottom:10 }}>
            {t('map.locationPrompt')}
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
                      {p.isOpen ? t('map.info.openNow') : t('map.info.closed')}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
                  {p.geometry && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.geometry.lat},${p.geometry.lng}&destination_place_id=${encodeURIComponent(p.place_id)}`}
                       target="_blank" rel="noopener noreferrer"
                       style={{ padding:'5px 10px', borderRadius:100,
                                background:'linear-gradient(135deg,#f472b6,#fb7185)',
                                color:'white', textDecoration:'none', fontWeight:700,
                                fontSize:11, textAlign:'center', whiteSpace:'nowrap' }}>
                      {t('map.action.goto')}
                    </a>
                  )}
                  <button onClick={() => checkIn(p)}
                          style={{ padding:'5px 10px', borderRadius:100, border:'2px solid #fce7f3',
                                   background:'white', color:'#f472b6', fontWeight:700, fontSize:11,
                                   cursor:'pointer', whiteSpace:'nowrap' }}>
                    {t('map.action.checkin')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Walk-history bottom sheet */}
      {historyOpen && (
        <div onClick={() => setHistoryOpen(false)}
             style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:50,
                      display:'flex', alignItems:'flex-end', justifyContent:'center',
                      animation:'fadeIn .2s ease' }}>
          <div onClick={e => e.stopPropagation()}
               style={{ width:'100%', maxWidth:560, background:'white',
                        borderTopLeftRadius:24, borderTopRightRadius:24,
                        maxHeight:'78vh', display:'flex', flexDirection:'column',
                        animation:'slideUp .25s ease', overflow:'hidden' }}>
            {/* Sheet header */}
            <div style={{ padding:'16px 20px 12px', borderBottom:'1px solid #fce7f3',
                          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:800, color:'#9d174d', fontSize:16 }}>{t('map.history.title')}</div>
                <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                  {t('map.history.subtitle', { n: history.length })}
                </div>
              </div>
              <button onClick={() => setHistoryOpen(false)}
                      style={{ width:32, height:32, borderRadius:16, border:'none',
                               background:'#fce7f3', color:'#9d174d', fontSize:16,
                               cursor:'pointer', fontWeight:800 }}>×</button>
            </div>
            {/* Sheet list */}
            <div style={{ flex:1, overflowY:'auto', padding:12 }}>
              {history.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#9ca3af', fontSize:13 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>🐾</div>
                  {t('map.history.empty')}<br/>
                  <span style={{ fontSize:11 }}>{t('map.history.emptyHint')}</span>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {history.map(h => {
                    const dirUrl = h.location
                      ? `https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.placeName)}`;
                    return (
                      <div key={h.id}
                           style={{ background:'#fdf2f8', borderRadius:14, padding:'10px 14px',
                                    display:'flex', gap:10, alignItems:'center',
                                    border:'1px solid #fce7f3' }}>
                        <div style={{ width:36, height:36, borderRadius:10,
                                      background:'white', display:'flex',
                                      alignItems:'center', justifyContent:'center',
                                      fontSize:18, flexShrink:0 }}>
                          {h.typeEmoji || '📍'}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, color:'#9d174d', fontSize:13,
                                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {h.placeName}
                          </div>
                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                            {formatRelativeTime(h.createdAt, lang, t)}
                          </div>
                        </div>
                        <a href={dirUrl} target="_blank" rel="noopener"
                           style={{ flexShrink:0, padding:'6px 12px', borderRadius:100,
                                    background:'linear-gradient(135deg,#f472b6,#fb7185)',
                                    color:'white', textDecoration:'none', fontWeight:700,
                                    fontSize:11 }}>
                          {t('map.action.goAgain')}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
      `}</style>
    </div>
  );
}
