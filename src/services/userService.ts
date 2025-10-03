import { prisma } from '../database/prisma';
import type { PF_usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '../database/prisma';
import type { PF_usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Definindo um tipo para os dados de entrada, incluindo nome e sobrenome
type CreateUsuarioData = Omit<PF_usuario, 'id' | 'dataCadastro' | 'nomeCompleto'> & {
  nome: string;
  sobrenome: string;
};

class UsuarioService {
  /**
   * Função para CRIAR um novo usuário
   * @param data
   * @returns
   */
  public async create(
    data: CreateUsuarioData,
  ): Promise<Omit<PF_usuario, 'senha'> | null> {
    const emailExistente = await prisma.pF_usuario.findUnique({
      where: { email: data.email },
    });
    if (emailExistente) {
      throw new Error('Este e-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10);
    
    const { nome, sobrenome, ...rest } = data;
    const nomeCompleto = `${nome} ${sobrenome}`;

    const newUser = await prisma.pF_usuario.create({
      data: {
        ...rest,
        nomeCompleto,
        senha: hashedPassword,
      },
    });

    const { senha, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Função para LISTAR todos os usuários
   * @returns
   */
  public async getAll(): Promise<Omit<PF_usuario, 'senha'>[]> {
    const users = await prisma.pF_usuario.findMany();
    return users.map(user => {
      const { senha, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Função para BUSCAR um usuário pelo ID
   * @param id
   * @returns
   */
  public async getById(id: number): Promise<Omit<PF_usuario, 'senha'> | null> {
    const user = await prisma.pF_usuario.findUnique({
      where: { id },
    });
    if (user) {
      const { senha, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  /**
   * Função para ATUALIZAR um usuário
   * @param id
   * @param data
   * @returns
   */
  public async update(
    id: number,
    data: Partial<Omit<PF_usuario, 'nomeCompleto'>>,
  ): Promise<Omit<PF_usuario, 'senha'> | null> {
    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    if (data.email) {
      const emailExistente = await prisma.pF_usuario.findUnique({
        where: { email: data.email },
      });

      if (emailExistente && emailExistente.id !== id) {
        throw new Error('Este e-mail já está em uso por outro usuário.');
      }
    }

    const updatedUser = await prisma.pF_usuario.update({
      where: { id },
      data,
    });

    const { senha, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Função para deletar um usuário
   * @param id
   */
  public async delete(id: number): Promise<void> {
    await prisma.pF_usuario.delete({
      where: { id },
    });
  }
}

export default new UsuarioService();

