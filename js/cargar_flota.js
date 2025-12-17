document.addEventListener('DOMContentLoaded', () => {
    cargarFlota();
});

async function cargarFlota() {
    const contenedor = document.getElementById('grid-aviones');
    
    try {
        // 1. Buscamos el inventario (flota.json)
        // Usamos "../" porque estamos en la carpeta /aviones/ y queremos ir a /data/
        const respuestaInventario = await fetch('../data/flota.json');
        
        if (!respuestaInventario.ok) {
            throw new Error("No se pudo encontrar data/flota.json");
        }

        const flota = await respuestaInventario.json();

        // Limpiamos el mensaje de "Cargando..."
        contenedor.innerHTML = '';

        // 2. Recorremos cada avión del inventario
        for (const item of flota) {
            try {
                // Leemos el perfil individual de cada avión
                const respuestaPerfil = await fetch('../' + item.archivo_perfil);
                
                if (!respuestaPerfil.ok) {
                    console.error(`No se encontró el perfil: ${item.archivo_perfil}`);
                    continue;
                }

                const avion = await respuestaPerfil.json();
                
                // 3. Creamos la tarjeta y la añadimos a la pantalla
                const tarjetaHTML = crearTarjetaHTML(avion);
                contenedor.innerHTML += tarjetaHTML;

            } catch (error) {
                console.error(`Error cargando el avión ${item.id}:`, error);
            }
        }

        // Si no hay aviones, mostramos aviso
        if (flota.length === 0) {
            contenedor.innerHTML = '<p>No hay aviones en tu hangar todavía.</p>';
        }

    } catch (error) {
        console.error("Error crítico:", error);
        contenedor.innerHTML = `<p style="color: red;">Error cargando la flota. Verifica que 'data/flota.json' existe.</p>`;
    }
}

function crearTarjetaHTML(avion) {
    // Extraemos datos clave para mostrar en la tarjeta
    // Usamos ?. para evitar errores si falta algún dato
    const velCrucero = avion.ficha_tecnica?.configuracion_crucero?.rpm_crucero || "N/A";
    const velAscenso = avion.ficha_tecnica?.velocidades_importantes?.vy_ascenso || "N/A";
    
    // NOTA: Ajustamos la ruta de la imagen añadiendo "../"
    // porque el JSON asume ruta desde raíz, pero el HTML está en /aviones/
    const rutaImagen = `../${avion.imagenes.avion}`;

    return `
        <article class="card-avion">
            <div class="card-imagen">
                <img src="${rutaImagen}" alt="${avion.nombre}" onerror="this.src='../assets/imagenes/default/aviones.png'">
            </div>
            
            <div class="card-contenido">
                <h3>${avion.nombre}</h3>
                <p class="descripcion">${avion.resumen}</p>
                
                <div class="datos-rapidos">
                    <span title="Velocidad Ascenso">↗ Vy: ${velAscenso} kts</span>
                    <span title="RPM Crucero">⚙ ${velCrucero} RPM</span>
                </div>

                <button class="btn-ficha" onclick="abrirFicha('${avion.id}')">
                    ABRIR FICHA
                </button>
            </div>
        </article>
    `;
}

function abrirFicha(idAvion) {
    // 1. Guardamos el ID del avión en la memoria del navegador
    // Así la siguiente página sabrá qué cargar.
    localStorage.setItem('avion_seleccionado', idAvion);
    
    // 2. Redirigimos a la pantalla de vuelo
    window.location.href = '../vfr/vuelo.html';
}
