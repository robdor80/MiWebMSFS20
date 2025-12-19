document.addEventListener('DOMContentLoaded', iniciarVuelo);

async function iniciarVuelo() {
    const idAvion = localStorage.getItem('avion_seleccionado');

    if (!idAvion) {
        alert("Debes seleccionar un avión primero.");
        window.location.href = '../aviones/aviones.html';
        return;
    }

    try {
        await cargarDatosAvion(idAvion);
        iniciarReloj();
    } catch (error) {
        console.error("Error iniciando vuelo:", error);
        alert("Error cargando el avión. Revisa la consola.");
    }
}

async function cargarDatosAvion(id) {
    // 1. Buscamos el avión en la flota
    const respFlota = await fetch('../data/flota.json');
    const flota = await respFlota.json();
    
    const avionInfo = flota.find(a => a.id === id);
    if (!avionInfo) throw new Error("Avión no encontrado en flota");

    // 2. Cargamos su perfil completo
    const respPerfil = await fetch('../' + avionInfo.archivo_perfil);
    const perfil = await respPerfil.json();

    window.perfilAvionActual = perfil;

    // 3. Rellenamos la barra superior
    const indicador = document.getElementById('indicador-avion');
    if (indicador) indicador.textContent = perfil.nombre;

    /* --- GENERACIÓN DINÁMICA DE CONTENIDO --- */

    // A) Generar CHECKLIST (Todas las fases)
    const containerCheck = document.getElementById('checklist-container');
    const tituloCheck = document.getElementById('titulo-checklist');
    
    if (containerCheck && tituloCheck) {
        containerCheck.innerHTML = ''; 
        tituloCheck.textContent = perfil.nombre + ": Procedimientos";

        if (perfil.checklists) {
            Object.entries(perfil.checklists).forEach(([faseKey, pasos], faseIndex) => {
                // Título de la fase
                const h3 = document.createElement('h3');
                h3.textContent = formatearTitulo(faseKey);
                h3.style.marginTop = "20px";
                h3.style.borderBottom = "2px solid #ff9800"; 
                h3.style.paddingBottom = "5px";
                h3.style.color = "#ddd"; 
                containerCheck.appendChild(h3);

                // Pasos de la fase
                pasos.forEach((pasoTexto, pasoIndex) => {
                    const div = document.createElement('div');
                    div.className = 'check-row';
                    const uniqueID = `chk_${faseIndex}_${pasoIndex}`;
                    
                    let itemHTML = pasoTexto;
                    if (pasoTexto.includes('-')) {
                        const partes = pasoTexto.split('-');
                        itemHTML = `<strong>${partes[0].trim()}</strong> <span>- ${partes.slice(1).join('-').trim()}</span>`;
                    }

                    div.innerHTML = `
                        <input type="checkbox" id="${uniqueID}">
                        <label for="${uniqueID}">
                            ${itemHTML}
                        </label>
                    `;
                    containerCheck.appendChild(div);
                });
            });
        } else {
            containerCheck.innerHTML = '<p>No se encontraron checklists.</p>';
        }
    }

    // B) Generar FICHA TÉCNICA (Velocidades)
    const tablaVel = document.getElementById('tabla-velocidades');
    if (tablaVel) {
        tablaVel.innerHTML = ''; 
        if (perfil.ficha_tecnica && perfil.ficha_tecnica.velocidades) {
            perfil.ficha_tecnica.velocidades.forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${v.nombre} <small style="color:#888">(${v.desc})</small></td>
                    <td class="num">${v.valor}</td>
                `;
                tablaVel.appendChild(tr);
            });
        }
    }

    // C) Generar FICHA TÉCNICA (Motor)
    const tablaMotor = document.getElementById('tabla-motor');
    if (tablaMotor) {
        tablaMotor.innerHTML = ''; 
        if (perfil.ficha_tecnica && perfil.ficha_tecnica.info_motor) {
            perfil.ficha_tecnica.info_motor.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${m.nombre}</td>
                    <td class="num">${m.valor}</td>
                `;
                tablaMotor.appendChild(tr);
            });
        }
    }

    // D) MÓDULO 3: IMAGEN DEL MANDO
    const contenedorMando = document.getElementById('modulo-mando');
    if (contenedorMando) {
        contenedorMando.innerHTML = ''; 
        
        if (perfil.imagen_mando) {
            const img = document.createElement('img');
            img.src = '../' + perfil.imagen_mando; 
            img.alt = "Configuración de Mando";
            
            // Estilos básicos (el resto va por CSS)
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.display = "block";
            
            img.onerror = function() {
                contenedorMando.innerHTML = '<p class="placeholder" style="color:red">Error cargando imagen.</p>';
            };

            contenedorMando.appendChild(img);
        } else {
            contenedorMando.innerHTML = '<p class="placeholder">Sin esquema de mando</p>';
        }
    }
}

// --- FUNCIONES AUXILIARES ---

