'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { getWeek, getYear } from "date-fns";

import apiClient from "../../lib/apiClients";
import TarjetaGiratoria from "./components/TarjetaGiratoria";
import { contarRespuestasPorSemana } from "./utils/contarRespuestasPorSemana";
import { agruparSemanasPorBloques } from "./utils/agruparSemanasPorBloque";
import { getTop5 } from "./utils/getsTop5";
import { countSiNo, countNivel, esRespuestaValida } from "./utils/contadores";

import GraficoNombres from './components/graficoNombres';
import GraficoBasura from './components/graficoBasura';
import GraficoAguaTurbia from './components/graficoAguaTurbia';
import GraficoTop5 from './components/graficoTop5';
import GraficoOlores from './components/graficoOlores';
import HeatmapAnimales from './components/heatmapAnimales';

//intento de caja de comentarios:
import CajaComentarios from './components/cajaComentarios';
import { extraerComentarios } from './utils/extraerComentarios';

//intento caja comentarios end

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);


export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [bloqueIndex, setBloqueIndex] = useState(0);

  // Cargar datos
 useEffect(() => {
    const fetchRespuestas = async () => {
      try {
        //*USO DE JSON LOCAL DE PRUEBA */
        //const res = await fetch('./data/respuestas.json');
        //const json= await res.json();
        /*fin*/

        /*LLAMADA A API (ANTIGUA) */
        //const res = await apiClient.get("/api/encuesta");
        //const json = await res.data;
        //console.log('lo q llega de api', json);
        /*fin*/
      
      //  setData(json);


      /*SUPER LLAMADA A API */
      const res = await apiClient.get("/api/encuesta");
      const listaBase = res.data; 

      //Obtener todas las respuestas usando los id
      const respuestasCompletas = await Promise.all(
        listaBase.map(async (entrada) => {
          try {
            const detalle = await apiClient.get(`/api/encuesta/${entrada.id}`);
            return {
              id: entrada.id,
              timestamp: entrada.created_at,
              respuestas: detalle.data //  esto debe ser el array de {item, respuesta}
            };
          } catch (error) {
            console.warn(`Error cargando detalle de ${entrada.id}:`, error);
            return null; 
          }
        })
      );

      // Filtrar los que vinieron nulos por error
      const respuestasFiltradas = respuestasCompletas.filter(Boolean);

      setData(respuestasFiltradas);

      /*FIN SUPER LLAMADA A API*/

        // Calcular semana actual
        const hoy = new Date();
        const semanaActual = getWeek(hoy, { weekStartsOn: 1 });
        const añoActual = getYear(hoy);
        const claveActual = `${añoActual}-S${semanaActual}`;

        const respuestasSemanaTemp = contarRespuestasPorSemana(respuestasFiltradas);

        // Completar semanas faltantes
        const años = [...new Set(Object.keys(respuestasSemanaTemp).map(k => k.split('-S')[0]))];
        años.forEach(año => {
          for (let i = 1; i <= 52; i++) {
            const clave = `${año}-S${i}`;
            if (!respuestasSemanaTemp[clave]) respuestasSemanaTemp[clave] = [];
          }
        });

        // Calcular bloques y buscar índice del actual
        const bloquesTemp = agruparSemanasPorBloques(respuestasSemanaTemp, 4);
        const indexBloqueActual = bloquesTemp.findIndex(b => b.includes(claveActual));

        if (indexBloqueActual !== -1) {
          setBloqueIndex(indexBloqueActual);
        }

      } catch (error) {
        console.error('Error al procesar datos:', error);
      }
    };
    fetchRespuestas();
  }, []);

  
  const respuestasSemana = useMemo(() => {
    if (!data) return {};
    const agrupadas = contarRespuestasPorSemana(data);

    // Asegurar que haya 52 semanas para cada año presente
    const años = [...new Set(Object.keys(agrupadas).map(k => k.split('-S')[0]))];

    años.forEach(año => {
      for (let i = 1; i <= 52; i++) {
        const clave = `${año}-S${i}`;
        if (!agrupadas[clave]) agrupadas[clave] = [];
      }
    });

    return agrupadas;
  }, [data]);
  //console.log('resp por semana', respuestasSemana);
  const bloques = useMemo(() => {
    return agruparSemanasPorBloques(respuestasSemana, 4);
  }, [respuestasSemana]);
  //console.log('bloques', bloques);

  const semanas = bloques[bloqueIndex] || [];
  const rangoSemanas = useMemo(() => {
    if (semanas.length === 0) return '';

    const semanasSeparadas = semanas.map(s => {
      const [año, semana] = s.split('-S');
      return { año: parseInt(año), semana: parseInt(semana) };
    }).filter(({ año, semana }) => !isNaN(año) && !isNaN(semana));

    const años = [...new Set(semanasSeparadas.map(s => s.año))].sort();
    const semanasNumeros = semanasSeparadas.map(s => s.semana);

    const añoTexto = años.length === 1
      ? `${años[0]}`
      : `${años[0]}–${años[años.length - 1]}`;

    const minSemana = Math.min(...semanasNumeros);
    const maxSemana = Math.max(...semanasNumeros);

    let semanasTexto = '';
    // Si hay semanas no consecutivas como 52,1,2,3... las mostramos completas
    if (semanasNumeros.length > 0) {
      const ordenadas = [...new Set(semanasNumeros)].sort((a, b) => a - b);
      if (ordenadas[0] === minSemana && ordenadas[ordenadas.length - 1] === maxSemana && ordenadas.length === (maxSemana - minSemana + 1)) {
        semanasTexto = `Semanas ${minSemana}–${maxSemana}`;
      } else {
        semanasTexto = `Semanas ${ordenadas.join(', ')}`;
      }
    }

    return `${añoTexto} - ${semanasTexto}`;
  }, [semanas]);
  //console.log('semanas', semanas);
  const respuestasBloque = semanas
    .flatMap((s) => respuestasSemana[s] || [])
    .filter(Array.isArray); // <--- solo arrays válidos


  const animales = ['percibe-aves', 'percibe-peces', 'percibe-ganado', 'percibe-ranas', 'percibe-insectos'];

  const heatmapData = useMemo(() => {
    const celdas = [];

    animales.forEach((animal, yIndex) => {

      semanas.forEach((semana, xIndex) => {
        const respuestasArray = respuestasSemana[semana] || [];

        // Aplanar todos los arrays de respuestas individuales
        const respuestas = respuestasArray.flat();

        // Filtrar por coincidencias del animal con respuesta "si"
        const total = respuestas.filter(r =>
          esRespuestaValida(r) && r.item === animal && r.respuesta === 'si'
        ).length;
        celdas.push({
          x: xIndex,
          y: yIndex,
          v: total,
          animal: animal.replace('percibe-', '')
        });
      });
    });

    return celdas;
  }, [semanas, respuestasSemana, animales]);
  const top5 = useMemo(() => {
    if (!data) return [];
    return getTop5(data);
  }, [data]);
  //console.log('datos top5', top5);

  // Datos de cada gráfico
  const nombresSiNo = countSiNo(data, 'conoce-nombre-humedal');
  //console.log('datos de nombres', nombresSiNo);

  const basuraPorSemana = semanas.map(semana => {
    const respuestas = (respuestasSemana[semana] || []).flat();
    return {
      semana,
      data: countSiNo(respuestas, 'percibe-desechos')
    };
  });
  //console.log('datos basura', basuraPorSemana);
  const aguaPorSemana = semanas.map(semana => {
    const respuestas = (respuestasSemana[semana] || []).flat();
    return {
      semana,
      data: countSiNo(respuestas, 'percibe-agua-turbia')
    };
  });
    //console.log('datos agua', aguaPorSemana);

  const oloresData = countNivel(respuestasBloque, 'huele', ['1', '2', '3']);
  //console.log('datos olores', oloresData);

  const logoPath = '/logo-uach.png';
  // Mostrar "Cargando..." mientras no hay datos
  if (!data) {
    return (
      <main className="main-container">
        <div className="dashboard-card">Cargando datos...</div>
      </main>
    );
  }

  return (
    <main className="main-container">

        <div className="main-card-wrapper">
            <div className="section-header-main">
                <h1>MIRADAL DASHBOARD</h1>
                <div className="logo-container">
                <Image src={logoPath} alt="Logo Universidad Austral de Chile" width={150} height={64} style={{ objectFit: 'contain' }} />
                </div>
            </div>
            
            <div className="main-card-content-area">
                {/*Tarjeta de Introduccion*/}
                <div className="dashboard-card-static">
                    <h2 className="chart-title">Bienvenido al Dashboard de Miradal</h2>
                    <p>
                        Esta página presenta una visualización de los datos recopilados sobre la percepción ambiental del Humedal Miraflores en Valdivia.
                        Cada tarjeta interactiva muestra un aspecto diferente del estudio. Haz clic en los botones para explorar los graficos.
                    </p>
                </div>
            
                <div className="dashboard-grid">

                    {/*Grafico de Torta*/}
                    <div className="dashboard-card">
                     <TarjetaGiratoria
                      infoAdicional="🌿 ¿Conoces el Humedal El Bosque?

 Muchos estudiantes lo ven todos los días al pasar por el Campus Miraflores de la UACh, pero pocos saben cómo se llama o cuán valioso es. Este humedal alberga una rica diversidad de flora y fauna, y forma parte del paisaje cotidiano.

🚰 Sabías que forma parte de una red de humedales urbanos que incluye los sectores Bosque–Miraflores–Las Mulatas–Guacamayo y que fue declarada área protegida en 202, protegiendo aproximadamente 387 hectáreas.😲
Cumple funciones clave como filtrar el agua, absorber carbono y ser refugio de biodiversidad local.🐸

📊 Mira este gráfico y descubre cuántas personas aún no lo conocen.⬇️

 ¡Ayúdanos a difundir su nombre y su importancia para que más gente lo valore y lo cuide!"
                      fotos={[
                        "fotos/foto1.png"                    
                      ]}
                    >
                      <div className="nombres-y-top5">
                        <div className="grafico-nombres">
                          <GraficoNombres data={nombresSiNo} />
                        </div>
                        <div className="tabla-top5">
                          <GraficoTop5 data={top5} />
                        </div>
                      </div>
                    </TarjetaGiratoria>
                    </div>
                
                    {/*Heatmap*/}
                    <div className='bloque-nav' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', gap: '8px' }} >
                      <button onClick={() => setBloqueIndex(i => Math.max(i-1, 0))} disabled={bloqueIndex === 0}>⬅️</button>
                      ({rangoSemanas}) 
                      <button onClick={() => setBloqueIndex(i => Math.min(i+1, bloques.length-1))} disabled={bloqueIndex >= bloques.length-1}>➡️</button>
                    </div>
                    <div className="dashboard-card">
                    <TarjetaGiratoria
                        infoAdicional="Avistamientos de animales durante la semana. Haz clic para ver el detalle."
                    >
                     <HeatmapAnimales data={heatmapData} semanasLabels={semanas} animales={animales} />
                    </TarjetaGiratoria>
                    </div>

                    {/*Grafico de Basura*/}
                    <div className='bloque-nav' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', gap: '8px' }} >
                      <button onClick={() => setBloqueIndex(i => Math.max(i-1, 0))} disabled={bloqueIndex === 0}>⬅️</button>
                      ({rangoSemanas}) 
                      <button onClick={() => setBloqueIndex(i => Math.min(i+1, bloques.length-1))} disabled={bloqueIndex >= bloques.length-1}>➡️</button>
                    </div>
                    <div className="dashboard-card">
                    <TarjetaGiratoria
                        infoAdicional="La presencia de basura es perjudicial para el ecosistema. Haz clic para ver los reportes."
                    >
                      <GraficoBasura dataPorSemana={basuraPorSemana} />
                    </TarjetaGiratoria>
                    </div>

                    {/*Grafico de Agua Turbia*/}
                    <div className='bloque-nav' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', gap: '8px' }} >
                      <button onClick={() => setBloqueIndex(i => Math.max(i-1, 0))} disabled={bloqueIndex === 0}>⬅️</button>
                      ({rangoSemanas}) 
                      <button onClick={() => setBloqueIndex(i => Math.min(i+1, bloques.length-1))} disabled={bloqueIndex >= bloques.length-1}>➡️</button>
                    </div>
                    <div className="dashboard-card">
                    <TarjetaGiratoria 
                        infoAdicional="La turbidez del agua es un indicador clave de la salud del humedal. Haz clic para ver los datos."
                    >
                      <GraficoAguaTurbia dataPorSemana={aguaPorSemana} />
                    </TarjetaGiratoria>
                    </div>

                    {/*Grafico de Olor*/}
                    <div className='bloque-nav' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px', gap: '8px' }} >
                      <button onClick={() => setBloqueIndex(i => Math.max(i-1, 0))} disabled={bloqueIndex === 0}>⬅️</button>
                      ({rangoSemanas}) 
                      <button onClick={() => setBloqueIndex(i => Math.min(i+1, bloques.length-1))} disabled={bloqueIndex >= bloques.length-1}>➡️</button>
                    </div>
                    <div className="dashboard-card">
                    <TarjetaGiratoria
                        infoAdicional="Percepción de mal olor registrada durante la semana. Haz clic para ver los detalles."
                    >
                      <GraficoOlores data={oloresData} />
                      </TarjetaGiratoria>
                    </div>

                    
                  <div className="dashboard-card-amplia">
                    <CajaComentarios comentarios={extraerComentarios(data)} />
                  </div>
                </div>
            </div>
        </div>
    </main>
  );
}
