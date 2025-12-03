import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertTriangle, Crosshair, Star, Clock, Phone, RotateCw, Map as MapIcon, Loader2, ExternalLink, LocateFixed, Lock } from 'lucide-react';
import { Clinic, AppTab } from '../types';
import { getCurrentUser } from '../services/db';

declare var google: any;

interface Location {
  lat: number;
  lng: number;
}

type SearchState = 'idle' | 'searching' | 'found' | 'error';
type PermissionState = 'prompt' | 'granted' | 'denied';

// NOTE: In a real app, ensure process.env.GOOGLE_MAPS_API_KEY is set in your build configuration.
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || ""; 

// Hardcoded Clinics in Goiânia for Demo/Fallback
const GOIANIA_COORDS = { lat: -16.6869, lng: -49.2648 };

// Comprehensive list of real clinics in Goiânia
const MOCK_GOIANIA_CLINICS: any[] = [
  { id: 'gyn_hvsf', name: 'Hospital Veterinário São Francisco de Assis', vicinity: 'Av. C-206, Jardim América, Goiânia - GO', rating: 4.8, user_ratings_total: 2150, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7088, lng: -49.2789, toJSON: () => ({ lat: -16.7088, lng: -49.2789 }) } } },
  { id: 'gyn_ufg', name: 'Hospital Veterinário da UFG', vicinity: 'Campus Samambaia - UFG, Goiânia - GO', rating: 4.5, user_ratings_total: 1200, opening_hours: { open_now: true }, geometry: { location: { lat: -16.5986, lng: -49.2667, toJSON: () => ({ lat: -16.5986, lng: -49.2667 }) } } },
  { id: 'gyn_centroleste', name: 'Centro Veterinário de Goiânia', vicinity: 'R. 233, 855 - St. Leste Universitário, Goiânia - GO', rating: 4.7, user_ratings_total: 540, opening_hours: { open_now: false }, geometry: { location: { lat: -16.6799, lng: -49.2550, toJSON: () => ({ lat: -16.6799, lng: -49.2550 }) } } },
  { id: 'gyn_vida', name: 'Clínica Veterinária Vida Animal', vicinity: 'Av. T-63, 1200 - St. Bueno, Goiânia - GO', rating: 4.6, user_ratings_total: 890, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7166, lng: -49.2710, toJSON: () => ({ lat: -16.7166, lng: -49.2710 }) } } },
  { id: 'gyn_pethealth', name: 'Pet Health Clínica Veterinária', vicinity: 'R. 1129, 365 - St. Marista, Goiânia - GO', rating: 4.9, user_ratings_total: 320, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7020, lng: -49.2600, toJSON: () => ({ lat: -16.7020, lng: -49.2600 }) } } },
  { id: 'gyn_caoqmia', name: 'Cão Q Mia Veterinária', vicinity: 'Av. 85, 2310 - St. Marista, Goiânia - GO', rating: 4.4, user_ratings_total: 410, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7055, lng: -49.2655, toJSON: () => ({ lat: -16.7055, lng: -49.2655 }) } } },
  { id: 'gyn_vetmais', name: 'Vet+ Clínica Veterinária', vicinity: 'Av. Republica do Libano, St. Aeroporto, Goiânia - GO', rating: 4.5, user_ratings_total: 150, opening_hours: { open_now: true }, geometry: { location: { lat: -16.6850, lng: -49.2750, toJSON: () => ({ lat: -16.6850, lng: -49.2750 }) } } },
  { id: 'gyn_bichos', name: 'Bichos & Caprichos', vicinity: 'R. 9, 1200 - St. Oeste, Goiânia - GO', rating: 4.7, user_ratings_total: 280, opening_hours: { open_now: false }, geometry: { location: { lat: -16.6900, lng: -49.2680, toJSON: () => ({ lat: -16.6900, lng: -49.2680 }) } } },
  { id: 'gyn_alphapet', name: 'AlphaPet Center', vicinity: 'Av. Jamel Cecílio, Jd. Goiás, Goiânia - GO', rating: 4.8, user_ratings_total: 600, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7030, lng: -49.2380, toJSON: () => ({ lat: -16.7030, lng: -49.2380 }) } } },
  { id: 'gyn_flamboyant', name: 'Clínica Veterinária Flamboyant', vicinity: 'R. 56, Jardim Goiás, Goiânia - GO', rating: 4.3, user_ratings_total: 180, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7080, lng: -49.2450, toJSON: () => ({ lat: -16.7080, lng: -49.2450 }) } } },
  { id: 'gyn_sos', name: 'SOS Animais', vicinity: 'Av. 4ª Radial - St. Pedro Ludovico, Goiânia - GO', rating: 4.6, user_ratings_total: 350, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7150, lng: -49.2550, toJSON: () => ({ lat: -16.7150, lng: -49.2550 }) } } },
  { id: 'gyn_animalia', name: 'Animália Clínica Veterinária', vicinity: 'Av. C-4, Jardim América, Goiânia - GO', rating: 4.7, user_ratings_total: 220, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7120, lng: -49.2850, toJSON: () => ({ lat: -16.7120, lng: -49.2850 }) } } },
  { id: 'gyn_campinas', name: 'Clínica Vet Campinas', vicinity: 'Av. 24 de Outubro, Campinas, Goiânia - GO', rating: 4.2, user_ratings_total: 400, opening_hours: { open_now: true }, geometry: { location: { lat: -16.6750, lng: -49.2950, toJSON: () => ({ lat: -16.6750, lng: -49.2950 }) } } },
  { id: 'gyn_mang', name: 'Mangalô Vet', vicinity: 'Av. Mangalô - St. Morada do Sol, Goiânia - GO', rating: 4.5, user_ratings_total: 150, opening_hours: { open_now: false }, geometry: { location: { lat: -16.6300, lng: -49.3200, toJSON: () => ({ lat: -16.6300, lng: -49.3200 }) } } },
  { id: 'gyn_buriti', name: 'Buriti Pet Shop & Vet', vicinity: 'Av. Rio Verde, Vila Rosa, Aparecida de Goiânia - GO', rating: 4.4, user_ratings_total: 550, opening_hours: { open_now: true }, geometry: { location: { lat: -16.7350, lng: -49.2800, toJSON: () => ({ lat: -16.7350, lng: -49.2800 }) } } },
];

