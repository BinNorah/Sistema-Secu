import clienteAPI from '../../../api/cliente_api';

export const servicioNotas = {
  async listar(alumnoId = '', asignatura = '') {
    const params = {};
    if (alumnoId) params.alumno_id = alumnoId;
    if (asignatura) params.asignatura = asignatura;
    const res = await clienteAPI.get('/notas', { params });
    return res.datos || [];
  },

  async obtenerPorId(id) {
    const res = await clienteAPI.get(`/notas/${id}`);
    return res.datos;
  },

  async registrar(datos) {
    const res = await clienteAPI.post('/notas', datos);
    return res;
  },

  async actualizar(id, datos) {
    const res = await clienteAPI.put(`/notas/${id}`, datos);
    return res;
  },

  async eliminar(id) {
    const res = await clienteAPI.delete(`/notas/${id}`);
    return res;
  },

  // Operaciones del Patrón Memento
  async obtenerHistorial(id) {
    const res = await clienteAPI.get(`/notas/${id}/historial`);
    return res.datos;
  },

  async deshacer(id) {
    const res = await clienteAPI.post(`/notas/${id}/deshacer`);
    return res;
  },

  async rehacer(id) {
    const res = await clienteAPI.post(`/notas/${id}/rehacer`);
    return res;
  },

  async restaurarVersion(id, versionId) {
    const res = await clienteAPI.post(`/notas/${id}/restaurar/${versionId}`);
    return res;
  },
};

