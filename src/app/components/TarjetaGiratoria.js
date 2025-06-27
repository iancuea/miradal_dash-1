'use client';
import { useState } from "react";

export default function TarjetaGiratoria({ children, infoAdicional, fotos = [] }) {
  const [volteado, setVolteado] = useState(false);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [fotoActual, setFotoActual] = useState(0);

  const handleFlip = (e) => {
    e.stopPropagation();
    setVolteado(!volteado);
  };

  const handleVerFotos = (e) => {
    e.stopPropagation();
    setGaleriaAbierta(true);
    setFotoActual(0);
  };

  const handleCerrarGaleria = () => {
    setGaleriaAbierta(false);
  };

  const handleAnterior = () => {
    setFotoActual((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));
  };

  const handleSiguiente = () => {
    setFotoActual((prev) => (prev === fotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flip-card">
      <div className={`flip-inner ${volteado ? "flipped" : ""}`}>

        {/* Anverso */}
        <div className="flip-front">
          <p className="flip-text">{infoAdicional}</p>
          <div className="botones-container">
            <button onClick={handleFlip} className="flip-button">Ver Gráfico</button>
            <button onClick={handleVerFotos} className="flip-button">Ver fotos</button>
          </div>
        </div>

        {/* Reverso */}
        <div className="flip-back">
          <div className="flip-content">{children}</div>
          <div className="botones-container">
            <button onClick={handleFlip} className="flip-button">Ver Información</button>
            <button onClick={handleVerFotos} className="flip-button">Ver fotos</button>
          </div>
        </div>
      </div>

      {/* Modal de galería */}
      {galeriaAbierta && fotos.length > 0 && (
        <div className="galeria-modal">
          <div className="galeria-contenido">
            <img src={fotos[fotoActual]} alt={`Foto ${fotoActual + 1}`} className="galeria-img" />
            <div className="galeria-controles">
              <button onClick={handleAnterior} className="galeria-flecha">←</button>
              <button onClick={handleSiguiente} className="galeria-flecha">→</button>
            </div>
            <button onClick={handleCerrarGaleria} className="galeria-cerrar">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
