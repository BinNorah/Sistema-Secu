import clienteAPI from '../../../api/cliente_api';

export const servicioProfesores = {
  async listar() {
    const res = await clienteAPI.get('/profesores');
    return res.datos || [];
  },
};

