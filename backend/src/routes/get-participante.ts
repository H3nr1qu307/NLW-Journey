import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import { ClientError } from "../erros/client-erros";

export async function getParticipante(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get('/participantes/:participanteId', {
        schema: {
            params: z.object({
                participanteId: z.string().uuid()
            })
        }
    }, async (request) => {
        const { participanteId } = request.params

        const participante = await prisma.participantes.findUnique({
            select: {
                id: true,
                name: true,
                email: true,
                is_confirmed: true
            },
            where: { id: participanteId }
        })

        if(!participante){
            throw new ClientError('Viagem não encontrada.')
        }

        return { participante }
    })
}