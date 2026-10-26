const ciudadInput = document.getElementById('ciudad-input');
const botonBuscar = document.getElementById('boton-buscar');
const mensajeEstado = document.getElementById('mensaje-estado');
const resultadoClima = document.getElementById('resultado-clima');

const nombreCiudad = document.getElementById('nombre-ciudad');
const temperaturaEl = document.getElementById('temperatura');
const simboloUnidad = document.getElementById('simbolo-unidad');
const vientoEl = document.getElementById('viento');
const fraseClima = document.getElementById('frase-clima');
const botonUnidad = document.getElementById('boton-unidad');

const seccionHistorial = document.getElementById('seccion-historial');
const listaHistorial = document.getElementById('lista-historial');

let temperaturaCelsius = 0;
let esCelsius = true;

// Eventos
botonBuscar.addEventListener('click', () => buscarClima(ciudadInput.value));
ciudadInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarClima(ciudadInput.value);
});
botonUnidad.addEventListener('click', cambiarUnidad);

// Apenas carga la página, mostramos el historial guardado si existe
mostrarHistorial();

async function buscarClima(nombreCiudadParam) {
    const ciudad = nombreCiudadParam.trim();

    if (ciudad === '') {
        mostrarMensaje('Por favor, escribí el nombre de una ciudad.');
        return;
    }

    mostrarMensaje('Buscando clima en vivo... ⏳');
    resultadoClima.classList.add('oculto');

    try {
        // 1. Coordenadas
    const urlGeo = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ar&q=${encodeURIComponent(ciudad)}`;
        const respuestaGeo = await fetch(urlGeo);
        const datosGeo = await respuestaGeo.json();

        if (datosGeo.length === 0) {
            mostrarMensaje('❌ No se encontró esa ciudad. Revisá si está bien escrita.');
            return;
        }

        const lat = datosGeo[0].lat;
        const lon = datosGeo[0].lon;
        const nombreEncontrado = datosGeo[0].display_name.split(',')[0];

        // 2. Datos del clima
        const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const respuestaClima = await fetch(urlClima);
        const datosClima = await respuestaClima.json();

        temperaturaCelsius = Math.round(datosClima.current_weather.temperature);
        const vientoActual = datosClima.current_weather.windspeed;

        // 3. Pintar en pantalla
        nombreCiudad.textContent = nombreEncontrado;
        esCelsius = true;
        actualizarVistaTemperatura();
        
        vientoEl.textContent = `Viento: ${vientoActual} km/h`;
        fraseClima.textContent = obtenerFraseDinamica(temperaturaCelsius);

        mensajeEstado.classList.add('oculto');
        resultadoClima.classList.remove('oculto');

        // 4. Guardar en LocalStorage
        guardarEnHistorial(nombreEncontrado);

    } catch (error) {
        console.error(error);
        mostrarMensaje('❌ Ocurrió un error al conectar con el servidor.');
    }
}

// Función para alternar entre Celsius y Fahrenheit
function actualizarVistaTemperatura() {
    if (esCelsius) {
        temperaturaEl.textContent = temperaturaCelsius;
        simboloUnidad.textContent = '°C';
        botonUnidad.textContent = 'Cambiar a °F 🔄';
    } else {
        const tempFahrenheit = Math.round((temperaturaCelsius * 9/5) + 32);
        temperaturaEl.textContent = tempFahrenheit;
        simboloUnidad.textContent = '°F';
        botonUnidad.textContent = 'Cambiar a °C 🔄';
    }
}

function cambiarUnidad() {
    esCelsius = !esCelsius;
    actualizarVistaTemperatura();
}

// Frases dinámicas según la temperatura
function obtenerFraseDinamica(temp) {
    if (temp > 30) return "🔥 ¡Un horno la calle, ni salgas de tu casa!";
    if (temp >= 20 && temp <= 30) return "😎 Clima ideal para tomar unos mates al sol.";
    if (temp >= 10 && temp < 20) return "🧥 Fresquito piola, ponete una camperita liviana.";
    return "❄️ Hiela hasta el alma, prepará un buen guiso o un locro.";
}

// Guardar historial en la memoria del navegador (LocalStorage)
function guardarEnHistorial(ciudad) {
    let historial = JSON.parse(localStorage.getItem('ciudades_clima')) || [];
    
    // Sacamos la ciudad si ya estaba para ponerla al principio y evitamos duplicados
    historial = historial.filter(c => c.toLowerCase() !== ciudad.toLowerCase());
    historial.unshift(ciudad);
    
    // Dejamos un máximo de 4 ciudades guardadas
    if (historial.length > 4) historial.pop();
    
    localStorage.setItem('ciudades_clima', JSON.stringify(historial));
    mostrarHistorial();
}

// Mostrar los botones del historial en pantalla
function mostrarHistorial() {
    const historial = JSON.parse(localStorage.getItem('ciudades_clima')) || [];
    listaHistorial.innerHTML = '';

    if (historial.length === 0) {
        seccionHistorial.classList.add('oculto');
        return;
    }

    seccionHistorial.classList.remove('oculto');
    historial.forEach(ciudad => {
        const btn = document.createElement('button');
        btn.textContent = ciudad;
        btn.className = 'btn-historial';
        btn.addEventListener('click', () => {
            ciudadInput.value = ciudad;
            buscarClima(ciudad);
        });
        listaHistorial.appendChild(btn);
    });
}

function mostrarMensaje(texto) {
    mensajeEstado.textContent = texto;
    mensajeEstado.classList.remove('oculto');
}