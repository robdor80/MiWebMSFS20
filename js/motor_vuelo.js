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
    document.getElementById('indicador-avion').textContent = perfil.nombre;

    /* --- AQUÍ EMPIEZA LA MAGIA AUTOMÁTICA --- */

    // A) Generar CHECKLIST
    const containerCheck = document.getElementById('checklist-container');
    const tituloCheck = document.getElementById('titulo-checklist');
    
    // Limpiamos lo anterior
    containerCheck.innerHTML = ''; 
    tituloCheck.textContent = perfil.nombre + ": Arranque";

    // Si el JSON tiene checklist, la creamos
    if (perfil.checklist_arranque) {
        perfil.checklist_arranque.forEach((paso, index) => {
            const div = document.createElement('div');
            div.className = 'check-row';
            // Creamos el HTML de cada línea
            div.innerHTML = `
                <input type="checkbox" id="chk_${index}">
                <label for="chk_${index}">
                    ${paso.item} <span>${paso.estado}</span>
                </label>
            `;
            containerCheck.appendChild(div);
        });
    }

    // B) Generar FICHA TÉCNICA (Velocidades)
    const tablaVel = document.getElementById('tabla-velocidades');
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

    // C) Generar FICHA TÉCNICA (Motor)
    const tablaMotor = document.getElementById('tabla-motor');
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

function iniciarReloj() {
    setInterval(() => {
        const ahora = new Date();
        const texto = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById('reloj-local').textContent = texto;
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