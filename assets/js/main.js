const form = document.getElementById('createTaskForm');

form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(form);
    const nuevoRegistro = Object.fromEntries(formData.entries());
    nuevoRegistro.estado = "Solicitud Enviada";

    const listaExistente = localStorage.getItem('Solicitudes')
    const historial = listaExistente ? JSON.parse(listaExistente) : [];
    
    const idOculto = document.getElementById('inputIdOculto').value;
    let nuevoId = 1;

    if (idOculto) {
        nuevoRegistro.id = parseInt(idOculto);
        const index = historial.findIndex(registro => registro.id === nuevoRegistro.id);
        if (index !== -1) {
            nuevoRegistro.estado = historial[index].estado;
            historial[index] = nuevoRegistro;
        }
    }else{
        while (historial.some(registro => registro.id === nuevoId)) {
        nuevoId++;
        }
        nuevoRegistro.id = nuevoId;
        nuevoRegistro.estado = "Solicitud Enviada";
        historial.push(nuevoRegistro);
    }

    localStorage.setItem('Solicitudes', JSON.stringify(historial));
    renderizarSolicitudes();
    form.reset();
    inputIdOculto.value = '';
    const modalElement = document.getElementById('createModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
});

function renderizarSolicitudes() {
    const listaExistente = localStorage.getItem('Solicitudes');
    const historial = listaExistente ? JSON.parse(listaExistente) : [];

    const colSolicitud = document.getElementById('col-solicitud');
    const colEntrevistaAgendada = document.getElementById('col-entrevista-agendada');
    const colEntrevistaRealizada = document.getElementById('col-entrevista-realizada');
    const colPasosExtra = document.getElementById('col-pasos-extra');
    const colContratado = document.getElementById('col-contratado');
    const colRechazado = document.getElementById('col-rechazado');
    const colSinRespuesta = document.getElementById('col-sin-respuesta');

    colSolicitud.innerHTML = '';
    colEntrevistaAgendada.innerHTML = '';
    colEntrevistaRealizada.innerHTML = '';
    colPasosExtra.innerHTML = '';
    colContratado.innerHTML = '';
    colRechazado.innerHTML = '';
    colSinRespuesta.innerHTML = '';

    const template = document.getElementById('kanbanCardTemplate');
    historial.forEach(registro => {
        const clone = template.content.cloneNode(true);
        const cardElement = clone.querySelector('.kanban-card');

        const btnEliminar = clone.querySelector('.btn-danger');
        const btnEditar = clone.querySelector('.btn-primary');
        btnEditar.dataset.id = registro.id;
        btnEliminar.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
                eliminarSolicitud(registro.id);
            }
        });
        btnEditar.addEventListener('click', () => {
            const idAEditar = parseInt(event.target.dataset.id);
            const historial = JSON.parse(localStorage.getItem('Solicitudes')) || [];
            const solicitud = historial.find(item => item.id === idAEditar);
            const form = document.getElementById('createTaskForm');
            for (const [clave,valor] of Object.entries(solicitud)) {
                if (form.elements[clave]) {
                    form.elements[clave].value = valor;
                }
            }
            document.getElementById('inputIdOculto').value = idAEditar;
            const createModal = new bootstrap.Modal(document.getElementById('createModal'));
            const idOculto = document.getElementById('inputIdOculto').value;
            console.log('ID oculto:', idOculto);
            createModal.show();
         
        });
        clone.querySelector('.task-title').textContent = registro.Puesto || '';
        clone.querySelector('.task-company').textContent = registro.Empresa || '';
        clone.querySelector('.task-location').textContent = registro.Ubicacion || '';
        clone.querySelector('.task-time').textContent = registro.HoraInicio && registro.HoraFin ? `${registro.HoraInicio} - ${registro.HoraFin}` : '';
        clone.querySelector('.task-link').textContent = registro.Link || '';
        clone.querySelector('.task-salary').textContent = registro.Salario || '';
        
        cardElement.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', String(registro.id));
        });


        switch (registro.estado) {
            case 'Solicitud Enviada':
                colSolicitud.appendChild(clone);
                break;
            case 'Entrevista Agendada':
                colEntrevistaAgendada.appendChild(clone);
                break;
            case 'Entrevista Realizada':
                colEntrevistaRealizada.appendChild(clone);
                break;
            case 'Pasos Extra':
                colPasosExtra.appendChild(clone);
                break;
            case 'Contratado':
                colContratado.appendChild(clone);
                break;
            case 'Rechazado':
                colRechazado.appendChild(clone);
                break;
            case 'Sin respuesta':
            case 'Sin Respuesta':
                colSinRespuesta.appendChild(clone);
                break;
        }
    });
    console.table(historial);
}

function configurarZonasDrop() {
    const zonasDrop = [
        {id: 'col-solicitud', estado: 'Solicitud Enviada'},
        {id: 'col-entrevista-agendada', estado: 'Entrevista Agendada'},
        {id: 'col-entrevista-realizada', estado: 'Entrevista Realizada'},
        {id: 'col-pasos-extra', estado: 'Pasos Extra'},
        {id: 'col-contratado', estado: 'Contratado'},
        {id: 'col-rechazado', estado: 'Rechazado'},
        {id: 'col-sin-respuesta', estado: 'Sin Respuesta'}
    ];
    
    zonasDrop.forEach(zona => {
        const columna = document.getElementById(zona.id);
        if (!columna) return;
        
        columna.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        columna.addEventListener('drop', (event) => {
            event.preventDefault();
    
    // 1. Extraemos la información con la MISMA llave: 'text/plain'
            const idExtraido = event.dataTransfer.getData('text/plain');
            const idArrastrado = parseInt(idExtraido);

            console.log(`Intentando mover tarjeta ID: ${idArrastrado} a -> ${zona.estado}`);

            if (!idArrastrado) {
                console.error("Error: No se detectó un ID válido al soltar la tarjeta.");
                return;
            }

            const historial = JSON.parse(localStorage.getItem('Solicitudes') || '[]');
    
    // 2. Buscamos el índice asegurando que ambos sean números (Number)
            const index = historial.findIndex(registro => Number(registro.id) === idArrastrado);

            if (index === -1) {
                console.error("Error: El ID arrastrado no existe en el LocalStorage.");
                return;
            }

    // 3. Actualizamos el estado, guardamos y volvemos a pintar
            historial[index].estado = zona.estado;
            localStorage.setItem('Solicitudes', JSON.stringify(historial));
    
            console.log("¡Éxito! Tarjeta actualizada en LocalStorage.");
            renderizarSolicitudes();
        });
    });
}

function editarSolicitud(id, nuevosDatos) {
    const listaExistente = localStorage.getItem('Solicitudes');
    if (!listaExistente) return;
    let historial = JSON.parse(listaExistente);
    historial = historial.map(registro => registro.id === id ? { ...registro, ...nuevosDatos } : registro);
    localStorage.setItem('Solicitudes', JSON.stringify(historial));
    renderizarSolicitudes();
}
function eliminarSolicitud(id) {
    const listaExistente = localStorage.getItem('Solicitudes');
    if (!listaExistente) return;
    let historial = JSON.parse(listaExistente);
    historial = historial.filter(registro => registro.id !== id);
    localStorage.setItem('Solicitudes', JSON.stringify(historial))
    renderizarSolicitudes();
}

document.addEventListener('DOMContentLoaded', () => {
    configurarZonasDrop();
    renderizarSolicitudes();
});

function cargarSolicitudes() {
    const listaExistente = localStorage.getItem('Solicitudes');
    console.table(JSON.parse(listaExistente)); 
}
