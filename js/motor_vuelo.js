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

    /* --- AQUÍ EMPIEZA LA MAGIA AUTOMÁTICA --- */

    // A) Generar CHECKLIST (Todas las fases)
    const containerCheck = document.getElementById('checklist-container');
    const tituloCheck = document.getElementById('titulo-checklist');
    
    if (containerCheck && tituloCheck) {
        // Limpiamos lo anterior
        containerCheck.innerHTML = ''; 
        // Cambiamos el título para que sea genérico
        tituloCheck.textContent = perfil.nombre + ": Procedimientos";

        // Verificamos si existe el objeto 'checklists' en el JSON nuevo
        if (perfil.checklists) {
            
            // Recorremos cada fase (clave) y sus pasos (valor)
            Object.entries(perfil.checklists).forEach(([faseKey, pasos], faseIndex) => {

                // 1. Crear un Título para la fase (Ej: PUESTA EN MARCHA)
                const h3 = document.createElement('h3');
                h3.textContent = formatearTitulo(faseKey);
                h3.style.marginTop = "20px";
                h3.style.borderBottom = "2px solid #ff9800"; // Un toque visual naranjita
                h3.style.paddingBottom = "5px";
                h3.style.color = "#ddd"; // Color gris claro para que se vea bien en fondo oscuro
                containerCheck.appendChild(h3);

                // 2. Crear los checkboxes para esa fase
                pasos.forEach((pasoTexto, pasoIndex) => {
                    const div = document.createElement('div');
                    div.className = 'check-row';
                    
                    // Generamos un ID único para cada checkbox (fase + indice)
                    const uniqueID = `chk_${faseIndex}_${pasoIndex}`;

                    // Procesamos el texto: "Frenos - PUESTOS"
                    let itemHTML = pasoTexto;
                    if (pasoTexto.includes('-')) {
                        const partes = pasoTexto.split('-');
                        // Parte izquierda (Item) en negrita, parte derecha (Acción) normal
                        itemHTML = `<strong>${partes[0].trim()}</strong> <span>- ${partes.slice(1).join('-').trim()}</span>`;
                    }

                    // Creamos el HTML
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
            containerCheck.innerHTML = '<p>No se encontraron checklists para este avión.</p>';
        }
    }

    // B) Generar FICHA TÉCNICA (Velocidades)
    const tablaVel = document.getElementById('tabla-velocidades');
    if (tablaVel) {
        tablaVel.innerHTML = ''; // Limpiar

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
        tablaMotor.innerHTML = ''; // Limpiar

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

    // D) MÓDULO 3: IMAGEN DEL MANDO (NUEVO)
    const contenedorMando = document.getElementById('modulo-mando');
    if (contenedorMando) {
        contenedorMando.innerHTML = ''; // Limpiar el "Vacío"
        
        // Verificamos si en el JSON existe la propiedad "imagen_mando"
        if (perfil.imagen_mando) {
            const img = document.createElement('img');
            // IMPORTANTE: Añadimos '../' porque el html está en una subcarpeta
            img.src = '../' + perfil.imagen_mando; 
            img.alt = "Configuración de Mando";
            
            // Estilos para que encaje perfecto
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.display = "block";
            img.style.borderRadius = "4px";
            
            // Gestión de errores por si la imagen no carga
            img.onerror = function() {
                contenedorMando.innerHTML = '<p class="placeholder" style="color:red">Error cargando imagen.</p>';
            };

            contenedorMando.appendChild(img);
        } else {
            contenedorMando.innerHTML = '<p class="placeholder">Sin esquema de mando</p>';
        }
    }
}

// Función auxiliar para poner bonitos los títulos (ej: "antes_del_vuelo" -> "Antes Del Vuelo")
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

/* --- FUNCIONES DE LOS BOTONES --- */

function switchTab(tabName) {
    const checklist = document.getElementById('tab-checklist');
    const ficha = document.getElementById('tab-ficha');
    
    if (!checklist || !ficha) return;

    // Mostrar/Ocultar
    if (tabName === 'checklist') {
        checklist.classList.remove('hidden');
        ficha.classList.add('hidden');
    } else {
        checklist.classList.add('hidden');
        ficha.classList.remove('hidden');
    }

    // Iluminar botones
    const btns = document.querySelectorAll('.toggle-wrapper .tab-btn');
    if (btns.length >= 2) {
        if (tabName === 'checklist') {
            btns[0].classList.add('active');
            btns[1].classList.remove('active');
        } else {
            btns[0].classList.remove('active');
            btns[1].classList.add('active');
        }
    }
}

function resetChecklist() {
    const checks = document.querySelectorAll('#tab-checklist input[type="checkbox"]');
    checks.forEach(cb => cb.checked = false);
}