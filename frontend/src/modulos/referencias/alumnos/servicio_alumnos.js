import clienteAPI from '../../../api/cliente_api';

export const servicioAlumnos = {
  async listar() {
    const res = await clienteAPI.get('/alumnos');
    return res.datos || [];
  },
};