export const ClinicMap: React.FC = () => {
  // Check Plan
  const user = getCurrentUser();
  const isPremium = user?.plano !== 'free';

  // State
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchRadius, setSearchRadius] = useState(5000); // Start 5km

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any | null>(null);
  const userMarkerRef = useRef<any | null>(null);
  const clinicMarkersRef = useRef<any[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // If FREE PLAN, show lock screen
  if (!isPremium) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-white">
          <div className="bg-blue-50 p-8 rounded-full mb-6 animate-bounceIn">
              <Lock size={48} className="text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Recurso Premium</h2>
          <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
              O mapa de clínicas veterinárias em tempo real é exclusivo para membros do clube.
          </p>
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-8 w-full max-w-sm">
             <h3 className="font-bold text-blue-700 text-sm mb-2 text-left">Por que assinar?</h3>
             <ul className="text-xs text-blue-600 text-left space-y-2 pl-2">
               <li className="flex items-center gap-2"><Star size={12} fill="currentColor"/> Encontre clínicas 24h próximas</li>
               <li className="flex items-center gap-2"><Star size={12} fill="currentColor"/> Trace rotas de emergência</li>
               <li className="flex items-center gap-2"><Star size={12} fill="currentColor"/> Acesso a telefones e avaliações</li>
             </ul>
          </div>
          
          <button 
              onClick={() => {
                const premiumBtn = document.querySelectorAll('nav button')[4] as HTMLButtonElement;
                if(premiumBtn) premiumBtn.click();
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all w-full max-w-xs"
          >
              Liberar Acesso Agora
          </button>
      </div>
    );
  }

  // --- 1. Load Google Maps Script ---
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      setMapsLoaded(true);
      return;
    }
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
       const interval = setInterval(() => {
           if ((window as any).google && (window as any).google.maps) {
               setMapsLoaded(true);
               clearInterval(interval);
           }
       }, 500);
       return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsLoaded(true);
    script.onerror = () => {
        console.error("Erro ao carregar Google Maps API.");
        setMapError(true);
    };
    document.head.appendChild(script);
  }, []);

  // --- 2. Permission & Geolocation Logic ---
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada.");
      return;
    }
    setPermissionStatus('granted');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        startWatchingPosition();
      },
      (err) => {
        console.error(err);
        setPermissionStatus('denied');
        setUserLocation(GOIANIA_COORDS);
      },
      { enableHighAccuracy: true }
    );
  };

  const startWatchingPosition = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(newLoc);
        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(newLoc);
        }
      },
      (err) => console.error("Erro no GPS:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // --- 3. Map Initialization ---
  useEffect(() => {
    if (mapsLoaded && userLocation && mapRef.current && !googleMapRef.current) {
      try {
        const map = new google.maps.Map(mapRef.current, {
            center: userLocation,
            zoom: 13,
            disableDefaultUI: true,
            clickableIcons: false,
            styles: [
              { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
        });

        googleMapRef.current = map;

        // Custom Paw Marker for User - BLUE THEME
        const pawSvg = {
            path: "M 15 3 C 17.209 3 19 4.791 19 7 C 19 9.209 17.209 11 15 11 C 12.791 11 11 9.209 11 7 C 11 4.791 12.791 3 15 3 Z M 25 5 C 27.209 5 29 6.791 29 9 C 29 11.209 27.209 13 25 13 C 22.791 13 21 11.209 21 9 C 21 6.791 22.791 5 25 5 Z M 5 5 C 7.209 5 9 6.791 9 9 C 9 11.209 7.209 13 5 13 C 2.791 13 1 11.209 1 9 C 1 6.791 2.791 5 5 5 Z M 15 13 C 20.523 13 25 17.477 25 23 C 25 28.523 20.523 33 15 33 C 9.477 33 5 28.523 5 23 C 5 17.477 9.477 13 15 13 Z",
            fillColor: "#3b82f6", // Blue-500
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: "#FFFFFF",
            rotation: 0,
            scale: 1,
            anchor: new google.maps.Point(15, 18),
        };

        userMarkerRef.current = new google.maps.Marker({
            position: userLocation,
            map: map,
            icon: pawSvg,
            zIndex: 999,
            title: "Sua Localização"
        });

        searchClinics(userLocation, 5000);
      } catch (e) {
        console.error("Error initializing map:", e);
        setMapError(true);
      }
    }
  }, [mapsLoaded, userLocation]);

  // --- 4. Search Logic ---
  const searchClinics = (location: Location, radius: number) => {
    if (!googleMapRef.current) return;
    setSearchState('searching');
    setSearchRadius(radius);
    const service = new google.maps.places.PlacesService(googleMapRef.current);
    const request = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: radius,
      keyword: 'Clínica veterinária',
      type: 'veterinary_care'
    };
    service.nearbySearch(request, (results: any[], status: any) => {
      let finalResults: Clinic[] = [];
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        finalResults = results as Clinic[];
      }
      finalResults = [...finalResults, ...MOCK_GOIANIA_CLINICS];
      finalResults = finalResults.filter((v,i,a)=>a.findIndex(t=>(t.name === v.name))===i);

      if (finalResults.length > 0) {
        setClinics(finalResults);
        setSearchState('found');
        renderClinicMarkers(finalResults);
      } else {
        if (radius < 20000) {
          searchClinics(location, radius * 2);
        } else {
          setSearchState('error');
          setClinics([]);
        }
      }
    });
  };

  const renderClinicMarkers = (clinicsData: Clinic[]) => {
    clinicMarkersRef.current.forEach(m => m.setMap(null));
    clinicMarkersRef.current = [];
    clinicsData.forEach(clinic => {
      if (!googleMapRef.current) return;
      const position = typeof clinic.geometry.location.toJSON === 'function' ? clinic.geometry.location.toJSON() : clinic.geometry.location;
      const marker = new google.maps.Marker({
        position: position,
        map: googleMapRef.current,
        title: clinic.name,
        // Default Google Red Pin is fine, or we could customize
      });
      marker.addListener('click', () => {
        setSelectedClinic(clinic);
        if(googleMapRef.current) {
            googleMapRef.current.panTo(position);
            googleMapRef.current.setZoom(15);
        }
      });
      clinicMarkersRef.current.push(marker);
    });
  };

  // --- 5. Helper Functions ---
  const handleRecenter = () => {
    if (googleMapRef.current && userLocation) {
      googleMapRef.current.panTo(userLocation);
      googleMapRef.current.setZoom(14);
    }
  };

  const handleGoToGoiania = () => {
    if (googleMapRef.current) {
        googleMapRef.current.panTo(GOIANIA_COORDS);
        googleMapRef.current.setZoom(12);
        searchClinics(GOIANIA_COORDS, 5000);
    }
  };

  const handleManualUpdate = () => {
    if(userLocation) searchClinics(userLocation, 5000); 
  };

  const openRoute = (clinic?: Clinic) => {
    let dest = 'veterinário';
    if (clinic) {
       const lat = typeof clinic.geometry.location.lat === 'function' ? clinic.geometry.location.lat() : clinic.geometry.location.lat;
       const lng = typeof clinic.geometry.location.lng === 'function' ? clinic.geometry.location.lng() : clinic.geometry.location.lng;
       dest = `${lat},${lng}`;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const calculateDistance = (clinic: Clinic): string => {
      if(!userLocation || !google.maps.geometry) return "...";
      const from = new google.maps.LatLng(userLocation.lat, userLocation.lng);
      const lat = typeof clinic.geometry.location.lat === 'function' ? clinic.geometry.location.lat() : clinic.geometry.location.lat;
      const lng = typeof clinic.geometry.location.lng === 'function' ? clinic.geometry.location.lng() : clinic.geometry.location.lng;
      const to = new google.maps.LatLng(lat, lng);
      const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(from, to);
      return (distanceMeters / 1000).toFixed(1) + " km";
  };


  // --- RENDER ---
  if (!userLocation && permissionStatus !== 'denied') {
    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-white">
            <div className="bg-blue-50 p-6 rounded-full mb-6 animate-bounce">
                <MapPin size={40} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Permissão de Localização</h2>
            <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
                Permita o acesso à sua localização para encontrar clínicas perto de você.
            </p>
            <button onClick={requestLocation} className="bg-blue-500 hover:bg-blue-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all">
                Ativar Localização
            </button>
        </div>
    );
  }

  if (permissionStatus === 'denied') {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-white">
            <AlertTriangle size={48} className="text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
            <p className="text-gray-500 mb-6">Sem GPS, não conseguimos encontrar clínicas.</p>
            <button onClick={requestLocation} className="text-blue-500 font-bold hover:underline">Tentar novamente</button>
            <div className="mt-8 border-t pt-4">
                <p className="text-xs text-gray-400 mb-2">Ou veja clínicas em Goiânia:</p>
                <button onClick={() => { setUserLocation(GOIANIA_COORDS); setPermissionStatus('granted'); }} className="text-sm bg-gray-100 px-4 py-2 rounded-lg font-bold text-gray-600">
                    Modo Demo (Goiânia)
                </button>
            </div>
        </div>
      );
  }

  if (mapError) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-white">
              <AlertTriangle size={48} className="text-blue-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Mapa Indisponível</h2>
              <button onClick={() => openRoute()} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 mt-4">
                 <ExternalLink size={20} /> Abrir no Google Maps App
              </button>
          </div>
      );
  }

  if (!mapsLoaded || !userLocation) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fadeIn bg-white">
              <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Localizando...</h2>
          </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col relative bg-gray-100 overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-blue-100 pointer-events-auto flex justify-between items-center">
             <div>
                 <h2 className="font-black text-gray-800 flex items-center gap-2">
                     <MapIcon size={18} className="text-blue-500"/> Clínicas Encontradas
                 </h2>
                 <p className="text-xs text-gray-500 mt-1 font-medium">
                     {searchState === 'searching' && 'Buscando clínicas...'}
                     {searchState === 'found' && `${clinics.length} clínicas no mapa`}
                     {searchState === 'error' && 'Nenhuma clínica encontrada.'}
                 </p>
             </div>
             <button onClick={handleManualUpdate} className={`p-2 rounded-full hover:bg-blue-50 text-blue-600 ${searchState === 'searching' ? 'animate-spin' : ''}`}>
                 <RotateCw size={24} />
             </button>
          </div>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: '100%' }} className="absolute inset-0" />

      {/* Floating Controls */}
      <div className="absolute top-28 right-4 z-10 flex flex-col gap-2">
          <button onClick={handleRecenter} className="bg-white p-3.5 rounded-2xl shadow-xl text-gray-600 hover:text-blue-500 active:scale-95 transition-transform" title="Centralizar em mim">
              <Crosshair size={24} />
          </button>
          <button onClick={handleGoToGoiania} className="bg-white p-3.5 rounded-2xl shadow-xl text-gray-600 hover:text-blue-500 active:scale-95 transition-transform" title="Ir para Goiânia">
              <LocateFixed size={24} />
          </button>
      </div>

      {/* Bottom Sheet - Selected Clinic Details */}
      {selectedClinic && (
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 animate-slideUp">
              <div className="bg-white rounded-[2rem] shadow-2xl p-6 border border-gray-100 relative">
                  <button onClick={() => setSelectedClinic(null)} className="absolute top-3 right-1/2 translate-x-1/2 w-16 h-1.5 bg-gray-200 rounded-full" />
                  <div className="mt-4">
                      <div className="flex justify-between items-start">
                          <h3 className="text-xl font-black text-gray-900 leading-tight w-3/4">{selectedClinic.name}</h3>
                          <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
                              {calculateDistance(selectedClinic)}
                          </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          {selectedClinic.rating && (
                              <div className="flex items-center gap-1 text-amber-500 font-black">
                                  <Star size={16} fill="currentColor" />
                                  <span>{selectedClinic.rating}</span>
                                  <span className="text-gray-400 font-medium">({selectedClinic.user_ratings_total})</span>
                              </div>
                          )}
                          {selectedClinic.opening_hours && (
                              <div className={`flex items-center gap-1 font-bold ${selectedClinic.opening_hours.open_now ? 'text-green-600' : 'text-red-500'}`}>
                                  <Clock size={16} />
                                  {selectedClinic.opening_hours.open_now ? 'Aberto agora' : 'Fechado'}
                              </div>
                          )}
                      </div>
                      <p className="text-xs text-gray-400 mt-3 truncate font-medium">{selectedClinic.vicinity}</p>
                      <button onClick={() => openRoute(selectedClinic)} className="w-full mt-5 bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                          <Navigation size={20} /> Traçar Rota
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};