function formatearTitulo(texto) {
    if (!texto) return "";
    return texto
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

function iniciarReloj() {
    setInterval(() => {
        const ahora = new Date();
        const texto = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const reloj = document.getElementById('reloj-local');
        if(reloj) reloj.textContent = texto;
    }, 1000);
}

/* --- FUNCIONES UI (PESTAÑAS) --- */

function switchTab(tabName) {
    const checklist = document.getElementById('tab-checklist');
    const ficha = document.getElementById('tab-ficha');
    
    if (!checklist || !ficha) return;

    // 1. Mostrar/Ocultar contenido
    if (tabName === 'checklist') {
        checklist.classList.remove('hidden');
        ficha.classList.add('hidden');
    } else {
        checklist.classList.add('hidden');
        ficha.classList.remove('hidden');
    }

    // 2. Actualizar estado de los botones (NUEVA VERSIÓN DISCRETA)
    // Buscamos todos los botones con la nueva clase
    const btns = document.querySelectorAll('.tab-btn-discrete');
    
    // Reseteamos todos (quitamos 'active')
    btns.forEach(btn => btn.classList.remove('active'));

    // Activamos el correcto según su texto o posición
    if (tabName === 'checklist') {
        // Asumimos que el primero es checklist
        if(btns[0]) btns[0].classList.add('active');
    } else {
        // Asumimos que el segundo es ficha
        if(btns[1]) btns[1].classList.add('active');
    }
}

function resetChecklist() {
    const checks = document.querySelectorAll('#tab-checklist input[type="checkbox"]');
    checks.forEach(cb => cb.checked = false);
}

/* ==========================================
   GESTIÓN DE RUTAS (MÓDULO 1)
   ========================================== */

// 1. Cargar desde servidor (Selector)
async function cargarRutaSeleccionada(nombreArchivo) {
    if (!nombreArchivo) return;

    const container = document.getElementById('container-tramos');
    const headerInfo = document.getElementById('info-ruta-header');
    
    container.innerHTML = '<p class="placeholder">Cargando datos de navegación...</p>';

    try {
        const respuesta = await fetch(`../data/rutas/${nombreArchivo}.json`);
        if (!respuesta.ok) throw new Error("No se pudo cargar la ruta");
        
        const datos = await respuesta.json();
        renderizarRuta(datos);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="placeholder" style="color:red">Error al cargar ruta</p>';
        headerInfo.classList.add('hidden');
    }
}

// 2. Cargar desde PC (Input File) - NUEVO
function cargarRutaDesdePC(input) {
    const archivo = input.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function(evento) {
        try {
            const datos = JSON.parse(evento.target.result);
            renderizarRuta(datos);
            
            // Limpiamos el selector para evitar confusión
            const selector = document.getElementById('selector-ruta');
            if(selector) selector.value = "";
            
        } catch (error) {
            console.error("Error leyendo JSON:", error);
            alert("El archivo no es válido o está dañado.");
        }
    };

    lector.readAsText(archivo);
}

// 3. Pintar en pantalla
function renderizarRuta(datos) {
    const headerInfo = document.getElementById('info-ruta-header');
    document.getElementById('ruta-nombre').textContent = datos.meta.nombre;
    document.getElementById('ruta-meteo').innerHTML = `<i class="fas fa-cloud-sun"></i> ${datos.meta.meteo_prevista}`;
    headerInfo.classList.remove('hidden');

    const container = document.getElementById('container-tramos');
    container.innerHTML = ''; 

    datos.tramos.forEach((tramo, index) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tramo-card';
        
        let icono = 'fa-arrow-right';
        let colorBorde = '#444'; 
        
        if (tramo.tipo === 'DESPEGUE') { 
            icono = 'fa-plane-departure'; 
            colorBorde = '#ff9800'; 
        } else if (tramo.tipo === 'ATERRIZAJE') {
            icono = 'fa-plane-arrival';
            colorBorde = '#4caf50'; 
        }

        tarjeta.style.borderLeft = `4px solid ${colorBorde}`;

        tarjeta.innerHTML = `
            <div class="tramo-header">
                <span class="tramo-id">#${index + 1} ${tramo.tipo}</span>
                <span class="tramo-rumbo"><i class="far fa-compass"></i> ${tramo.rumbo}</span>
            </div>
            <div class="tramo-body">
                <div class="tramo-puntos">
                    <strong>${tramo.punto_inicio}</strong> <i class="fas ${icono}"></i> <strong>${tramo.punto_fin}</strong>
                </div>
                <div class="tramo-datos">
                    <span><i class="fas fa-arrows-alt-v"></i> ${tramo.altitud}</span>
                    <span><i class="fas fa-tachometer-alt"></i> ${tramo.velocidad}</span>
                    <span><i class="far fa-clock"></i> ${tramo.tiempo}</span>
                </div>
                <div class="tramo-instruccion">
                    ${tramo.instruccion}
                </div>
            </div>
        `;

        container.appendChild(tarjeta);
    });
}