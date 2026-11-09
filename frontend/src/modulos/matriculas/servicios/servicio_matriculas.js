import clienteAPI from '../../../api/cliente_api';

export const servicioMatriculas = {
  async listar(estado = '', anio = '') {
    const params = {};
    if (estado && estado !== 'Todos') params.estado = estado;
    if (anio) params.anio = anio;
    const res = await clienteAPI.get('/matriculas', { params });
    return res.datos || [];
  },

  async obtenerPorId(id) {
    const res = await clienteAPI.get(`/matriculas/${id}`);
    return res.datos;
  },

  async registrar(datos) {
    const res = await clienteAPI.post('/matriculas', datos);
    return res;
  },

  async actualizar(id, datos) {
    const res = await clienteAPI.put(`/matriculas/${id}`, datos);
    return res;
  },

  async cambiarEstado(id, nuevoEstado, motivo = '') {
    const res = await clienteAPI.patch(`/matriculas/${id}/estado`, {
      nuevo_estado: nuevoEstado,
      motivo,
    });
    return res;
  },

  async eliminar(id) {
    const res = await clienteAPI.delete(`/matriculas/${id}`);
    return res;
  },

  async obtenerEstadisticas() {
    const res = await clienteAPI.get('/matriculas/estadisticas');
    return res.datos;
  },
};

