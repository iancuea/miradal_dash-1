'use client';
import { useState } from 'react';

export default function GaleriaFotos({ fotos = [], abierta, onClose }) {
  const [fotoActual, setFotoActual] = useState(0);

  const handleAnterior = () => {
    setFotoActual((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
  };

  const handleSiguiente = () => {
    setFotoActual((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
  };

  if (!abierta || fotos.length === 0) return null;

  return (
    <div className="galeria-modal">
      <div className="galeria-contenido">
        <img src={fotos[fotoActual]} alt={`Foto ${fotoActual + 1}`} className="galeria-img" />
        <div className="galeria-controles">
          <button onClick={handleAnterior} className="galeria-flecha">←</button>
          <button onClick={handleSiguiente} className="galeria-flecha">→</button>
        </div>
        <button onClick={onClose} className="galeria-cerrar">✕</button>
      </div>
    </div>
  );
}
