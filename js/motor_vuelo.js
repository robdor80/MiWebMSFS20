document.addEventListener('DOMContentLoaded', iniciarVuelo);

async function iniciarVuelo() {
    // 1. Recuperamos qué avión seleccionó el usuario en la pantalla anterior
    const idAvion = localStorage.getItem('avion_seleccionado');

    // Seguridad: Si alguien entra directo a vuelo.html sin elegir avión, lo echamos
    if (!idAvion) {
        alert("Debes seleccionar un avión primero.");
        window.location.href = '../aviones/aviones.html';
        return;
    }

    // 2. Cargamos los datos de ese avión específico
    try {
        await cargarDatosAvion(idAvion);
        iniciarReloj();
    } catch (error) {
        console.error("Error iniciando vuelo:", error);
        alert("Error cargando el avión. Revisa la consola.");
    }
}

async function cargarDatosAvion(id) {
    // Primero leemos el inventario para saber dónde está el perfil de este ID
    const respFlota = await fetch('../data/flota.json');
    const flota = await respFlota.json();
    
    const avionInfo = flota.find(a => a.id === id);
    if (!avionInfo) throw new Error("Avión no encontrado en flota");

    // Ahora leemos el perfil completo (el JSON grande)
    const respPerfil = await fetch('../' + avionInfo.archivo_perfil);
    const perfil = await respPerfil.json();

    // Guardamos el perfil completo en memoria para usarlo en los módulos
    window.perfilAvionActual = perfil;

    // ACTUALIZAMOS LA INTERFAZ
    // Ponemos el nombre en la barra superior
    document.getElementById('indicador-avion').textContent = perfil.nombre;

    // (Temporal) Mostramos texto en el slot central para confirmar que funciona
    const panelCentral = document.getElementById('contenido-cen');
    panelCentral.innerHTML = `
        <div style="text-align:center; color: white;">
            <h2 style="color: #4a90e2;">${perfil.nombre}</h2>
            <p>Datos cargados correctamente.</p>
            <p>Velocidad de Ascenso (Vy): <strong>${perfil.ficha_tecnica.velocidades_importantes.vy_ascenso} kts</strong></p>
        </div>
    `;
}

function iniciarReloj() {
    setInterval(() => {
        const ahora = new Date();
        const texto = ahora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.getElementById('reloj-local').textContent = texto;
    }, 1000);
}

/* --- FUNCIONES PANEL CENTRAL --- */

function switchTab(tabName) {
    // 1. Obtener los paneles
    const checklist = document.getElementById('tab-checklist');
    const ficha = document.getElementById('tab-ficha');

    // 2. Mostrar/Ocultar paneles
    if (tabName === 'checklist') {
        checklist.classList.remove('hidden');
        ficha.classList.add('hidden');
    } else {
        checklist.classList.add('hidden');
        ficha.classList.remove('hidden');
    }

    // 3. Gestionar estado visual de los botones
    const btns = document.querySelectorAll('.toggle-wrapper .tab-btn');
    if (tabName === 'checklist') {
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

function resetChecklist() {
    // Busca todos los checkboxes dentro del panel y los desmarca
    document.querySelectorAll('#tab-checklist input[type="checkbox"]')
        .forEach(cb => cb.checked = false);
}